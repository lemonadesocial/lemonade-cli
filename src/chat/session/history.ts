import chalk from 'chalk';
import { Message } from '../providers/interface';

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

export function truncateHistory(messages: Message[]): void {
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

  messages.splice(0, cutIndex);
  console.log(chalk.dim('  Context trimmed to save tokens. Older messages dropped.'));
}
