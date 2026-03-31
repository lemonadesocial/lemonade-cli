import React from 'react';
import { Box, Text } from 'ink';
import { ToolCall, ToolCallStatus } from './ToolCall.js';

export interface ToolCallEntry {
  id: string;
  name: string;
  status: ToolCallStatus;
  result?: string;
  error?: string;
}

interface ToolCallGroupProps {
  calls: ToolCallEntry[];
}

export function ToolCallGroup({ calls }: ToolCallGroupProps): React.ReactElement {
  if (calls.length === 0) return <Box />;

  const running = calls.filter((c) => c.status === 'running').length;
  const done = calls.filter((c) => c.status !== 'running').length;

  return (
    <Box flexDirection="column" marginY={0} paddingLeft={1}>
      <Text dimColor>
        Tools ({done}/{calls.length} done{running > 0 ? `, ${running} running` : ''})
      </Text>
      {calls.map((call) => (
        <ToolCall
          key={call.id}
          name={call.name}
          status={call.status}
          result={call.result}
          error={call.error}
        />
      ))}
    </Box>
  );
}
