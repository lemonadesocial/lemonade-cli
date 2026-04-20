import React from 'react';
import { Box, Text } from 'ink';
import type { NotificationChannelPreference } from '../state.js';
import { describePreference } from './ListView.js';

export interface DeleteConfirmProps {
  target: NotificationChannelPreference;
  pending: boolean;
  error?: string;
}

/**
 * Inline "Delete this preference? (y/N)" prompt (US-5d.1). Keystrokes
 * are captured by the parent `PreferenceTui` via `useInput` — `y`
 * confirms, any other key cancels.
 */
export function DeleteConfirm({ target, pending, error }: DeleteConfirmProps): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text bold>Delete preference</Text>
      <Box marginTop={1}>
        <Text>{describePreference(target)}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>Delete this preference? (y/N)</Text>
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
