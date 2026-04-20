import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../../../../../src/api/graphql.js', () => ({
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

vi.mock('../../../../../src/output/error.js', async () => {
  const actual: Record<string, unknown> = await vi.importActual('../../../../../src/output/error.js');
  return {
    ...actual,
    handleError: vi.fn((_err: unknown, _json: boolean) => {
      throw new Error('__handled__');
    }),
  };
});

vi.mock('../../../../../src/auth/store.js', () => ({
  setFlagApiKey: vi.fn(),
}));

import { registerNotificationCommands } from '../../../../../src/commands/notifications/index.js';
import { graphqlRequest } from '../../../../../src/api/graphql.js';
import { NON_TTY_MUTATION_MESSAGE } from '../../../../../src/commands/notifications/preferences/index.js';

const mockGraphqlRequest = vi.mocked(graphqlRequest);

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNotificationCommands(program);
  return program;
}

describe('notifications preferences — non-TTY short-circuit (US-5e)', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let originalIsTty: boolean | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code ?? 0}`);
    }) as never);
    // Simulate non-TTY by stashing the original and forcing false.
    originalIsTty = process.stdout.isTTY;
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      writable: true,
      value: false,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    stderrSpy.mockRestore();
    processExitSpy.mockRestore();
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      writable: true,
      value: originalIsTty,
    });
  });

  it('US-5e.1 — non-TTY emits jsonSuccess(items) and exits 0', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({
      getNotificationChannelPreferences: [
        {
          _id: 'p1',
          enabled_channels: ['push'],
          notification_category: 'event',
        },
        { _id: 'p2', enabled_channels: ['push'] },
      ],
    });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'preferences']);

    expect(mockGraphqlRequest).toHaveBeenCalledOnce();
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.data)).toBe(true);
    expect((parsed.data as Array<{ _id: string }>).length).toBe(2);
    expect((parsed.data as Array<{ _id: string }>)[0]._id).toBe('p1');
  });

  it('US-5e.1 — --json even on a TTY still emits list JSON (no Ink)', async () => {
    // Flip isTTY back to true so we test the --json path explicitly.
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      writable: true,
      value: true,
    });
    mockGraphqlRequest.mockResolvedValueOnce({ getNotificationChannelPreferences: [] });

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'notifications', 'preferences', '--json']);

    expect(mockGraphqlRequest).toHaveBeenCalledOnce();
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual([]);
  });

  it('US-5e.2 — non-TTY mutation attempt exits 1 with exact PRD wording', async () => {
    const program = buildProgram();
    let thrown: Error | undefined;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'preferences', 'add']);
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown?.message).toBe('__exit__:1');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();

    const stderrText = stderrSpy.mock.calls.map((c) => String(c[0])).join('');
    expect(stderrText).toContain(NON_TTY_MUTATION_MESSAGE);
    // Lock the exact literal (no wrapping, no extra prefixes).
    expect(stderrText.trim()).toBe(NON_TTY_MUTATION_MESSAGE);
  });

  it('US-5e.2 — --json + mutation positional also fails with the exact wording', async () => {
    // Re-enter TTY mode so only the --json flag drives the non-interactive guard.
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      writable: true,
      value: true,
    });
    const program = buildProgram();
    let thrown: Error | undefined;
    try {
      await program.parseAsync(['node', 'test', 'notifications', 'preferences', 'delete', '--json']);
    } catch (err) {
      thrown = err as Error;
    }
    expect(thrown?.message).toBe('__exit__:1');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    const stderrText = stderrSpy.mock.calls.map((c) => String(c[0])).join('');
    expect(stderrText).toContain(NON_TTY_MUTATION_MESSAGE);
  });
});
