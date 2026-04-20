import React, { useEffect, useReducer } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import {
  startNotificationListener,
  type NotificationStatus,
} from '../../../chat/notifications/listener.js';
import type { LemonadeNotification } from '../../../api/subscriptions.js';
import { feedReducer, initialState } from './feed-state.js';

export interface WatchFeedProps {
  /**
   * When set, the component will use this listener instead of starting a fresh
   * one. Exposed primarily so the parent (watch.ts) can supply a shared listener
   * handle; defaults to spinning up a new listener on mount.
   */
  listenerFactory?: (handlers: {
    onNotification: (formatted: string, raw: LemonadeNotification) => void;
    onStatusChange: (status: NotificationStatus) => void;
  }) => { stop: () => void };
}

/**
 * Ink live-feed view for `lemonade notifications watch`.
 *
 * State is delegated to the pure `feedReducer` in `./feed-state.ts` so the
 * MAX_VISIBLE slice, status transitions, and notification push logic can be
 * unit-tested without rendering Ink (A-009 remediation).
 *
 * Anti-patterns honoured (per IMPL Phase 2 § Anti-patterns):
 * - NEVER call process.exit() inside the component — use useApp().exit().
 * - NEVER write directly via process.stdout.write (Ink manages the TTY).
 * - ALWAYS call listener.stop() on unmount (useEffect cleanup).
 */
export function WatchFeed({ listenerFactory }: WatchFeedProps): React.JSX.Element {
  const { exit } = useApp();
  const [state, dispatch] = useReducer(feedReducer, initialState);

  useEffect(() => {
    const factory =
      listenerFactory ??
      ((h) => startNotificationListener(h));

    const listener = factory({
      onNotification: (formatted) => {
        dispatch({ type: 'notify', payload: formatted });
      },
      onStatusChange: (s) => {
        dispatch({ type: 'status', payload: s });
      },
    });

    return () => {
      listener.stop();
    };
  }, [listenerFactory]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
    if (input === 'q' || key.escape) {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Text>
        Notifications — status: <Text bold>{state.status}</Text>
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {state.notifications.length === 0 ? (
          <Text dimColor>Waiting for notifications… (Ctrl+C or q to exit)</Text>
        ) : (
          state.notifications.map((line, idx) => <Text key={`${idx}-${line}`}>{line}</Text>)
        )}
      </Box>
    </Box>
  );
}
