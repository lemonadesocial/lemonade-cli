import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Registry Client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends search request with correct headers', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    global.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init.headers as Record<string, string>;
      return {
        ok: true,
        json: async () => ({
          items: [],
          cursor: null,
          total: 0,
          sources: [],
        }),
      };
    });

    const { registrySearch } = await import('../../../src/api/registry');
    const result = await registrySearch({ q: 'techno', limit: 5 });

    expect(capturedUrl).toContain('/atlas/v1/search');
    expect(capturedUrl).toContain('q=techno');
    expect(capturedUrl).toContain('limit=5');
    expect(capturedHeaders['Atlas-Agent-Id']).toBe('cli:lemonade-cli');
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockImplementation(async () => ({
      ok: false,
      status: 503,
    }));

    const { registrySearch } = await import('../../../src/api/registry');
    await expect(registrySearch({ q: 'test' })).rejects.toThrow('Registry search failed: 503');
  });
});
