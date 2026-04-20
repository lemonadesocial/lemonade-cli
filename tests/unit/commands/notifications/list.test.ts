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
import { handleError } from '../../../../src/output/error.js';

const mockGraphqlRequest = vi.mocked(graphqlRequest);
const mockHandleError = vi.mocked(handleError);

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNotificationCommands(program);
  return program;
}

describe('notifications list', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('US-2.3 — --limit 50 → variables { skip: 0, limit: 50 }', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotifications: [] });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'list', '--limit', '50']);

    expect(mockGraphqlRequest).toHaveBeenCalledOnce();
    const [, variables] = mockGraphqlRequest.mock.calls[0];
    expect(variables).toEqual({ skip: 0, limit: 50 });
  });

  it('US-2.3 — --limit 10000 is clamped to 1000', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotifications: [] });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'list', '--limit', '10000']);

    const [, variables] = mockGraphqlRequest.mock.calls[0];
    expect(variables).toMatchObject({ limit: 1000 });
  });

  it('US-2.4 — --skip 25 → { skip: 25, limit: 25 } (default limit)', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotifications: [] });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'list', '--skip', '25']);

    const [, variables] = mockGraphqlRequest.mock.calls[0];
    expect(variables).toEqual({ skip: 25, limit: 25 });
  });

  it('US-2.2 — --category event → variables include category: event', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotifications: [] });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'list', '--category', 'event']);

    const [, variables] = mockGraphqlRequest.mock.calls[0];
    expect(variables).toMatchObject({ category: 'event' });
  });

  it('US-2.7 — invalid --category is rejected by Commander before network call', async () => {
    const program = buildProgram();
    // Suppress Commander's error output in this test
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    await expect(
      program.parseAsync(['node', 'test', 'notifications', 'list', '--category', 'bogus']),
    ).rejects.toThrow();

    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    stderrSpy.mockRestore();
  });

  it('US-2.5 — --unseen filters items with is_seen === true client-side', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({
      getNotifications: [
        { _id: 'a', type: 'event_update', created_at: 't', is_seen: false, title: 'A', message: 'a' },
        { _id: 'b', type: 'event_update', created_at: 't', is_seen: true, title: 'B', message: 'b' },
        { _id: 'c', type: 'event_update', created_at: 't', is_seen: false, title: 'C', message: 'c' },
      ],
    });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'list', '--unseen']);

    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('a');
    expect(output).toContain('c');
    expect(output).not.toContain('B');
  });

  it('US-2.6 — --json emits flat envelope { ok, data, cursor }', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({
      getNotifications: [
        { _id: '1', type: 'event_update', created_at: 't', is_seen: false },
      ],
    });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'list', '--json']);

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    // Lock the exact shape emitted by `jsonSuccess(data, { cursor })` in
    // src/output/json.ts:14-21 — no `meta` nesting, cursor is top-level and
    // null when there is no next page (single row < default limit of 25),
    // `total` is undefined -> dropped by JSON.stringify so the key MUST NOT
    // be present on the parsed envelope.
    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.data)).toBe(true);
    expect(parsed.cursor).toBeNull();
    expect('total' in parsed).toBe(false);
    expect('meta' in parsed).toBe(false);
  });

  it('US-2.8 — unauthenticated invocation routes to handleError', async () => {
    const { GraphQLError } = await import('../../../../src/api/graphql.js');
    const authError = new GraphQLError(
      'Not authenticated. Run "lemonade auth login" or set LEMONADE_API_KEY.',
      'UNAUTHENTICATED',
      401,
    );
    mockGraphqlRequest.mockRejectedValueOnce(authError);

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'notifications', 'list']),
    ).rejects.toThrow('__handled__');

    expect(mockHandleError).toHaveBeenCalledOnce();
    const [passedErr] = mockHandleError.mock.calls[0];
    expect((passedErr as Error).message).toContain('Not authenticated');
  });
});
