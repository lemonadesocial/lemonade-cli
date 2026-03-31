import readline from 'readline';
import { AIProvider, Message, ToolDef, SystemMessage } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { truncateHistory } from '../session/history.js';
import { executeToolCalls } from '../tools/executor.js';
import { writeStreamToken, writeNewline, printWarning } from './display.js';

const TOKEN_WARN_THRESHOLD_ANTHROPIC = 150_000;
const TOKEN_WARN_THRESHOLD_OPENAI = 90_000;
const MAX_TOOL_ITERATIONS = 25;

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export async function handleTurn(
  provider: AIProvider,
  messages: Message[],
  formattedTools: unknown[],
  systemPrompt: SystemMessage[],
  session: SessionState,
  registry: Record<string, ToolDef>,
  rl: readline.Interface | null,
  isTTY: boolean,
): Promise<void> {

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];
    let accumulatedText = '';
    let stopReason: 'end_turn' | 'tool_use' | undefined;
    let lastUsage: { input_tokens: number; output_tokens: number } | undefined;
    let textStarted = false;

    try {
      const events = provider.stream({
        systemPrompt,
        messages,
        tools: formattedTools,
        maxTokens: 4096,
      });

      for await (const event of events) {
        switch (event.type) {
          case 'text_delta':
            if (event.text) {
              if (!textStarted && isTTY) process.stdout.write('\n  ');
              textStarted = true;
              writeStreamToken(event.text, isTTY);
              accumulatedText += event.text;
            }
            break;

          case 'tool_call':
            if (event.toolCall) {
              toolCalls.push(event.toolCall);
            }
            break;

          case 'done':
            stopReason = event.stopReason;
            lastUsage = event.usage;
            break;
        }
      }
    } catch (err) {
      if (textStarted) writeNewline();
      printWarning(`Streaming error: ${safeErrorMessage(err)}`);
      return;
    }

    if (textStarted) writeNewline();

    // Build assistant content blocks for history
    const contentBlocks: Array<Record<string, unknown>> = [];
    if (accumulatedText) {
      contentBlocks.push({ type: 'text', text: accumulatedText });
    }
    for (const tc of toolCalls) {
      contentBlocks.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.name,
        input: tc.arguments,
      });
    }

    messages.push({ role: 'assistant', content: contentBlocks as Message['content'] });

    // Check token usage warnings
    if (lastUsage) {
      const threshold = provider.name === 'anthropic'
        ? TOKEN_WARN_THRESHOLD_ANTHROPIC
        : TOKEN_WARN_THRESHOLD_OPENAI;
      if (lastUsage.input_tokens > threshold) {
        printWarning(
          `Session getting long (${lastUsage.input_tokens} tokens). Consider starting fresh soon.`,
        );
      }
    }

    // If no tool calls, turn is done
    if (stopReason !== 'tool_use' || toolCalls.length === 0) break;

    // Execute tool calls sequentially
    const { results, fatal } = await executeToolCalls(
      toolCalls,
      registry,
      session,
      rl,
      isTTY,
    );

    if (fatal) return;

    // Append tool results as a user message
    messages.push({ role: 'user', content: results as Message['content'] });

    // Truncate history if needed
    truncateHistory(messages);
  }
}
