import readline from 'readline';
import { AIProvider, Message, ToolDef, SystemMessage } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { truncateHistory } from '../session/history.js';
import { executeToolCalls } from '../tools/executor.js';
import { ChatEngine } from '../engine/ChatEngine.js';

const TOKEN_WARN_THRESHOLD_ANTHROPIC = 150_000;
const TOKEN_WARN_THRESHOLD_OPENAI = 90_000;
const MAX_TOOL_ITERATIONS = 25;
/** @internal — exported for testing only */
export const MAX_STREAM_RETRIES = 3;

/** @internal — exported for testing only */
export let RETRY_BASE_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 30_000;
const RETRY_AFTER_CAP_S = 60;

export function isRetryableStreamingError(err: unknown): boolean {
  const errRecord = err as Record<string, unknown>;
  const status = typeof errRecord?.status === 'number' ? errRecord.status as number : undefined;

  if (status === 429 || status === 529) return true;

  const rawMsg = safeErrorMessage(err);
  const lower = rawMsg.toLowerCase();
  const retryablePatterns = [
    '429', 'rate limit', '529', 'overloaded',
    'econnreset', 'etimedout', 'enotfound', 'econnrefused',
    'fetch failed', 'network', 'socket',
  ];
  return retryablePatterns.some((p) => lower.includes(p));
}

/** @internal — exported for testing only */
export function getRetryDelay(attempt: number, err: unknown): number {
  // Check for retry-after header
  const errRecord = err as Record<string, unknown>;
  const headers = errRecord?.headers as Record<string, string> | undefined;
  if (headers && headers['retry-after']) {
    const retryAfterSec = parseFloat(headers['retry-after']);
    if (!isNaN(retryAfterSec) && retryAfterSec > 0) {
      const capped = Math.min(retryAfterSec, RETRY_AFTER_CAP_S);
      return capped * 1000;
    }
  }

  const exponential = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
  const capped = Math.min(exponential, RETRY_MAX_DELAY_MS);
  // Add ±20% jitter
  const jitter = capped * (0.8 + Math.random() * 0.4);
  return Math.round(jitter);
}

export function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }

    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

const SENSITIVE_KEYS = ['api_key', 'apiKey', 'api_key_value', 'password', 'secret', 'token', 'access_token', 'refresh_token'];

