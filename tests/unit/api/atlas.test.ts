import { describe, it, expect, vi, afterEach } from 'vitest';
import { AtlasError } from '../../../src/api/atlas';

describe('Atlas Client', () => {
  describe('AtlasError', () => {
    it('creates error with status code', () => {
      const err = new AtlasError('not found', 404);
      expect(err.message).toBe('not found');
      expect(err.statusCode).toBe(404);
      expect(err.name).toBe('AtlasError');
    });
  });

  describe('atlasRequest', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('includes Atlas-Agent-Id and Atlas-Version headers', async () => {
      let capturedHeaders: Record<string, string> = {};

      global.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        capturedHeaders = init.headers as Record<string, string>;
        return {
          ok: true,
          status: 200,
          json: async () => ({ items: [] }),
        };
      });

      const { atlasRequest } = await import('../../../src/api/atlas');
      await atlasRequest({ path: '/atlas/v1/test' });

      expect(capturedHeaders['Atlas-Agent-Id']).toBe('cli:lemonade-cli');
      expect(capturedHeaders['Atlas-Version']).toBe('1.0');
    });

    it('passes 402 responses without throwing', async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 402,
        json: async () => ({ hold_id: 'h123', amount: 25 }),
      }));

      const { atlasRequest } = await import('../../../src/api/atlas');
      const result = await atlasRequest({ path: '/atlas/v1/purchase' });

      expect(result.status).toBe(402);
      expect((result.data as Record<string, unknown>).hold_id).toBe('h123');
    });

    it('constructs query string from params', async () => {
      let capturedUrl = '';

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
        };
      });

      const { atlasRequest } = await import('../../../src/api/atlas');
      await atlasRequest({
        path: '/atlas/v1/search',
        query: { q: 'techno berlin', limit: 10, active: undefined },
      });

      expect(capturedUrl).toContain('q=techno%20berlin');
      expect(capturedUrl).toContain('limit=10');
      expect(capturedUrl).not.toContain('active');
    });
  });
});
