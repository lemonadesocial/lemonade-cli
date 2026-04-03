import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnCoordinator, TurnDeps, MAIN_TURN_BUSY } from '../../../../src/chat/runtime/TurnCoordinator';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';
import { AIProvider, Message, StreamEvent, SystemMessage, ToolDef } from '../../../../src/chat/providers/interface';
import { handleTurn } from '../../../../src/chat/stream/handler';
import { createSessionState } from '../../../../src/chat/session/state';

// Mock handleTurn for TurnCoordinator tests
vi.mock('../../../../src/chat/stream/handler', () => ({
  handleTurn: vi.fn(),
}));

vi.mock('../../../../src/chat/session/cache', () => ({
  buildSystemMessages: vi.fn(() => [{ type: 'text', text: 'system prompt' }]),
}));

const mockHandleTurn = vi.mocked(handleTurn);

// Simulates the LemonadeAIProvider contract: no tool calling, text-only responses.
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

function createBYOKProvider(): AIProvider {
  return {
    name: 'anthropic',
    model: 'claude-sonnet-4-6',
    capabilities: { supportsToolCalling: true },
    formatTools: (tools) => tools,
    async *stream() {
      yield { type: 'text_delta', text: 'BYOK response' };
      yield { type: 'done', stopReason: 'end_turn' };
    },
  };
}

function makeDeps(provider: AIProvider, overrides?: Partial<TurnDeps>): TurnDeps {
  return {
    engine: new ChatEngine(),
    provider,
    formattedTools: [],
    session: {
      user: { _id: '1', name: 'Test', email: 'test@test.com' },
    },
    registry: {},
    chatMessages: [],
    ...overrides,
  };
}

describe('Credits mode through TurnCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleTurn.mockResolvedValue(undefined);
  });

  it('accepts a turn with a credits-mode provider', async () => {
    const provider = createCreditsProvider();
    const tc = new TurnCoordinator(makeDeps(provider));

    const result = tc.submitMainTurn('hello credits');
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    await result.completion;
    expect(mockHandleTurn).toHaveBeenCalledTimes(1);
  });

  it('commits user message to chatMessages the same as BYOK', async () => {
    const provider = createCreditsProvider();
    const chatMessages: Message[] = [];
    let capturedMessages: Message[] | undefined;

    mockHandleTurn.mockImplementationOnce((_p, msgs) => {
      capturedMessages = [...msgs];
      return Promise.resolve();
    });

    const tc = new TurnCoordinator(makeDeps(provider, { chatMessages }));

    const result = tc.submitMainTurn('credits turn');
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    await result.completion;
    expect(capturedMessages).toContainEqual({ role: 'user', content: 'credits turn' });
  });

  it('rejects concurrent turn the same as BYOK', async () => {
    let resolveFirst!: () => void;
    mockHandleTurn.mockImplementationOnce(() =>
      new Promise<void>((r) => { resolveFirst = r; }),
    );

    const provider = createCreditsProvider();
    const tc = new TurnCoordinator(makeDeps(provider));

    const first = tc.submitMainTurn('first');
    expect(first.accepted).toBe(true);

    const second = tc.submitMainTurn('second');
    expect(second.accepted).toBe(false);
    if (!second.accepted) {
      expect(second.error).toBe(MAIN_TURN_BUSY);
    }

    resolveFirst();
    if (first.accepted) await first.completion;
  });

  it('cancel rolls back user message the same as BYOK', () => {
    const provider = createCreditsProvider();
    const chatMessages: Message[] = [];
    mockHandleTurn.mockImplementationOnce(() => new Promise(() => {}));

    const tc = new TurnCoordinator(makeDeps(provider, { chatMessages }));
    const result = tc.submitMainTurn('will cancel');
    expect(result.accepted).toBe(true);
    expect(chatMessages).toHaveLength(1);

    const cancelled = tc.cancelMainTurn();
    expect(cancelled).toBe(true);
    expect(chatMessages).toHaveLength(0);
  });

  it('passes credits provider to handleTurn with correct capabilities', async () => {
    const provider = createCreditsProvider();
    const tc = new TurnCoordinator(makeDeps(provider));

    const result = tc.submitMainTurn('check provider');
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    await result.completion;
    expect(mockHandleTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'lemonade-ai',
        capabilities: { supportsToolCalling: false },
      }),
      expect.any(Array),
      expect.any(Array),
      expect.any(Array),
      expect.any(Object),
      expect.any(Object),
      null,
      true,
      expect.any(ChatEngine),
      expect.any(AbortSignal),
    );
  });

  it('BYOK and credits use identical TurnCoordinator code path', async () => {
    const creditsProvider = createCreditsProvider();
    const byokProvider = createBYOKProvider();

    const creditsTc = new TurnCoordinator(makeDeps(creditsProvider));
    const byokTc = new TurnCoordinator(makeDeps(byokProvider));

    // Both start idle
    expect(creditsTc.state).toEqual(byokTc.state);

    // Both accept turns
    const creditsResult = creditsTc.submitMainTurn('test');
    const byokResult = byokTc.submitMainTurn('test');
    expect(creditsResult.accepted).toBe(true);
    expect(byokResult.accepted).toBe(true);

    if (creditsResult.accepted) await creditsResult.completion;
    if (byokResult.accepted) await byokResult.completion;

    // Both return to idle
    expect(creditsTc.state).toEqual(byokTc.state);
    expect(creditsTc.state.isMainTurnActive).toBe(false);
  });

  it('btw turn works with credits provider', () => {
    const provider = createCreditsProvider();
    const tc = new TurnCoordinator(makeDeps(provider));

    const btwId = tc.submitBtwTurn('side question');
    expect(btwId).toMatch(/^btw-/);
    expect(tc.state.activeBtwCount).toBe(1);
  });
});

