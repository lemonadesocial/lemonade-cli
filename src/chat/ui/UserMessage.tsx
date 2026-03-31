import React from 'react';
import { Box, Text } from 'ink';

interface UserMessageProps {
  text: string;
}

// UserMessage is used in the Ink render tree only for edge cases where
// streaming hasn't started yet. The primary display path for completed
// user messages goes through writeMessage.ts -> stdout.
export function UserMessage({ text }: UserMessageProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1}>
      <Box>
        <Text backgroundColor="#2A2A2A" color="#60A5FA" bold> You </Text>
      </Box>
      <Box>
        <Text backgroundColor="#2A2A2A"> {text} </Text>
      </Box>
    </Box>
  );
}
