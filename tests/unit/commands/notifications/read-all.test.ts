import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../../../../src/api/graphql.js', () => ({
  graphqlRequest: vi.fn(),
  getClientHeaders: () => ({}),
  setClientType: vi.fn(),
  GraphQLError: class GraphQLError extends Error {
    constructor(
      message: string,
      public code: string | undefined,
      public statusCode: number,
    ) {
      super(message);
      this.name = 'GraphQLError';
    }
  },
}));

vi.mock('../../../../src/output/error.js', async () => {
  const actual: Record<string, unknown> = await vi.importActual('../../../../src/output/error.js');
  return {
    ...actual,
    handleError: vi.fn((_err: unknown, _json: boolean) => {
      throw new Error('__handled__');
    }),
  };
});

vi.mock('../../../../src/auth/store.js', () => ({
  setFlagApiKey: vi.fn(),
}));

// Ink render mock — we don't want to actually mount the Ink component in
// unit tests. Instead we synthesize a fake `render` that (1) calls the
// component's onDecision callback with a pre-programmed answer, and
// (2) returns a dummy instance whose waitUntilExit resolves immediately.
//
// Tests programme the decision via `__mockInkDecision.next` before invoking
// parseAsync; default is "true" (confirm) so --yes-path tests need no setup.
const __mockInkDecision = {
  next: true as boolean,
};

vi.mock('ink', async () => {
  const actual: Record<string, unknown> = await vi.importActual('ink');
  return {
    ...actual,
    render: vi.fn((element: { props: { onDecision?: (b: boolean) => void } }) => {
      // Fire the decision on the next microtask so the Promise wrapper in
      // read.ts has a chance to subscribe.
      queueMicrotask(() => {
        element.props.onDecision?.(__mockInkDecision.next);
      });
      return {
        waitUntilExit: () => Promise.resolve(),
        unmount: () => {},
        rerender: () => {},
        clear: () => {},
        cleanup: () => {},
      };
    }),
  };
});

import { registerNotificationCommands } from '../../../../src/commands/notifications/index.js';
import { graphqlRequest, GraphQLError } from '../../../../src/api/graphql.js';
import { handleError } from '../../../../src/output/error.js';

const mockGraphqlRequest = vi.mocked(graphqlRequest);
const mockHandleError = vi.mocked(handleError);

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNotificationCommands(program);
  return program;
}

