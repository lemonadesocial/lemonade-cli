import { describe, it, expect } from 'vitest';
import { ConversationStore } from '../../../../src/chat/runtime/ConversationStore';
import { handleTurn } from '../../../../src/chat/stream/handler';
import { AIProvider, StreamEvent, SystemMessage } from '../../../../src/chat/providers/interface';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';
import { createSessionState } from '../../../../src/chat/session/state';

function createMockProvider(responses: StreamEvent[][]): AIProvider {
  let callIndex = 0;
  return {
    name: 'mock',
    model: 'mock-model',
    formatTools: (tools) => tools,
    async *stream() {
      const events = responses[callIndex] || [];
      callIndex++;
      for (const event of events) {
        yield event;
      }
    },
  };
}

describe('ConversationStore', () => {
  it('starts empty', () => {
    const store = new ConversationStore();
    expect(store.length).toBe(0);
    expect(store.getMessages()).toEqual([]);
  });

  it('addUserMessage appends to the backing array', () => {
    const store = new ConversationStore();
    store.addUserMessage('hello');
    expect(store.length).toBe(1);
    expect(store.getMessages()[0]).toEqual({ role: 'user', content: 'hello' });
  });

  it('clear empties the backing array', () => {
    const store = new ConversationStore();
    store.addUserMessage('one');
    store.addUserMessage('two');
    expect(store.length).toBe(2);
    store.clear();
    expect(store.length).toBe(0);
    expect(store.getMessages()).toEqual([]);
  });

  it('getSnapshot returns a deep clone that does not alias the backing array', () => {
    const store = new ConversationStore();
    store.addUserMessage('original');
    const snapshot = store.getSnapshot();

    // Mutating the snapshot must not affect the store
    snapshot.push({ role: 'user', content: 'extra' });
    expect(store.length).toBe(1);
    expect(snapshot.length).toBe(2);
  });

  it('getMessages returns the same array reference (for handleTurn in-place mutation)', () => {
    const store = new ConversationStore();
    const ref1 = store.getMessages();
    const ref2 = store.getMessages();
    expect(ref1).toBe(ref2);
  });
});

describe('ConversationStore + handleTurn integration', () => {
  const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
  const systemPrompt: SystemMessage[] = [{ type: 'text', text: 'System prompt' }];

  it('provider history and engine events reflect the same turn content', async () => {
    const engine = new ChatEngine();

    // Collect text emitted through engine events (what the UI sees)
    let uiText = '';
    engine.on('text_delta', (data) => { uiText += data.text; });

    const provider = createMockProvider([
      [
        { type: 'text_delta', text: 'Hello from the store!' },
        { type: 'done', stopReason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 } },
      ],
    ]);

    const store = new ConversationStore();
    store.addUserMessage('hi');

    await handleTurn(
      provider,
      store.getMessages(),
      [],
      systemPrompt,
      session,
      {},
      null,
      true,
      engine,
    );

    // Provider history: user + assistant
    const msgs = store.getMessages();
    expect(msgs.length).toBe(2);
    expect(msgs[0]).toEqual({ role: 'user', content: 'hi' });
    expect(msgs[1].role).toBe('assistant');

    // Extract text from assistant content blocks
    const assistantContent = msgs[1].content as Array<{ type: string; text?: string }>;
    const providerText = assistantContent
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // UI-visible text and provider-submitted text must match
    expect(providerText).toBe('Hello from the store!');
    expect(uiText).toBe('Hello from the store!');
    expect(providerText).toBe(uiText);
  });

  it('clear via store empties provider history without orphaned state', () => {
    const store = new ConversationStore();
    store.addUserMessage('first');
    store.addUserMessage('second');
    expect(store.getMessages().length).toBe(2);

    store.clear();
    expect(store.getMessages().length).toBe(0);

    // New messages start from scratch
    store.addUserMessage('fresh');
    expect(store.getMessages().length).toBe(1);
    expect(store.getMessages()[0].content).toBe('fresh');
  });

  it('btw snapshot does not pollute main store', async () => {
    const engine = new ChatEngine();
    const provider = createMockProvider([
      [
        { type: 'text_delta', text: 'btw answer' },
        { type: 'done', stopReason: 'end_turn', usage: { input_tokens: 5, output_tokens: 3 } },
      ],
    ]);

    const store = new ConversationStore();
    store.addUserMessage('main question');

    // Simulate BTW: snapshot + extra message
    const snapshot = store.getSnapshot();
    snapshot.push({ role: 'user', content: 'btw side question' });

    await handleTurn(
      provider,
      snapshot,   // handleTurn mutates the snapshot, not the store
      [],
      systemPrompt,
      session,
      {},
      null,
      true,
      engine,
      undefined,
      'btw-123',
    );

    // Snapshot was mutated by handleTurn (has 3 messages now)
    expect(snapshot.length).toBe(3);

    // Main store must remain untouched
    expect(store.getMessages().length).toBe(1);
    expect(store.getMessages()[0].content).toBe('main question');
  });
});
