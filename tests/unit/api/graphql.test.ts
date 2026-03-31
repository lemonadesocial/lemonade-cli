import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphQLError } from '../../../src/api/graphql';

describe('GraphQL Client', () => {
  describe('GraphQLError', () => {
    it('creates error with code and status', () => {
      const err = new GraphQLError('test error', 'AUTH_FAILED', 401);
      expect(err.message).toBe('test error');
      expect(err.code).toBe('AUTH_FAILED');
      expect(err.statusCode).toBe(401);
      expect(err.name).toBe('GraphQLError');
    });

    it('works with undefined code', () => {
      const err = new GraphQLError('test', undefined, 500);
      expect(err.code).toBeUndefined();
    });
  });

  describe('graphqlRequest', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    // TODO: This test has a mock isolation bug on main -- vi.doMock does not
    // fully replace the module before re-import due to ESM caching.
    it('throws UNAUTHENTICATED when no auth available', async () => {
      // Clear all auth sources
      delete process.env.LEMONADE_API_KEY;
      vi.doMock('../../../src/auth/store', () => ({
        getApiUrl: () => 'https://test.api',
        getAuthHeader: () => undefined,
      }));

      // Re-import to get mocked version
      const { graphqlRequest } = await import('../../../src/api/graphql');
      await expect(graphqlRequest('query { test }')).rejects.toThrow('Not authenticated');
    });

    it('sends correct headers when auth is present', async () => {
      let capturedHeaders: Record<string, string> = {};

      global.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        capturedHeaders = init.headers as Record<string, string>;
        return {
          ok: true,
          json: async () => ({ data: { test: true } }),
        };
      });

      process.env.LEMONADE_API_KEY = 'test-key-123';
      const { graphqlRequest } = await import('../../../src/api/graphql');

      await graphqlRequest('query { test }');
      expect(capturedHeaders['Authorization']).toBe('Bearer test-key-123');
      expect(capturedHeaders['Content-Type']).toBe('application/json');

      delete process.env.LEMONADE_API_KEY;
    });
  });
});
