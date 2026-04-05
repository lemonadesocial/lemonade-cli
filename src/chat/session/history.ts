import chalk from 'chalk';
import { Message } from '../providers/interface.js';

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

/**
 * Safety net: removes consecutive same-role messages from the array before
 * it is sent to the API.  The Anthropic API rejects payloads where
 * "roles must alternate", so this guard catches any corruption that slipped
 * past the normal rollback logic (e.g. a race between cancel and error
 * recovery).
 *
 * When consecutive same-role messages are found the *earlier* duplicate is
 * removed — the later one is assumed to be more recent / more relevant.
 *
 * Mutates `messages` in place and returns `true` if any messages were removed.
 */
export function sanitizeConsecutiveRoles(messages: Message[]): boolean {
  let changed = false;
  for (let i = messages.length - 1; i > 0; i--) {
    if (messages[i].role === messages[i - 1].role) {
      messages.splice(i - 1, 1);
      changed = true;
      // Don't decrement i further — the splice shifted elements so
      // messages[i-1] is now a new element that needs checking on the
      // next loop iteration (i will be decremented by the for-loop).
    }
  }
  return changed;
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

  // Ensure messages don't start with a tool_result (orphaned)
  while (messages.length > 0 && isToolResultMessage(messages[0])) {
    messages.shift();
  }

  // Ensure messages don't end with an assistant message (API requires ending with user)
  while (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
    messages.pop();
  }

  console.log(chalk.dim('  Context trimmed to save tokens. Older messages dropped.'));
}
