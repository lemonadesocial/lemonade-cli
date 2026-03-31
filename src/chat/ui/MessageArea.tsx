import React from 'react';
import { Box, Static } from 'ink';
import { UserMessage } from './UserMessage.js';
import { AssistantMessage } from './AssistantMessage.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface MessageAreaProps {
  messages: ChatMessage[];
  streamingText: string;
}

export function MessageArea({ messages, streamingText }: MessageAreaProps): React.ReactElement {
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
      {streamingText ? <AssistantMessage text={streamingText} /> : null}
    </Box>
  );
}
