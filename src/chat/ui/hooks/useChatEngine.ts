import { useState, useEffect, useCallback, useRef, type MutableRefObject } from 'react';
import { ChatEngine, ChatEngineEvents } from '../../engine/ChatEngine.js';

export interface ToolStatus {
  id: string;
  name: string;
  status: 'running' | 'done' | 'error';
  result?: unknown;
  error?: string;
}

export interface UIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tools?: ToolStatus[];
  turnId?: string;
  /** Stable identity for rollback targeting. Present on user messages added via addUserMessage. */
  msgId?: string;
}

export interface ConfirmRequest {
  id: string;
  description: string;
}

export interface UseChatEngineResult {
  messages: UIMessage[];
  isStreaming: boolean;
  isThinking: boolean;
  pendingConfirm: ConfirmRequest | null;
  tokenCount: number;
  addUserMessage: (text: string, idRef?: MutableRefObject<string | null>) => void;
  removeMessageById: (id: string) => void;
  addSystemMessage: (text: string) => void;
  clearMessages: () => void;
  confirmAction: (id: string, confirmed: boolean) => void;
  resetStreaming: () => void;
}

/**
 * Compute turn-index adjustments needed after a message removal.
 * Pure function — no side effects. Caller applies returned mutations to the Map.
 */
export function computeIndexAdjustments(
  turnIndex: ReadonlyMap<string, number>,
  removedIdx: number,
): { updates: [string, number][]; deletes: string[] } {
  const updates: [string, number][] = [];
  const deletes: string[] = [];
  for (const [tid, tIdx] of turnIndex) {
    if (tIdx > removedIdx) {
      updates.push([tid, tIdx - 1]);
    } else if (tIdx === removedIdx) {
      // In practice this branch is unlikely for removeMessageById (which only
      // targets user messages, while turnMessageIndex tracks assistant turns),
      // but it is needed for correctness if the invariant ever changes.
      deletes.push(tid);
    }
  }
  return { updates, deletes };
}

/** Apply the result of computeIndexAdjustments to a mutable Map in place. */
export function applyIndexAdjustments(
  turnIndex: Map<string, number>,
  adj: { updates: [string, number][]; deletes: string[] },
): void {
  for (const [tid, newIdx] of adj.updates) turnIndex.set(tid, newIdx);
  for (const tid of adj.deletes) turnIndex.delete(tid);
}

