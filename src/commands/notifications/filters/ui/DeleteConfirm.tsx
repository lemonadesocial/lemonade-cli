import React from 'react';
import { Box, Text } from 'ink';
import type { NotificationFilter } from '../state.js';
import { describeFilter } from './ListView.js';

export interface DeleteConfirmProps {
  target: NotificationFilter;
  pending: boolean;
  error?: string;
}

/**
 * Inline "Delete this filter? (y/N)" prompt (US-4d.1). Keystrokes are
 * captured by the parent `FilterTui` via `useInput` — `y` confirms, any
 * other key cancels (US-4d.3).
 */
export function DeleteConfirm({ target, pending, error }: DeleteConfirmProps): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text bold>Delete filter</Text>
      <Box marginTop={1}>
        <Text>{describeFilter(target)}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>Delete this filter? (y/N)</Text>
      </Box>
      {pending ? (
        <Box marginTop={1}>
          <Text dimColor>Deleting…</Text>
        </Box>
      ) : null}
      {error ? (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
