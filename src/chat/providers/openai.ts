import OpenAI from 'openai';
import { AIProvider, StreamEvent, ToolDef, SystemMessage, Message } from './interface.js';
import { buildJsonSchema } from '../tools/schema.js';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model || 'gpt-4o';
  }

  formatTools(tools: ToolDef[]): unknown[] {
    return tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: buildJsonSchema(t.params),
      },
    }));
  }

  async *stream(params: {
    systemPrompt: SystemMessage[];
    messages: Message[];
    tools: unknown[];
    maxTokens: number;
  }): AsyncIterable<StreamEvent> {
    const systemContent = params.systemPrompt.map((s) => s.text).join('\n\n');
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
    ];

    for (const msg of params.messages) {
      if (msg.role === 'user') {
        if (typeof msg.content === 'string') {
          openaiMessages.push({ role: 'user', content: msg.content });
        } else if (Array.isArray(msg.content)) {
          const toolResults = msg.content as Array<{ tool_use_id: string; content: string; is_error?: boolean }>;
          for (const tr of toolResults) {
            if ('tool_use_id' in tr) {
              openaiMessages.push({
                role: 'tool',
                tool_call_id: tr.tool_use_id,
                content: tr.content,
              });
            }
          }
        }
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          openaiMessages.push({ role: 'assistant', content: msg.content });
        } else if (Array.isArray(msg.content)) {
          const textParts: string[] = [];
          const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

          for (const block of msg.content) {
            const b = block as Record<string, unknown>;
            if (b.type === 'text') {
              textParts.push(b.text as string);
            } else if (b.type === 'tool_use') {
              toolCalls.push({
                id: b.id as string,
                type: 'function',
                function: {
                  name: b.name as string,
                  arguments: JSON.stringify(b.input),
                },
              });
            }
          }

          const assistantMsg: OpenAI.ChatCompletionAssistantMessageParam = {
            role: 'assistant',
            content: textParts.join('') || null,
          };
          if (toolCalls.length > 0) {
            assistantMsg.tool_calls = toolCalls;
          }
          openaiMessages.push(assistantMsg);
        }
      }
    }

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      tools: params.tools as OpenAI.ChatCompletionTool[],
      max_tokens: params.maxTokens,
      stream: true,
    });

    const toolCallAccumulators: Map<number, {
      id: string;
      name: string;
      argumentsJson: string;
    }> = new Map();

    let finishReason: string | null = null;
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (choice.delta.content) {
        yield { type: 'text_delta', text: choice.delta.content };
      }

      if (choice.delta.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          if (!toolCallAccumulators.has(tc.index)) {
            toolCallAccumulators.set(tc.index, {
              id: tc.id || '',
              name: tc.function?.name || '',
              argumentsJson: '',
            });
          }
          const acc = toolCallAccumulators.get(tc.index)!;
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name = tc.function.name;
          if (tc.function?.arguments) acc.argumentsJson += tc.function.arguments;
        }
      }

      if (choice.finish_reason) {
        finishReason = choice.finish_reason;
      }

      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }
    }

    for (const [, acc] of toolCallAccumulators) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(acc.argumentsJson);
      } catch {
        args = {};
      }
      yield {
        type: 'tool_call',
        toolCall: { id: acc.id, name: acc.name, arguments: args },
      };
    }

    yield {
      type: 'done',
      stopReason: finishReason === 'tool_calls' ? 'tool_use' : 'end_turn',
      usage: { input_tokens: promptTokens, output_tokens: completionTokens },
    };
  }
}
