import React from 'react';
import { Box, Static } from 'ink';
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
}

export function MessageArea({
  messages,
  streamingText,
  isStreaming,
}: MessageAreaProps): React.ReactElement {
  const showThinking = isStreaming && !streamingText;

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Static items={messages}>
        {(msg) => (
          <Box key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage text={msg.text} />
            ) : (
              <AssistantMessage text={msg.text} />
            )}
          </Box>
        )}
      </Static>
      {showThinking ? <ThinkingIndicator /> : null}
      {streamingText ? <AssistantMessage text={streamingText} streaming /> : null}
    </Box>
  );
}
