import { createClient, type Client } from 'graphql-ws';
import WebSocket from 'ws';
import { getApiUrl, ensureAuthHeader } from '../auth/store.js';

export interface LemonadeNotification {
  _id: string;
  created_at: string;
  type: string;
  title?: string;
  message?: string;
  image_url?: string;
  from?: string;
  ref_event?: string;
  ref_space?: string;
  ref_user?: string;
  is_seen?: boolean;
}

export interface SubscriptionOptions {
  onNotification: (notification: LemonadeNotification) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

const NOTIFICATION_SUBSCRIPTION = `
  subscription NotificationCreated {
    notificationCreated {
      _id
      created_at
      type
      title
      message
      image_url
      from
      ref_event
      ref_space
      ref_user
      is_seen
    }
  }
`;

export function createNotificationSubscription(
  options: SubscriptionOptions,
): { dispose: () => void } {
  const apiUrl = getApiUrl();
  const wsUrl = apiUrl.replace(/^http/, 'ws') + '/graphql';

  let disposed = false;
  let client: Client | null = null;
  let activeUnsubscribe: (() => void) | null = null;

  async function connect() {
    if (disposed) return;

    const auth = await ensureAuthHeader();
    if (!auth) {
      options.onError?.(new Error('Not authenticated'));
      return;
    }

    client = createClient({
      url: wsUrl,
      webSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
      connectionParams: async () => {
        const freshAuth = await ensureAuthHeader();
        const freshToken = freshAuth?.replace('Bearer ', '') ?? '';
        return { token: freshToken };
      },
      shouldRetry: () => !disposed,
      retryAttempts: Infinity,
      retryWait: async (retryCount: number) => {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30_000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      },
      on: {
        connected: () => options.onConnected?.(),
        closed: () => {
          if (!disposed) options.onDisconnected?.();
        },
        error: (err: unknown) =>
          options.onError?.(
            err instanceof Error ? err : new Error(String(err)),
          ),
      },
    });

    activeUnsubscribe = client.subscribe<{ notificationCreated: LemonadeNotification }>(
      { query: NOTIFICATION_SUBSCRIPTION },
      {
        next: (value) => {
          const notification = value.data?.notificationCreated;
          if (notification) {
            options.onNotification(notification);
          }
        },
        error: (err: unknown) => {
          options.onError?.(
            err instanceof Error ? err : new Error(String(err)),
          );
        },
        complete: () => {
          if (!disposed) {
            // Reconnect on unexpected completion
            setTimeout(() => connect(), 1000);
          }
        },
      },
    );
  }

  function dispose() {
    disposed = true;
    activeUnsubscribe?.();
    client?.dispose();
  }

  connect().catch((err) => {
    options.onError?.(err instanceof Error ? err : new Error(String(err)));
  });

  return { dispose };
}
