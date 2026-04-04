// TEMPORARY MIGRATION ADAPTER — Lemonade Credits Mode
//
// This provider routes through the remote Lemonade AI backend (GraphQL `run`
// mutation) rather than calling a tool-capable LLM directly. It satisfies the
// AIProvider contract but with `supportsToolCalling: false`, which means:
//
//   - No local tool execution (handleTurn skips the tool loop)
//   - The assistant experience in credits mode is NOT capability-equivalent
//     to BYOK mode (no tool use, no multi-turn tool loops)
//
// HISTORY ALIGNMENT (Track 3, Slice 3):
//   Local runtime history (params.messages from TurnCoordinator) is the
//   authoritative conversation source. The provider formats ALL local messages
//   into the `message` string sent to the backend, rather than relying on
//   server-side session continuity. This means:
//     - /clear genuinely clears conversation context (no stale server history)
//     - /btw side-questions carry the correct snapshot context
//     - Multi-turn continuity matches what the user sees in the terminal
//   The backend `session` param is not sent — each request is self-contained.
//
// REMAINING CAPABILITY GAP (migration debt, not product behavior):
//   - Tool calling: blocked on backend providing a tool-capable credits transport
//   - Model selection: uses backend model discovery, not local model list
//
// This adapter must be replaced when the backend supports a tool-capable
// credits transport (see PRD-CHAT-ARCHITECTURE-CONSOLIDATION.md §6, Option A).
// Until then it is the only valid credits-mode provider.

import { AIProvider, Message, ProviderCapabilities, StreamEvent, StreamParams, ToolDef } from './interface.js';
import { getAuthHeader } from '../../auth/store.js';

function getLemonadeAiUrl(): string {
  return process.env.LEMONADE_AI_URL || 'https://ai.lemonade.social';
}

/**
 * Combine caller abort signal with a 60-second timeout.
 * Uses AbortSignal.any when available (Node ≥20.3), otherwise falls back
 * to manual listener forwarding so caller abort is never silently dropped.
 */
function combinedSignal(callerSignal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(60_000);
  if (!callerSignal) return timeout;

  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([callerSignal, timeout]);
  }

  // Fallback: wire both signals into a single AbortController
  const ac = new AbortController();

  if (callerSignal.aborted) {
    ac.abort(callerSignal.reason);
    return ac.signal;
  }

  const onAbort = () => {
    ac.abort(callerSignal.reason);
    cleanup();
  };
  const onTimeout = () => {
    ac.abort(timeout.reason);
    cleanup();
  };
  const cleanup = () => {
    callerSignal.removeEventListener('abort', onAbort);
    timeout.removeEventListener('abort', onTimeout);
  };

  callerSignal.addEventListener('abort', onAbort, { once: true });
  timeout.addEventListener('abort', onTimeout, { once: true });

  return ac.signal;
}

// Ceiling for the formatted prompt string sent to the backend (in characters).
// ~100k chars ≈ ~25k tokens — keeps us well within typical model context limits
// while leaving room for the backend's own system prompt.  When history exceeds
// this, the oldest entries are dropped until the formatted string fits.
const MAX_FORMATTED_PROMPT_CHARS = 100_000;

export class LemonadeAIProvider implements AIProvider {
  name = 'lemonade-ai';
  capabilities: ProviderCapabilities = {
    supportsToolCalling: false,
  };
  model: string;
  private standId: string;

  constructor(model: string, standId: string) {
    this.model = model;
    this.standId = standId;
  }

  resetSession(): void {
    // No-op: local runtime history is authoritative. Clearing is handled
    // by TurnCoordinator.clearSession() truncating the chatMessages array.
    // This method exists to satisfy the AIProvider contract.
  }

  formatTools(_tools: ToolDef[]): unknown[] {
    return [];
  }

