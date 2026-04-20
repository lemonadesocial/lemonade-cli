import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { setFlagApiKey } from '../../auth/store.js';
import { handleError } from '../../output/error.js';
import { graphqlRequest } from '../../api/graphql.js';
import { startNotificationListener } from '../../chat/notifications/listener.js';
import { WatchFeed } from './ui/WatchFeed.js';

const GET_NOTIFICATION_UNREAD_COUNT_QUERY = `
  query GetNotificationUnreadCount($category: NotificationCategory) {
    getNotificationUnreadCount(category: $category)
  }
`;

export const NDJSON_UNREAD_DEBOUNCE_MS = 250;

async function fetchUnreadCount(): Promise<number> {
  const result = await graphqlRequest<{ getNotificationUnreadCount: number }>(
    GET_NOTIFICATION_UNREAD_COUNT_QUERY,
  );
  return result.getNotificationUnreadCount;
}

/**
 * Factory for the NDJSON mode unread-refetch helper. Extracted from
 * `runNdjsonWatch` so the debounce + stderr-breadcrumb + silent-failure
 * contract can be unit-tested with fake timers + injected spies
 * (A-004 remediation).
 *
 * Behaviour:
 *   - `schedule()` starts (or resets) a `debounceMs` timer. On fire:
 *     invokes `fetchUnread()` and writes `[unread] <N>\n` to `stderrWrite`
 *     on success.
 *   - On fetch failure: swallows silently (US-1.4 deviation — a per-notification
 *     warning would spam the piped stream; operators inspect successful
 *     `[unread] <N>` breadcrumbs for drift detection).
 *   - `cancel()` clears any pending timer.
 *
 * Tests MUST NOT see a `[unread]` string written to STDOUT — stderr only.
 */
export function createNdjsonUnreadRefetcher(opts: {
  fetchUnread: () => Promise<number>;
  stderrWrite: (chunk: string) => void;
  debounceMs?: number;
}): { schedule: () => void; cancel: () => void } {
  const debounceMs = opts.debounceMs ?? NDJSON_UNREAD_DEBOUNCE_MS;
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
          try {
            opts.stderrWrite(`[unread] ${n}\n`);
          } catch {
            // ignore — stderr write failures are non-fatal.
          }
        })
        .catch(() => {
          // US-1.4 NDJSON deviation — swallow silently. See the module
          // docblock for the runNdjsonWatch scheduler for rationale.
        });
    }, debounceMs);
  };

  return { schedule, cancel };
}

export function registerNotificationsWatch(notifications: Command): void {
  notifications
    .command('watch')
    .description('Stream live notifications to the terminal (Ink feed or NDJSON)')
    .option('--json', 'Emit NDJSON (one JSON line per notification) instead of Ink feed')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      // NDJSON short-circuit: when --json OR stdout is not a TTY, bypass Ink
      // and write one line per notification to stdout, breadcrumbs to stderr.
      // Defense-in-depth: even without --json, a non-TTY destination cannot
      // render Ink — fall back to NDJSON (IMPL Phase 2 scope clarification #2).
      const useNdjson = !!opts.json || !process.stdout.isTTY;

      try {
        setFlagApiKey(opts.apiKey);
        if (useNdjson) {
          await runNdjsonWatch();
        } else {
          await runInkWatch();
        }
      } catch (error) {
        handleError(error, !!opts.json);
      } finally {
        setFlagApiKey(undefined);
      }
    });
}

/**
 * NDJSON mode — stdout receives one JSON line per notification; stderr
 * receives status breadcrumbs AND per-notification `[unread] <N>` refetch
 * breadcrumbs (US-1.5 — stdout stays strictly one-line-per-notification).
 * SIGINT disposes the listener and exits 0 within the 500ms budget (US-1.6).
 *
 * Leak-safety: the listener and SIGINT/SIGTERM handlers are tracked in the
 * outer scope and torn down in `finally`, so a throw from inside
 * `onNotification` (e.g. JSON.stringify on a circular payload) cannot leave
 * the WS subscription, poller, or process-level signal listeners registered
 * (A-002 remediation).
 */
async function runNdjsonWatch(): Promise<void> {
  type Listener = { stop: () => void };
  // Use ref holders — TypeScript's narrowing does not cross the Promise
  // callback boundary for `let` bindings, so we box the mutable state in
  // objects whose property types are stable.
  const listenerRef: { current: Listener | null } = { current: null };
  const sigintRef: { current: (() => void) | null } = { current: null };

  // Extracted refetcher — unit-tested via createNdjsonUnreadRefetcher
  // (A-004 remediation).
  const refetcher = createNdjsonUnreadRefetcher({
    fetchUnread: fetchUnreadCount,
    stderrWrite: (chunk) => process.stderr.write(chunk),
  });

  try {
    await new Promise<void>((resolve, reject) => {
      let stopped = false;

      listenerRef.current = startNotificationListener({
        onNotification: (_formatted, raw) => {
          try {
            process.stdout.write(JSON.stringify(raw) + '\n');
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
            return;
          }
          refetcher.schedule();
        },
        onStatusChange: (status) => {
          process.stderr.write(`[${status}]\n`);
        },
      });

      sigintRef.current = () => {
        if (stopped) return;
        stopped = true;
        resolve();
      };

      process.on('SIGINT', sigintRef.current);
      process.on('SIGTERM', sigintRef.current);
    });
  } finally {
    refetcher.cancel();
    if (listenerRef.current) {
      try {
        listenerRef.current.stop();
      } catch {
        // swallow — teardown best-effort
      }
    }
    if (sigintRef.current) {
      process.off('SIGINT', sigintRef.current);
      process.off('SIGTERM', sigintRef.current);
    }
  }
}

/**
 * Ink mode — mounts WatchFeed with patchConsole + exitOnCtrlC:false so the
 * component owns clean teardown via its useEffect cleanup.
 *
 * Before mounting, we issue an initial `getNotificationUnreadCount` query
 * and pass the result to <WatchFeed initialUnread={N}>. On failure, we pass
 * `null` (header renders `unread: ?`) and write a single stderr warning.
 */
async function runInkWatch(): Promise<void> {
  let initialUnread: number | null = null;
  try {
    initialUnread = await fetchUnreadCount();
  } catch {
    try {
      process.stderr.write('[warn] initial unread fetch failed\n');
    } catch {
      // ignore
    }
    initialUnread = null;
  }

  const instance = render(
    React.createElement(WatchFeed, {
      initialUnread,
      fetchUnread: fetchUnreadCount,
    }),
    {
      exitOnCtrlC: false,
      patchConsole: true,
    },
  );
  await instance.waitUntilExit();
}
