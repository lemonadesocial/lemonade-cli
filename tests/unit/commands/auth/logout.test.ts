import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/auth/store.js', () => ({
  clearAuth: vi.fn(),
  setApiKey: vi.fn(),
  setFlagApiKey: vi.fn(),
}));

vi.mock('../../../../src/auth/oauth.js', () => ({
  loginWithBrowser: vi.fn(),
}));

vi.mock('../../../../src/api/graphql.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    graphqlRequest: vi.fn(),
  };
});

import { Command } from 'commander';
import { registerAuthCommands } from '../../../../src/commands/auth/index.js';
import { clearAuth } from '../../../../src/auth/store.js';

describe('auth logout', () => {
  let program: Command;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerAuthCommands(program);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  it('calls clearAuth and prints success message', async () => {
    await program.parseAsync(['node', 'test', 'auth', 'logout']);

    expect(clearAuth).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(
      'Logged out. All stored credentials have been cleared.',
    );
  });

  it('outputs JSON envelope with --json flag', async () => {
    await program.parseAsync(['node', 'test', 'auth', 'logout', '--json']);

    expect(clearAuth).toHaveBeenCalledOnce();
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.ok).toBe(true);
    expect(parsed.data.logged_out).toBe(true);
  });

  it('handles clearAuth errors', async () => {
    vi.mocked(clearAuth).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    await program.parseAsync(['node', 'test', 'auth', 'logout']);

    expect(stderrSpy).toHaveBeenCalled();
    const written = stderrSpy.mock.calls[0][0] as string;
    expect(written).toContain('Permission denied');
    expect(exitSpy).toHaveBeenCalled();
  });

  it('handles clearAuth errors with --json flag', async () => {
    vi.mocked(clearAuth).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    await program.parseAsync(['node', 'test', 'auth', 'logout', '--json']);

    expect(stderrSpy).toHaveBeenCalled();
    const written = stderrSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(written.trim());
    expect(parsed.ok).toBe(false);
    expect(parsed.error.message).toContain('Permission denied');
    expect(exitSpy).toHaveBeenCalled();
  });
});
