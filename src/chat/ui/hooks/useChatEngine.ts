import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatEngine } from '../../engine/ChatEngine.js';
import { AIProvider, Message, ToolDef } from '../../providers/interface.js';
import { SessionState } from '../../session/state.js';
import { buildSystemMessages } from '../../session/cache.js';
import { handleTurn } from '../../stream/handler.js';
import type { ChatMessage } from '../MessageArea.js';
import type { ToolCallEntry } from '../ToolCallGroup.js';
import type { ErrorType } from '../ErrorDisplay.js';

interface UseChatEngineOptions {
  provider: AIProvider;
  session: SessionState;
  registry: Record<string, ToolDef>;
  formattedTools: unknown[];
}

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  retryAfter?: number;
}

const SENSITIVE_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]+/g,
  /sk-[a-zA-Z0-9_-]{20,}/g,
];

export function scrubSensitive(msg: string): string {
  let scrubbed = msg;
  for (const pattern of SENSITIVE_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, 'sk-...redacted');
  }
  return scrubbed;
}

export function classifyError(message: string): ClassifiedError {
  const scrubbed = scrubSensitive(message);
  const lower = scrubbed.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('429')) {
    const match = scrubbed.match(/(\d+)\s*s/);
    return {
      type: 'rate_limit',
      message: scrubbed,
      retryAfter: match ? parseInt(match[1], 10) : undefined,
    };
  }
  if (lower.includes('auth') || lower.includes('unauthorized') || lower.includes('401') || lower.includes('expired')) {
    return { type: 'auth', message: scrubbed };
  }
  if (lower.includes('context') || lower.includes('token limit') || lower.includes('too long') || lower.includes('context_length')) {
    return { type: 'context_length', message: scrubbed };
  }
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('fetch') || lower.includes('timeout')) {
    return { type: 'network', message: scrubbed };
  }
  return { type: 'generic', message: scrubbed };
}

interface UseChatEngineResult {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  tokenCount: number;
  streamTokenCount: number;
  lastError?: string;
  classifiedError?: ClassifiedError;
  lastToolName?: string;
  toolCalls: ToolCallEntry[];
  sendMessage: (text: string) => void;
  clearHistory: () => void;
  cancelStream: () => void;
  confirmAction: (id: string, confirmed: boolean) => void;
  pendingConfirmation: { id: string; description: string } | null;
}

export function useChatEngine({
  provider,
  session,
  registry,
  formattedTools,
}: UseChatEngineOptions): UseChatEngineResult {
  const engineRef = useRef<ChatEngine>(new ChatEngine());
  const historyRef = useRef<Message[]>([]);
  const msgIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [streamTokenCount, setStreamTokenCount] = useState(0);
  const [lastError, setLastError] = useState<string | undefined>();
  const [classifiedError, setClassifiedError] = useState<ClassifiedError | undefined>();
  const [lastToolName, setLastToolName] = useState<string | undefined>();
  const [pendingConfirmation, setPendingConfirmation] = useState<{ id: string; description: string } | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);

  useEffect(() => {
    const engine = engineRef.current;

    const onTextDelta = (data: { text: string }) => {
      setStreamingText((prev) => prev + data.text);
      setStreamTokenCount((prev) => prev + 1);
    };

    const onToolStart = (data: { id: string; name: string }) => {
      setLastToolName(data.name);
      setToolCalls((prev) => [...prev, { id: data.id, name: data.name, status: 'running' }]);
    };

    const onToolDone = (data: { id: string; name: string; result?: unknown; error?: string }) => {
      setLastToolName(data.name);
      if (data.error) {
        setLastError(data.error);
        setClassifiedError(classifyError(data.error));
      }
      setToolCalls((prev) =>
        prev.map((tc) =>
          tc.id === data.id
            ? {
                ...tc,
                status: data.error ? 'failure' as const : 'success' as const,
                result: data.result ? String(data.result) : undefined,
                error: data.error,
              }
            : tc,
        ),
      );
    };

    const onConfirmRequest = (data: { id: string; description: string }) => {
      setPendingConfirmation(data);
    };

    const onTurnDone = (data: { usage: { input_tokens: number; output_tokens: number } }) => {
      setTokenCount((prev) => prev + data.usage.input_tokens + data.usage.output_tokens);
    };

    const onError = (data: { message: string; fatal: boolean }) => {
      setLastError(data.message);
      setClassifiedError(classifyError(data.message));
    };

    const onWarning = (data: { message: string }) => {
      setLastError(data.message);
    };

    engine.on('text_delta', onTextDelta);
    engine.on('tool_start', onToolStart);
    engine.on('tool_done', onToolDone);
    engine.on('confirm_request', onConfirmRequest);
    engine.on('turn_done', onTurnDone);
    engine.on('error', onError);
    engine.on('warning', onWarning);

    return () => {
      engine.off('text_delta', onTextDelta);
      engine.off('tool_start', onToolStart);
      engine.off('tool_done', onToolDone);
      engine.off('confirm_request', onConfirmRequest);
      engine.off('turn_done', onTurnDone);
      engine.off('error', onError);
      engine.off('warning', onWarning);
    };
  }, []);

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMsgId = String(++msgIdRef.current);
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text }]);
    setStreamingText('');
    setStreamTokenCount(0);
    setIsStreaming(true);
    setToolCalls([]);
    setClassifiedError(undefined);

    const abort = new AbortController();
    abortRef.current = abort;

    historyRef.current.push({ role: 'user', content: text });

    const systemPrompt = buildSystemMessages(session, provider.name);

    try {
      await handleTurn(
        provider,
        historyRef.current,
        formattedTools,
        systemPrompt,
        session,
        registry,
        null,
        true,
        engineRef.current,
      );
    } catch (err) {
      if (abort.signal.aborted) {
        // stream was cancelled by the user
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setLastError(msg);
        setClassifiedError(classifyError(msg));
      }
    }

    const wasCancelled = abort.signal.aborted;
    abortRef.current = null;

    // Finalize streamed text into messages
    setStreamingText((currentStreaming) => {
      if (currentStreaming) {
        const finalText = wasCancelled
          ? currentStreaming + ' [cancelled]'
          : currentStreaming;
        const assistantId = String(++msgIdRef.current);
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: finalText }]);
      }
      return '';
    });

    setIsStreaming(false);
  }, [provider, session, registry, formattedTools]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
    setStreamingText('');
    setTokenCount(0);
    setToolCalls([]);
    setClassifiedError(undefined);
  }, []);

  const confirmAction = useCallback((id: string, confirmed: boolean) => {
    engineRef.current.confirmAction(id, confirmed);
    setPendingConfirmation(null);
  }, []);

  return {
    messages,
    streamingText,
    isStreaming,
    tokenCount,
    streamTokenCount,
    lastError,
    classifiedError,
    lastToolName,
    toolCalls,
    sendMessage,
    clearHistory,
    cancelStream,
    confirmAction,
    pendingConfirmation,
  };
}
