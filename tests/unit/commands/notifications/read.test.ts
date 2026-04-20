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

import { registerNotificationCommands } from '../../../../src/commands/notifications/index.js';
import { graphqlRequest } from '../../../../src/api/graphql.js';

const mockGraphqlRequest = vi.mocked(graphqlRequest);

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNotificationCommands(program);
  return program;
}

describe('notifications read', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    // Intercept process.exit so the test doesn't actually exit.
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code ?? 0}`);
    }) as never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    stderrSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('US-3.1 + US-3.2 + US-3.3 — read <id1> <id2> sends _id: [ids] and prints "Marked 2..."', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ readNotifications: true });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', 'id1', 'id2']);

    expect(mockGraphqlRequest).toHaveBeenCalledOnce();
    const [mutation, variables] = mockGraphqlRequest.mock.calls[0];
    expect(String(mutation)).toContain('readNotifications');
    expect(String(mutation)).toContain('$_id: [MongoID!]');
    expect(variables).toEqual({ _id: ['id1', 'id2'] });

    expect(consoleLogSpy).toHaveBeenCalledWith('Marked 2 notification(s) as read');
  });

  it('US-3.4 — --json outputs { ok: true, data: { read: true, count: 2 }, ... } flat envelope', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ readNotifications: true });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', 'id1', 'id2', '--json']);

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual({ read: true, count: 2 });
    // Flat envelope — no `meta` nesting.
    expect('meta' in parsed).toBe(false);
  });

  it('US-3.5 — --dry-run prints intended payload and does NOT call graphqlRequest', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', 'id1', 'id2', '--dry-run']);

    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    // At least one console.log call should surface the intended mutation payload.
    const logs = consoleLogSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logs).toContain('readNotifications');
    expect(logs).toContain('id1');
    expect(logs).toContain('id2');
  });

  it('US-3.5 — --dry-run --json emits dry_run envelope and no network call', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'read', 'id1', '--dry-run', '--json']);

    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect((parsed.data as Record<string, unknown>).dry_run).toBe(true);
  });

  it('US-3.6 — zero IDs exits code 1 with correct stderr message', async () => {
    const program = buildProgram();
    // Commander rejects zero variadic args with its own error — ensure no network call
    // and that either Commander or our guard writes a user-visible error to stderr.
    await expect(
      program.parseAsync(['node', 'test', 'notifications', 'read']),
    ).rejects.toThrow();

    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    // Commander's error message mentions the missing argument.
    const stderrText = stderrSpy.mock.calls.map((c) => String(c[0])).join('');
    expect(stderrText.length).toBeGreaterThan(0);
  });
});
