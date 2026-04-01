import { useState, useEffect, useCallback, useRef } from 'react';
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
  addUserMessage: (text: string) => void;
  addSystemMessage: (text: string) => void;
  clearMessages: () => void;
  confirmAction: (id: string, confirmed: boolean) => void;
  resetStreaming: () => void;
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

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
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
    addSystemMessage,
    clearMessages,
    confirmAction,
    resetStreaming,
  };
}
