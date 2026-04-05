import { describe, it, expect, vi, afterEach } from 'vitest';
import { GraphQLError } from '../../../src/api/graphql.js';

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

    it('throws UNAUTHENTICATED when no auth available', async () => {
      delete process.env.LEMONADE_API_KEY;

      const store = await import('../../../src/auth/store.js');
      vi.spyOn(store, 'getAuthHeader').mockReturnValue(undefined);

      const { graphqlRequest } = await import('../../../src/api/graphql.js');
      await expect(graphqlRequest('query { test }')).rejects.toThrow('Not authenticated');
    });

    it('surfaces GraphQL validation errors on HTTP 400', async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            {
              message: 'Cannot query field "state" on type "AIEventGuest". Did you mean "status"?',
              extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
            },
          ],
        }),
      }));

      process.env.LEMONADE_API_KEY = 'test-key-123';
      const { graphqlRequest } = await import('../../../src/api/graphql.js');

      try {
        await graphqlRequest('query { test }');
        expect.unreachable('should have thrown');
      } catch (err: unknown) {
        const gqlErr = err as GraphQLError;
        expect(gqlErr.message).toContain('Cannot query field "state"');
        expect(gqlErr.code).toBe('GRAPHQL_VALIDATION_FAILED');
        expect(gqlErr.statusCode).toBe(400);
      }

      delete process.env.LEMONADE_API_KEY;
    });

    it('falls back to generic message on 400 without errors body', async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 400,
        json: async () => ({}),
      }));

      process.env.LEMONADE_API_KEY = 'test-key-123';
      const { graphqlRequest } = await import('../../../src/api/graphql.js');

      await expect(graphqlRequest('query { test }')).rejects.toThrow('Backend returned 400');

      delete process.env.LEMONADE_API_KEY;
    });

    it('falls back gracefully on non-JSON HTTP error body', async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 502,
        json: async () => { throw new SyntaxError('Unexpected token'); },
      }));

      process.env.LEMONADE_API_KEY = 'test-key-123';
      const { graphqlRequest } = await import('../../../src/api/graphql.js');

      try {
        await graphqlRequest('query { test }');
        expect.unreachable('should have thrown');
      } catch (err: unknown) {
        const gqlErr = err as GraphQLError;
        expect(gqlErr.message).toBe('Backend returned 502');
        expect(gqlErr.code).toBe('INTERNAL');
        expect(gqlErr.statusCode).toBe(502);
      }

      delete process.env.LEMONADE_API_KEY;
    });

    it('falls back to generic message on 400 with empty errors array', async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ errors: [] }),
      }));

      process.env.LEMONADE_API_KEY = 'test-key-123';
      const { graphqlRequest } = await import('../../../src/api/graphql.js');

      await expect(graphqlRequest('query { test }')).rejects.toThrow('Backend returned 400');

      delete process.env.LEMONADE_API_KEY;
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
      const { graphqlRequest } = await import('../../../src/api/graphql.js');

      await graphqlRequest('query { test }');
      expect(capturedHeaders['Authorization']).toBe('Bearer test-key-123');
      expect(capturedHeaders['Content-Type']).toBe('application/json');

      delete process.env.LEMONADE_API_KEY;
    });
  });
});
