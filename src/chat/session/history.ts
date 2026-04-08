import chalk from 'chalk';
import { Message } from '../providers/interface.js';
import { SessionState } from './state.js';
import { buildContextSummary } from './summary.js';

const MAX_MESSAGES = 50;
const KEEP_RECENT = 20;
const MAX_ESTIMATED_TOKENS = 100_000;

function estimateTokens(messages: Message[]): number {
  let chars = 0;
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      chars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        chars += JSON.stringify(block).length;
      }
    }
  }
  return Math.ceil(chars / 4);
}

function isToolResultMessage(msg: Message): boolean {
  if (msg.role !== 'user' || !Array.isArray(msg.content)) return false;
  const blocks = msg.content as Array<Record<string, unknown>>;
  return blocks.length > 0 && 'tool_use_id' in blocks[0];
}

export function truncateHistory(messages: Message[], session?: SessionState): void {
  const shouldTruncate =
    messages.length > MAX_MESSAGES ||
    estimateTokens(messages) > MAX_ESTIMATED_TOKENS;

  if (!shouldTruncate) return;

  let cutIndex = messages.length - KEEP_RECENT;
  if (cutIndex <= 0) return;

  // Advance past any tool_result messages to avoid orphaning them
  while (cutIndex < messages.length && isToolResultMessage(messages[cutIndex])) {
    cutIndex++;
  }

  if (cutIndex >= messages.length) return;

  // Build context summary from messages about to be removed
  const truncatedMessages = messages.slice(0, cutIndex);
  const summary = buildContextSummary(truncatedMessages, session);

  messages.splice(0, cutIndex);

  // Ensure messages start with a non-tool-result user message
  while (messages.length > 0 && (messages[0].role !== 'user' || isToolResultMessage(messages[0]))) {
    messages.shift();
  }

  // Ensure messages don't end with an assistant message (API requires ending with user)
  while (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
    messages.pop();
  }

  // Insert context summary as synthetic first message if we extracted useful context
  if (summary && messages.length > 0) {
    messages.unshift({ role: 'user', content: `[Context from previous conversation]\n${summary}` });
  }

  console.log(chalk.dim('  Context trimmed to save tokens. Older messages dropped.'));
}
