import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Readable } from 'stream';
import { AIProvider, Message, SystemMessage } from '../../../src/chat/providers/interface';
import { batchMode } from '../../../src/chat/batch';
import { createSessionState } from '../../../src/chat/session/state';

vi.mock('../../../src/chat/stream/handler', () => ({
  handleTurn: vi.fn(),
}));

import { handleTurn } from '../../../src/chat/stream/handler';
const mockHandleTurn = vi.mocked(handleTurn);

function createCreditsProvider(): AIProvider {
  return {
    name: 'lemonade-ai',
    model: 'Lemonade AI',
    capabilities: { supportsToolCalling: false },
    formatTools: () => [],
    async *stream(params) {
      const lastMsg = params.messages[params.messages.length - 1];
      const text = typeof lastMsg.content === 'string' ? lastMsg.content : 'response';
      yield { type: 'text_delta', text: `Echo: ${text}` };
      yield { type: 'done', stopReason: 'end_turn' };
    },
  };
}

describe('Batch mode with credits provider', () => {
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    vi.clearAllMocks();
    originalStdin = process.stdin;
  });

  afterEach(() => {
    Object.defineProperty(process, 'stdin', { value: originalStdin, writable: true });
  });

  it('processes lines through handleTurn with supportsToolCalling: false provider', async () => {
    // Feed two lines through a readable stream acting as stdin
    const fakeStdin = new Readable({ read() {} });
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true });

    mockHandleTurn.mockImplementation(async (_provider, messages: Message[]) => {
      const last = messages[messages.length - 1];
      messages.push({ role: 'assistant', content: [{ type: 'text', text: `reply to ${last.content}` }] });
    });

    const provider = createCreditsProvider();
    const session = createSessionState(
      { _id: '1', name: 'T', email: 't@t.com', first_name: 'T' },
      undefined,
      'UTC',
    );
    const systemPrompt: SystemMessage[] = [{ type: 'text', text: 'system' }];

    const done = batchMode(provider, [], systemPrompt, session, {}, false);

    fakeStdin.push('hello\n');
    fakeStdin.push('world\n');
    fakeStdin.push(null); // EOF

    await done;

    expect(mockHandleTurn).toHaveBeenCalledTimes(2);

    // Verify the credits provider was passed through (not swapped for a BYOK provider)
    const firstCallProvider = mockHandleTurn.mock.calls[0][0];
    expect(firstCallProvider.name).toBe('lemonade-ai');
    expect(firstCallProvider.capabilities.supportsToolCalling).toBe(false);
  });
});
