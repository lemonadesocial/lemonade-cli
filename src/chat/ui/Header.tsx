import React from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';

interface HeaderProps {
  providerName: string;
  modelName: string;
  spaceName?: string;
  tokenCount: number;
}

export function Header({ providerName, modelName, spaceName, tokenCount }: HeaderProps): React.ReactElement {
  const formattedTokens = tokenCount > 0 ? tokenCount.toLocaleString() + ' tokens' : '';

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" paddingX={1}>
        <Text color={colors.lemon} bold>LEMONADE</Text>
        <Text>
          <Text color={colors.violetLight}>{providerName}</Text>
          <Text dimColor> | </Text>
          <Text color={colors.violetLight}>{modelName}</Text>
        </Text>
        <Box>
          <Text dimColor>Space: </Text>
          <Text color={colors.violetLight}>{spaceName || 'none'}</Text>
          {formattedTokens ? (
            <>
              <Text dimColor> | </Text>
              <Text dimColor>{formattedTokens}</Text>
            </>
          ) : null}
        </Box>
      </Box>
      <Box borderStyle="single" borderColor={colors.muted} borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} />
    </Box>
  );
}
