import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTurn } from '../../../src/chat/stream/handler';
import { AIProvider, StreamEvent, Message, ToolDef, SystemMessage } from '../../../src/chat/providers/interface';
import { createSessionState } from '../../../src/chat/session/state';

function createMockProvider(responses: StreamEvent[][]): AIProvider {
  let callIndex = 0;
  return {
    name: 'mock',
    formatTools: (tools) => tools,
    async *stream() {
      const events = responses[callIndex] || [];
      callIndex++;
      for (const event of events) {
        yield event;
      }
    },
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
});
