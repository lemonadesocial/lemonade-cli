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
   *
   * NOTE: `fetchUnread` must be a STABLE reference (module-level function in
   * `watch.ts` — not a fresh arrow per render), otherwise the listener
   * useEffect below will tear down + remount on every parent re-render,
   * losing the debounce timer and the listener subscription. Test harnesses
   * should pass a stable `vi.fn()` or module-level stub (A-012 remediation).
   */
  fetchUnread?: () => Promise<number>;
}

export const UNREAD_REFETCH_DEBOUNCE_MS = 250;

/**
 * Pure factory for the unread-refetch debounce scheduler. Extracted from
 * `WatchFeed`'s useEffect body so the debounce window + unmount-cancel
 * semantics can be unit-tested deterministically under `vi.useFakeTimers()`
 * without mounting Ink (A-001 remediation).
 *
 * Contract:
 *   - `schedule()` starts (or resets) a timer of `debounceMs`. On fire:
 *     calls `fetchUnread()` and, if `isMounted()` is still true, dispatches
 *     the result via `onResult(n)`. On fetch failure, calls `onError()`
 *     (still gated by `isMounted()`), again only if still mounted.
 *   - Rapid re-entry cancels the pending timer and re-arms — so N calls
 *     within `debounceMs` collapse into a SINGLE fetchUnread() call on the
 *     trailing edge.
 *   - `cancel()` clears any pending timer. After `cancel()`, no further
 *     onResult/onError is delivered even if `fetchUnread()` is already
 *     in-flight (gated by isMounted) — that's the unmount safety rail.
 */
export function createRefetchScheduler(opts: {
  fetchUnread: () => Promise<number>;
  onResult: (n: number) => void;
  onError: () => void;
  isMounted: () => boolean;
  debounceMs?: number;
}): { schedule: () => void; cancel: () => void } {
  const debounceMs = opts.debounceMs ?? UNREAD_REFETCH_DEBOUNCE_MS;
  let timer: NodeJS.Timeout | null = null;

  const cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      opts
        .fetchUnread()
        .then((n) => {
          if (!opts.isMounted()) return;
          opts.onResult(n);
        })
        .catch(() => {
          if (!opts.isMounted()) return;
          opts.onError();
        });
    }, debounceMs);
  };

  return { schedule, cancel };
}

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
  const initialSeededRef = useRef<boolean>(false);

  // Seed the unread count from the caller's pre-fetch on mount. Mount-only
  // dep array `[]` is deliberate: the `initialSeededRef` guard turns any
  // re-run into a no-op, so reacting to `initialUnread` changes would be a
  // dead branch (A-009 remediation).
  useEffect(() => {
    if (initialSeededRef.current) return;
    initialSeededRef.current = true;
    dispatch({ type: 'unread-update', payload: initialUnread ?? null });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const factory =
      listenerFactory ??
      ((h) => startNotificationListener(h));

    // Extracted scheduler (A-001 remediation) — the debounce semantics are
    // covered by unit tests against `createRefetchScheduler` directly with
    // fake timers.
    const scheduler = fetchUnread
      ? createRefetchScheduler({
          fetchUnread,
          onResult: (n) => dispatch({ type: 'unread-update', payload: n }),
          onError: () => {
            // Keep last value sticky — do NOT dispatch on failure.
            // Emit a single stderr breadcrumb so the user sees the
            // transient failure without flooding the TTY.
            try {
              process.stderr.write('[warn] unread refetch failed\n');
            } catch {
              // ignore — stderr write failures are non-fatal.
            }
          },
          isMounted: () => mountedRef.current,
        })
      : null;

    const listener = factory({
      onNotification: (formatted) => {
        dispatch({ type: 'notify', payload: formatted });
        scheduler?.schedule();
      },
      onStatusChange: (s) => {
        dispatch({ type: 'status', payload: s });
      },
    });

    return () => {
      mountedRef.current = false;
      scheduler?.cancel();
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
