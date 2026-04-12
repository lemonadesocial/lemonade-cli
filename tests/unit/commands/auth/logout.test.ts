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
  const actual = await importOriginal<typeof import('../../../../src/api/graphql.js')>();
  return {
    GraphQLError: actual.GraphQLError,
    graphqlRequest: vi.fn(),
  };
});

import { Command } from 'commander';
import { registerAuthCommands } from '../../../../src/commands/auth/index.js';
import { clearAuth } from '../../../../src/auth/store.js';
import { graphqlRequest } from '../../../../src/api/graphql.js';

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
      'Logged out. Lemonade auth tokens cleared.',
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

  it('succeeds when already logged out (idempotent)', async () => {
    // clearAuth is a no-op when no credentials exist — should still succeed
    vi.mocked(clearAuth).mockImplementation(() => {});

    await program.parseAsync(['node', 'test', 'auth', 'logout']);

    expect(clearAuth).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(
      'Logged out. Lemonade auth tokens cleared.',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('handles clearAuth errors', async () => {
    vi.mocked(clearAuth).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    await program.parseAsync(['node', 'test', 'auth', 'logout']);

    expect(stderrSpy).toHaveBeenCalled();
    const written = stderrSpy.mock.calls[0][0] as string;
    expect(written).toContain('Permission denied');
    expect(exitSpy).toHaveBeenCalledWith(1);
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
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('calls revokeCurrentSession mutation before clearAuth', async () => {
    vi.mocked(clearAuth).mockImplementation(() => {});
    vi.mocked(graphqlRequest).mockResolvedValueOnce({
      revokeCurrentSession: true,
    });

    await program.parseAsync(['node', 'test', 'auth', 'logout']);

    expect(graphqlRequest).toHaveBeenCalledWith(
      expect.stringContaining('revokeCurrentSession'),
    );
    // graphqlRequest invocation order must precede clearAuth
    const revokeOrder = vi.mocked(graphqlRequest).mock.invocationCallOrder[0];
    const clearOrder = vi.mocked(clearAuth).mock.invocationCallOrder[0];
    expect(revokeOrder).toBeLessThan(clearOrder);
  });

  it('still clears auth when revokeCurrentSession fails (best-effort)', async () => {
    // Reset clearAuth to a no-op — vi.clearAllMocks() in beforeEach does not
    // reset mock implementations, so the throw from an earlier test leaks in.
    vi.mocked(clearAuth).mockImplementation(() => {});
    vi.mocked(graphqlRequest).mockRejectedValueOnce(
      new Error('Server unreachable'),
    );

    await program.parseAsync(['node', 'test', 'auth', 'logout']);

    expect(graphqlRequest).toHaveBeenCalledWith(
      expect.stringContaining('revokeCurrentSession'),
    );
    expect(clearAuth).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(
      'Logged out. Lemonade auth tokens cleared.',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
