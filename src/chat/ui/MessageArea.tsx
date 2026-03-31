import React, { useMemo } from 'react';
import { Box } from 'ink';
import { UserMessage } from './UserMessage.js';
import { AssistantMessage } from './AssistantMessage.js';
import { ThinkingIndicator } from './ThinkingIndicator.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface MessageAreaProps {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  maxHeight: number;
  scrollOffset: number;
}

// Estimate lines a message will occupy (1 line per ~100 chars, minimum 2 for padding)
function estimateLines(msg: ChatMessage): number {
  const textLines = msg.text.split('\n').length;
  const wrappedLines = Math.ceil(msg.text.length / 100);
  return Math.max(textLines, wrappedLines) + 1; // +1 for role label/padding
}

export function MessageArea({
  messages,
  streamingText,
  isStreaming,
  maxHeight,
  scrollOffset,
}: MessageAreaProps): React.ReactElement {
  const showThinking = isStreaming && !streamingText;

  const visibleMessages = useMemo(() => {
    if (messages.length === 0) return [];

    // Walk backwards from the end, accumulating lines until we fill the viewport
    let totalLines = 0;
    const streamLines = streamingText ? Math.max(streamingText.split('\n').length, 2) + 1 : 0;
    const thinkingLines = showThinking ? 1 : 0;
    const reservedLines = streamLines + thinkingLines;
    const available = maxHeight - reservedLines;

    if (available <= 0) return [];

    // Apply scroll offset: skip the most recent N messages
    const endIndex = Math.max(messages.length - scrollOffset, 0);
    const visible: ChatMessage[] = [];

    for (let i = endIndex - 1; i >= 0; i--) {
      const lines = estimateLines(messages[i]);
      if (totalLines + lines > available && visible.length > 0) break;
      totalLines += lines;
      visible.unshift(messages[i]);
    }

    return visible;
  }, [messages, streamingText, showThinking, maxHeight, scrollOffset]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {visibleMessages.map((msg) => (
        <Box key={msg.id}>
          {msg.role === 'user' ? (
            <UserMessage text={msg.text} />
          ) : (
            <AssistantMessage text={msg.text} />
          )}
        </Box>
      ))}
      {showThinking ? <ThinkingIndicator /> : null}
      {streamingText ? <AssistantMessage text={streamingText} streaming /> : null}
    </Box>
  );
}
