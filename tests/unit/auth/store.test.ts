import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Create a stable test home dir before the os mock is installed.
const testHome = mkdtempSync(join(tmpdir(), 'lemonade-test-'));

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return {
    ...actual,
    homedir: () => testHome,
  };
});

// Paths that mirror the production constants after the homedir mock.
const testConfigDir = join(testHome, '.lemonade');
const testConfigFile = join(testConfigDir, 'config.json');
const testTmpFile = testConfigFile + '.tmp';

// Helper to reset the config directory between tests.
function cleanConfigDir() {
  if (existsSync(testConfigDir)) {
    rmSync(testConfigDir, { recursive: true, force: true });
  }
}

describe('Auth Store — atomic writes', () => {
  beforeEach(() => {
    cleanConfigDir();
    vi.resetModules(); // ensure fresh module state per test
  });

  afterEach(() => {
    cleanConfigDir();
  });

  it('setApiKey writes config atomically (no .tmp file left)', async () => {
    const { setApiKey } = await import('../../../src/auth/store.js');

    setApiKey('test-key-123');

    // Config file should exist with correct content
    expect(existsSync(testConfigFile)).toBe(true);
    const raw = readFileSync(testConfigFile, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.api_key).toBe('test-key-123');

    // Temp file should NOT exist after a successful write
    expect(existsSync(testTmpFile)).toBe(false);
  });

  it('returns defaults when config.json is corrupted (no .tmp recovery)', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(testConfigFile, '{{{corrupted', 'utf-8');
    writeFileSync(testTmpFile, JSON.stringify({ api_key: 'should-not-recover' }), 'utf-8');

    const { getConfig } = await import('../../../src/auth/store.js');
    const config = getConfig();

    expect(config.api_key).toBeUndefined();
    expect(config.api_url).toBe('https://backend.lemonade.social');
    expect(existsSync(testTmpFile)).toBe(false);
  });

  it('readConfig cleans up leftover .tmp file on successful read', async () => {
    const { setApiKey, getConfig } = await import('../../../src/auth/store.js');
    setApiKey('test-key');

    writeFileSync(testTmpFile, '{"stale": true}', 'utf-8');
    expect(existsSync(testTmpFile)).toBe(true);

    const config = getConfig();
    expect(config.api_key).toBe('test-key');
    expect(existsSync(testTmpFile)).toBe(false);
  });

  it('readConfig falls back to defaults when both files are corrupted', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(testConfigFile, '{{{corrupted', 'utf-8');
    writeFileSync(testTmpFile, '{{{also-corrupted', 'utf-8');

    const { getConfig } = await import('../../../src/auth/store.js');
    const config = getConfig();

    // Should return defaults
    expect(config.api_url).toBe('https://backend.lemonade.social');
    expect(config.api_key).toBeUndefined();
    // Temp file should have been cleaned up
    expect(existsSync(testTmpFile)).toBe(false);
  });

  it('writeConfig preserves 0o600 file permissions', async () => {
    const { setApiKey } = await import('../../../src/auth/store.js');
    setApiKey('perm-test');

    const stats = statSync(testConfigFile);
    // 0o600 = owner read+write only (octal 600 = decimal 384)
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('setTokens followed by getConfig returns correct tokens', async () => {
    const { setTokens, getConfig } = await import('../../../src/auth/store.js');

    const before = Date.now();
    setTokens('access-abc', 'refresh-xyz', 3600);
    const after = Date.now();

    const config = getConfig();
    expect(config.access_token).toBe('access-abc');
    expect(config.refresh_token).toBe('refresh-xyz');
    // token_expires_at should be ~1 hour from now
    expect(config.token_expires_at).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(config.token_expires_at).toBeLessThanOrEqual(after + 3600 * 1000);
  });
});

describe('JSON Output', () => {
  it('produces success envelope', async () => {
    const { jsonSuccess } = await import('../../../src/output/json');
    const output = jsonSuccess({ name: 'test' });
    const parsed = JSON.parse(output);
    expect(parsed.ok).toBe(true);
    expect(parsed.data.name).toBe('test');
  });

  it('produces error envelope', async () => {
    const { jsonError } = await import('../../../src/output/json');
    const output = jsonError('TEST_ERR', 'something failed');
    const parsed = JSON.parse(output);
    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe('TEST_ERR');
    expect(parsed.error.message).toBe('something failed');
  });

  it('includes pagination in success envelope', async () => {
    const { jsonSuccess } = await import('../../../src/output/json');
    const output = jsonSuccess([1, 2, 3], { cursor: 'abc', total: 100 });
    const parsed = JSON.parse(output);
    expect(parsed.ok).toBe(true);
    expect(parsed.cursor).toBe('abc');
    expect(parsed.total).toBe(100);
  });

  it('includes upgrade info in error envelope', async () => {
    const { jsonError } = await import('../../../src/output/json');
    const output = jsonError('TIER_LIMIT', 'limit reached', {
      upgrade_url: 'https://example.com/upgrade',
      upgrade_command: 'lemonade space upgrade test',
    });
    const parsed = JSON.parse(output);
    expect(parsed.error.upgrade_url).toBe('https://example.com/upgrade');
    expect(parsed.error.upgrade_command).toBe('lemonade space upgrade test');
  });
});
