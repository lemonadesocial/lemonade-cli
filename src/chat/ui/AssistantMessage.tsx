import React from 'react';
import { Box, Text } from 'ink';

interface AssistantMessageProps {
  text: string;
}

export function AssistantMessage({ text }: AssistantMessageProps): React.ReactElement {
  return (
    <Box paddingX={1} marginTop={1}>
      <Text>{text}</Text>
    </Box>
  );
}
