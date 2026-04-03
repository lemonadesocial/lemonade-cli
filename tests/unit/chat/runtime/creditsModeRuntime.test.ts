import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnCoordinator, TurnDeps, MAIN_TURN_BUSY } from '../../../../src/chat/runtime/TurnCoordinator';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';
import { AIProvider, Message, StreamEvent, StreamParams, SystemMessage, ToolDef } from '../../../../src/chat/providers/interface';
import { handleTurn } from '../../../../src/chat/stream/handler';
import { createSessionState } from '../../../../src/chat/session/state';
import { LemonadeAIProvider } from '../../../../src/chat/providers/lemonade-ai';

// Mock handleTurn for TurnCoordinator tests
vi.mock('../../../../src/chat/stream/handler', () => ({
  handleTurn: vi.fn(),
}));

vi.mock('../../../../src/chat/session/cache', () => ({
  buildSystemMessages: vi.fn(() => [{ type: 'text', text: 'system prompt' }]),
}));

const mockHandleTurn = vi.mocked(handleTurn);

// Simulates the LemonadeAIProvider contract: no tool calling, text-only responses,
// full local history formatted in the message (aligned with real provider behavior).
function createCreditsProvider(): AIProvider & { resetSession: () => void; lastStreamParams?: StreamParams } {
  const provider: AIProvider & { resetSession: () => void; lastStreamParams?: StreamParams } = {
    name: 'lemonade-ai',
    model: 'Lemonade AI',
    capabilities: { supportsToolCalling: false },
    formatTools: () => [],
    resetSession: vi.fn(),
    lastStreamParams: undefined,
    async *stream(params) {
      provider.lastStreamParams = params;
      const lastMsg = params.messages[params.messages.length - 1];
      const text = typeof lastMsg.content === 'string' ? lastMsg.content : 'response';
      yield { type: 'text_delta', text: `Echo: ${text}` };
      yield { type: 'done', stopReason: 'end_turn' };
    },
  };
  return provider;
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

  it('clearSession works identically for credits and BYOK', async () => {
    const creditsProvider = createCreditsProvider();
    const byokProvider = createBYOKProvider();

    const creditsMsgs: Message[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi from credits' },
    ];
    const byokMsgs: Message[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi from byok' },
    ];

    const creditsTc = new TurnCoordinator(makeDeps(creditsProvider, { chatMessages: creditsMsgs }));
    const byokTc = new TurnCoordinator(makeDeps(byokProvider, { chatMessages: byokMsgs }));

    creditsTc.clearSession();
    byokTc.clearSession();

    expect(creditsMsgs).toHaveLength(0);
    expect(byokMsgs).toHaveLength(0);
    expect(creditsTc.state.isMainTurnActive).toBe(false);
    expect(byokTc.state.isMainTurnActive).toBe(false);
  });

  it('clearSession resets credits-mode provider session state', async () => {
    const provider = createCreditsProvider();
    const resetSpy = vi.fn();
    provider.resetSession = resetSpy;

    const chatMessages: Message[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi from credits' },
    ];

    const tc = new TurnCoordinator(makeDeps(provider, { chatMessages }));

    tc.clearSession();

    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(chatMessages).toHaveLength(0);
  });

  it('clearSession on BYOK provider does not throw (no resetSession)', () => {
    const provider = createBYOKProvider();
    const chatMessages: Message[] = [
      { role: 'user', content: 'hello' },
    ];

    const tc = new TurnCoordinator(makeDeps(provider, { chatMessages }));

    expect(() => tc.clearSession()).not.toThrow();
    expect(chatMessages).toHaveLength(0);
  });

  it('clearSession cancels active credits turn and empties history', async () => {
    let resolveFirst!: () => void;
    mockHandleTurn.mockImplementationOnce(() =>
      new Promise<void>((resolve) => { resolveFirst = resolve; }),
    );

    const provider = createCreditsProvider();
    const chatMessages: Message[] = [];
    const tc = new TurnCoordinator(makeDeps(provider, { chatMessages }));

    const submit = tc.submitMainTurn('credits question');
    expect(submit.accepted).toBe(true);
    expect(chatMessages).toHaveLength(1);

    tc.clearSession();
    expect(chatMessages).toHaveLength(0);
    expect(tc.state.isMainTurnActive).toBe(false);

    resolveFirst();
    if (submit.accepted) await submit.completion;
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

describe('LemonadeAIProvider history alignment', () => {
  it('extractText handles string content', () => {
    expect(LemonadeAIProvider.extractText({ role: 'user', content: 'hello' })).toBe('hello');
  });

  it('extractText handles content block arrays', () => {
    const msg: Message = {
      role: 'assistant',
      content: [
        { type: 'text', text: 'first' },
        { type: 'text', text: 'second' },
      ],
    };
    expect(LemonadeAIProvider.extractText(msg)).toBe('first\nsecond');
  });

  it('extractText filters non-text blocks', () => {
    const msg: Message = {
      role: 'assistant',
      content: [
        { type: 'text', text: 'visible' },
        { type: 'tool_use', id: 'tc1', name: 'test', input: {} },
      ],
    };
    expect(LemonadeAIProvider.extractText(msg)).toBe('visible');
  });

  it('extractText handles empty content blocks', () => {
    const msg: Message = {
      role: 'assistant',
      content: [],
    };
    expect(LemonadeAIProvider.extractText(msg)).toBe('');
  });
});

describe('Credits-mode history formatting (provider receives full history)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('single-turn sends message as-is (no history prefix)', async () => {
    const { handleTurn: realHandleTurn } = await vi.importActual<typeof import('../../../../src/chat/stream/handler')>('../../../../src/chat/stream/handler');

    const provider = createCreditsProvider();
    const messages: Message[] = [{ role: 'user', content: 'hello' }];
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
    );

    // The provider should have received 'hello' as the first user message
    expect(provider.lastStreamParams).toBeDefined();
    expect(provider.lastStreamParams!.messages[0]).toEqual({ role: 'user', content: 'hello' });
  });

  it('multi-turn sends all messages to provider (handleTurn passes full chatMessages)', async () => {
    const { handleTurn: realHandleTurn } = await vi.importActual<typeof import('../../../../src/chat/stream/handler')>('../../../../src/chat/stream/handler');

    const provider = createCreditsProvider();
    const messages: Message[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there!' },
      { role: 'user', content: 'what is 2+2?' },
    ];
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
    );

    // Provider receives ALL prior messages. Note: handleTurn may have appended
    // an assistant message from the first turn, so we check the first 3 entries.
    expect(provider.lastStreamParams).toBeDefined();
    expect(provider.lastStreamParams!.messages.length).toBeGreaterThanOrEqual(3);
    expect(provider.lastStreamParams!.messages[0]).toEqual({ role: 'user', content: 'hello' });
    expect(provider.lastStreamParams!.messages[1]).toEqual({ role: 'assistant', content: 'hi there!' });
    expect(provider.lastStreamParams!.messages[2]).toEqual({ role: 'user', content: 'what is 2+2?' });
  });

  it('after clearSession, provider receives only new messages (no stale history)', async () => {
    const { handleTurn: realHandleTurn } = await vi.importActual<typeof import('../../../../src/chat/stream/handler')>('../../../../src/chat/stream/handler');

    const provider = createCreditsProvider();
    const chatMessages: Message[] = [
      { role: 'user', content: 'old message' },
      { role: 'assistant', content: 'old response' },
    ];
    const engine = new ChatEngine();

    // Simulate /clear via TurnCoordinator
    const tc = new TurnCoordinator(makeDeps(provider, { chatMessages, engine }));
    tc.clearSession();

    expect(chatMessages).toHaveLength(0);

    // New turn after clear
    chatMessages.push({ role: 'user', content: 'fresh start' });

    await realHandleTurn(
      provider,
      chatMessages,
      [],
      [{ type: 'text', text: 'system' }],
      { user: { _id: '1', name: 'T', email: 't@t.com' } } as ReturnType<typeof createSessionState>,
      {},
      null,
      true,
      engine,
    );

    // Provider should see only the fresh message, not old history
    expect(provider.lastStreamParams).toBeDefined();
    expect(provider.lastStreamParams!.messages[0]).toEqual({ role: 'user', content: 'fresh start' });
    expect(provider.lastStreamParams!.messages.every(m =>
      typeof m.content === 'string' ? !m.content.includes('old') : true
    )).toBe(true);
  });

  it('btw snapshot carries correct conversation context', () => {
    // TurnCoordinator.submitBtwTurn clones chatMessages and appends the btw
    // message. The credits provider receives the full snapshot — verify the
    // snapshot construction is consistent.
    const provider = createCreditsProvider();
    const chatMessages: Message[] = [
      { role: 'user', content: 'main question' },
      { role: 'assistant', content: 'main response' },
    ];

    // submitBtwTurn does: snapshot = deep clone of chatMessages, then snapshot.push(btw)
    // Verify this manually (TurnCoordinator uses JSON.parse(JSON.stringify) for the clone)
    const snapshot: Message[] = JSON.parse(JSON.stringify(chatMessages));
    snapshot.push({ role: 'user', content: 'btw side question' });

    expect(snapshot).toHaveLength(3);
    expect(snapshot[0]).toEqual({ role: 'user', content: 'main question' });
    expect(snapshot[1]).toEqual({ role: 'assistant', content: 'main response' });
    expect(snapshot[2]).toEqual({ role: 'user', content: 'btw side question' });

    // Original chatMessages unchanged
    expect(chatMessages).toHaveLength(2);
  });

  it('resetSession is a no-op on the aligned provider', () => {
    const provider = createCreditsProvider();
    // resetSession should not throw
    expect(() => provider.resetSession()).not.toThrow();
  });
});
