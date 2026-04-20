import {
  createNotificationSubscription,
  type LemonadeNotification,
} from '../../api/subscriptions.js';
import { startNotificationPoller } from './poller.js';
import { formatNotification } from './formatter.js';
import {
  appendLastSeenNotificationId,
  getLastSeenNotificationIds,
} from '../../auth/notification-dedup.js';

export type NotificationStatus =
  | 'connected'
  | 'disconnected'
  | 'disconnected-revoked'
  | 'polling';

export interface NotificationListenerOptions {
  onNotification: (formatted: string, raw: LemonadeNotification) => void;
  onStatusChange?: (status: NotificationStatus) => void;
  pollIntervalMs?: number;
}

export function startNotificationListener(
  options: NotificationListenerOptions,
): { stop: () => void } {
  let wsSubscription: { dispose: () => void } | null = null;
  let poller: { stop: () => void } | null = null;
  let stopped = false;
  let wsConnected = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  // Seed from persisted dedup cache so restarts don't re-emit notifications
  // the previous session already showed (US-6.1..US-6.7).
  const recentIds = getLastSeenNotificationIds();
  const handleNotification = (notification: LemonadeNotification) => {
    if (recentIds.has(notification._id)) return;
    recentIds.add(notification._id);
    if (recentIds.size > 100) {
      const first = recentIds.values().next().value as string;
      recentIds.delete(first);
    }
    // Persist last-seen ID. Ordering matters (US-6.5): add-then-persist so
    // the in-memory cap check above sees the new ID. Wrap in try/catch so a
    // disk failure never crashes the hot WS next() path (US-6.9).
    try {
      appendLastSeenNotificationId(notification._id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[notifications] dedup persist failed: ${msg}\n`,
      );
    }
    const formatted = formatNotification(notification);
    options.onNotification(formatted, notification);
  };

  // Try WebSocket first
  wsSubscription = createNotificationSubscription({
    onNotification: handleNotification,
    onConnected: () => {
      wsConnected = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (poller) {
        poller.stop();
        poller = null;
      }
      options.onStatusChange?.('connected');
    },
    onDisconnected: () => {
      wsConnected = false;
      options.onStatusChange?.('disconnected');
      // Start polling fallback after 5s if WS doesn't reconnect
      if (!stopped) {
        fallbackTimer = setTimeout(() => {
          if (!wsConnected && !stopped) {
            poller = startNotificationPoller(
              handleNotification,
              options.pollIntervalMs || 60_000,
            );
            options.onStatusChange?.('polling');
          }
        }, 5000);
      }
    },
    onError: (err: Error) => {
      process.stderr.write(
        `[notifications] WebSocket error: ${err.message}\n`,
      );
      // If WS never connected, start polling immediately
      if (!wsConnected && !poller && !stopped) {
        poller = startNotificationPoller(
          handleNotification,
          options.pollIntervalMs || 60_000,
        );
        options.onStatusChange?.('polling');
      }
    },
    onSessionRevoked: () => {
      // Terminal status — WS is gone for good. Surface `disconnected-revoked`
      // so the chat UI can render a re-auth indicator (US-2.6d).
      // Do NOT re-emit the `[lemonade-cli] session revoked code=4401` breadcrumb —
      // subscriptions.ts already emitted it exactly once (US-6.9).
      wsConnected = false;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (poller) {
        poller.stop();
        poller = null;
      }
      options.onStatusChange?.('disconnected-revoked');
    },
  });

  return {
    stop: () => {
      stopped = true;
      wsSubscription?.dispose();
      poller?.stop();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    },
  };
}
