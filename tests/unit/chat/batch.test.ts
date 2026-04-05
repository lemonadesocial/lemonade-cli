import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Readable } from 'stream';
import { createSessionState } from '../../../src/chat/session/state';
import { AIProvider, SystemMessage, ToolDef, Message } from '../../../src/chat/providers/interface';

// Mock handleTurn so we can control success/failure without a real provider
vi.mock('../../../src/chat/stream/handler', () => ({
  handleTurn: vi.fn(),
}));

import { handleTurn } from '../../../src/chat/stream/handler';
const mockHandleTurn = vi.mocked(handleTurn);

// We need to override process.stdin for readline inside batchMode.
// Import batchMode lazily after setting up stdin.

function createMockProvider(): AIProvider {
  return {
    name: 'mock',
    model: 'mock-model',
    capabilities: { supportsToolCalling: true },
    formatTools: (tools) => tools,
    async *stream() {
      yield { type: 'done' as const, stopReason: 'end_turn' };
    },
  };
}

function makeFakeStdin(lines: string[]): Readable {
  const content = lines.join('\n') + '\n';
  return Readable.from(content);
}

describe('batchMode', () => {
  const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
  const systemPrompt: SystemMessage[] = [{ type: 'text', text: 'System prompt' }];
  const provider = createMockProvider();
  const registry: Record<string, ToolDef> = {};

  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    originalStdin = process.stdin;
    mockHandleTurn.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true });
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  async function runBatch(lines: string[], jsonOutput: boolean): Promise<void> {
    const fakeStdin = makeFakeStdin(lines);
    Object.defineProperty(process, 'stdin', { value: fakeStdin, configurable: true });
    // Dynamic import to pick up the mocked handleTurn
    const { batchMode } = await import('../../../src/chat/batch');
    await batchMode(provider, [], systemPrompt, session, registry, jsonOutput);
  }

  it('emits JSON error envelope to stdout when jsonOutput=true and handleTurn throws', async () => {
    mockHandleTurn.mockRejectedValueOnce(new Error('provider exploded'));

    await runBatch(['hello'], true);

    // stderr should still get the error
    expect(errorSpy).toHaveBeenCalledWith('Error: provider exploded');

    // stdout should get the JSON error envelope
    const logCalls = logSpy.mock.calls.map((c) => c[0]);
    const jsonCall = logCalls.find((c) => typeof c === 'string' && c.includes('"error"'));
    expect(jsonCall).toBeDefined();
    const parsed = JSON.parse(jsonCall as string);
    expect(parsed).toEqual({ error: 'provider exploded' });
  });

  it('does not emit JSON to stdout when jsonOutput=false and handleTurn throws', async () => {
    mockHandleTurn.mockRejectedValueOnce(new Error('provider exploded'));

    await runBatch(['hello'], false);

    // stderr should still get the error
    expect(errorSpy).toHaveBeenCalledWith('Error: provider exploded');

    // stdout should NOT get any JSON output
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('emits JSON success output on the success path when jsonOutput=true', async () => {
    // handleTurn succeeds and pushes an assistant message onto the messages array
    mockHandleTurn.mockImplementationOnce(
      async (
        _provider: AIProvider,
        messages: Message[],
      ) => {
        messages.push({
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello back!' }],
        });
      },
    );

    await runBatch(['hi'], true);

    expect(errorSpy).not.toHaveBeenCalled();

    const logCalls = logSpy.mock.calls.map((c) => c[0]);
    const jsonCall = logCalls.find((c) => typeof c === 'string' && c.includes('"text"'));
    expect(jsonCall).toBeDefined();
    const parsed = JSON.parse(jsonCall as string);
    expect(parsed).toEqual({ text: 'Hello back!' });
  });
});