describe('notifications read --all', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let isTtyDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    __mockInkDecision.next = true;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code ?? 0}`);
    }) as never);
    // Default: pretend we're on a TTY so interactive tests don't hit the
    // non-TTY usage-error guard.
    isTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    stderrSpy.mockRestore();
    processExitSpy.mockRestore();
    if (isTtyDescriptor) {
      Object.defineProperty(process.stdout, 'isTTY', isTtyDescriptor);
    } else {
      // @ts-expect-error — restore default
      delete (process.stdout as { isTTY?: boolean }).isTTY;
    }
  });

  // ────────────────────────────────────────────────────────────────────
  // Happy paths
  // ────────────────────────────────────────────────────────────────────

  it('US-3.1 + US-3.2 — confirm (y) → pre-fetch, mutation, refetch, success string', async () => {
    __mockInkDecision.next = true;
    // Call 1: pre-fetch count
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 12 });
    // Call 2: mutation
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 12 });
    // Call 3: post-mutation refetch
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all']);

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(3);
    // Call 1: pre-fetch — GetNotificationUnreadCount with empty vars
    expect(String(mockGraphqlRequest.mock.calls[0][0])).toContain('GetNotificationUnreadCount');
    expect(mockGraphqlRequest.mock.calls[0][1]).toEqual({});
    // Call 2: mutation — ReadAllNotifications with empty vars
    expect(String(mockGraphqlRequest.mock.calls[1][0])).toContain('ReadAllNotifications');
    expect(mockGraphqlRequest.mock.calls[1][1]).toEqual({});
    // Call 3: refetch — GetNotificationUnreadCount again
    expect(String(mockGraphqlRequest.mock.calls[2][0])).toContain('GetNotificationUnreadCount');

    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('Marked 12 notifications as read. Unread: 0.');
  });

  it('US-3.3 — cancel (n → onDecision false) → NO mutation, prints "Cancelled. No changes made."', async () => {
    __mockInkDecision.next = false;
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 5 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all']);

    // Only the pre-fetch — NO mutation call.
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(
      mockGraphqlRequest.mock.calls.some(
        (c) => String(c[0]).includes('readAllNotifications') || String(c[0]).includes('ReadAllNotifications'),
      ),
    ).toBe(false);

    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('Cancelled. No changes made.');
  });

  it('US-3.4 — --yes skips Ink prompt and issues mutation immediately', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 3 });
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 3 });
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });

    // Spy on Ink's render to assert it was NOT called.
    const inkModule = await import('ink');
    const renderSpy = vi.mocked(inkModule.render);
    renderSpy.mockClear();

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes']);

    expect(renderSpy).not.toHaveBeenCalled();
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(3);
    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('Marked 3 notifications as read. Unread: 0.');
  });

  // ────────────────────────────────────────────────────────────────────
  // Dry-run safety (PRIMARY SAFETY INVARIANT)
  // ────────────────────────────────────────────────────────────────────

  it('US-3.5 — --dry-run fetches count, prints preview, does NOT call mutation', async () => {
    // Only the pre-fetch — mutation MUST NOT be called.
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 25 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--dry-run']);

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    // NEGATIVE ASSERTION — the critical safety check.
    expect(mockGraphqlRequest).not.toHaveBeenCalledWith(
      expect.stringContaining('readAllNotifications'),
      expect.anything(),
    );
    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('Would mark 25 notifications as read (dry run). No changes made.');
  });

  it('US-3.5 — --dry-run --yes also does NOT call mutation (safety takes precedence)', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 8 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--dry-run', '--yes']);

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).not.toHaveBeenCalledWith(
      expect.stringContaining('readAllNotifications'),
      expect.anything(),
    );
  });

  it('US-3.6 — --dry-run --json emits { ok: true, data: { dry_run: true, would_mark: N } }', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 17 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--dry-run', '--json']);

    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0]));
    const parsed = JSON.parse(logs[0]) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual({ dry_run: true, would_mark: 17 });
    expect(mockGraphqlRequest).not.toHaveBeenCalledWith(
      expect.stringContaining('readAllNotifications'),
      expect.anything(),
    );
  });

  it('US-3.7 — --yes --json emits { ok: true, data: { marked: M, unread: N } }', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 10 });
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 10 });
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes', '--json']);

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual({ marked: 10, unread: 0 });
  });

  // ────────────────────────────────────────────────────────────────────
  // Non-TTY and --json usage guards
  // ────────────────────────────────────────────────────────────────────

  it('US-3.8 — --json without --yes or --dry-run → handleError (usage error)', async () => {
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--json']);
    } catch (err) {
      thrown = err;
    }

    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    // handleError was passed json=true
    expect(mockHandleError.mock.calls[0][1]).toBe(true);
  });

  it('US-3.8 — non-TTY without --yes or --dry-run → handleError (usage error)', async () => {
    // Simulate a pipe: stdout.isTTY === false.
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => false,
    });

    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'read', '--all']);
    } catch (err) {
      thrown = err;
    }

    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('US-3.8 — non-TTY with --yes is allowed', async () => {
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => false,
    });
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 4 });
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 4 });
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes']);

    expect(mockHandleError).not.toHaveBeenCalled();
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(3);
  });

  // ────────────────────────────────────────────────────────────────────
  // --category scoping (US-3.9, US-3.10, US-3.13)
  // ────────────────────────────────────────────────────────────────────

  it('US-3.9 + US-3.13 — --category passes through in pre-fetch + mutation; success string includes "in category"', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 6 });
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 6 });
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes', '--category', 'event']);

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(3);
    // Pre-fetch variables include category.
    expect(mockGraphqlRequest.mock.calls[0][1]).toEqual({ category: 'event' });
    // Mutation variables include category.
    expect(mockGraphqlRequest.mock.calls[1][1]).toEqual({ category: 'event' });
    // Refetch variables include category.
    expect(mockGraphqlRequest.mock.calls[2][1]).toEqual({ category: 'event' });

    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('Marked 6 notifications as read in category event. Unread: 0.');
  });

  it('US-3.10 — invalid --category rejected by Commander.choices before network', async () => {
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes', '--category', 'not-a-category']);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeDefined();
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('US-3.13 — variables OMIT category when --category absent (not null)', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 1 });
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 1 });
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes']);

    for (const [, vars] of mockGraphqlRequest.mock.calls) {
      expect(vars).toEqual({});
      expect('category' in (vars as Record<string, unknown>)).toBe(false);
    }
  });

  // ────────────────────────────────────────────────────────────────────
  // --all + positional IDs
  // ────────────────────────────────────────────────────────────────────

  it('US-3.11 — --all + positional IDs → handleError (usage error, no network call)', async () => {
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'read', 'id1', 'id2', '--all', '--yes']);
    } catch (err) {
      thrown = err;
    }

    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────────
  // Zero-unread (US-3.12)
  // ────────────────────────────────────────────────────────────────────

  it('US-3.12 — zero unread at pre-fetch → prints "No unread notifications." no prompt, no mutation', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });
    const inkModule = await import('ink');
    const renderSpy = vi.mocked(inkModule.render);
    renderSpy.mockClear();

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all']);

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(renderSpy).not.toHaveBeenCalled();
    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('No unread notifications. Nothing to mark.');
  });

  it('US-3.12 — zero unread + --json → { ok: true, data: { marked: 0, unread: 0 } }', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes', '--json']);

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual({ marked: 0, unread: 0 });
  });

  // ────────────────────────────────────────────────────────────────────
  // Auth errors (US-3.14)
  // ────────────────────────────────────────────────────────────────────

  it('US-3.14 — auth error on pre-fetch routes through handleError', async () => {
    mockGraphqlRequest.mockRejectedValueOnce(
      new GraphQLError('Authentication failed', 'UNAUTHENTICATED', 401),
    );
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes']);
    } catch (err) {
      thrown = err;
    }

    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
    expect((mockHandleError.mock.calls[0][0] as GraphQLError).statusCode).toBe(401);
  });

  it('US-3.14 — auth error on mutation routes through handleError', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 5 });
    mockGraphqlRequest.mockRejectedValueOnce(
      new GraphQLError('Authentication failed', 'UNAUTHENTICATED', 401),
    );
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes']);
    } catch (err) {
      thrown = err;
    }

    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
  });

  // ────────────────────────────────────────────────────────────────────
  // Post-mutation race (Risks row 2) — refetch returns non-zero
  // ────────────────────────────────────────────────────────────────────

  it('post-mutation race — refetch returns non-zero N\' → success string reflects actual N\'', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 42 });
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 42 });
    // Simulate: 1 new notification arrived between mutation and refetch.
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 1 });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes']);

    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    // Must NOT assume 0 — must report the actual refetched value.
    expect(logs).toContain('Marked 42 notifications as read. Unread: 1.');
  });

  it('post-mutation refetch failure → success string still prints, unread=0 fallback', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 5 });
    mockGraphqlRequest.mockResolvedValueOnce({ readAllNotifications: 5 });
    // Refetch throws — swallowed, unread falls back to 0.
    mockGraphqlRequest.mockRejectedValueOnce(
      new GraphQLError('boom', 'INTERNAL', 500),
    );

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', '--all', '--yes']);

    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('Marked 5 notifications as read. Unread: 0.');
    // handleError is NOT called — the mutation itself succeeded.
    expect(mockHandleError).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────────
  // Regression — existing positional [id...] path (US-3.15)
  // ────────────────────────────────────────────────────────────────────

  it('US-3.15 — positional IDs path unchanged (read id1 id2 still calls readNotifications)', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ readNotifications: true });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', 'id1', 'id2']);

    expect(mockGraphqlRequest).toHaveBeenCalledOnce();
    const [mutation, variables] = mockGraphqlRequest.mock.calls[0];
    // The positional path uses `readNotifications` (NOT readAllNotifications).
    expect(String(mutation)).toContain('readNotifications');
    expect(String(mutation)).not.toContain('readAllNotifications');
    expect(variables).toEqual({ _id: ['id1', 'id2'] });
  });

  it('US-3.15 — zero positional IDs WITHOUT --all still exits 1 with PRD-mandated stderr', async () => {
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'read']);
    } catch (err) {
      thrown = err;
    }
    expect((thrown as Error).message).toBe('__exit__:1');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    const stderrText = stderrSpy.mock.calls.map((c) => String(c[0])).join('');
    expect(stderrText).toContain('At least one notification ID is required');
  });
});
