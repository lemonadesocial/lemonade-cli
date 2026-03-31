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

// Estimate how many terminal lines a message occupies
function estimateLines(msg: ChatMessage, cols: number): number {
  const lines = msg.text.split('\n');
  let total = 0;
  for (const line of lines) {
    total += Math.max(1, Math.ceil((line.length + 1) / Math.max(cols - 4, 40)));
  }
  // +1 for the label/margin above each message
  return total + 1;
}

interface MessageSlice {
  startLine: number;
  endLine: number;
  msg: ChatMessage;
}

export function MessageArea({
  messages,
  streamingText,
  isStreaming,
  maxHeight,
  scrollOffset,
}: MessageAreaProps): React.ReactElement {
  const showThinking = isStreaming && !streamingText;
  const cols = process.stdout.columns || 80;

  const visibleMessages = useMemo(() => {
    if (messages.length === 0) return [];

    // Reserve space for streaming text and thinking indicator
    const streamLines = streamingText
      ? streamingText.split('\n').length + 1
      : 0;
    const thinkingLines = showThinking ? 1 : 0;
    const available = maxHeight - streamLines - thinkingLines;

    if (available <= 0) return [];

    // Build a layout map: each message maps to a line range
    const slices: MessageSlice[] = [];
    let cursor = 0;
    for (const msg of messages) {
      const h = estimateLines(msg, cols);
      slices.push({ startLine: cursor, endLine: cursor + h, msg });
      cursor += h;
    }

    const totalLines = cursor;

    // scrollOffset=0 means "show the bottom". Higher values scroll up.
    const viewBottom = Math.max(totalLines - scrollOffset, 0);
    const viewTop = Math.max(viewBottom - available, 0);

    // Collect messages that overlap [viewTop, viewBottom)
    const visible: ChatMessage[] = [];
    for (const s of slices) {
      if (s.endLine > viewTop && s.startLine < viewBottom) {
        visible.push(s.msg);
      }
    }

    return visible;
  }, [messages, streamingText, showThinking, maxHeight, scrollOffset, cols]);

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