export function useChatEngine(engine: ChatEngine): UseChatEngineResult {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmRequest | null>(null);
  const [tokenCount, setTokenCount] = useState(0);

  // Track per-turn message indices and active turns
  const turnMessageIndex = useRef<Map<string, number>>(new Map());
  const activeTurns = useRef<Set<string>>(new Set());
  // Monotonic counter for stable UI message IDs — synchronous, no React flush dependency
  const nextMsgIdRef = useRef(1);
  // Tracks msgIds for which a corruption warning has already been appended,
  // preventing duplicate system messages under React StrictMode double-invocation.
  const corruptionWarned = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onThinkingStart = (data: { turnId?: string }) => {
      const tid = data.turnId || 'main';
      if (tid === 'main') setIsThinking(true);
    };

    const onTextDelta = (data: { text: string; turnId?: string }) => {
      const tid = data.turnId || 'main';
      if (tid === 'main') setIsThinking(false);

      if (!activeTurns.current.has(tid)) {
        activeTurns.current.add(tid);
        if (tid === 'main') setIsStreaming(true);
      }

      // Index registration happens inside the updater so that message-array
      // mutation and turnMessageIndex mutation are atomic — no dependency on
      // React executing the updater synchronously before post-setMessages code.
      setMessages((prev) => {
        const existingIdx = turnMessageIndex.current.get(tid);
        if (existingIdx !== undefined && existingIdx < prev.length && prev[existingIdx]?.role === 'assistant') {
          const updated = [...prev];
          const msg = updated[existingIdx];
          updated[existingIdx] = { ...msg, content: msg.content + data.text };
          return updated;
        }
        const newMsg: UIMessage = { role: 'assistant', content: data.text, turnId: tid === 'main' ? undefined : tid };
        const newArr = [...prev, newMsg];
        turnMessageIndex.current.set(tid, newArr.length - 1);
        return newArr;
      });
    };

    const onToolStart = (data: { id: string; name: string; turnId?: string }) => {
      const tid = data.turnId || 'main';
      // Index registration inside updater — atomic with array mutation (see onTextDelta comment).
      setMessages((prev) => {
        const updated = [...prev];
        let idx = turnMessageIndex.current.get(tid);
        if (idx === undefined || idx >= updated.length || updated[idx]?.role !== 'assistant') {
          const newMsg: UIMessage = { role: 'assistant', content: '', tools: [], turnId: tid === 'main' ? undefined : tid };
          updated.push(newMsg);
          idx = updated.length - 1;
          turnMessageIndex.current.set(tid, idx);
        }
        const msg = updated[idx];
        const tools = [...(msg.tools || [])];
        tools.push({ id: data.id, name: data.name, status: 'running' });
        updated[idx] = { ...msg, tools };
        return updated;
      });
    };

    const onToolDone = (data: { id: string; name: string; result?: unknown; error?: string; turnId?: string }) => {
      const tid = data.turnId || 'main';
      setMessages((prev) => {
        const updated = [...prev];
        const idx = turnMessageIndex.current.get(tid);
        if (idx === undefined || idx >= updated.length) return prev;
        const msg = updated[idx];
        if (msg.tools) {
          const tools = msg.tools.map((t) =>
            t.id === data.id
              ? { ...t, status: (data.error ? 'error' : 'done') as ToolStatus['status'], result: data.result, error: data.error }
              : t,
          );
          updated[idx] = { ...msg, tools };
        }
        return updated;
      });
    };

    const onConfirmRequest = (data: ChatEngineEvents['confirm_request']) => {
      setPendingConfirm({ id: data.id, description: data.description });
    };

    const onTurnDone = (data: { usage: { input_tokens: number; output_tokens: number }; turnId?: string }) => {
      const tid = data.turnId || 'main';
      activeTurns.current.delete(tid);
      turnMessageIndex.current.delete(tid);
      if (tid === 'main') {
        setIsStreaming(false);
        setIsThinking(false);
      }
      setTokenCount(data.usage.input_tokens + data.usage.output_tokens);
    };

    const onError = (data: { message: string; fatal: boolean; turnId?: string }) => {
      const tid = data.turnId || 'main';
      activeTurns.current.delete(tid);
      turnMessageIndex.current.delete(tid);
      if (tid === 'main') {
        setIsStreaming(false);
        setIsThinking(false);
      }
      setMessages((prev) => [...prev, { role: 'system', content: `Error: ${data.message}`, turnId: tid === 'main' ? undefined : tid }]);
    };

    const onWarning = (data: { message: string; turnId?: string }) => {
      setMessages((prev) => [...prev, { role: 'system', content: data.message }]);
    };

    engine.on('thinking_start', onThinkingStart);
    engine.on('text_delta', onTextDelta);
    engine.on('tool_start', onToolStart);
    engine.on('tool_done', onToolDone);
    engine.on('confirm_request', onConfirmRequest);
    engine.on('turn_done', onTurnDone);
    engine.on('error', onError);
    engine.on('warning', onWarning);

    return () => {
      engine.off('thinking_start', onThinkingStart);
      engine.off('text_delta', onTextDelta);
      engine.off('tool_start', onToolStart);
      engine.off('tool_done', onToolDone);
      engine.off('confirm_request', onConfirmRequest);
      engine.off('turn_done', onTurnDone);
      engine.off('error', onError);
      engine.off('warning', onWarning);
    };
  }, [engine]);

  const addUserMessage = useCallback((text: string, idRef?: MutableRefObject<string | null>) => {
    // Generate a stable ID synchronously so the caller has a rollback handle
    // immediately — no dependency on React flushing the state updater.
    const msgId = `umsg-${nextMsgIdRef.current++}`;
    if (idRef) idRef.current = msgId;
    setMessages((prev) => [...prev, { role: 'user', content: text, msgId }]);
  }, []);

  /**
   * Remove a UI message by its stable msgId. UI-only: does NOT touch
   * ConversationStore — caller must ensure store rollback succeeded first.
   *
   * Index adjustment mutates turnMessageIndex.current in-place inside the
   * updater so that concurrent writes from event handlers (e.g. onTextDelta
   * registering a new BTW turn) are preserved — no snapshot-then-replace.
   */
  const removeMessageById = useCallback((id: string) => {
    // Guard ensures the ref mutation runs exactly once even if React
    // double-invokes the updater (StrictMode). The second invocation sees the
    // same `prev` but the live ref has already been adjusted.
    let refMutated = false;

    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.msgId === id);
      if (idx === -1) return prev;

      if (prev[idx].role !== 'user') {
        // Idempotent: skip if already warned for this ID (React StrictMode double-invocation).
        if (corruptionWarned.current.has(id)) return prev;
        corruptionWarned.current.add(id);
        const detail = `removeMessageById: message ${id} at index ${idx} has role "${prev[idx].role}", expected "user" — removal skipped (state corruption)`;
        console.error(`[useChatEngine] ${detail}`);
        return [...prev, { role: 'system', content: `Warning: UI state inconsistency detected — ${detail}` }];
      }

      // Adjust the live ref in-place — preserves any entries added by
      // concurrent event handlers between the setMessages call and updater
      // execution. Snapshot entries for safe iteration while mutating.
      if (!refMutated) {
        refMutated = true;
        const adj = computeIndexAdjustments(turnMessageIndex.current, idx);
        applyIndexAdjustments(turnMessageIndex.current, adj);
      }

      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'system', content: text }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setTokenCount(0);
    turnMessageIndex.current.clear();
    activeTurns.current.clear();
  }, []);

  const confirmAction = useCallback((id: string, confirmed: boolean) => {
    engine.confirmAction(id, confirmed);
    setPendingConfirm(null);
  }, [engine]);

  // Called on Escape before removeMessageById. Clearing turnMessageIndex here
  // means the subsequent removal's index adjustment is a no-op (nothing to
  // shift). In the catch-block error path resetStreaming is NOT called first,
  // so removeMessageById's in-place adjustment is still load-bearing there.
  const resetStreaming = useCallback(() => {
    setIsStreaming(false);
    setIsThinking(false);
    activeTurns.current.clear();
    turnMessageIndex.current.clear();
  }, []);

  return {
    messages,
    isStreaming,
    isThinking,
    pendingConfirm,
    tokenCount,
    addUserMessage,
    removeMessageById,
    addSystemMessage,
    clearMessages,
    confirmAction,
    resetStreaming,
  };
}
