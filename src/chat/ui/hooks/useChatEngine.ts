import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatEngine } from '../../engine/ChatEngine.js';
import { AIProvider, Message, ToolDef, SystemMessage } from '../../providers/interface.js';
import { SessionState } from '../../session/state.js';
import { buildSystemMessages } from '../../session/cache.js';
import { handleTurn } from '../../stream/handler.js';
import type { ChatMessage } from '../MessageArea.js';

interface UseChatEngineOptions {
  provider: AIProvider;
  session: SessionState;
  registry: Record<string, ToolDef>;
  formattedTools: unknown[];
}

interface UseChatEngineResult {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  tokenCount: number;
  streamTokenCount: number;
  lastError?: string;
  lastToolName?: string;
  sendMessage: (text: string) => void;
  clearHistory: () => void;
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [streamTokenCount, setStreamTokenCount] = useState(0);
  const [lastError, setLastError] = useState<string | undefined>();
  const [lastToolName, setLastToolName] = useState<string | undefined>();
  const [pendingConfirmation, setPendingConfirmation] = useState<{ id: string; description: string } | null>(null);

  useEffect(() => {
    const engine = engineRef.current;

    const onTextDelta = (data: { text: string }) => {
      setStreamingText((prev) => prev + data.text);
      setStreamTokenCount((prev) => prev + 1);
    };

    const onToolStart = (data: { id: string; name: string }) => {
      setLastToolName(data.name);
    };

    const onToolDone = (data: { id: string; name: string; result?: unknown; error?: string }) => {
      setLastToolName(data.name);
      if (data.error) {
        setLastError(data.error);
      }
    };

    const onConfirmRequest = (data: { id: string; description: string }) => {
      setPendingConfirmation(data);
    };

    const onTurnDone = (data: { usage: { input_tokens: number; output_tokens: number } }) => {
      setTokenCount((prev) => prev + data.usage.input_tokens + data.usage.output_tokens);
    };

    const onError = (data: { message: string; fatal: boolean }) => {
      setLastError(data.message);
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

  const sendMessage = useCallback(async (text: string) => {
    const userMsgId = String(++msgIdRef.current);
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text }]);
    setStreamingText('');
    setStreamTokenCount(0);
    setIsStreaming(true);

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
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastError(msg);
    }

    // Finalize streamed text into messages
    setStreamingText((currentStreaming) => {
      if (currentStreaming) {
        const assistantId = String(++msgIdRef.current);
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: currentStreaming }]);
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
    lastToolName,
    sendMessage,
    clearHistory,
    confirmAction,
    pendingConfirmation,
  };
}
