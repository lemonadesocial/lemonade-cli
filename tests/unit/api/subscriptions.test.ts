import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — graphql-ws createClient captures the options so tests can drive
// synthetic close events and assert on connectionParams.
// ---------------------------------------------------------------------------

type CreateClientOptions = {
  url: string;
  connectionParams?: () => Promise<Record<string, unknown>>;
  shouldRetry?: (errOrCloseEvent: unknown) => boolean;
  on: {
    connected?: () => void;
    closed: (event: unknown) => void;
    error?: (err: unknown) => void;
  };
};

let lastCreateClientOptions: CreateClientOptions | null = null;
const subscribeMock = vi.fn(() => () => {});
const disposeMock = vi.fn();

vi.mock('graphql-ws', () => ({
  createClient: (opts: CreateClientOptions) => {
    lastCreateClientOptions = opts;
    return {
      subscribe: subscribeMock,
      dispose: disposeMock,
    };
  },
}));

vi.mock('ws', () => ({ default: class {} }));

const ensureAuthHeaderMock = vi.fn(async () => 'Bearer test-token' as string | undefined);
const clearAuthMock = vi.fn();

vi.mock('../../../src/auth/store.js', () => ({
  getApiUrl: () => 'http://localhost:4000',
  ensureAuthHeader: (...args: unknown[]) => ensureAuthHeaderMock(...args),
  clearAuth: (...args: unknown[]) => clearAuthMock(...args),
}));

const getClientHeadersMock = vi.fn<() => Record<string, string>>(() => ({
  'X-Client-Type': 'cli',
  'X-Client-Device-Name': 'test-host',
  'X-Client-OS': 'linux 1.0.0',
  'X-Client-App-Version': '1.0.0-test',
  'X-Client-Locale': 'en-US',
}));

