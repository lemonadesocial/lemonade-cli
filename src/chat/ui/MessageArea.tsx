/*
 * SCROLL ARCHITECTURE: stdout-flush approach
 *
 * Completed messages are written directly to process.stdout via Ink's
 * useStdout().write() in App.tsx. This produces natural terminal scrollback
 * that the user can scroll with their terminal emulator (mouse wheel,
 * Shift+PgUp, trackpad, etc.). Ink only renders the currently-streaming
 * response, the input area, and the status bar.
 *
 * This replaces the previous viewport-slicing approach, which failed because
 * line-height estimation was inaccurate with rich text, markdown, borders,
 * and padding, causing frozen views and missed auto-scroll.
 *
 * Scenario trace:
 *
 * 1. Short message + short response:
 *    Both are flushed to stdout after completion. They sit in the terminal
 *    viewport above Ink's input area. Fully visible.
 *
 * 2. Short message + 50-line streaming response:
 *    User message is flushed to stdout immediately. Streaming text renders
 *    in Ink via the <AssistantMessage streaming> component below. Ink
 *    re-renders on every token delta, so the latest text is always visible.
 *    When streaming completes, the full response is flushed to stdout and
 *    cleared from Ink. Terminal scrollback grows naturally.
 *
 * 3. 20+ messages in history:
 *    All completed messages live in terminal scrollback. The user scrolls
 *    up with their terminal emulator's native scroll. The latest message
 *    is always at the bottom, right above Ink's input area.
 *
 * 4. User scrolls up then sends new message:
 *    The new user message is written to stdout via write(), which appends
 *    at the bottom. Most terminals auto-scroll to new output. The view
 *    snaps back to the bottom naturally.
 *
 * 5. Streaming tokens appear:
 *    Ink re-renders on each streamingText state update. Since streaming
 *    text is the only dynamic content in Ink's render tree, the view
 *    always shows the latest tokens. No line estimation needed.
 */
import React from 'react';
import { Box } from 'ink';
import { AssistantMessage } from './AssistantMessage.js';
import { ThinkingIndicator } from './ThinkingIndicator.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface MessageAreaProps {
  streamingText: string;
  isStreaming: boolean;
}

export function MessageArea({
  streamingText,
  isStreaming,
}: MessageAreaProps): React.ReactElement {
  const showThinking = isStreaming && !streamingText;

  return (
    <Box flexDirection="column" flexGrow={1}>
      {showThinking ? <ThinkingIndicator /> : null}
      {streamingText ? <AssistantMessage text={streamingText} streaming /> : null}
    </Box>
  );
}