function sanitizeToolArgs(args: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (SENSITIVE_KEYS.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeToolArgs(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

function formatStreamingErrorMessage(err: unknown, retriesAttempted = 0): string {
  // Cast to a generic record so we can probe for structured fields like `status`
  // without assuming a specific error class (e.g. Anthropic SDK's APIError).
  const errRecord = err as Record<string, unknown>;
  const status = typeof errRecord?.status === 'number'
    ? errRecord.status as number
    : undefined;

  const retrySuffix = retriesAttempted > 0
    ? ` after ${retriesAttempted} ${retriesAttempted === 1 ? 'retry' : 'retries'}`
    : '';

  if (status === 429) {
    return `Rate limited by the API${retrySuffix}. Your message was not lost — please wait a moment and try again.`;
  }
  if (status === 529) {
    return `The API is temporarily overloaded${retrySuffix}. Your message was not lost — please retry shortly.`;
  }

  // Fall back to string matching for errors without a status property
  const rawMsg = safeErrorMessage(err);
  const lower = rawMsg.toLowerCase();
  if (lower.includes('429') || lower.includes('rate limit')) {
    return `Rate limited by the API${retrySuffix}. Your message was not lost — please wait a moment and try again.`;
  }
  if (lower.includes('529') || lower.includes('overloaded')) {
    return `The API is temporarily overloaded${retrySuffix}. Your message was not lost — please retry shortly.`;
  }
  if (lower.includes('econnreset') || lower.includes('etimedout') || lower.includes('enotfound') || lower.includes('econnrefused') || lower.includes('fetch failed') || lower.includes('network') || lower.includes('socket')) {
    return `Network error — connection was interrupted${retrySuffix}. Your message was not lost — check your connection and retry.`;
  }
  return `Streaming error${retrySuffix}: ${rawMsg}. Your message was not lost — you can retry.`;
}

// Dual-mode function: when `engine` is provided, all output is emitted as typed
// events (consumed by the Ink UI via useChatEngine). When `engine` is omitted,
// output falls back to direct stdout writes via display.ts (batch mode and tests).
// Both paths must stay in sync until batch mode is migrated to the engine pattern.
export async function handleTurn(
  provider: AIProvider,
  messages: Message[],
  formattedTools: unknown[],
  systemPrompt: SystemMessage[],
  session: SessionState,
  registry: Record<string, ToolDef>,
  rl: readline.Interface | null,
  isTTY: boolean,
  engine?: ChatEngine,
  signal?: AbortSignal,
  turnId?: string,
): Promise<void> {

  let finalUsage: { input_tokens: number; output_tokens: number } | undefined;
  const canUseTool = provider.capabilities.supportsToolCalling === true;
  const maxIterations = canUseTool ? MAX_TOOL_ITERATIONS : 1;

  const emitAbortDone = () => {
    if (engine) {
      engine.emit('turn_done', { usage: finalUsage || { input_tokens: 0, output_tokens: 0 }, turnId });
    }
  };

  let streamRetryCount = 0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (iteration > 0 && engine) {
      engine.emit('thinking_start', { turnId });
    }
    const toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];
    let accumulatedText = '';
    let stopReason: 'end_turn' | 'tool_use' | undefined;
    let lastUsage: { input_tokens: number; output_tokens: number } | undefined;
    let textStarted = false;

    try {
      const events = provider.stream({
        systemPrompt,
        messages,
        tools: canUseTool ? formattedTools : [],
        maxTokens: 4096,
        signal,
      });

      for await (const event of events) {
        if (signal?.aborted) break;
        switch (event.type) {
          case 'text_delta':
            if (event.text) {
              if (!textStarted && isTTY && !engine) process.stdout.write('\n  ');
              textStarted = true;
              if (engine) {
                engine.emit('text_delta', { text: event.text, turnId });
              } else {
                const { writeStreamToken } = await import('./display.js');
                writeStreamToken(event.text, isTTY);
              }
              accumulatedText += event.text;
            }
            break;

          case 'tool_call':
            if (event.toolCall && canUseTool) {
              toolCalls.push(event.toolCall);
            }
            break;

          case 'done':
            stopReason = canUseTool ? event.stopReason : 'end_turn';
            lastUsage = event.usage;
            break;
        }
      }
      if (signal?.aborted) {
        emitAbortDone();
        return;
      }
    } catch (err) {
      // If the signal was aborted (e.g. by cancel or clear), the stream
      // error is expected — emit turn_done without an error event to
      // prevent ghost error messages in a freshly cleared conversation.
      if (signal?.aborted) {
        emitAbortDone();
        return;
      }

      // Retry logic for iteration-0 transient errors before any content was produced
      if (
        iteration === 0 &&
        !accumulatedText &&
        toolCalls.length === 0 &&
        isRetryableStreamingError(err) &&
        streamRetryCount < MAX_STREAM_RETRIES
      ) {
        streamRetryCount++;
        const delay = getRetryDelay(streamRetryCount - 1, err);
        const delaySec = (delay / 1000).toFixed(1);
        const retryMsg = `Transient error — retrying in ${delaySec}s (attempt ${streamRetryCount}/${MAX_STREAM_RETRIES})...`;

        if (engine) {
          engine.emit('warning', { message: retryMsg, turnId });
        } else {
          const { printWarning } = await import('./display.js');
          printWarning(retryMsg);
        }

        try {
          await sleepWithAbort(delay, signal);
        } catch {
          // Signal was aborted during sleep
          emitAbortDone();
          return;
        }

        if (signal?.aborted) {
          emitAbortDone();
          return;
        }

        // Decrement iteration so the for-loop's `iteration++` brings it back
        // to 0, effectively re-entering iteration 0 for a retry attempt.
        // The retry count is tracked by `streamRetryCount` (checked above)
        // to prevent infinite loops — this loop can repeat at most
        // MAX_STREAM_RETRIES times before falling through to the error path.
        iteration--;
        continue;
      }

      // Roll back the user message only on the first iteration, and only when
      // this iteration hasn't accumulated any text or tool calls (i.e., the
      // stream failed before producing any content).
      if (iteration === 0 && !accumulatedText && toolCalls.length === 0) {
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx].role === 'user') {
          messages.splice(lastIdx, 1);
        }
      }

      const userMessage = formatStreamingErrorMessage(err, streamRetryCount);

      if (engine) {
        engine.emit('error', { message: userMessage, fatal: false, turnId });
        engine.emit('turn_done', { usage: finalUsage || { input_tokens: 0, output_tokens: 0 }, turnId });
      } else {
        if (textStarted) {
          const { writeNewline } = await import('./display.js');
          writeNewline();
        }
        const { printWarning } = await import('./display.js');
        printWarning(userMessage);
      }
      return;
    }

    // After a successful stream on iteration 0, reset retry count
    if (iteration === 0) streamRetryCount = 0;

    if (!engine && textStarted) {
      const { writeNewline } = await import('./display.js');
      writeNewline();
    }

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
        input: sanitizeToolArgs(tc.arguments),
      });
    }

    if (contentBlocks.length > 0) {
      messages.push({ role: 'assistant', content: contentBlocks as Message['content'] });
    }

    // Check token usage warnings
    if (lastUsage) {
      finalUsage = lastUsage;
      const threshold = provider.name === 'anthropic'
        ? TOKEN_WARN_THRESHOLD_ANTHROPIC
        : TOKEN_WARN_THRESHOLD_OPENAI;
      if (lastUsage.input_tokens > threshold) {
        const msg = `Session getting long (${lastUsage.input_tokens} tokens). Consider starting fresh soon.`;
        if (engine) {
          engine.emit('warning', { message: msg, turnId });
        } else {
          const { printWarning } = await import('./display.js');
          printWarning(msg);
        }
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
      engine,
      turnId,
    );

    if (fatal) {
      if (engine) {
        engine.emit('turn_done', { usage: finalUsage || { input_tokens: 0, output_tokens: 0 }, turnId });
      }
      return;
    }

    // OPTIMIZATION: Skip second API call for single self-describing tool
    if (
      engine &&
      toolCalls.length === 1 &&
      !accumulatedText
    ) {
      const toolDef = registry[toolCalls[0].name];
      if (toolDef?.formatResult && !results[0].is_error) {
        try {
          const rawResult = JSON.parse(results[0].content);
          const formatted = toolDef.formatResult(rawResult);
          engine.emit('text_delta', { text: formatted, turnId });
          // Push to history so future turns have context
          messages.push({ role: 'user', content: results as Message['content'] });
          messages.push({ role: 'assistant', content: [{ type: 'text', text: formatted }] as Message['content'] });
          break; // Skip second API call
        } catch {
          // If formatResult fails, fall through to normal flow
        }
      }
    }

    // Append tool results as a user message
    messages.push({ role: 'user', content: results as Message['content'] });

    // Truncate history if needed
    truncateHistory(messages);
  }

  if (engine) {
    engine.emit('turn_done', { usage: finalUsage || { input_tokens: 0, output_tokens: 0 }, turnId });
  }
}
