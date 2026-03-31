import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { colors } from './theme.js';

export function ThinkingIndicator(): React.ReactElement {
  return (
    <Box paddingX={1} marginTop={1} gap={1}>
      <Spinner label="" />
      <Text color={colors.violetLight}>Thinking...</Text>
    </Box>
  );
}
