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
import { graphqlRequest, GraphQLError } from '../../../../src/api/graphql.js';
import { handleError } from '../../../../src/output/error.js';
import { setFlagApiKey } from '../../../../src/auth/store.js';

const mockGraphqlRequest = vi.mocked(graphqlRequest);
const mockHandleError = vi.mocked(handleError);
const mockSetFlagApiKey = vi.mocked(setFlagApiKey);

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNotificationCommands(program);
  return program;
}

describe('notifications unread', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code ?? 0}`);
    }) as never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    stderrSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('US-2.1 + US-2.2 — happy path prints a single integer to stdout and exits 0', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 42 });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'unread']);

    expect(mockGraphqlRequest).toHaveBeenCalledOnce();
    expect(consoleLogSpy).toHaveBeenCalledWith('42');
    expect(mockHandleError).not.toHaveBeenCalled();
  });

  it('US-2.1 — prints 0 correctly when unread is 0 (falsy integer guard)', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 0 });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'unread']);

    expect(consoleLogSpy).toHaveBeenCalledWith('0');
  });

  it('US-2.3 — --json emits flat envelope { ok: true, data: { unread: N } } with no meta nesting', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 7 });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'unread', '--json']);

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual({ unread: 7 });
    expect('meta' in parsed).toBe(false);
  });

  it('US-2.4 + US-2.10 — --category passes through in variables and uses canonical operation name', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 3 });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'unread', '--category', 'event']);

    expect(mockGraphqlRequest).toHaveBeenCalledOnce();
    const [operation, variables] = mockGraphqlRequest.mock.calls[0];
    expect(String(operation)).toContain('GetNotificationUnreadCount');
    expect(String(operation)).toContain('getNotificationUnreadCount(category: $category)');
    expect(variables).toEqual({ category: 'event' });
  });

  it('US-2.10 — variables object OMITS category when --category is absent (not null)', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 1 });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'unread']);

    const [, variables] = mockGraphqlRequest.mock.calls[0];
    expect(variables).toEqual({});
    expect('category' in (variables as Record<string, unknown>)).toBe(false);
  });

  it('US-2.5 — invalid --category rejected by Commander.choices BEFORE network', async () => {
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'unread', '--category', 'not-a-category']);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeDefined();
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('US-2.6 — --api-key flag triggers setFlagApiKey + cleans up in finally', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationUnreadCount: 9 });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'unread', '--api-key', 'my-key']);

    // The action calls setFlagApiKey('my-key') in try, then setFlagApiKey(undefined) in finally.
    expect(mockSetFlagApiKey).toHaveBeenNthCalledWith(1, 'my-key');
    expect(mockSetFlagApiKey).toHaveBeenLastCalledWith(undefined);
  });

  it('US-2.7 — GraphQLError(statusCode=401) routes through handleError', async () => {
    mockGraphqlRequest.mockRejectedValueOnce(
      new GraphQLError('Authentication failed', 'UNAUTHENTICATED', 401),
    );
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'unread']);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
    const [err, jsonFlag] = mockHandleError.mock.calls[0];
    expect(err).toBeInstanceOf(GraphQLError);
    expect((err as GraphQLError).statusCode).toBe(401);
    expect(jsonFlag).toBe(false);
  });

  it('US-2.7 — GraphQLError(statusCode=403) also routes through handleError with --json', async () => {
    mockGraphqlRequest.mockRejectedValueOnce(
      new GraphQLError('Forbidden', 'FORBIDDEN', 403),
    );
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'unread', '--json']);
    } catch (err) {
      thrown = err;
    }

    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
    const [err, jsonFlag] = mockHandleError.mock.calls[0];
    expect((err as GraphQLError).statusCode).toBe(403);
    expect(jsonFlag).toBe(true);
  });

  it('US-2.8 — fetch-failed TypeError routes through handleError (network branch)', async () => {
    const err = new TypeError('fetch failed');
    mockGraphqlRequest.mockRejectedValueOnce(err);
    const program = buildProgram();
    let thrown: unknown;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'unread']);
    } catch (e) {
      thrown = e;
    }

    expect((thrown as Error).message).toBe('__handled__');
    expect(mockHandleError).toHaveBeenCalledOnce();
    expect(mockHandleError.mock.calls[0][0]).toBe(err);
  });

  it('finally — setFlagApiKey(undefined) runs even on error', async () => {
    mockGraphqlRequest.mockRejectedValueOnce(
      new GraphQLError('boom', 'INTERNAL', 500),
    );
    const program = buildProgram();
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'unread', '--api-key', 'k']);
    } catch {
      // handled
    }
    expect(mockSetFlagApiKey).toHaveBeenLastCalledWith(undefined);
  });
});
