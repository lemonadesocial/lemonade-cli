import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- refreshAccessToken tests ----

describe('refreshAccessToken', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('stores new tokens and returns access_token on success', async () => {
    const store = await import('../../../src/auth/store.js');
    const setTokensSpy = vi.spyOn(store, 'setTokens').mockImplementation(() => {});
    vi.spyOn(store, 'getHydraUrl').mockReturnValue('https://hydra.test');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 86400,
      }),
    });

    const { refreshAccessToken } = await import('../../../src/auth/oauth.js');
    const result = await refreshAccessToken('old-refresh');

    expect(result).toBe('new-access');
    expect(setTokensSpy).toHaveBeenCalledWith('new-access', 'new-refresh', 86400);
  });

  it('clears tokens and returns null on 401', async () => {
    const store = await import('../../../src/auth/store.js');
    const clearTokensSpy = vi.spyOn(store, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(store, 'getHydraUrl').mockReturnValue('https://hydra.test');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const { refreshAccessToken } = await import('../../../src/auth/oauth.js');
    const result = await refreshAccessToken('bad-refresh');

    expect(result).toBeNull();
    expect(clearTokensSpy).toHaveBeenCalled();
  });

  it('clears tokens on 400 (authoritative rejection)', async () => {
    const store = await import('../../../src/auth/store.js');
    const clearTokensSpy = vi.spyOn(store, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(store, 'getHydraUrl').mockReturnValue('https://hydra.test');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    const { refreshAccessToken } = await import('../../../src/auth/oauth.js');
    const result = await refreshAccessToken('bad-refresh');

    expect(result).toBeNull();
    expect(clearTokensSpy).toHaveBeenCalled();
  });

  it('clears tokens on 403 (forbidden / revoked)', async () => {
    const store = await import('../../../src/auth/store.js');
    const clearTokensSpy = vi.spyOn(store, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(store, 'getHydraUrl').mockReturnValue('https://hydra.test');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    const { refreshAccessToken } = await import('../../../src/auth/oauth.js');
    const result = await refreshAccessToken('revoked-refresh');

    expect(result).toBeNull();
    expect(clearTokensSpy).toHaveBeenCalled();
  });

  it('preserves tokens on 500 (transient server error)', async () => {
    const store = await import('../../../src/auth/store.js');
    const clearTokensSpy = vi.spyOn(store, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(store, 'getHydraUrl').mockReturnValue('https://hydra.test');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { refreshAccessToken } = await import('../../../src/auth/oauth.js');
    const result = await refreshAccessToken('some-refresh');

    expect(result).toBeNull();
    expect(clearTokensSpy).not.toHaveBeenCalled();
  });

  it('preserves tokens on network failure', async () => {
    const store = await import('../../../src/auth/store.js');
    const clearTokensSpy = vi.spyOn(store, 'clearTokens').mockImplementation(() => {});
    vi.spyOn(store, 'getHydraUrl').mockReturnValue('https://hydra.test');

    global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const { refreshAccessToken } = await import('../../../src/auth/oauth.js');
    const result = await refreshAccessToken('some-refresh');

    expect(result).toBeNull();
    expect(clearTokensSpy).not.toHaveBeenCalled();
  });
});

// ---- ensureAuthHeader tests ----

describe('ensureAuthHeader', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.LEMONADE_API_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns valid token without refreshing when not expired', async () => {
    const futureExpiry = Date.now() + 3_600_000; // 1 hour from now
    const configJson = JSON.stringify({
      access_token: 'valid-token',
      token_expires_at: futureExpiry,
    });

    vi.doMock('fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('fs')>();
      return {
        ...actual,
        existsSync: () => true,
        readFileSync: () => configJson,
      };
    });

    global.fetch = vi.fn();

    const { ensureAuthHeader } = await import('../../../src/auth/store.js');
    const result = await ensureAuthHeader();

    expect(result).toBe('Bearer valid-token');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refreshes expired token and returns new bearer', async () => {
    const expiredConfig = JSON.stringify({
      access_token: 'expired-token',
      refresh_token: 'valid-refresh',
      token_expires_at: Date.now() - 3_600_000, // 1 hour ago
      hydra_url: 'https://hydra.test',
    });

    vi.doMock('fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('fs')>();
      return {
        ...actual,
        existsSync: () => true,
        readFileSync: () => expiredConfig,
        writeFileSync: () => {},
        mkdirSync: () => {},
      };
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'refreshed-token',
        refresh_token: 'new-refresh',
        expires_in: 86400,
      }),
    });

    const { ensureAuthHeader } = await import('../../../src/auth/store.js');
    const result = await ensureAuthHeader();

    expect(result).toBe('Bearer refreshed-token');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('concurrent calls share the same refresh promise', async () => {
    const expiredConfig = JSON.stringify({
      access_token: 'expired-token',
      refresh_token: 'valid-refresh',
      token_expires_at: Date.now() - 3_600_000,
      hydra_url: 'https://hydra.test',
    });

    vi.doMock('fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('fs')>();
      return {
        ...actual,
        existsSync: () => true,
        readFileSync: () => expiredConfig,
        writeFileSync: () => {},
        mkdirSync: () => {},
      };
    });

    // Resolve after a delay so concurrent callers can pile up
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                access_token: 'shared-token',
                refresh_token: 'new-refresh',
                expires_in: 86400,
              }),
            });
          }, 50),
        ),
    );

    const { ensureAuthHeader } = await import('../../../src/auth/store.js');

    // All three fire before any await yields — the synchronous guard
    // ensures only one fetch despite concurrent callers.
    const [r1, r2, r3] = await Promise.all([
      ensureAuthHeader(),
      ensureAuthHeader(),
      ensureAuthHeader(),
    ]);

    expect(r1).toBe('Bearer shared-token');
    expect(r2).toBe('Bearer shared-token');
    expect(r3).toBe('Bearer shared-token');
    // Only one fetch despite three concurrent calls
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
