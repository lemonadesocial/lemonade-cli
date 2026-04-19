import { createClient, type Client } from 'graphql-ws';
import WebSocket from 'ws';
import { getApiUrl, ensureAuthHeader, clearAuth } from '../auth/store.js';
import { getClientHeaders } from './graphql.js';

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
  /**
   * Invoked exactly once when the backend closes the WS with the terminal
   * session-revocation close code (4401) or after a second 4403 promotes
   * to 4401 (per IMPL US-2.4 / US-3.3). Listeners MUST NOT re-emit the
   * `[lemonade-cli] session revoked code=4401` breadcrumb — that is the
   * close handler's responsibility (US-6.9).
   */
  onSessionRevoked?: () => void;
}

/** Backend close code constants — mirror of `lemonade-backend/src/graphql/index.ts:151,154`. */
const CLOSE_CODE_SESSION_REVOKED = 4401;
const CLOSE_CODE_TOKEN_EXPIRED = 4403;

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

  /**
   * Per-connection single-refresh flag for 4403 (token expired).
   * MUST be closure-local (never module-level) so each createNotificationSubscription
   * call has its own flag — prevents cross-contamination between concurrent MCP
   * `--watch` subscriptions (IMPL Anti-Pattern 6, US-3.2).
   * Resets on `on.connected` (US-3.2a) and on any non-4403 close code (US-3.4).
   */
  let tokenRefreshAttempted = false;

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
        // Required key: 'X-Client-Type' (title-case) — backend reads exactly this
        // casing at lemonade-backend/src/graphql/index.ts:395-406.
        // Optional forward-compat metadata merged in via getClientHeaders(); backend
        // ignores the extra keys today (PRD A-001 Option A + US-5.1).
        return {
          token: freshToken,
          ...getClientHeaders(),
        };
      },
      shouldRetry: () => !disposed,
      retryAttempts: Infinity,
      retryWait: async (retryCount: number) => {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30_000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      },
      on: {
        connected: () => {
          // Reset per-connection refresh attempt on every successful handshake
          // (US-3.2a) so the next 4403 gets a fresh single-refresh budget.
          tokenRefreshAttempted = false;
          options.onConnected?.();
        },
        closed: (rawEvent: unknown) => {
          const event = rawEvent as { code?: number } | undefined;
          const code = typeof event?.code === 'number' ? event.code : undefined;

          if (code === CLOSE_CODE_SESSION_REVOKED) {
            handleSessionRevoked();
            return;
          }

          if (code === CLOSE_CODE_TOKEN_EXPIRED) {
            if (tokenRefreshAttempted) {
              // Second 4403 with flag already true → promote to 4401 path (US-3.3).
              // Emit promotion breadcrumb BEFORE the 4401 breadcrumb (US-6.4).
              process.stderr.write(
                '[lemonade-cli] token refresh failed, treating as revoked code=4403->4401\n',
              );
              handleSessionRevoked();
              return;
            }

            // First 4403: single refresh + allow graphql-ws to reconnect (US-3.1, US-3.5).
            // No clearAuth, no user prompt, no onDisconnected bubble.
            process.stderr.write(
              '[lemonade-cli] token expired, refreshing code=4403\n',
            );
            tokenRefreshAttempted = true;
            // Fire-and-forget: refresh happens in-flight; the reconnect's async
            // connectionParams will re-read the fresh token via ensureAuthHeader().
            ensureAuthHeader().catch(() => {
              /* swallow — retry will try again with current state */
            });
            return;
          }

          // Transient (1006/1011/1012), clean shutdown (undefined), unknown (e.g. 9999):
          // reset refresh budget (US-3.4) and let graphql-ws retry per shouldRetry.
          tokenRefreshAttempted = false;
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

  /**
   * Terminal session-revocation path (US-2.1 through US-2.6).
   *
   * Order MUST be:
   *   1. Emit stderr breadcrumb (US-6.9 — BEFORE any user-visible message)
   *   2. Mark disposed BEFORE shouldRetry is next consulted (US-2.2)
   *   3. clearAuth exactly once (US-2.3)
   *   4. Invoke onSessionRevoked callback (US-2.4)
   *
   * MUST NOT invoke onDisconnected or onError for this event (US-2.5).
   */
  function handleSessionRevoked() {
    process.stderr.write('[lemonade-cli] session revoked code=4401\n');
    disposed = true;
    clearAuth();
    options.onSessionRevoked?.();
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
