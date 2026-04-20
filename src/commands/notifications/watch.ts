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

const NDJSON_UNREAD_DEBOUNCE_MS = 250;

async function fetchUnreadCount(): Promise<number> {
  const result = await graphqlRequest<{ getNotificationUnreadCount: number }>(
    GET_NOTIFICATION_UNREAD_COUNT_QUERY,
  );
  return result.getNotificationUnreadCount;
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
  const unreadTimerRef: { current: NodeJS.Timeout | null } = { current: null };

  const scheduleUnreadRefetch = (): void => {
    if (unreadTimerRef.current) {
      clearTimeout(unreadTimerRef.current);
    }
    unreadTimerRef.current = setTimeout(() => {
      unreadTimerRef.current = null;
      fetchUnreadCount()
        .then((n) => {
          try {
            process.stderr.write(`[unread] ${n}\n`);
          } catch {
            // ignore
          }
        })
        .catch(() => {
          // Best-effort — swallow. A noisy warning per refetch would
          // bury the stream; silence on failure is the PRD's spec.
        });
    }, NDJSON_UNREAD_DEBOUNCE_MS);
  };

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
          scheduleUnreadRefetch();
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
    if (unreadTimerRef.current) {
      clearTimeout(unreadTimerRef.current);
      unreadTimerRef.current = null;
    }
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
