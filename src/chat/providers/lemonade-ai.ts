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
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const text = LemonadeAIProvider.extractText(msg);
      if (text) parts.push(`${role}: ${text}`);
    }

    parts.push('');
    parts.push(LemonadeAIProvider.extractText(current));
    return parts.join('\n');
  }

  static extractText(msg: Message): string {
    if (typeof msg.content === 'string') return msg.content;
    if (Array.isArray(msg.content)) {
      return (msg.content as Array<Record<string, unknown>>)
        .filter(b => b.type === 'text' && typeof b.text === 'string')
        .map(b => b.text as string)
        .filter(Boolean)
        .join('\n');
    }
    return JSON.stringify(msg.content);
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
