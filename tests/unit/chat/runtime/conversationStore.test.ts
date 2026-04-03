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
    expect(store.getMutableRef()).toEqual([]);
  });

  it('addUserMessage appends to the backing array', () => {
    const store = new ConversationStore();
    store.addUserMessage('hello');
    expect(store.length).toBe(1);
    expect(store.getMutableRef()[0]).toEqual({ role: 'user', content: 'hello' });
  });

  it('clear empties the backing array', () => {
    const store = new ConversationStore();
    store.addUserMessage('one');
    store.addUserMessage('two');
    expect(store.length).toBe(2);
    store.clear();
    expect(store.length).toBe(0);
    expect(store.getMutableRef()).toEqual([]);
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

  it('getMutableRef returns the same array reference (for handleTurn in-place mutation)', () => {
    const store = new ConversationStore();
    const ref1 = store.getMutableRef();
    const ref2 = store.getMutableRef();
    expect(ref1).toBe(ref2);
  });

  it('clear throws when a turn is active', () => {
    const store = new ConversationStore();
    store.addUserMessage('msg');
    store.beginTurn();
    expect(() => store.clear()).toThrow('Cannot clear conversation while a turn is in progress');
    // Messages remain intact
    expect(store.length).toBe(1);
  });

  it('clear succeeds after endTurn', () => {
    const store = new ConversationStore();
    store.addUserMessage('msg');
    store.beginTurn();
    store.endTurn();
    store.clear();
    expect(store.length).toBe(0);
  });

  it('turnActive reflects begin/end lifecycle', () => {
    const store = new ConversationStore();
    expect(store.turnActive).toBe(false);
    store.beginTurn();
    expect(store.turnActive).toBe(true);
    store.endTurn();
    expect(store.turnActive).toBe(false);
  });

  it('beginTurn throws on reentrant call', () => {
    const store = new ConversationStore();
    store.beginTurn();
    expect(() => store.beginTurn()).toThrow('beginTurn() called while a turn is already active');
    store.endTurn();
    // After ending, beginTurn works again
    expect(() => store.beginTurn()).not.toThrow();
    store.endTurn();
  });

  it('addUserMessage throws during active turn', () => {
    const store = new ConversationStore();
    store.addUserMessage('before turn');
    expect(store.length).toBe(1);

    store.beginTurn();
    expect(() => store.addUserMessage('mid-turn')).toThrow('Cannot add a user message while a turn is in progress');
    expect(store.length).toBe(1); // unchanged

    store.endTurn();
    store.addUserMessage('after turn');
    expect(store.length).toBe(2);
  });

  it('abort path releases turn lock correctly', async () => {
    const store = new ConversationStore();
    store.addUserMessage('hello');

    const abort = new AbortController();
    const engine = new ChatEngine();

    // Provider that yields one delta then we abort
    const provider: AIProvider = {
      name: 'mock',
      model: 'mock-model',
      formatTools: (tools) => tools,
      async *stream() {
        yield { type: 'text_delta' as const, text: 'partial' };
        // Simulate slow stream — abort fires before done event
        abort.abort();
        yield { type: 'done' as const, stopReason: 'end_turn' as const, usage: { input_tokens: 1, output_tokens: 1 } };
      },
    };

    store.beginTurn();
    try {
      await handleTurn(
        provider,
        store.getMutableRef(),
        [],
        [{ type: 'text', text: 'sys' }],
        createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' }),
        {},
        null,
        true,
        engine,
        abort.signal,
      );
    } finally {
      store.endTurn();
    }

    // Store must be unlocked after finally cleanup
    expect(store.turnActive).toBe(false);
    // Can begin a new turn without error
    expect(() => store.beginTurn()).not.toThrow();
    store.endTurn();
    // Can clear after abort
    expect(() => store.clear()).not.toThrow();
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
      store.getMutableRef(),
      [],
      systemPrompt,
      session,
      {},
      null,
      true,
      engine,
    );

    // Provider history: user + assistant
    const msgs = store.getMutableRef();
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
    expect(store.getMutableRef().length).toBe(2);

    store.clear();
    expect(store.getMutableRef().length).toBe(0);

    // New messages start from scratch
    store.addUserMessage('fresh');
    expect(store.getMutableRef().length).toBe(1);
    expect(store.getMutableRef()[0].content).toBe('fresh');
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
    expect(store.getMutableRef().length).toBe(1);
    expect(store.getMutableRef()[0].content).toBe('main question');
  });

  it('clear during simulated active turn throws and preserves history', async () => {
    const store = new ConversationStore();
    store.addUserMessage('important context');
    store.beginTurn();

    // Attempting to clear mid-turn must throw
    expect(() => store.clear()).toThrow('Cannot clear conversation while a turn is in progress');

    // History must be intact
    expect(store.length).toBe(1);
    expect(store.getMutableRef()[0].content).toBe('important context');

    // After ending the turn, clear works
    store.endTurn();
    store.clear();
    expect(store.length).toBe(0);
  });
});
