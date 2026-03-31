import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, StreamEvent, ToolDef, SystemMessage, Message } from './interface.js';
import { buildJsonSchema } from '../tools/schema.js';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;
  model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || 'claude-sonnet-4-6';
  }

  formatTools(tools: ToolDef[]): Anthropic.Tool[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: buildJsonSchema(t.params) as Anthropic.Tool['input_schema'],
    }));
  }

  async *stream(params: {
    systemPrompt: SystemMessage[];
    messages: Message[];
    tools: unknown[];
    maxTokens: number;
  }): AsyncIterable<StreamEvent> {
    const stream = this.client.messages.stream({
      model: this.model,
      system: params.systemPrompt as Anthropic.MessageCreateParams['system'],
      messages: params.messages as Anthropic.MessageParam[],
      tools: params.tools as Anthropic.Tool[],
      max_tokens: params.maxTokens,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text_delta', text: event.delta.text };
        }
      }
    }

    const response = await stream.finalMessage();

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        yield {
          type: 'tool_call',
          toolCall: {
            id: block.id,
            name: block.name,
            arguments: block.input as Record<string, unknown>,
          },
        };
      }
    }

    yield {
      type: 'done',
      stopReason: response.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn',
      usage: response.usage
        ? { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens }
        : undefined,
    };
  }
}
