import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTurn } from '../../../src/chat/stream/handler';
import { AIProvider, StreamEvent, Message, ToolDef, SystemMessage } from '../../../src/chat/providers/interface';
import { createSessionState } from '../../../src/chat/session/state';
import { ChatEngine } from '../../../src/chat/engine/ChatEngine';

function createMockProvider(
  responses: StreamEvent[][],
  overrides?: Partial<AIProvider>,
): AIProvider {
  let callIndex = 0;
  return {
    name: 'mock',
    model: 'mock-model',
    capabilities: { supportsToolCalling: true },
    formatTools: (tools) => tools,
    async *stream() {
      const events = responses[callIndex] || [];
      callIndex++;
      for (const event of events) {
        yield event;
      }
    },
    ...overrides,
  };
}

function mockTool(overrides: Partial<ToolDef> = {}): ToolDef {
  return {
    name: 'test_tool',
    displayName: 'test tool',
    description: 'Test',
    params: [],
    destructive: false,
    execute: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

describe('handleTurn', () => {
  const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
  const systemPrompt: SystemMessage[] = [{ type: 'text', text: 'System prompt' }];

  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('handles a text-only response', async () => {
    const provider = createMockProvider([
      [
        { type: 'text_delta', text: 'Hello!' },
        { type: 'done', stopReason: 'end_turn' },
      ],
    ]);

    const messages: Message[] = [{ role: 'user', content: 'hi' }];

    await handleTurn(
      provider,
      messages,
      [],
      systemPrompt,
      session,
      {},
      null,
      false,
    );

    // Assistant message should be added to history
    expect(messages).toHaveLength(2);
    expect(messages[1].role).toBe('assistant');
  });

  it('handles a tool call followed by text response', async () => {
    const tool = mockTool();
    const registry = { test_tool: tool };

    const provider = createMockProvider([
      // First response: tool call
      [
        { type: 'text_delta', text: 'Let me check.' },
        { type: 'tool_call', toolCall: { id: 'tc1', name: 'test_tool', arguments: {} } },
        { type: 'done', stopReason: 'tool_use' },
      ],
      // Second response: text after tool result
      [
        { type: 'text_delta', text: 'Done!' },
        { type: 'done', stopReason: 'end_turn' },
      ],
    ]);

    const messages: Message[] = [{ role: 'user', content: 'do something' }];

    await handleTurn(
      provider,
      messages,
      [],
      systemPrompt,
      session,
      registry,
      null,
      false,
    );

    // Should have: user, assistant (tool call), user (tool result), assistant (text)
    expect(messages).toHaveLength(4);
    expect(messages[1].role).toBe('assistant');
    expect(messages[2].role).toBe('user'); // tool results
    expect(messages[3].role).toBe('assistant');
    expect(tool.execute).toHaveBeenCalled();
  });

  it('ignores tool_call events from a non-tool-calling provider', async () => {
    const tool = mockTool();
    const registry = { test_tool: tool };

    const provider = createMockProvider(
      [
        [
          { type: 'text_delta', text: 'Here is the answer.' },
          { type: 'tool_call', toolCall: { id: 'tc1', name: 'test_tool', arguments: {} } },
          { type: 'done', stopReason: 'tool_use' },
        ],
      ],
      { capabilities: { supportsToolCalling: false } },
    );

    const messages: Message[] = [{ role: 'user', content: 'do something' }];

    await handleTurn(
      provider,
      messages,
      [],
      systemPrompt,
      session,
      registry,
      null,
      false,
    );

    // Only user + assistant text — no tool execution, no second API call
    expect(messages).toHaveLength(2);
    expect(messages[1].role).toBe('assistant');
    expect(tool.execute).not.toHaveBeenCalled();
  });

  it('limits non-tool-calling provider to a single iteration', async () => {
    const provider = createMockProvider(
      [
        [
          { type: 'text_delta', text: 'Response' },
          { type: 'done', stopReason: 'end_turn' },
        ],
        // This second response should never be reached
        [
          { type: 'text_delta', text: 'Should not appear' },
          { type: 'done', stopReason: 'end_turn' },
        ],
      ],
      { capabilities: { supportsToolCalling: false } },
    );

    const messages: Message[] = [{ role: 'user', content: 'hi' }];

    await handleTurn(
      provider,
      messages,
      [],
      systemPrompt,
      session,
      {},
      null,
      false,
    );

    expect(messages).toHaveLength(2);
    expect(messages[1].role).toBe('assistant');
  });

  it('forwards signal to provider.stream()', async () => {
    const abort = new AbortController();
    let receivedSignal: AbortSignal | undefined;

    const provider: AIProvider = {
      name: 'signal-test',
      model: 'test',
      capabilities: { supportsToolCalling: true },
      formatTools: (tools) => tools,
      async *stream(params) {
        receivedSignal = params.signal;
        yield { type: 'text_delta' as const, text: 'ok' };
        yield { type: 'done' as const, stopReason: 'end_turn' as const };
      },
    };

    const messages: Message[] = [{ role: 'user', content: 'hi' }];
    await handleTurn(
      provider,
      messages,
      [],
      systemPrompt,
      session,
      {},
      null,
      false,
      undefined,
      abort.signal,
    );

    expect(receivedSignal).toBe(abort.signal);
  });

  it('stops processing events after signal is aborted mid-stream', async () => {
    const abort = new AbortController();
    let yieldCount = 0;

    const provider: AIProvider = {
      name: 'abort-test',
      model: 'test',
      capabilities: { supportsToolCalling: true },
      formatTools: (tools) => tools,
      async *stream() {
        yield { type: 'text_delta' as const, text: 'first' };
        yieldCount++;
        abort.abort();
        yield { type: 'text_delta' as const, text: 'second' };
        yieldCount++;
        yield { type: 'done' as const, stopReason: 'end_turn' as const };
      },
    };

    const messages: Message[] = [{ role: 'user', content: 'hi' }];
    await handleTurn(
      provider,
      messages,
      [],
      systemPrompt,
      session,
      {},
      null,
      false,
      undefined,
      abort.signal,
    );

    // Generator was abandoned mid-stream: post-'second' increment never ran
    expect(yieldCount).toBe(1);
    // Handler returned before pushing an assistant message
    expect(messages).toHaveLength(1);
  });

  it('suppresses engine error and emits turn_done when stream throws on abort', async () => {
    const abort = new AbortController();
    const engine = new ChatEngine();
    const emitted: string[] = [];

    engine.on('error', () => { emitted.push('error'); });
    engine.on('turn_done', () => { emitted.push('turn_done'); });

    const provider: AIProvider = {
      name: 'abort-throw-test',
      model: 'test',
      capabilities: { supportsToolCalling: true },
      formatTools: (tools) => tools,
      async *stream() {
        abort.abort();
        throw new Error('The operation was aborted');
      },
    };

    const messages: Message[] = [{ role: 'user', content: 'hi' }];
    await handleTurn(
      provider,
      messages,
      [],
      systemPrompt,
      session,
      {},
      null,
      true,
      engine,
      abort.signal,
    );

    expect(emitted).not.toContain('error');
    expect(emitted).toContain('turn_done');
  });

  it('handles token usage warning', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const provider = createMockProvider([
      [
        { type: 'text_delta', text: 'Hello' },
        { type: 'done', stopReason: 'end_turn', usage: { input_tokens: 160000, output_tokens: 500 } },
      ],
    ]);

    // Use anthropic provider name to trigger the 150K threshold
    const anthropicProvider = { ...provider, name: 'anthropic' };

    const messages: Message[] = [{ role: 'user', content: 'hi' }];

    await handleTurn(
      anthropicProvider,
      messages,
      [],
      systemPrompt,
      session,
      {},
      null,
      false,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Session getting long'),
    );

    consoleSpy.mockRestore();
  });

  describe('streaming error recovery', () => {
    it('rolls back user message when stream throws before any content', async () => {
      const provider: AIProvider = {
        name: 'error-test',
        model: 'test',
        capabilities: { supportsToolCalling: true },
        formatTools: (tools) => tools,
        async *stream() {
          throw new Error('429 Too Many Requests');
        },
      };

      const messages: Message[] = [
        { role: 'user', content: 'first message' },
        { role: 'assistant', content: 'first reply' },
        { role: 'user', content: 'second message' },
      ];

      await handleTurn(
        provider,
        messages,
        [],
        systemPrompt,
        session,
        {},
        null,
        false,
      );

      // The last user message should be rolled back
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });

    it('does NOT roll back user message if some text was already streamed', async () => {
      let yieldCount = 0;
      const provider: AIProvider = {
        name: 'partial-error-test',
        model: 'test',
        capabilities: { supportsToolCalling: true },
        formatTools: (tools) => tools,
        async *stream() {
          yield { type: 'text_delta' as const, text: 'partial' };
          yieldCount++;
          throw new Error('connection reset');
        },
      };

      const messages: Message[] = [{ role: 'user', content: 'hi' }];

      await handleTurn(
        provider,
        messages,
        [],
        systemPrompt,
        session,
        {},
        null,
        false,
      );

      // User message should still be present (text was partially streamed)
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(yieldCount).toBe(1);
    });

    it('emits actionable rate-limit error via engine', async () => {
      const engine = new ChatEngine();
      let errorMsg = '';

      engine.on('error', (payload) => { errorMsg = (payload as { message: string }).message; });

      const provider: AIProvider = {
        name: 'rate-limit-test',
        model: 'test',
        capabilities: { supportsToolCalling: true },
        formatTools: (tools) => tools,
        async *stream() {
          throw new Error('429 Too Many Requests');
        },
      };

      const messages: Message[] = [{ role: 'user', content: 'hi' }];

      await handleTurn(
        provider,
        messages,
        [],
        systemPrompt,
        session,
        {},
        null,
        true,
        engine,
      );

      expect(errorMsg).toContain('Rate limited');
      expect(errorMsg).toContain('send it again');
    });

    it('emits actionable overloaded error via engine', async () => {
      const engine = new ChatEngine();
      let errorMsg = '';

      engine.on('error', (payload) => { errorMsg = (payload as { message: string }).message; });

      const provider: AIProvider = {
        name: 'overloaded-test',
        model: 'test',
        capabilities: { supportsToolCalling: true },
        formatTools: (tools) => tools,
        async *stream() {
          throw new Error('529 overloaded');
        },
      };

      const messages: Message[] = [{ role: 'user', content: 'hi' }];

      await handleTurn(
        provider,
        messages,
        [],
        systemPrompt,
        session,
        {},
        null,
        true,
        engine,
      );

      expect(errorMsg).toContain('overloaded');
      expect(errorMsg).toContain('retry');
    });

    it('allows normal turn after streaming error recovery', async () => {
      // First call: throws an error (simulating 429)
      // Second call: succeeds normally
      let callCount = 0;
      const provider: AIProvider = {
        name: 'recovery-test',
        model: 'test',
        capabilities: { supportsToolCalling: true },
        formatTools: (tools) => tools,
        async *stream() {
          callCount++;
          if (callCount === 1) {
            throw new Error('429 rate limit');
          }
          yield { type: 'text_delta' as const, text: 'recovered!' };
          yield { type: 'done' as const, stopReason: 'end_turn' as const };
        },
      };

      const messages: Message[] = [{ role: 'user', content: 'first attempt' }];

      // First turn: error — user message rolled back
      await handleTurn(provider, messages, [], systemPrompt, session, {}, null, false);
      expect(messages).toHaveLength(0); // rolled back

      // User retries
      messages.push({ role: 'user', content: 'retry attempt' });

      // Second turn: succeeds
      await handleTurn(provider, messages, [], systemPrompt, session, {}, null, false);

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });
  });
});
