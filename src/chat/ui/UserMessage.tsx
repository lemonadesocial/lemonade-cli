import React from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';

interface UserMessageProps {
  text: string;
}

export function UserMessage({ text }: UserMessageProps): React.ReactElement {
  return (
    <Box paddingX={1} marginTop={1}>
      <Text color={colors.violet} bold>You: </Text>
      <Text>{text}</Text>
    </Box>
  );
}
