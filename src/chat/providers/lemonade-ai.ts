// TEMPORARY MIGRATION ADAPTER — Lemonade Credits Mode
//
// This provider routes through the remote Lemonade AI backend (GraphQL `run`
// mutation) rather than calling a tool-capable LLM directly. It satisfies the
// AIProvider contract but with `supportsToolCalling: false`, which means:
//
//   - No local tool execution (handleTurn skips the tool loop)
//   - Conversation history is maintained server-side via sessionId, not by
//     the local runtime — the provider only sends the last user message
//   - The assistant experience in credits mode is NOT capability-equivalent
//     to BYOK mode (no tool use, no multi-turn tool loops)
//
// CAPABILITY GAP (migration debt, not product behavior):
//   - Tool calling: blocked on backend providing a tool-capable credits transport
//   - Full history: backend `run` mutation accepts a single `message` string;
//     local conversation history from TurnCoordinator is unused beyond session ID
//   - Model selection: uses backend model discovery, not local model list
//
// This adapter must be replaced when the backend supports a tool-capable
// credits transport (see PRD-CHAT-ARCHITECTURE-CONSOLIDATION.md §6, Option A).
// Until then it is the only valid credits-mode provider.

import { AIProvider, ProviderCapabilities, StreamEvent, StreamParams, ToolDef } from './interface.js';
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
  private sessionId: string | null = null;

  constructor(model: string, standId: string) {
    this.model = model;
    this.standId = standId;
  }

  resetSession(): void {
    this.sessionId = null;
  }

  formatTools(_tools: ToolDef[]): unknown[] {
    return [];
  }

  async *stream(params: StreamParams): AsyncIterable<StreamEvent> {
    const auth = getAuthHeader();
    if (!auth) {
      yield { type: 'text_delta', text: 'Not authenticated. Run "lemonade auth login" first.' };
      yield { type: 'done', stopReason: 'end_turn' };
      return;
    }

    // Extract the last user message
    const lastMsg = params.messages[params.messages.length - 1];
    const messageText = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);

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
          session: this.sessionId,
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

    // Store session ID from response for multi-turn continuity
    const metadata = body.data?.run?.metadata;
    if (metadata && typeof metadata.session === 'string') {
      this.sessionId = metadata.session;
    }

    const text = body.data?.run?.message || 'No response from Lemonade AI.';
    yield { type: 'text_delta', text };
    yield { type: 'done', stopReason: 'end_turn' };
  }
}
