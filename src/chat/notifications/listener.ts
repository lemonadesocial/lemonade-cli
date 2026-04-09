import {
  createNotificationSubscription,
  type LemonadeNotification,
} from '../../api/subscriptions.js';
import { startNotificationPoller } from './poller.js';
import { formatNotification } from './formatter.js';

export type NotificationStatus = 'connected' | 'disconnected' | 'polling';

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

  const handleNotification = (notification: LemonadeNotification) => {
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
