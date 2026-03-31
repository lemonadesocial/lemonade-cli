import { AIProvider, StreamEvent, ToolDef, SystemMessage, Message } from './interface.js';
import { buildJsonSchema } from '../tools/schema.js';
import { getAuthHeader } from '../../auth/store.js';

function getLemonadeAiUrl(): string {
  return process.env.LEMONADE_AI_URL || 'https://ai.lemonade.social';
}

export class LemonadeAIProvider implements AIProvider {
  name = 'lemonade-ai';
  model: string;
  private standId: string;
  private sessionId: string | null = null;

  constructor(model: string, standId: string) {
    this.model = model;
    this.standId = standId;
  }

  formatTools(tools: ToolDef[]): unknown[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: buildJsonSchema(t.params),
    }));
  }

  async *stream(params: {
    systemPrompt: SystemMessage[];
    messages: Message[];
    tools: unknown[];
    maxTokens: number;
  }): AsyncIterable<StreamEvent> {
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
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      yield { type: 'text_delta', text: `Lemonade AI returned ${response.status}` };
      yield { type: 'done', stopReason: 'end_turn' };
      return;
    }

    const body = await response.json() as {
      data?: { run?: { message?: string; metadata?: unknown } };
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
