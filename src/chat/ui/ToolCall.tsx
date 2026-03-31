import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { colors } from './theme.js';

export type ToolCallStatus = 'running' | 'success' | 'failure';

interface ToolCallProps {
  name: string;
  status: ToolCallStatus;
  result?: string;
  error?: string;
}

const MAX_RESULT_LINES = 3;

function truncateToLines(text: string, maxLines: number): string {
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join('\n') + '\n...';
}

export function ToolCall({ name, status, result, error }: ToolCallProps): React.ReactElement {
  let icon: React.ReactElement;
  if (status === 'running') {
    icon = <Spinner label="" />;
  } else if (status === 'success') {
    icon = <Text color={colors.success}>✔</Text>;
  } else {
    icon = <Text color={colors.error}>✘</Text>;
  }

  const detail = error || result;
  const detailText = detail ? truncateToLines(String(detail), MAX_RESULT_LINES) : null;

  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Box>
        {icon}
        <Text> </Text>
        <Text dimColor>{name}</Text>
      </Box>
      {detailText && status !== 'running' ? (
        <Box paddingLeft={4}>
          <Text dimColor>{detailText}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
