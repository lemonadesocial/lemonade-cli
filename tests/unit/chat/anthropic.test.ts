import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../../../src/chat/providers/anthropic';
import { StreamEvent, ToolDef } from '../../../src/chat/providers/interface';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      stream: vi.fn(),
    };
  }
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

function createMockStream(events: Array<Record<string, unknown>>, finalMessage: Record<string, unknown>) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) {
        yield event;
      }
    },
    finalMessage: vi.fn().mockResolvedValue(finalMessage),
  };
}

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider('test-key');
  });

  describe('formatTools', () => {
    it('converts ToolDef[] to Anthropic tool format', () => {
      const tools: ToolDef[] = [
        {
          name: 'test_tool',
          displayName: 'test tool',
          description: 'A test tool',
          params: [
            { name: 'id', type: 'string', description: 'ID', required: true },
            { name: 'count', type: 'number', description: 'Count', required: false },
          ],
          destructive: false,
          execute: vi.fn(),
        },
      ];

      const formatted = provider.formatTools(tools);

      expect(formatted).toHaveLength(1);
      const tool = formatted[0] as Record<string, unknown>;
      expect(tool.name).toBe('test_tool');
      expect(tool.description).toBe('A test tool');

      const schema = tool.input_schema as Record<string, unknown>;
      expect(schema.type).toBe('object');

      const props = schema.properties as Record<string, Record<string, unknown>>;
      expect(props.id.type).toBe('string');
      expect(props.count.type).toBe('number');
      expect(schema.required).toEqual(['id']);
    });

    it('handles tools with no params', () => {
      const tools: ToolDef[] = [
        {
          name: 'no_params',
          displayName: 'no params',
          description: 'No params',
          params: [],
          destructive: false,
          execute: vi.fn(),
        },
      ];

      const formatted = provider.formatTools(tools);
      const tool = formatted[0] as Record<string, unknown>;
      const schema = tool.input_schema as Record<string, unknown>;
      expect(schema.type).toBe('object');
      expect(schema.required).toBeUndefined();
    });
  });

  describe('stream', () => {
    it('yields text_delta events for streaming text', async () => {
      const mockStream = createMockStream(
        [
          { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
          { type: 'content_block_delta', delta: { type: 'text_delta', text: ' world' } },
        ],
        {
          content: [{ type: 'text', text: 'Hello world' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 10 },
        },
      );

      (provider as unknown as { client: { messages: { stream: ReturnType<typeof vi.fn> } } }).client.messages.stream =
        vi.fn().mockReturnValue(mockStream);

      const events: StreamEvent[] = [];
      for await (const event of provider.stream({
        systemPrompt: [{ type: 'text', text: 'test' }],
        messages: [{ role: 'user', content: 'hi' }],
        tools: [],
        maxTokens: 100,
      })) {
        events.push(event);
      }

      expect(events[0]).toEqual({ type: 'text_delta', text: 'Hello' });
      expect(events[1]).toEqual({ type: 'text_delta', text: ' world' });
      expect(events[2]).toEqual({
        type: 'done',
        stopReason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 10 },
      });
    });

    it('yields tool_call events from final message', async () => {
      const mockStream = createMockStream(
        [
          { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Let me check.' } },
        ],
        {
          content: [
            { type: 'text', text: 'Let me check.' },
            { type: 'tool_use', id: 'toolu_123', name: 'event_get', input: { event_id: 'abc' } },
          ],
          stop_reason: 'tool_use',
          usage: { input_tokens: 200, output_tokens: 50 },
        },
      );

      (provider as unknown as { client: { messages: { stream: ReturnType<typeof vi.fn> } } }).client.messages.stream =
        vi.fn().mockReturnValue(mockStream);

      const events: StreamEvent[] = [];
      for await (const event of provider.stream({
        systemPrompt: [{ type: 'text', text: 'test' }],
        messages: [{ role: 'user', content: 'get event abc' }],
        tools: [],
        maxTokens: 100,
      })) {
        events.push(event);
      }

      const toolCall = events.find((e) => e.type === 'tool_call');
      expect(toolCall).toBeDefined();
      expect(toolCall!.toolCall!.id).toBe('toolu_123');
      expect(toolCall!.toolCall!.name).toBe('event_get');
      expect(toolCall!.toolCall!.arguments).toEqual({ event_id: 'abc' });

      const done = events.find((e) => e.type === 'done');
      expect(done!.stopReason).toBe('tool_use');
    });

    it('ignores non-text deltas', async () => {
      const mockStream = createMockStream(
        [
          { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{"id' } },
        ],
        {
          content: [],
          stop_reason: 'end_turn',
          usage: { input_tokens: 50, output_tokens: 5 },
        },
      );

      (provider as unknown as { client: { messages: { stream: ReturnType<typeof vi.fn> } } }).client.messages.stream =
        vi.fn().mockReturnValue(mockStream);

      const events: StreamEvent[] = [];
      for await (const event of provider.stream({
        systemPrompt: [{ type: 'text', text: 'test' }],
        messages: [{ role: 'user', content: 'hi' }],
        tools: [],
        maxTokens: 100,
      })) {
        events.push(event);
      }

      // Only the done event, no text_delta
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('done');
    });

    it('propagates stream errors', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          throw new Error('Connection dropped');
        },
        finalMessage: vi.fn(),
      };

      (provider as unknown as { client: { messages: { stream: ReturnType<typeof vi.fn> } } }).client.messages.stream =
        vi.fn().mockReturnValue(mockStream);

      await expect(async () => {
        for await (const _event of provider.stream({
          systemPrompt: [{ type: 'text', text: 'test' }],
          messages: [{ role: 'user', content: 'hi' }],
          tools: [],
          maxTokens: 100,
        })) {
          // consume
        }
      }).rejects.toThrow('Connection dropped');
    });
  });

  it('uses custom model when provided', () => {
    const customProvider = new AnthropicProvider('key', 'claude-opus-4-6');
    expect((customProvider as unknown as { model: string }).model).toBe('claude-opus-4-6');
  });

  it('defaults to claude-sonnet-4-6', () => {
    expect((provider as unknown as { model: string }).model).toBe('claude-sonnet-4-6');
  });
});
