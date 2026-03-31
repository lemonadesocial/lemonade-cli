import React from 'react';
import { Box, Text } from 'ink';

interface UserMessageProps {
  text: string;
}

export function UserMessage({ text }: UserMessageProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box borderStyle="bold" borderColor="#8B5CF6" borderLeft={true} borderRight={false} borderTop={false} borderBottom={false} paddingLeft={1}>
        <Box flexDirection="column">
          <Text color="#8B5CF6" bold>You</Text>
          <Text>{text}</Text>
        </Box>
      </Box>
    </Box>
  );
}