vi.mock('../../../src/api/graphql.js', () => ({
  getClientHeaders: (...args: unknown[]) => getClientHeadersMock(...args),
  setClientType: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

async function loadFreshModule() {
  vi.resetModules();
  lastCreateClientOptions = null;
  return import('../../../src/api/subscriptions.js');
}

/**
 * Narrowing helper: asserts the subscription factory has captured the
 * createClient options and returns a non-null handle. Lets call sites read
 * `getLastOpts().on.closed(...)` without a bang-operator everywhere (A-007).
 */
function getLastOpts(): NonNullable<typeof lastCreateClientOptions> {
  expect(lastCreateClientOptions).not.toBeNull();
  return lastCreateClientOptions!;
}

async function startSubscription(
  opts: Partial<Parameters<Awaited<ReturnType<typeof loadFreshModule>>['createNotificationSubscription']>[0]> = {},
) {
  const mod = await loadFreshModule();
  const onNotification = vi.fn();
  const onConnected = vi.fn();
  const onDisconnected = vi.fn();
  const onError = vi.fn();
  const onSessionRevoked = vi.fn();

  const sub = mod.createNotificationSubscription({
    onNotification,
    onConnected,
    onDisconnected,
    onError,
    onSessionRevoked,
    ...opts,
  });

  // Wait for the microtask-driven connect() to wire up createClient.
  await vi.waitFor(() => {
    expect(lastCreateClientOptions).not.toBeNull();
  });

  return {
    sub,
    opts: { onNotification, onConnected, onDisconnected, onError, onSessionRevoked },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('createNotificationSubscription', () => {
  let stderrWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    // Reset implementations (resetAllMocks clears mockImplementation).
    ensureAuthHeaderMock.mockImplementation(async () => 'Bearer test-token');
    subscribeMock.mockImplementation(() => () => {});
    getClientHeadersMock.mockImplementation(() => ({
      'X-Client-Type': 'cli',
      'X-Client-Device-Name': 'test-host',
      'X-Client-OS': 'linux 1.0.0',
      'X-Client-App-Version': '1.0.0-test',
      'X-Client-Locale': 'en-US',
    }));
    stderrWriteSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
  });

  // -------------------------------------------------------------------------
  // Existing smoke tests (retained)
  // -------------------------------------------------------------------------

  it('exports createNotificationSubscription as a function', async () => {
    const mod = await loadFreshModule();
    expect(mod.createNotificationSubscription).toBeTypeOf('function');
  });

  it('dispose() can be called immediately without error', async () => {
    const mod = await loadFreshModule();
    const sub = mod.createNotificationSubscription({ onNotification: () => {} });
    expect(() => sub.dispose()).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // Case 1 — close 4401 (terminal session revocation)
  // -------------------------------------------------------------------------

  it('close code 4401 → disposes, clears auth, invokes onSessionRevoked, breadcrumb before any user message', async () => {
    const { opts } = await startSubscription();

    getLastOpts().on.closed({ code: 4401 });

    expect(clearAuthMock).toHaveBeenCalledTimes(1);
    expect(opts.onSessionRevoked).toHaveBeenCalledTimes(1);
    expect(opts.onDisconnected).not.toHaveBeenCalled();
    expect(opts.onError).not.toHaveBeenCalled();

    // Breadcrumb emitted exactly once with the contract-required literal.
    const calls = stderrWriteSpy.mock.calls.map((c) => String(c[0]));
    const revokedBreadcrumbs = calls.filter((msg) =>
      msg.includes('[lemonade-cli] session revoked code=4401'),
    );
    expect(revokedBreadcrumbs).toHaveLength(1);

    // shouldRetry must return false after 4401 (disposed=true).
    expect(getLastOpts().shouldRetry?.(undefined)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Case 2 — first 4403 (token expired, recoverable)
  // -------------------------------------------------------------------------

  it('close code 4403 (first occurrence) → ensureAuthHeader awaited, refresh flag flips, no clearAuth, no user prompt', async () => {
    const { opts } = await startSubscription();

    // Baseline call count from the initial connect()
    const baselineAuthCalls = ensureAuthHeaderMock.mock.calls.length;

    getLastOpts().on.closed({ code: 4403 });
    // Allow the fire-and-forget ensureAuthHeader() refresh to settle.
    await Promise.resolve();

    // Refresh was kicked off.
    expect(ensureAuthHeaderMock.mock.calls.length).toBeGreaterThan(baselineAuthCalls);
    expect(clearAuthMock).not.toHaveBeenCalled();
    expect(opts.onSessionRevoked).not.toHaveBeenCalled();
    expect(opts.onDisconnected).not.toHaveBeenCalled();

    const calls = stderrWriteSpy.mock.calls.map((c) => String(c[0]));
    expect(
      calls.some((msg) =>
        msg.includes('[lemonade-cli] token expired, refreshing code=4403'),
      ),
    ).toBe(true);
    // No 4401 breadcrumb on first 4403.
    expect(
      calls.some((msg) =>
        msg.includes('[lemonade-cli] session revoked code=4401'),
      ),
    ).toBe(false);

    // shouldRetry still true (disposed unchanged).
    expect(getLastOpts().shouldRetry?.(undefined)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Case 3 — second 4403 promotes to 4401 path
  // -------------------------------------------------------------------------

  it('close code 4403 (second occurrence with flag true) → promotes to 4401, emits promotion breadcrumb BEFORE 4401 breadcrumb', async () => {
    const { opts } = await startSubscription();

    // First 4403 flips tokenRefreshAttempted = true
    getLastOpts().on.closed({ code: 4403 });
    await Promise.resolve();

    // Second 4403 → promote
    getLastOpts().on.closed({ code: 4403 });

    expect(clearAuthMock).toHaveBeenCalledTimes(1);
    expect(opts.onSessionRevoked).toHaveBeenCalledTimes(1);

    const calls = stderrWriteSpy.mock.calls.map((c) => String(c[0]));
    const promotionIdx = calls.findIndex((msg) =>
      msg.includes(
        '[lemonade-cli] token refresh failed, treating as revoked code=4403->4401',
      ),
    );
    const revokedIdx = calls.findIndex((msg) =>
      msg.includes('[lemonade-cli] session revoked code=4401'),
    );
    expect(promotionIdx).toBeGreaterThanOrEqual(0);
    expect(revokedIdx).toBeGreaterThan(promotionIdx);
  });

  // -------------------------------------------------------------------------
  // Cases 4/5/6 — transient codes (1006 / 1011 / 1012)
  // -------------------------------------------------------------------------

  it.each([[1006], [1011], [1012]])(
    'close code %i (transient) → no clearAuth, no breadcrumb, onDisconnected invoked, shouldRetry=true',
    async (code) => {
      const { opts } = await startSubscription();

      getLastOpts().on.closed({ code });

      expect(clearAuthMock).not.toHaveBeenCalled();
      expect(opts.onSessionRevoked).not.toHaveBeenCalled();
      expect(opts.onDisconnected).toHaveBeenCalledTimes(1);

      const calls = stderrWriteSpy.mock.calls.map((c) => String(c[0]));
      expect(calls.some((msg) => msg.startsWith('[lemonade-cli]'))).toBe(false);
      expect(getLastOpts().shouldRetry?.(undefined)).toBe(true);
    },
  );

  // -------------------------------------------------------------------------
  // Case 7 — close code undefined (clean shutdown)
  // -------------------------------------------------------------------------

  it('close code undefined (clean shutdown) → no breadcrumb, onDisconnected invoked, disposed unchanged', async () => {
    const { opts } = await startSubscription();

    getLastOpts().on.closed(undefined);

    expect(clearAuthMock).not.toHaveBeenCalled();
    expect(opts.onSessionRevoked).not.toHaveBeenCalled();
    expect(opts.onDisconnected).toHaveBeenCalledTimes(1);

    const calls = stderrWriteSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.startsWith('[lemonade-cli]'))).toBe(false);
    expect(getLastOpts().shouldRetry?.(undefined)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Case 8 — unknown code (9999)
  // -------------------------------------------------------------------------

  it('close code 9999 (unknown) → permissive default: no breadcrumb, no clearAuth, retry allowed', async () => {
    const { opts } = await startSubscription();

    getLastOpts().on.closed({ code: 9999 });

    expect(clearAuthMock).not.toHaveBeenCalled();
    expect(opts.onSessionRevoked).not.toHaveBeenCalled();
    expect(opts.onDisconnected).toHaveBeenCalledTimes(1);

    const calls = stderrWriteSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.startsWith('[lemonade-cli]'))).toBe(false);
    expect(getLastOpts().shouldRetry?.(undefined)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Case 9 — connectionParams contract assertion
  // -------------------------------------------------------------------------

  it('connectionParams includes literal "X-Client-Type" title-case = "cli" plus token', async () => {
    await startSubscription();

    const params = await getLastOpts().connectionParams!();
    expect(params['X-Client-Type']).toBe('cli');
    expect(params).toHaveProperty('token');
    expect(params.token).toBe('test-token');
  });

  it('connectionParams includes "X-Client-Type" = "mcp" when client type is mcp', async () => {
    getClientHeadersMock.mockImplementation(() => ({
      'X-Client-Type': 'mcp',
      'X-Client-Device-Name': 'Lemonade MCP (test-host)',
      'X-Client-OS': 'linux 1.0.0',
      'X-Client-App-Version': '1.0.0-test',
      'X-Client-Locale': 'en-US',
    }));

    await startSubscription();

    const params = await getLastOpts().connectionParams!();
    expect(params['X-Client-Type']).toBe('mcp');
    expect(params).toHaveProperty('token');
  });

  // -------------------------------------------------------------------------
  // Case 10 — on.connected resets tokenRefreshAttempted; non-4403 close also resets
  // -------------------------------------------------------------------------

  it('on.connected resets tokenRefreshAttempted so a fresh 4403 gets a new refresh budget', async () => {
    const { opts } = await startSubscription();

    // Burn the refresh budget with a 4403
    getLastOpts().on.closed({ code: 4403 });
    await Promise.resolve();
    const afterFirstBreadcrumbCount = stderrWriteSpy.mock.calls.filter((c) =>
      String(c[0]).includes('token expired, refreshing code=4403'),
    ).length;
    expect(afterFirstBreadcrumbCount).toBe(1);

    // Reconnect — on.connected must reset the flag
    getLastOpts().on.connected?.();
    expect(opts.onConnected).toHaveBeenCalled();

    // Another 4403 should now be treated as first-occurrence (refresh, NOT promote to 4401)
    getLastOpts().on.closed({ code: 4403 });
    await Promise.resolve();

    expect(clearAuthMock).not.toHaveBeenCalled();
    expect(opts.onSessionRevoked).not.toHaveBeenCalled();

    const refreshBreadcrumbs = stderrWriteSpy.mock.calls.filter((c) =>
      String(c[0]).includes('token expired, refreshing code=4403'),
    );
    expect(refreshBreadcrumbs).toHaveLength(2);
  });

  it('non-4403 close code resets tokenRefreshAttempted (US-3.4)', async () => {
    await startSubscription();

    // Burn the refresh budget with 4403
    getLastOpts().on.closed({ code: 4403 });
    await Promise.resolve();

    // Transient close resets the flag
    getLastOpts().on.closed({ code: 1006 });

    // Another 4403 should be treated as first-occurrence again
    getLastOpts().on.closed({ code: 4403 });
    await Promise.resolve();

    expect(clearAuthMock).not.toHaveBeenCalled();
    const refreshBreadcrumbs = stderrWriteSpy.mock.calls.filter((c) =>
      String(c[0]).includes('token expired, refreshing code=4403'),
    );
    expect(refreshBreadcrumbs).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// activeSubscription registry — direct unit coverage for the Option A
// module-level registry exposed via getActiveSubscription() (A-009 / US-1.8).
// ---------------------------------------------------------------------------

describe('activeSubscription registry', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureAuthHeaderMock.mockImplementation(async () => 'Bearer test-token');
    subscribeMock.mockImplementation(() => () => {});
    getClientHeadersMock.mockImplementation(() => ({
      'X-Client-Type': 'cli',
      'X-Client-Device-Name': 'test-host',
      'X-Client-OS': 'linux 1.0.0',
      'X-Client-App-Version': '1.0.0-test',
      'X-Client-Locale': 'en-US',
    }));
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  it('getActiveSubscription() returns null BEFORE any factory call', async () => {
    const mod = await loadFreshModule();
    expect(mod.getActiveSubscription()).toBeNull();
  });

  it('getActiveSubscription() returns the live handle (with dispose fn) AFTER a factory call registers it', async () => {
    const mod = await loadFreshModule();
    const handle = mod.createNotificationSubscription({
      onNotification: () => {},
    });

    const active = mod.getActiveSubscription();
    expect(active).not.toBeNull();
    // Registry entry must be the same handle the factory returned.
    expect(active).toBe(handle);
    expect(typeof active?.dispose).toBe('function');
  });

  it('getActiveSubscription() returns null AFTER dispose() is called on the handle', async () => {
    const mod = await loadFreshModule();
    const handle = mod.createNotificationSubscription({
      onNotification: () => {},
    });
    expect(mod.getActiveSubscription()).toBe(handle);

    handle.dispose();

    expect(mod.getActiveSubscription()).toBeNull();
  });

  it('stale-replaced guard: disposing the FIRST handle after a second factory call replaces the registry does NOT clear the SECOND entry', async () => {
    const mod = await loadFreshModule();

    // First subscription registers as active.
    const firstHandle = mod.createNotificationSubscription({
      onNotification: () => {},
    });
    expect(mod.getActiveSubscription()).toBe(firstHandle);

    // Second sequential factory call replaces the registry entry.
    const secondHandle = mod.createNotificationSubscription({
      onNotification: () => {},
    });
    expect(mod.getActiveSubscription()).toBe(secondHandle);
    expect(secondHandle).not.toBe(firstHandle);

    // Disposing the (now-stale) first handle must NOT clobber the second.
    firstHandle.dispose();
    expect(mod.getActiveSubscription()).toBe(secondHandle);

    // Sanity: disposing the currently-registered second handle clears it.
    secondHandle.dispose();
    expect(mod.getActiveSubscription()).toBeNull();
  });
});
