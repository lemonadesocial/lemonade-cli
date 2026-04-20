import React, { useEffect, useReducer, useRef } from 'react';
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
  /**
   * Initial unread count, pre-fetched by the caller (`watch.ts`) before
   * mounting. Optional — when absent, the header renders `unread: ?` until
   * a refetch resolves.
   */
  initialUnread?: number | null;
  /**
   * Fetcher for the current unread count. Optional — when absent, the
   * component does not refetch on notification arrival (useful for tests
   * that only assert feed behaviour). When present, invoked (debounced at
   * 250 ms) on every `onNotification` dispatch.
   */
  fetchUnread?: () => Promise<number>;
}

const UNREAD_REFETCH_DEBOUNCE_MS = 250;

/**
 * Ink live-feed view for `lemonade notifications watch`.
 *
 * State is delegated to the pure `feedReducer` in `./feed-state.ts` so the
 * MAX_VISIBLE slice, status transitions, notification push logic, and
 * unread-update transitions can be unit-tested without rendering Ink
 * (A-009 remediation).
 *
 * Anti-patterns honoured (per IMPL Phase 2 § Anti-patterns):
 * - NEVER call process.exit() inside the component — use useApp().exit().
 * - NEVER write directly via process.stdout.write (Ink manages the TTY).
 * - ALWAYS call listener.stop() on unmount (useEffect cleanup).
 * - ALWAYS guard the unread-refetch dispatch with a `mounted` ref so a late
 *   resolution after unmount cannot dispatch to a dead reducer.
 */
export function WatchFeed({
  listenerFactory,
  initialUnread = null,
  fetchUnread,
}: WatchFeedProps): React.JSX.Element {
  const { exit } = useApp();
  const [state, dispatch] = useReducer(feedReducer, initialState);
  const mountedRef = useRef<boolean>(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialSeededRef = useRef<boolean>(false);

  // Seed the unread count from the caller's pre-fetch on mount.
  useEffect(() => {
    if (initialSeededRef.current) return;
    initialSeededRef.current = true;
    dispatch({ type: 'unread-update', payload: initialUnread ?? null });
  }, [initialUnread]);

  useEffect(() => {
    mountedRef.current = true;

    const factory =
      listenerFactory ??
      ((h) => startNotificationListener(h));

    const scheduleRefetch = () => {
      if (!fetchUnread) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        fetchUnread()
          .then((n) => {
            if (!mountedRef.current) return;
            dispatch({ type: 'unread-update', payload: n });
          })
          .catch(() => {
            if (!mountedRef.current) return;
            // Keep last value sticky — do NOT dispatch on failure.
            // Emit a single stderr breadcrumb so the user sees the
            // transient failure without flooding the TTY.
            try {
              process.stderr.write('[warn] unread refetch failed\n');
            } catch {
              // ignore — stderr write failures are non-fatal.
            }
          });
      }, UNREAD_REFETCH_DEBOUNCE_MS);
    };

    const listener = factory({
      onNotification: (formatted) => {
        dispatch({ type: 'notify', payload: formatted });
        scheduleRefetch();
      },
      onStatusChange: (s) => {
        dispatch({ type: 'status', payload: s });
      },
    });

    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      listener.stop();
    };
  }, [listenerFactory, fetchUnread]);

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
        Notifications — status: <Text bold>{state.status}</Text> · unread:{' '}
        <Text bold>{state.unread === null ? '?' : String(state.unread)}</Text>
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
