import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../../../src/chat/providers/openai';
import { StreamEvent, ToolDef, Message } from '../../../src/chat/providers/interface';

// Mock the OpenAI SDK
vi.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn(),
      },
    };
  }
  return { default: MockOpenAI, OpenAI: MockOpenAI };
});

function createMockChunkStream(chunks: Array<Record<string, unknown>>) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider('test-key');
  });

  describe('formatTools', () => {
    it('converts ToolDef[] to OpenAI function calling format', () => {
      const tools: ToolDef[] = [
        {
          name: 'event_create',
          displayName: 'event create',
          description: 'Create an event',
          params: [
            { name: 'title', type: 'string', description: 'Title', required: true },
            { name: 'virtual', type: 'boolean', description: 'Virtual', required: false },
          ],
          destructive: false,
          execute: vi.fn(),
        },
      ];

      const formatted = provider.formatTools(tools);

      expect(formatted).toHaveLength(1);
      const tool = formatted[0] as Record<string, unknown>;
      expect(tool.type).toBe('function');

      const fn = tool.function as Record<string, unknown>;
      expect(fn.name).toBe('event_create');
      expect(fn.description).toBe('Create an event');

      const params = fn.parameters as Record<string, unknown>;
      expect(params.type).toBe('object');
      expect(params.required).toEqual(['title']);
    });
  });

  describe('stream - message format conversion', () => {
    it('converts system prompts to a single system message', async () => {
      const mockCreate = vi.fn().mockResolvedValue(createMockChunkStream([
        { choices: [{ delta: { content: 'Hi' }, finish_reason: null }] },
        { choices: [{ delta: {}, finish_reason: 'stop' }] },
      ]));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

      const events: StreamEvent[] = [];
      for await (const event of provider.stream({
        systemPrompt: [
          { type: 'text', text: 'Part 1' },
          { type: 'text', text: 'Part 2' },
        ],
        messages: [{ role: 'user', content: 'hello' }],
        tools: [],
        maxTokens: 100,
      })) {
        events.push(event);
      }

      const call = mockCreate.mock.calls[0][0];
      expect(call.messages[0]).toEqual({ role: 'system', content: 'Part 1\n\nPart 2' });
      expect(call.messages[1]).toEqual({ role: 'user', content: 'hello' });
    });

    it('converts tool results to OpenAI tool messages', async () => {
      const mockCreate = vi.fn().mockResolvedValue(createMockChunkStream([
        { choices: [{ delta: { content: 'Done' }, finish_reason: 'stop' }] },
      ]));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

      const messages: Message[] = [
        { role: 'user', content: 'do something' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me do that.' },
            { type: 'tool_use', id: 'tc1', name: 'event_get', input: { event_id: 'abc' } },
          ],
        },
        {
          role: 'user',
          content: [{ tool_use_id: 'tc1', content: '{"_id":"abc","title":"Test"}' }],
        },
      ];

      for await (const _event of provider.stream({
        systemPrompt: [{ type: 'text', text: 'System' }],
        messages,
        tools: [],
        maxTokens: 100,
      })) {
        // consume
      }

      const call = mockCreate.mock.calls[0][0];
      const msgs = call.messages;

      // system + user + assistant (with tool_calls) + tool result
      expect(msgs[0].role).toBe('system');
      expect(msgs[1].role).toBe('user');
      expect(msgs[2].role).toBe('assistant');
      expect(msgs[2].tool_calls).toHaveLength(1);
      expect(msgs[2].tool_calls[0].function.name).toBe('event_get');
      expect(msgs[3].role).toBe('tool');
      expect(msgs[3].tool_call_id).toBe('tc1');
    });
  });

  describe('stream - streaming event translation', () => {
    it('yields text_delta events from streaming chunks', async () => {
      const mockCreate = vi.fn().mockResolvedValue(createMockChunkStream([
        { choices: [{ delta: { content: 'Hello' }, finish_reason: null }] },
        { choices: [{ delta: { content: ' there' }, finish_reason: null }] },
        { choices: [{ delta: {}, finish_reason: 'stop' }] },
      ]));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

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
      expect(events[1]).toEqual({ type: 'text_delta', text: ' there' });
      expect(events[2]).toEqual({
        type: 'done',
        stopReason: 'end_turn',
        usage: { input_tokens: 0, output_tokens: 0 },
      });
    });
  });

  describe('stream - tool call accumulation', () => {
    it('accumulates fragmented tool calls across chunks', async () => {
      const mockCreate = vi.fn().mockResolvedValue(createMockChunkStream([
        {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0, id: 'call_1', function: { name: 'event_get', arguments: '{"event' },
              }],
            },
            finish_reason: null,
          }],
        },
        {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0, function: { arguments: '_id":"abc"}' },
              }],
            },
            finish_reason: null,
          }],
        },
        { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
      ]));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

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
      expect(toolCall!.toolCall!.id).toBe('call_1');
      expect(toolCall!.toolCall!.name).toBe('event_get');
      expect(toolCall!.toolCall!.arguments).toEqual({ event_id: 'abc' });

      const done = events.find((e) => e.type === 'done');
      expect(done!.stopReason).toBe('tool_use');
    });

    it('handles multiple concurrent tool calls', async () => {
      const mockCreate = vi.fn().mockResolvedValue(createMockChunkStream([
        {
          choices: [{
            delta: {
              tool_calls: [
                { index: 0, id: 'call_1', function: { name: 'event_get', arguments: '{"event_id":"a"}' } },
                { index: 1, id: 'call_2', function: { name: 'event_get', arguments: '{"event_id":"b"}' } },
              ],
            },
            finish_reason: null,
          }],
        },
        { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
      ]));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

      const events: StreamEvent[] = [];
      for await (const event of provider.stream({
        systemPrompt: [{ type: 'text', text: 'test' }],
        messages: [{ role: 'user', content: 'compare events' }],
        tools: [],
        maxTokens: 100,
      })) {
        events.push(event);
      }

      const toolCalls = events.filter((e) => e.type === 'tool_call');
      expect(toolCalls).toHaveLength(2);
      expect(toolCalls[0].toolCall!.id).toBe('call_1');
      expect(toolCalls[1].toolCall!.id).toBe('call_2');
    });

    it('handles malformed JSON in tool arguments gracefully', async () => {
      const mockCreate = vi.fn().mockResolvedValue(createMockChunkStream([
        {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0, id: 'call_1', function: { name: 'test', arguments: '{invalid' },
              }],
            },
            finish_reason: null,
          }],
        },
        { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
      ]));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

      const events: StreamEvent[] = [];
      for await (const event of provider.stream({
        systemPrompt: [{ type: 'text', text: 'test' }],
        messages: [{ role: 'user', content: 'hi' }],
        tools: [],
        maxTokens: 100,
      })) {
        events.push(event);
      }

      const toolCall = events.find((e) => e.type === 'tool_call');
      expect(toolCall!.toolCall!.arguments).toEqual({});
    });
  });

  describe('stream - error propagation', () => {
    it('propagates stream errors', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          throw new Error('Rate limit exceeded');
        },
      });

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

      await expect(async () => {
        for await (const _event of provider.stream({
          systemPrompt: [{ type: 'text', text: 'test' }],
          messages: [{ role: 'user', content: 'hi' }],
          tools: [],
          maxTokens: 100,
        })) {
          // consume
        }
      }).rejects.toThrow('Rate limit exceeded');
    });

    it('propagates create errors', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('Invalid API key'));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

      await expect(async () => {
        for await (const _event of provider.stream({
          systemPrompt: [{ type: 'text', text: 'test' }],
          messages: [{ role: 'user', content: 'hi' }],
          tools: [],
          maxTokens: 100,
        })) {
          // consume
        }
      }).rejects.toThrow('Invalid API key');
    });
  });

  describe('stream - usage tracking', () => {
    it('captures usage from chunk.usage', async () => {
      const mockCreate = vi.fn().mockResolvedValue(createMockChunkStream([
        { choices: [{ delta: { content: 'Hi' }, finish_reason: null }] },
        { choices: [{ delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 150, completion_tokens: 25 } },
      ]));

      (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client.chat.completions.create = mockCreate;

      const events: StreamEvent[] = [];
      for await (const event of provider.stream({
        systemPrompt: [{ type: 'text', text: 'test' }],
        messages: [{ role: 'user', content: 'hi' }],
        tools: [],
        maxTokens: 100,
      })) {
        events.push(event);
      }

      const done = events.find((e) => e.type === 'done');
      expect(done!.usage).toEqual({ input_tokens: 150, output_tokens: 25 });
    });
  });

  it('uses custom model when provided', () => {
    const customProvider = new OpenAIProvider('key', 'gpt-4o-mini');
    expect((customProvider as unknown as { model: string }).model).toBe('gpt-4o-mini');
  });

  it('defaults to gpt-4o', () => {
    expect((provider as unknown as { model: string }).model).toBe('gpt-4o');
  });
});