  // Format full local conversation history into a single message string.
  // Local runtime history is the authoritative source — the backend does
  // not maintain session continuity for credits mode.
  private formatMessages(messages: Message[]): string {
    if (messages.length === 0) return '';

    // Single message (first turn): send as-is, no wrapping needed.
    if (messages.length === 1) {
      return LemonadeAIProvider.extractText(messages[0]);
    }

    // Multi-turn: include prior conversation as context.
    const history = messages.slice(0, -1);
    const current = messages[messages.length - 1];
    const parts: string[] = [];

    for (const msg of history) {
      const text = LemonadeAIProvider.extractText(msg);
      if (!text) continue;

      const role = LemonadeAIProvider.classifyRole(msg);
      parts.push(`${role}: ${text}`);
    }

    // Explicit role on the current message so the backend never has to infer
    // who is speaking (finding 3: implicit role made explicit).
    const currentRole = LemonadeAIProvider.classifyRole(current);
    const currentText = LemonadeAIProvider.extractText(current);
    parts.push('');
    parts.push(`${currentRole}: ${currentText}`);

    // Prompt-size guard: drop oldest history entries until the formatted
    // string fits within MAX_FORMATTED_PROMPT_CHARS.  The current message
    // is never dropped — only prior history entries are trimmed.
    let formatted = parts.join('\n');
    while (formatted.length > MAX_FORMATTED_PROMPT_CHARS && parts.length > 2) {
      // parts layout: [history..., '', currentRole: currentText]
      //   indices 0..N-3  = history entries
      //   index   N-2     = blank separator between history and current
      //   index   N-1     = current message (never removed)
      // Remove the oldest history entry (index 0).
      parts.splice(0, 1);
      formatted = parts.join('\n');
    }

    // If all history entries were dropped, the blank separator is now the
    // first element — remove it so the prompt doesn't start with a newline.
    if (parts.length > 0 && parts[0] === '') {
      parts.splice(0, 1);
      formatted = parts.join('\n');
    }

    return formatted;
  }

  private static extractText(msg: Message): string {
    if (typeof msg.content === 'string') return msg.content;
    if (Array.isArray(msg.content)) {
      const parts: string[] = [];
      for (const block of msg.content as Array<Record<string, unknown>>) {
        if (block.type === 'text' && typeof block.text === 'string') {
          parts.push(block.text as string);
        } else if (block.type === 'tool_result' && typeof block.content === 'string') {
          // Tool-result blocks are BYOK history artifacts. Extract their
          // text content so it is not silently dropped from the prompt.
          parts.push(block.content as string);
        }
        // Intentionally skip tool_use, images, and other non-text blocks.
        // Credits mode has no tool support — these carry no meaningful
        // text for the backend prompt.
      }
      return parts.join('\n');
    }
    // Non-string, non-array content should not occur per the Message type
    // definition. Return empty rather than leaking internal structure via
    // JSON.stringify.
    return '';
  }

  // Determine the display role for a message.  Tool-result detection scans
  // ALL content blocks (not just the first) so mixed-content messages are
  // classified correctly.
  private static classifyRole(msg: Message): string {
    if (msg.role === 'assistant') return 'Assistant';

    if (Array.isArray(msg.content)) {
      const hasToolResult = (msg.content as Array<Record<string, unknown>>).some(
        (block) => block.type === 'tool_result',
      );
      if (hasToolResult) return 'Tool Output';
    }

    return 'User';
  }

  async *stream(params: StreamParams): AsyncIterable<StreamEvent> {
    const auth = getAuthHeader();
    if (!auth) {
      yield { type: 'text_delta', text: 'Not authenticated. Run "lemonade auth login" first.' };
      yield { type: 'done', stopReason: 'end_turn' };
      return;
    }

    // Format full local history into the message — local runtime is authoritative.
    const messageText = this.formatMessages(params.messages);

    const url = getLemonadeAiUrl();
    const response = await fetch(`${url}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify({
        query: `mutation Run($config: ObjectId, $message: String!, $data: JSON, $session: String, $standId: String) {
          run(config: $config, message: $message, data: $data, session: $session, standId: $standId) {
            message metadata sourceDocuments
          }
        }`,
        variables: {
          config: null,
          message: messageText,
          data: null,
          // Intentionally null: local runtime history is authoritative.
          // Each request is self-contained — no server-side session continuity.
          session: null,
          standId: this.standId,
        },
      }),
      signal: combinedSignal(params.signal),
    });

    if (!response.ok) {
      yield { type: 'text_delta', text: `Lemonade AI returned ${response.status}` };
      yield { type: 'done', stopReason: 'end_turn' };
      return;
    }

    const body = await response.json() as {
      data?: { run?: { message?: string; metadata?: Record<string, unknown>; sourceDocuments?: unknown } };
      errors?: Array<{ message: string }>;
    };

    if (body.errors && body.errors.length > 0) {
      yield { type: 'text_delta', text: body.errors[0].message };
      yield { type: 'done', stopReason: 'end_turn' };
      return;
    }

    const text = body.data?.run?.message || 'No response from Lemonade AI.';
    yield { type: 'text_delta', text };
    yield { type: 'done', stopReason: 'end_turn' };
  }
}
