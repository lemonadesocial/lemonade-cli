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
}

export interface ConfirmRequest {
  id: string;
  description: string;
}

export interface UseChatEngineResult {
  messages: UIMessage[];
  isStreaming: boolean;
  pendingConfirm: ConfirmRequest | null;
  tokenCount: number;
  addUserMessage: (text: string) => void;
  addSystemMessage: (text: string) => void;
  clearMessages: () => void;
  confirmAction: (id: string, confirmed: boolean) => void;
}

export function useChatEngine(engine: ChatEngine): UseChatEngineResult {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmRequest | null>(null);
  const [tokenCount, setTokenCount] = useState(0);

  // Track streaming state for the current assistant message
  const streamingRef = useRef(false);

  useEffect(() => {
    const onTextDelta = (data: ChatEngineEvents['text_delta']) => {
      if (!streamingRef.current) {
        streamingRef.current = true;
        setIsStreaming(true);
        // Start a new assistant message
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      }
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: last.content + data.text };
        }
        return updated;
      });
    };

    const onToolStart = (data: ChatEngineEvents['tool_start']) => {
      setMessages((prev) => {
        const updated = [...prev];
        // Find or create assistant message for tools
        let last = updated[updated.length - 1];
        if (!last || last.role !== 'assistant') {
          last = { role: 'assistant', content: '', tools: [] };
          updated.push(last);
        }
        const tools = [...(last.tools || [])];
        tools.push({ id: data.id, name: data.name, status: 'running' });
        updated[updated.length - 1] = { ...last, tools };
        return updated;
      });
    };

    const onToolDone = (data: ChatEngineEvents['tool_done']) => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && last.tools) {
          const tools = last.tools.map((t) =>
            t.id === data.id
              ? { ...t, status: (data.error ? 'error' : 'done') as ToolStatus['status'], result: data.result, error: data.error }
              : t,
          );
          updated[updated.length - 1] = { ...last, tools };
        }
        return updated;
      });
    };

    const onConfirmRequest = (data: ChatEngineEvents['confirm_request']) => {
      setPendingConfirm({ id: data.id, description: data.description });
    };

    const onTurnDone = (data: ChatEngineEvents['turn_done']) => {
      streamingRef.current = false;
      setIsStreaming(false);
      setTokenCount(data.usage.input_tokens + data.usage.output_tokens);
    };

    const onError = (data: ChatEngineEvents['error']) => {
      streamingRef.current = false;
      setIsStreaming(false);
      const errorText = data.message;
      setMessages((prev) => [...prev, { role: 'system', content: `Error: ${errorText}` }]);
    };

    const onWarning = (data: ChatEngineEvents['warning']) => {
      setMessages((prev) => [...prev, { role: 'system', content: data.message }]);
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
  }, []);

  const confirmAction = useCallback((id: string, confirmed: boolean) => {
    engine.confirmAction(id, confirmed);
    setPendingConfirm(null);
  }, [engine]);

  return {
    messages,
    isStreaming,
    pendingConfirm,
    tokenCount,
    addUserMessage,
    addSystemMessage,
    clearMessages,
    confirmAction,
  };
}
