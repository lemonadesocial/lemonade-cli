import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/auth/store.js', () => ({
  getConfig: vi.fn(),
  getConfigPath: vi.fn(),
  configExists: vi.fn(),
}));

import { Command } from 'commander';
import { registerStatusCommands } from '../../../../src/commands/status/index.js';
import { getConfig, getConfigPath, configExists } from '../../../../src/auth/store.js';

const mockGetConfig = vi.mocked(getConfig);
const mockGetConfigPath = vi.mocked(getConfigPath);
const mockConfigExists = vi.mocked(configExists);

describe('status command', () => {
  let program: Command;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerStatusCommands(program);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    // Defaults
    mockGetConfig.mockReturnValue({
      output_format: 'table',
      api_url: 'https://backend.lemonade.social',
    });
    mockGetConfigPath.mockReturnValue('/home/user/.lemonade/config.json');
    mockConfigExists.mockReturnValue(true);

    // Clean env
    delete process.env.LEMONADE_API_KEY;
    delete process.env.LEMONADE_API_URL;
    delete process.env.LEMONADE_HYDRA_URL;
    delete process.env.LEMONADE_REGISTRY_URL;
  });

  it('shows "Not authenticated" when no auth configured', async () => {
    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('Not authenticated');
    expect(output).toContain('n/a');
  });

  it('shows "OAuth" auth method when access_token present', async () => {
    mockGetConfig.mockReturnValue({
      access_token: 'abc1234567890xyz',
      token_expires_at: Date.now() + 3_600_000,
      output_format: 'table',
      api_url: 'https://backend.lemonade.social',
    });

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('OAuth');
    expect(output).toContain('abc...0xyz');
    expect(output).toContain('valid');
  });

  it('shows "API Key" auth method when api_key present', async () => {
    mockGetConfig.mockReturnValue({
      api_key: 'key1234567890end',
      output_format: 'table',
      api_url: 'https://backend.lemonade.social',
    });

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('API Key');
    expect(output).toContain('static key (no expiry)');
    expect(output).toContain('key...0end');
  });

  it('shows environment override when LEMONADE_API_KEY set', async () => {
    process.env.LEMONADE_API_KEY = 'envkey123456789last';

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('Environment (LEMONADE_API_KEY)');
    expect(output).toContain('Environment overrides');
    expect(output).toContain('LEMONADE_API_KEY');

    delete process.env.LEMONADE_API_KEY;
  });

  it('shows token expired status correctly', async () => {
    mockGetConfig.mockReturnValue({
      access_token: 'abc1234567890xyz',
      token_expires_at: Date.now() - 7_200_000, // 2h ago
      output_format: 'table',
      api_url: 'https://backend.lemonade.social',
    });

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('expired');
    expect(output).toContain('ago');
  });

  it('shows token valid status correctly', async () => {
    mockGetConfig.mockReturnValue({
      access_token: 'abc1234567890xyz',
      token_expires_at: Date.now() + 2_700_000, // 45m
      output_format: 'table',
      api_url: 'https://backend.lemonade.social',
    });

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('valid');
    expect(output).toContain('expires in');
  });

  it('shows default space when set', async () => {
    mockGetConfig.mockReturnValue({
      default_space: 'my-space-id',
      output_format: 'table',
      api_url: 'https://backend.lemonade.social',
    });

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('my-space-id');
  });

  it('shows "not set" when no default space', async () => {
    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('not set');
  });

  it('JSON output has correct envelope structure', async () => {
    mockGetConfig.mockReturnValue({
      access_token: 'abc1234567890xyz',
      token_expires_at: Date.now() + 3_600_000,
      default_space: 'space-1',
      output_format: 'json',
      api_url: 'https://backend.lemonade.social',
    });

    await program.parseAsync(['node', 'test', 'status', '--json']);

    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toBeDefined();
    expect(parsed.data.auth).toBeDefined();
    expect(parsed.data.auth.method).toBe('OAuth');
    expect(parsed.data.auth.token_status).toContain('valid');
    expect(parsed.data.space).toBeDefined();
    expect(parsed.data.space.default_space).toBe('space-1');
    expect(parsed.data.config).toBeDefined();
    expect(parsed.data.config.path).toBeDefined();
    expect(parsed.data.config.exists).toBe(true);
    expect(parsed.data.env_overrides).toBeDefined();
  });

  it('shows config path', async () => {
    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('/home/user/.lemonade/config.json');
  });

  it('shows non-default API URL', async () => {
    mockGetConfig.mockReturnValue({
      output_format: 'table',
      api_url: 'https://custom-api.example.com',
    });

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('https://custom-api.example.com');
  });

  it('does not show API URL when it is the default', async () => {
    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('API URL');
  });

  it('shows ai_mode when set', async () => {
    mockGetConfig.mockReturnValue({
      output_format: 'table',
      api_url: 'https://backend.lemonade.social',
      ai_mode: 'credits',
    });

    await program.parseAsync(['node', 'test', 'status']);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('credits');
  });
});