describe('Credits mode through handleTurn (integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('handles a text-only response from credits provider', async () => {
    // Use the REAL handleTurn, not the mock
    const { handleTurn: realHandleTurn } = await vi.importActual<typeof import('../../../../src/chat/stream/handler')>('../../../../src/chat/stream/handler');

    const provider = createCreditsProvider();
    const messages: Message[] = [{ role: 'user', content: 'hello' }];
    const engine = new ChatEngine();
    const events: string[] = [];

    engine.on('text_delta', (data: { text: string }) => events.push(data.text));
    engine.on('turn_done', () => events.push('DONE'));

    await realHandleTurn(
      provider,
      messages,
      [],
      [{ type: 'text', text: 'system' }],
      { user: { _id: '1', name: 'T', email: 't@t.com' } } as ReturnType<typeof createSessionState>,
      {},
      null,
      true,
      engine,
    );

    // Assistant message appended to history
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[messages.length - 1].role).toBe('assistant');
    // Engine received text and completion events
    expect(events.some(e => e.includes('Echo:'))).toBe(true);
    expect(events).toContain('DONE');
  });

  it('does not execute tools even if provider emits tool_call events', async () => {
    const { handleTurn: realHandleTurn } = await vi.importActual<typeof import('../../../../src/chat/stream/handler')>('../../../../src/chat/stream/handler');

    // Provider that violates contract by emitting tool_call despite supportsToolCalling: false
    const rogueProvider: AIProvider = {
      name: 'lemonade-ai',
      model: 'test',
      capabilities: { supportsToolCalling: false },
      formatTools: () => [],
      async *stream() {
        yield { type: 'text_delta', text: 'text' };
        yield { type: 'tool_call', toolCall: { id: 'tc1', name: 'test_tool', arguments: {} } };
        yield { type: 'done', stopReason: 'tool_use' };
      },
    };

    const tool: ToolDef = {
      name: 'test_tool',
      displayName: 'test',
      description: 'test',
      params: [],
      destructive: false,
      execute: vi.fn().mockResolvedValue({ ok: true }),
    };

    const messages: Message[] = [{ role: 'user', content: 'test' }];
    const engine = new ChatEngine();

    await realHandleTurn(
      rogueProvider,
      messages,
      [],
      [{ type: 'text', text: 'system' }],
      { user: { _id: '1', name: 'T', email: 't@t.com' } } as ReturnType<typeof createSessionState>,
      { test_tool: tool },
      null,
      true,
      engine,
    );

    // Tool must NOT have been executed
    expect(tool.execute).not.toHaveBeenCalled();
    // Only text response, single iteration
    expect(messages).toHaveLength(2);
  });

  it('respects abort signal in credits mode', async () => {
    const { handleTurn: realHandleTurn } = await vi.importActual<typeof import('../../../../src/chat/stream/handler')>('../../../../src/chat/stream/handler');

    const abort = new AbortController();
    abort.abort();

    const provider = createCreditsProvider();
    const messages: Message[] = [{ role: 'user', content: 'hi' }];
    const engine = new ChatEngine();

    await realHandleTurn(
      provider,
      messages,
      [],
      [{ type: 'text', text: 'system' }],
      { user: { _id: '1', name: 'T', email: 't@t.com' } } as ReturnType<typeof createSessionState>,
      {},
      null,
      true,
      engine,
      abort.signal,
    );

    // No assistant message appended when aborted
    expect(messages).toHaveLength(1);
  });
});
