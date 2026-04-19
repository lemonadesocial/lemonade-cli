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

/**
 * Module-level registry of the currently-live subscription handle.
 *
 * Phase 2 (IMPL § Phase 2, Option A) — exposes `getActiveSubscription()` so
 * `auth logout` can call `dispose()` on whatever subscription is live WITHOUT
 * unconditionally importing the subscription factory on every logout
 * invocation (US-1.8 / US-1.9).
 *
 * Invariants:
 *   - At most one active subscription per process (CLI is single-tenant).
 *   - `getActiveSubscription()` returns `null` when no subscription is live →
 *     `auth logout` safe-no-op (US-1.8).
 *   - The registry entry is cleared when dispose() runs (idempotent).
 *   - NO cross-process IPC (US-1.9) — pure in-memory per Node process.
 */
let activeSubscription: { dispose: () => void } | null = null;

export function getActiveSubscription(): { dispose: () => void } | null {
  return activeSubscription;
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
        closed: async (rawEvent: unknown) => {
          // Narrow via structural typeof guard: avoids a bare `as` cast and
          // tolerates non-object payloads (undefined, strings) without throwing.
          const code =
            typeof rawEvent === 'object' &&
            rawEvent !== null &&
            'code' in rawEvent &&
            typeof (rawEvent as { code: unknown }).code === 'number'
              ? (rawEvent as { code: number }).code
              : undefined;

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
            // Await ensureAuthHeader() per its contract ("MUST be awaited").
            // graphql-ws v6 Client.on.closed permits Promise<void>, so we can
            // hold the callback until the refresh attempt settles before the
            // next reconnect pulls a token via connectionParams.
            try {
              await ensureAuthHeader();
            } catch {
              // Surface the intermediate failure so ops can see a refresh
              // attempt actually errored (otherwise a silent catch hides the
              // root cause of an eventual 4403→4401 promotion).
              process.stderr.write(
                '[lemonade-cli] token refresh attempt errored code=4403\n',
              );
            }
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
    // Clear the module-level registry only if this subscription is the
    // currently-registered one. Guard prevents a late dispose from a
    // previously-replaced subscription from clobbering a newer handle.
    if (activeSubscription === handle) {
      activeSubscription = null;
    }
  }

  const handle = { dispose };

  // Register as the active subscription BEFORE kicking off connect() so a
  // logout that fires during the initial handshake still finds a disposable
  // handle (US-1.8 safe-no-op when there is none, safe-cleanup when there is).
  activeSubscription = handle;

  connect().catch((err) => {
    options.onError?.(err instanceof Error ? err : new Error(String(err)));
  });

  return handle;
}
