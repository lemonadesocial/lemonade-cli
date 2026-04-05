import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing the module under test
vi.mock('../../../../src/auth/store.js', () => ({
  getConfig: vi.fn(),
  getConfigPath: vi.fn().mockReturnValue('/home/test/.lemonade/config.json'),
  configExists: vi.fn(),
  DEFAULT_API_URL: 'https://backend.lemonade.social',
}));

vi.mock('../../../../src/api/graphql.js', () => ({
  graphqlRequest: vi.fn(),
  GraphQLError: class GraphQLError extends Error {
    code: string | undefined;
    statusCode: number;
    constructor(message: string, code: string | undefined, statusCode: number) {
      super(message);
      this.name = 'GraphQLError';
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

vi.mock('../../../../src/chat/tools/registry.js', () => ({
  buildToolRegistry: vi.fn(),
}));

import {
  checkConfigExists,
  checkConfigReadable,
  checkOutputFormat,
  checkApiUrl,
  checkAuthMethod,
  checkTokenStatus,
  checkRefreshToken,
  checkToolRegistry,
  checkConnectivity,
} from '../../../../src/commands/doctor/index.js';

import type { LemonadeConfig } from '../../../../src/auth/store.js';

import { getConfig, configExists } from '../../../../src/auth/store.js';
import { graphqlRequest, GraphQLError } from '../../../../src/api/graphql.js';
import { buildToolRegistry } from '../../../../src/chat/tools/registry.js';

const mockedGetConfig = vi.mocked(getConfig);
const mockedConfigExists = vi.mocked(configExists);
const mockedGraphqlRequest = vi.mocked(graphqlRequest);
const mockedBuildToolRegistry = vi.mocked(buildToolRegistry);

describe('doctor command', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.LEMONADE_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('config checks', () => {
    it('passes when config file exists', () => {
      mockedConfigExists.mockReturnValue(true);
      const result = checkConfigExists();
      expect(result.status).toBe('pass');
      expect(result.detail).toBe('exists');
    });

    it('fails when config file is missing', () => {
      mockedConfigExists.mockReturnValue(false);
      const result = checkConfigExists();
      expect(result.status).toBe('fail');
      expect(result.detail).toContain('not found');
    });

    it('passes when config is readable', () => {
      mockedGetConfig.mockReturnValue({ output_format: 'table' } as LemonadeConfig);
      const result = checkConfigReadable();
      expect(result.status).toBe('pass');
    });

    it('fails when getConfig throws', () => {
      mockedGetConfig.mockImplementation(() => { throw new Error('corrupt JSON'); });
      const result = checkConfigReadable();
      expect(result.status).toBe('fail');
      expect(result.detail).toContain('corrupt JSON');
    });

    it('passes with valid output format', () => {
      expect(checkOutputFormat({ output_format: 'json' }).status).toBe('pass');
      expect(checkOutputFormat({ output_format: 'table' }).status).toBe('pass');
    });

    it('passes when output format is not set', () => {
      const result = checkOutputFormat({});
      expect(result.status).toBe('pass');
    });

    it('fails with invalid output format', () => {
      const result = checkOutputFormat({ output_format: 'xml' as 'json' });
      expect(result.status).toBe('fail');
      expect(result.detail).toContain('invalid');
    });

    it('passes with valid HTTPS API URL', () => {
      const result = checkApiUrl({ api_url: 'https://backend.lemonade.social' });
      expect(result.status).toBe('pass');
    });

    it('passes with localhost API URL', () => {
      const result = checkApiUrl({ api_url: 'http://localhost:4000' });
      expect(result.status).toBe('pass');
    });

    it('passes with bare localhost URL', () => {
      const result = checkApiUrl({ api_url: 'http://localhost' });
      expect(result.status).toBe('pass');
    });

    it('passes with localhost path URL', () => {
      const result = checkApiUrl({ api_url: 'http://localhost/graphql' });
      expect(result.status).toBe('pass');
    });

    it('fails with localhost subdomain spoof', () => {
      const result = checkApiUrl({ api_url: 'http://localhost.evil.com' });
      expect(result.status).toBe('fail');
    });

    it('fails with non-HTTPS API URL', () => {
      const result = checkApiUrl({ api_url: 'http://insecure.example.com' });
      expect(result.status).toBe('fail');
    });
  });

  describe('auth checks', () => {
    it('passes with LEMONADE_API_KEY env var', () => {
      process.env.LEMONADE_API_KEY = 'test-key';
      const result = checkAuthMethod({});
      expect(result.status).toBe('pass');
      expect(result.detail).toContain('Environment');
    });

    it('passes with OAuth access_token', () => {
      const result = checkAuthMethod({ access_token: 'tok' });
      expect(result.status).toBe('pass');
      expect(result.detail).toBe('OAuth');
    });

    it('passes with api_key', () => {
      const result = checkAuthMethod({ api_key: 'key' });
      expect(result.status).toBe('pass');
      expect(result.detail).toBe('API Key');
    });

    it('fails when no auth is configured', () => {
      const result = checkAuthMethod({});
      expect(result.status).toBe('fail');
      expect(result.detail).toContain('no auth');
    });

    it('shows valid token status for unexpired OAuth', () => {
      const result = checkTokenStatus({
        access_token: 'tok',
        token_expires_at: Date.now() + 3_600_000,
      });
      expect(result.status).toBe('pass');
      expect(result.detail).toContain('valid');
    });

    it('warns when OAuth token is expired', () => {
      const result = checkTokenStatus({
        access_token: 'tok',
        token_expires_at: Date.now() - 60_000,
      });
      expect(result.status).toBe('warn');
      expect(result.detail).toContain('expired');
    });

    it('warns when OAuth token has no expiry', () => {
      const result = checkTokenStatus({ access_token: 'tok' });
      expect(result.status).toBe('warn');
      expect(result.detail).toContain('unknown');
    });

    it('passes for static API key token status', () => {
      const result = checkTokenStatus({ api_key: 'key' });
      expect(result.status).toBe('pass');
      expect(result.detail).toContain('static');
    });

    it('passes when refresh token is present', () => {
      const result = checkRefreshToken({ access_token: 'tok', refresh_token: 'ref' });
      expect(result.status).toBe('pass');
      expect(result.detail).toBe('present');
    });

    it('warns when refresh token is missing for OAuth', () => {
      const result = checkRefreshToken({ access_token: 'tok' });
      expect(result.status).toBe('warn');
      expect(result.detail).toContain('missing');
    });

    it('skips refresh token check for API key auth', () => {
      const result = checkRefreshToken({ api_key: 'key' });
      expect(result.status).toBe('skip');
    });

    it('skips refresh token check for env key', () => {
      process.env.LEMONADE_API_KEY = 'test';
      const result = checkRefreshToken({});
      expect(result.status).toBe('skip');
    });
  });

  describe('tool registry', () => {
    it('passes when tools load successfully', async () => {
      mockedBuildToolRegistry.mockReturnValue({
        tool1: { name: 'tool1', displayName: 'Tool 1', description: 'desc', params: [], run: vi.fn() },
        tool2: { name: 'tool2', displayName: 'Tool 2', description: 'desc', params: [], run: vi.fn() },
      } as never);
      const result = await checkToolRegistry();
      expect(result.status).toBe('pass');
      expect(result.detail).toBe('2 tools');
    });

    it('fails when registry is empty', async () => {
      mockedBuildToolRegistry.mockReturnValue({} as never);
      const result = await checkToolRegistry();
      expect(result.status).toBe('fail');
      expect(result.detail).toContain('empty');
    });

    it('fails when registry throws', async () => {
      mockedBuildToolRegistry.mockImplementation(() => { throw new Error('bad import'); });
      const result = await checkToolRegistry();
      expect(result.status).toBe('fail');
      expect(result.detail).toContain('bad import');
    });
  });

  describe('connectivity', () => {
    it('passes when API is reachable', async () => {
      mockedGraphqlRequest.mockResolvedValue({ __typename: 'Query' });
      const result = await checkConnectivity();
      expect(result.status).toBe('pass');
      expect(result.detail).toContain('reachable');
      expect(result.detail).toMatch(/\d+ms/);
    });

    it('warns on auth failure (still reachable)', async () => {
      mockedGraphqlRequest.mockRejectedValue(
        new GraphQLError('Unauthorized', 'UNAUTHENTICATED', 401),
      );
      const result = await checkConnectivity();
      expect(result.status).toBe('warn');
      expect(result.detail).toContain('auth failed');
    });

    it('fails on network error', async () => {
      mockedGraphqlRequest.mockRejectedValue(new Error('fetch failed'));
      const result = await checkConnectivity();
      expect(result.status).toBe('fail');
      expect(result.detail).toContain('fetch failed');
    });
  });

  describe('runChecks integration', () => {
    // Import runChecks for integration-level assertions
    let runChecks: typeof import('../../../../src/commands/doctor/index.js').runChecks;

    beforeEach(async () => {
      const mod = await import('../../../../src/commands/doctor/index.js');
      runChecks = mod.runChecks;
    });

    it('includes all checks with correct summary when all pass', async () => {
      mockedConfigExists.mockReturnValue(true);
      mockedGetConfig.mockReturnValue({
        output_format: 'table',
        api_url: 'https://backend.lemonade.social',
        api_key: 'key',
      } as LemonadeConfig);
      mockedBuildToolRegistry.mockReturnValue({ t: {} } as never);

      const data = await runChecks(false);
      expect(data.checks).toHaveLength(9);
      expect(data.summary.total).toBe(9);
      // Connectivity is skipped, refresh_token is skipped (API key)
      expect(data.checks.find((c) => c.name === 'api_connectivity')?.status).toBe('skip');
    });

    it('returns correct JSON structure', async () => {
      mockedConfigExists.mockReturnValue(true);
      mockedGetConfig.mockReturnValue({ api_key: 'key' } as LemonadeConfig);
      mockedBuildToolRegistry.mockReturnValue({ t: {} } as never);

      const data = await runChecks(false);

      // Verify structure
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('summary');
      expect(data.summary).toHaveProperty('total');
      expect(data.summary).toHaveProperty('passed');
      expect(data.summary).toHaveProperty('failed');
      expect(data.summary).toHaveProperty('warned');
      expect(data.summary).toHaveProperty('skipped');

      for (const check of data.checks) {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('detail');
        expect(['pass', 'fail', 'warn', 'skip']).toContain(check.status);
      }
    });

    it('skips connectivity by default', async () => {
      mockedConfigExists.mockReturnValue(true);
      mockedGetConfig.mockReturnValue({ api_key: 'k' } as LemonadeConfig);
      mockedBuildToolRegistry.mockReturnValue({ t: {} } as never);

      const data = await runChecks(false);
      const conn = data.checks.find((c) => c.name === 'api_connectivity');
      expect(conn?.status).toBe('skip');
    });

    it('skips connectivity when API URL validation fails', async () => {
      mockedConfigExists.mockReturnValue(true);
      mockedGetConfig.mockReturnValue({
        api_url: 'http://insecure.example.com',
        api_key: 'key',
      } as LemonadeConfig);
      mockedBuildToolRegistry.mockReturnValue({ t: {} } as never);

      const data = await runChecks(true); // connectivity requested
      const conn = data.checks.find((c) => c.name === 'api_connectivity');
      expect(conn?.status).toBe('skip');
      expect(conn?.detail).toContain('API URL validation failed');
      // graphqlRequest should NOT have been called
      expect(mockedGraphqlRequest).not.toHaveBeenCalled();
    });

    it('counts failures correctly when config missing and no auth', async () => {
      mockedConfigExists.mockReturnValue(false);
      mockedGetConfig.mockReturnValue({} as LemonadeConfig);
      mockedBuildToolRegistry.mockReturnValue({ t: {} } as never);

      const data = await runChecks(false);
      expect(data.summary.failed).toBeGreaterThan(0);
      // config_exists fails, auth_method fails
      const failedChecks = data.checks.filter((c) => c.status === 'fail');
      expect(failedChecks.map((c) => c.name)).toContain('config_exists');
      expect(failedChecks.map((c) => c.name)).toContain('auth_method');
    });
  });
});
