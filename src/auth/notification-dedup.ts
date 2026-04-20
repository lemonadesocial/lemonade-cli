import { readConfig, writeConfig } from './store.js';

/**
 * Persistent dedup cache for notifications (US-6.1..US-6.10).
 *
 * Backed by `~/.lemonade/config.json` via the atomic-rename `readConfig`/
 * `writeConfig` primitives in `src/auth/store.ts`. Neither helper is allowed
 * to throw — disk failures degrade to stderr breadcrumbs (US-6.9) so the
 * listener / poller hot paths never crash.
 *
 * Cap: the last 200 IDs are retained in FIFO order (US-6.8). The in-memory
 * dedup sets in listener.ts / poller.ts layer their own smaller caps on top
 * (100 and 200 respectively); this store exists solely to survive process
 * restarts.
 */

const MAX_IDS = 200;

/**
 * Reads the persisted last-seen notification IDs.
 *
 * Never throws. Returns an empty Set if the config cannot be read or the
 * field is absent (fresh install).
 */
export function getLastSeenNotificationIds(): Set<string> {
  try {
    const config = readConfig();
    return new Set<string>(config.lastSeenNotificationIds ?? []);
  } catch {
    return new Set<string>();
  }
}

/**
 * Appends a notification `_id` to the persisted dedup cache.
 *
 * - Preserves FIFO insertion order; trims oldest entries when cap exceeded.
 * - Idempotent: appending an ID that is already persisted is a no-op (no
 *   reordering, no unnecessary disk write).
 * - Updates `lastSeenNotificationsUpdatedAt = Date.now()`.
 * - Swallows all read / write errors, writing
 *   `[notifications] dedup persist failed: <msg>` to stderr (US-6.9).
 * - Never throws.
 */
export function appendLastSeenNotificationId(id: string): void {
  try {
    const config = readConfig();
    const existing = config.lastSeenNotificationIds ?? [];

    // Idempotency: already persisted -> no write (avoid disk churn and
    // preserve original FIFO order).
    if (existing.includes(id)) {
      return;
    }

    const next = existing.concat(id);
    // Trim oldest entries beyond MAX_IDS (FIFO — US-6.8).
    const trimmed =
      next.length > MAX_IDS ? next.slice(next.length - MAX_IDS) : next;

    config.lastSeenNotificationIds = trimmed;
    config.lastSeenNotificationsUpdatedAt = Date.now();
    writeConfig(config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      process.stderr.write(`[notifications] dedup persist failed: ${msg}\n`);
    } catch {
      // stderr.write itself failing is non-recoverable; swallow per US-6.9.
    }
  }
}
