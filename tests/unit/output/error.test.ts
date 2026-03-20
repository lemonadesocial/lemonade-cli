import { describe, it, expect, vi } from 'vitest';
import { ExitCode } from '../../../src/output/error';
import { GraphQLError } from '../../../src/api/graphql';
import { AtlasError } from '../../../src/api/atlas';

describe('Error Handler', () => {
  describe('ExitCode', () => {
    it('has correct values', () => {
      expect(ExitCode.SUCCESS).toBe(0);
      expect(ExitCode.USER_ERROR).toBe(1);
      expect(ExitCode.AUTH_ERROR).toBe(2);
      expect(ExitCode.NETWORK_ERROR).toBe(3);
    });
  });

  describe('error classification', () => {
    it('GraphQLError 401 maps to AUTH_ERROR', () => {
      const err = new GraphQLError('auth failed', 'UNAUTHENTICATED', 401);
      expect(err.statusCode).toBe(401);
    });

    it('GraphQLError 400 maps to USER_ERROR', () => {
      const err = new GraphQLError('bad input', 'BAD_USER_INPUT', 400);
      expect(err.statusCode).toBe(400);
    });

    it('AtlasError 401 maps to AUTH_ERROR', () => {
      const err = new AtlasError('unauthorized', 401);
      expect(err.statusCode).toBe(401);
    });

    it('AtlasError 404 maps to USER_ERROR', () => {
      const err = new AtlasError('not found', 404);
      expect(err.statusCode).toBe(404);
    });
  });
});
