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

  it('beginTurn returns a unique token', () => {
    const store = new ConversationStore();
    const t1 = store.beginTurn();
    store.endTurn(t1);
    const t2 = store.beginTurn();
    store.endTurn(t2);
    expect(t1).not.toBe(t2);
  });

  it('clear throws when a turn is active', () => {
    const store = new ConversationStore();
    store.addUserMessage('msg');
    const token = store.beginTurn();
    expect(() => store.clear()).toThrow('Cannot clear conversation while a turn is in progress');
    // Messages remain intact
    expect(store.length).toBe(1);
    store.endTurn(token);
  });

  it('clear succeeds after endTurn', () => {
    const store = new ConversationStore();
    store.addUserMessage('msg');
    const token = store.beginTurn();
    store.endTurn(token);
    store.clear();
    expect(store.length).toBe(0);
  });

  it('turnActive reflects begin/end lifecycle', () => {
    const store = new ConversationStore();
    expect(store.turnActive).toBe(false);
    const token = store.beginTurn();
    expect(store.turnActive).toBe(true);
    store.endTurn(token);
    expect(store.turnActive).toBe(false);
  });

  it('beginTurn throws on reentrant call', () => {
    const store = new ConversationStore();
    const token = store.beginTurn();
    expect(() => store.beginTurn()).toThrow('beginTurn() called while a turn is already active');
    store.endTurn(token);
    // After ending, beginTurn works again
    const token2 = store.beginTurn();
    expect(token2).toBeGreaterThan(token);
    store.endTurn(token2);
  });

  it('endTurn with stale token is a no-op', () => {
    const store = new ConversationStore();
    const t1 = store.beginTurn();
    store.endTurn(t1);

    const t2 = store.beginTurn();
    // Stale finally from turn A must NOT unlock turn B
    store.endTurn(t1);
    expect(store.turnActive).toBe(true);
    // Correct token still works
    store.endTurn(t2);
    expect(store.turnActive).toBe(false);
  });

  it('commitTurnUserMessage requires an active turn', () => {
    const store = new ConversationStore();
    expect(() => store.commitTurnUserMessage('no turn')).toThrow('requires an active turn');
  });

  it('commitTurnUserMessage returns index and rollbackTurnUserMessage undoes it', () => {
    const store = new ConversationStore();
    const token = store.beginTurn();
    const idx = store.commitTurnUserMessage('will fail');
    expect(store.length).toBe(1);
    expect(idx).toBe(0);

    // Rollback succeeds — message is last and is a user message
    expect(store.rollbackTurnUserMessage(idx)).toBe(true);
    expect(store.length).toBe(0);

    store.endTurn(token);
    expect(store.turnActive).toBe(false);

    // Subsequent turns work normally
    store.addUserMessage('real message');
    expect(store.length).toBe(1);
    const t2 = store.beginTurn();
    store.endTurn(t2);
  });

  it('rollbackTurnUserMessage is a no-op when assistant reply exists', () => {
    const store = new ConversationStore();
    const token = store.beginTurn();
    const idx = store.commitTurnUserMessage('input');
    // Simulate provider appending an assistant message
    store.getMutableRef().push({ role: 'assistant', content: 'partial response' });

    // Rollback fails — user message is no longer the last entry
    expect(store.rollbackTurnUserMessage(idx)).toBe(false);
    expect(store.length).toBe(2);

    store.endTurn(token);
  });

  it('rollbackTurnUserMessage is safe with out-of-range index', () => {
    const store = new ConversationStore();
    expect(store.rollbackTurnUserMessage(-1)).toBe(false);
    expect(store.rollbackTurnUserMessage(99)).toBe(false);
  });

  it('rollbackTurnUserMessage is idempotent — second call is a no-op', () => {
    const store = new ConversationStore();
    const token = store.beginTurn();
    const idx = store.commitTurnUserMessage('msg');
    expect(store.rollbackTurnUserMessage(idx)).toBe(true);
    // Second call: index is now out of range
    expect(store.rollbackTurnUserMessage(idx)).toBe(false);
    expect(store.length).toBe(0);
    store.endTurn(token);
  });

  it('escape-path rollback removes orphaned user message when no assistant replied', () => {
    const store = new ConversationStore();
    store.addUserMessage('prior context');
    const token = store.beginTurn();
    const idx = store.commitTurnUserMessage('cancelled input');
    expect(store.length).toBe(2);

    // Simulate escape: rollback then endTurn
    expect(store.rollbackTurnUserMessage(idx)).toBe(true);
    store.endTurn(token);

    // Only the prior message remains
    expect(store.length).toBe(1);
    expect(store.getMutableRef()[0].content).toBe('prior context');
  });

  it('escape-path rollback skips when assistant already partially responded', () => {
    const store = new ConversationStore();
    const token = store.beginTurn();
    const idx = store.commitTurnUserMessage('input');
    store.getMutableRef().push({ role: 'assistant', content: 'partial' });

    // Simulate escape after partial response
    expect(store.rollbackTurnUserMessage(idx)).toBe(false);
    store.endTurn(token);

    // Both messages preserved
    expect(store.length).toBe(2);
  });

  it('commitTurnUserMessage preserves index across prior messages', () => {
    const store = new ConversationStore();
    store.addUserMessage('first');
    store.addUserMessage('second');
    const token = store.beginTurn();
    const idx = store.commitTurnUserMessage('third');
    expect(idx).toBe(2);

    // Rollback only removes the committed message
    expect(store.rollbackTurnUserMessage(idx)).toBe(true);
    expect(store.length).toBe(2);
    expect(store.getMutableRef()[1].content).toBe('second');
    store.endTurn(token);
  });

  it('double-rollback (Escape + catch) does not double-delete', () => {
    const store = new ConversationStore();
    store.addUserMessage('prior context');
    const token = store.beginTurn();
    const idx = store.commitTurnUserMessage('will cancel');
    expect(store.length).toBe(2);

    // Simulate Escape handler: first rollback succeeds
    expect(store.rollbackTurnUserMessage(idx)).toBe(true);
    expect(store.length).toBe(1);

    // Simulate catch block: second rollback is a no-op (message already removed)
    expect(store.rollbackTurnUserMessage(idx)).toBe(false);
    expect(store.length).toBe(1);
    expect(store.getMutableRef()[0].content).toBe('prior context');

    store.endTurn(token);
  });

  it('addUserMessage throws during active turn', () => {
    const store = new ConversationStore();
    store.addUserMessage('before turn');
    expect(store.length).toBe(1);

    const token = store.beginTurn();
    expect(() => store.addUserMessage('mid-turn')).toThrow('Cannot add a user message while a turn is in progress');
    expect(store.length).toBe(1); // unchanged

    store.endTurn(token);
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

    const token = store.beginTurn();
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
      store.endTurn(token);
    }

    // Store must be unlocked after finally cleanup
    expect(store.turnActive).toBe(false);
    // Can begin a new turn without error
    const t2 = store.beginTurn();
    expect(t2).toBeGreaterThan(token);
    store.endTurn(t2);
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
    const token = store.beginTurn();

    // Attempting to clear mid-turn must throw
    expect(() => store.clear()).toThrow('Cannot clear conversation while a turn is in progress');

    // History must be intact
    expect(store.length).toBe(1);
    expect(store.getMutableRef()[0].content).toBe('important context');

    // After ending the turn, clear works
    store.endTurn(token);
    store.clear();
    expect(store.length).toBe(0);
  });

  it('stale finally from aborted turn A cannot unlock turn B (race)', async () => {
    const store = new ConversationStore();
    store.addUserMessage('hello');

    const abortA = new AbortController();
    const engineA = new ChatEngine();

    // Turn A: provider that stalls so we can abort mid-stream
    let turnASettled = false;
    const providerA: AIProvider = {
      name: 'mock',
      model: 'mock-model',
      formatTools: (tools) => tools,
      async *stream() {
        yield { type: 'text_delta' as const, text: 'A partial' };
        abortA.abort();
        yield { type: 'done' as const, stopReason: 'end_turn' as const, usage: { input_tokens: 1, output_tokens: 1 } };
      },
    };

    // Start turn A
    const tokenA = store.beginTurn();

    await handleTurn(
      providerA,
      store.getMutableRef(),
      [],
      [{ type: 'text', text: 'sys' }],
      session,
      {},
      null,
      true,
      engineA,
      abortA.signal,
    );
    turnASettled = true;

    // Simulate escape handler ending turn A with correct token
    store.endTurn(tokenA);
    expect(store.turnActive).toBe(false);

    // Start turn B immediately
    const tokenB = store.beginTurn();
    expect(store.turnActive).toBe(true);

    // Stale finally from turn A tries to end the turn — must be a no-op
    store.endTurn(tokenA);
    expect(store.turnActive).toBe(true); // turn B still active

    // Turn B completes normally
    const engineB = new ChatEngine();
    const providerB = createMockProvider([
      [
        { type: 'text_delta', text: 'B response' },
        { type: 'done', stopReason: 'end_turn', usage: { input_tokens: 2, output_tokens: 2 } },
      ],
    ]);

    await handleTurn(
      providerB,
      store.getMutableRef(),
      [],
      [{ type: 'text', text: 'sys' }],
      session,
      {},
      null,
      true,
      engineB,
    );

    // End turn B with correct token
    store.endTurn(tokenB);
    expect(store.turnActive).toBe(false);
    expect(turnASettled).toBe(true);

    // Store is fully unlocked — can clear
    expect(() => store.clear()).not.toThrow();
  });
});
