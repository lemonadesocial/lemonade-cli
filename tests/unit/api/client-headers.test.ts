import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock auth store
vi.mock('../../../src/auth/store.js', () => ({
  getApiUrl: () => 'https://backend.lemonade.social',
  ensureAuthHeader: vi.fn().mockResolvedValue('Bearer test-token'),
}));

// Mock version
vi.mock('../../../src/config/version.js', () => ({
  getPackageVersion: () => '1.3.0',
}));

import { getClientHeaders, setClientType, graphqlRequest } from '../../../src/api/graphql.js';

describe('X-Client-* Headers', () => {
  beforeEach(() => {
    setClientType('cli');
  });

  it('includes X-Client-Type: cli by default', () => {
    const headers = getClientHeaders();
    expect(headers['X-Client-Type']).toBe('cli');
  });

  it('includes X-Client-Device-Name from os.hostname()', () => {
    const headers = getClientHeaders();
    expect(typeof headers['X-Client-Device-Name']).toBe('string');
    expect(headers['X-Client-Device-Name'].length).toBeGreaterThan(0);
  });

  it('includes X-Client-OS with platform and release', () => {
    const headers = getClientHeaders();
    expect(headers['X-Client-OS']).toMatch(/\S+ \S+/);
  });

  it('includes X-Client-App-Version from package.json', () => {
    const headers = getClientHeaders();
    expect(headers['X-Client-App-Version']).toBe('1.3.0');
  });

  it('includes X-Client-Locale defaulting to en-US', () => {
    const originalLang = process.env.LANG;
    delete process.env.LANG;
    const headers = getClientHeaders();
    expect(headers['X-Client-Locale']).toBe('en-US');
    if (originalLang) process.env.LANG = originalLang;
  });

  it('uses LANG env var for locale when available', () => {
    const originalLang = process.env.LANG;
    process.env.LANG = 'fr-FR.UTF-8';
    const headers = getClientHeaders();
    expect(headers['X-Client-Locale']).toBe('fr-FR.UTF-8');
    if (originalLang) {
      process.env.LANG = originalLang;
    } else {
      delete process.env.LANG;
    }
  });

  describe('Header injection into fetch', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    afterEach(() => {
      fetchSpy?.mockRestore();
    });

    it('sends X-Client-Type on outbound requests', async () => {
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { test: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await graphqlRequest<{ test: boolean }>('query { test }');

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers['X-Client-Type']).toBe('cli');
      expect(headers['X-Client-Device-Name']).toBeDefined();
      expect(headers['X-Client-OS']).toBeDefined();
      expect(headers['X-Client-App-Version']).toBe('1.3.0');
    });
  });
});

describe('MCP Client Type Tagging', () => {
  afterEach(() => {
    setClientType('cli');
  });

  it('sets X-Client-Type to mcp when setClientType is called', () => {
    setClientType('mcp');
    const headers = getClientHeaders();
    expect(headers['X-Client-Type']).toBe('mcp');
  });

  it('MCP type persists across multiple getClientHeaders calls', () => {
    setClientType('mcp');
    expect(getClientHeaders()['X-Client-Type']).toBe('mcp');
    expect(getClientHeaders()['X-Client-Type']).toBe('mcp');
  });

  it('can switch back to cli from mcp', () => {
    setClientType('mcp');
    expect(getClientHeaders()['X-Client-Type']).toBe('mcp');
    setClientType('cli');
    expect(getClientHeaders()['X-Client-Type']).toBe('cli');
  });
});
