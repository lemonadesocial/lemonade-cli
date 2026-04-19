import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

// Mock the subscription registry so tests can control whether
// `getActiveSubscription()` returns a disposable handle (US-1.8).
vi.mock('../../../../src/api/subscriptions.js', () => ({
  getActiveSubscription: vi.fn(),
}));

import { Command } from 'commander';
import { registerAuthCommands } from '../../../../src/commands/auth/index.js';
import { clearAuth } from '../../../../src/auth/store.js';
import { graphqlRequest } from '../../../../src/api/graphql.js';
import { getActiveSubscription } from '../../../../src/api/subscriptions.js';

describe('auth logout', () => {
  let program: Command;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // resetAllMocks clears both call history AND mock implementations — prevents
    // a throwing clearAuth from a previous test leaking into the next.
    vi.resetAllMocks();
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
    vi.mocked(graphqlRequest).mockResolvedValueOnce({
      revokeCurrentSession: true,
    });

    await program.parseAsync(['node', 'test', 'auth', 'logout']);

    expect(graphqlRequest).toHaveBeenCalledWith(
      expect.stringContaining('revokeCurrentSession'),
    );
    expect(clearAuth).toHaveBeenCalledOnce();
    // graphqlRequest invocation order must precede clearAuth
    const revokeOrder = vi.mocked(graphqlRequest).mock.invocationCallOrder[0];
    const clearOrder = vi.mocked(clearAuth).mock.invocationCallOrder[0];
    expect(revokeOrder).toBeLessThan(clearOrder);
  });

  it('still clears auth when revokeCurrentSession fails (best-effort)', async () => {
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

  // ---------------------------------------------------------------------
  // Phase 2 — ordered teardown (revoke → dispose → clearAuth) + 2s race
  // Mirror of web-new/lib/hooks/useLogout.ts:29-66 (IMPL § Phase 2).
  // ---------------------------------------------------------------------

  describe('Phase 2: ordered teardown + 2s revoke timeout', () => {
    afterEach(() => {
      // Defensive: if a test enabled fake timers, restore real timers so
      // the next test's beforeEach isn't stuck on a frozen clock.
      vi.useRealTimers();
    });

    it('happy path orders revokeCurrentSession → dispose() → clearAuth()', async () => {
      const disposeMock = vi.fn();
      vi.mocked(getActiveSubscription).mockReturnValue({
        dispose: disposeMock,
      });
      vi.mocked(graphqlRequest).mockResolvedValueOnce({
        revokeCurrentSession: true,
      });

      await program.parseAsync(['node', 'test', 'auth', 'logout']);

      expect(graphqlRequest).toHaveBeenCalledOnce();
      expect(disposeMock).toHaveBeenCalledOnce();
      expect(clearAuth).toHaveBeenCalledOnce();

      // Strict ordering via invocationCallOrder — matches precedent at
      // line 116 in the #208 assertions.
      const revokeOrder =
        vi.mocked(graphqlRequest).mock.invocationCallOrder[0];
      const disposeOrder = disposeMock.mock.invocationCallOrder[0];
      const clearOrder = vi.mocked(clearAuth).mock.invocationCallOrder[0];
      expect(revokeOrder).toBeLessThan(disposeOrder);
      expect(disposeOrder).toBeLessThan(clearOrder);
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('timeout path still disposes and clears auth (emits breadcrumb)', async () => {
      vi.useFakeTimers();
      const disposeMock = vi.fn();
      vi.mocked(getActiveSubscription).mockReturnValue({
        dispose: disposeMock,
      });
      // Pending revoke that NEVER resolves within the test window → timer wins.
      vi.mocked(graphqlRequest).mockImplementationOnce(
        () => new Promise(() => {}),
      );

      const runPromise = program.parseAsync([
        'node',
        'test',
        'auth',
        'logout',
      ]);
      // Advance past the 2000ms timeout sentinel resolve.
      await vi.advanceTimersByTimeAsync(2001);
      await runPromise;

      // Timer resolved → dispose + clearAuth still ran in order.
      expect(disposeMock).toHaveBeenCalledOnce();
      expect(clearAuth).toHaveBeenCalledOnce();
      const disposeOrder = disposeMock.mock.invocationCallOrder[0];
      const clearOrder = vi.mocked(clearAuth).mock.invocationCallOrder[0];
      expect(disposeOrder).toBeLessThan(clearOrder);

      // Stderr breadcrumb emitted exactly once on timeout (US-6.1).
      const timeoutWrites = stderrSpy.mock.calls.filter((c) =>
        String(c[0]).includes('revokeCurrentSession timeout flow=logout'),
      );
      expect(timeoutWrites).toHaveLength(1);
      expect(timeoutWrites[0][0]).toBe(
        '[lemonade-cli] revokeCurrentSession timeout flow=logout\n',
      );
      // Exit 0 even on timeout (US-1.7c).
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('revoke error still disposes and clears auth (no timeout breadcrumb)', async () => {
      const disposeMock = vi.fn();
      vi.mocked(getActiveSubscription).mockReturnValue({
        dispose: disposeMock,
      });
      vi.mocked(graphqlRequest).mockRejectedValueOnce(
        new Error('Server unreachable'),
      );

      await program.parseAsync(['node', 'test', 'auth', 'logout']);

      expect(disposeMock).toHaveBeenCalledOnce();
      expect(clearAuth).toHaveBeenCalledOnce();
      // No stderr timeout breadcrumb — this is an error, not a timeout.
      const timeoutWrites = stderrSpy.mock.calls.filter((c) =>
        String(c[0]).includes('revokeCurrentSession timeout flow=logout'),
      );
      expect(timeoutWrites).toHaveLength(0);
      // Exit 0 in non-`--json` mode (US-1.7c).
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('no active subscription → dispose is a safe no-op', async () => {
      // Registry returns null → getActiveSubscription()?.dispose() is a no-op.
      vi.mocked(getActiveSubscription).mockReturnValue(null);
      vi.mocked(graphqlRequest).mockResolvedValueOnce({
        revokeCurrentSession: true,
      });

      await program.parseAsync(['node', 'test', 'auth', 'logout']);

      // Logout still completes cleanly.
      expect(clearAuth).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        'Logged out. Lemonade auth tokens cleared.',
      );
      expect(exitSpy).toHaveBeenCalledWith(0);
      // Registry was consulted (proves no eager import of the factory;
      // the call site uses optional-chain so a null handle skips dispose).
      expect(getActiveSubscription).toHaveBeenCalled();
    });

    it('--json timeout payload includes revoke_timed_out: true', async () => {
      vi.useFakeTimers();
      const disposeMock = vi.fn();
      vi.mocked(getActiveSubscription).mockReturnValue({
        dispose: disposeMock,
      });
      vi.mocked(graphqlRequest).mockImplementationOnce(
        () => new Promise(() => {}),
      );

      const runPromise = program.parseAsync([
        'node',
        'test',
        'auth',
        'logout',
        '--json',
      ]);
      await vi.advanceTimersByTimeAsync(2001);
      await runPromise;

      // Find the JSON envelope in the log output.
      const jsonCall = logSpy.mock.calls.find((c) => {
        try {
          JSON.parse(c[0] as string);
          return true;
        } catch {
          return false;
        }
      });
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed.ok).toBe(true);
      expect(parsed.data.logged_out).toBe(true);
      expect(parsed.data.revoke_timed_out).toBe(true);
    });

    it('dispose runs before clearAuth even when revoke rejects', async () => {
      const disposeMock = vi.fn();
      vi.mocked(getActiveSubscription).mockReturnValue({
        dispose: disposeMock,
      });
      vi.mocked(graphqlRequest).mockRejectedValueOnce(
        new Error('GraphQL BAD_USER_INPUT: auth.session missing'),
      );

      await program.parseAsync(['node', 'test', 'auth', 'logout']);

      // Strict order: revoke (rejected) → dispose → clearAuth.
      expect(graphqlRequest).toHaveBeenCalledOnce();
      expect(disposeMock).toHaveBeenCalledOnce();
      expect(clearAuth).toHaveBeenCalledOnce();
      const revokeOrder =
        vi.mocked(graphqlRequest).mock.invocationCallOrder[0];
      const disposeOrder = disposeMock.mock.invocationCallOrder[0];
      const clearOrder = vi.mocked(clearAuth).mock.invocationCallOrder[0];
      expect(revokeOrder).toBeLessThan(disposeOrder);
      expect(disposeOrder).toBeLessThan(clearOrder);
    });
  });
});
