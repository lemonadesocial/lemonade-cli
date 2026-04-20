import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import {
  startNotificationListener,
  type NotificationStatus,
} from '../../../chat/notifications/listener.js';
import type { LemonadeNotification } from '../../../api/subscriptions.js';

const MAX_VISIBLE = 10;

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
 * Anti-patterns honoured (per IMPL Phase 2 § Anti-patterns):
 * - NEVER call process.exit() inside the component — use useApp().exit().
 * - NEVER write directly via process.stdout.write (Ink manages the TTY).
 * - ALWAYS call listener.stop() on unmount (useEffect cleanup).
 */
export function WatchFeed({ listenerFactory }: WatchFeedProps): React.JSX.Element {
  const { exit } = useApp();
  const [status, setStatus] = useState<NotificationStatus>('disconnected');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const factory =
      listenerFactory ??
      ((h) => startNotificationListener(h));

    const listener = factory({
      onNotification: (formatted) => {
        setRecent((prev) => {
          const next = [...prev, formatted];
          if (next.length > MAX_VISIBLE) {
            return next.slice(next.length - MAX_VISIBLE);
          }
          return next;
        });
      },
      onStatusChange: (s) => {
        setStatus(s);
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
        Notifications — status: <Text bold>{status}</Text>
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {recent.length === 0 ? (
          <Text dimColor>Waiting for notifications… (Ctrl+C or q to exit)</Text>
        ) : (
          recent.map((line, idx) => <Text key={`${idx}-${line}`}>{line}</Text>)
        )}
      </Box>
    </Box>
  );
}
