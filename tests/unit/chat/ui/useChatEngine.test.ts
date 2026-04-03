import { describe, it, expect, vi } from 'vitest';
import {
  computeIndexAdjustments,
  applyIndexAdjustments,
  removeMessageByIdUpdater,
  type UIMessage,
  type RemoveMessageResult,
} from '../../../../src/chat/ui/hooks/useChatEngine';

describe('computeIndexAdjustments', () => {
  it('returns empty when the map is empty', () => {
    const map = new Map<string, number>();
    const result = computeIndexAdjustments(map, 0);
    expect(result.updates).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  it('shifts indices above the removed position down by one', () => {
    const map = new Map<string, number>([
      ['turn-a', 3],
      ['turn-b', 5],
    ]);
    const result = computeIndexAdjustments(map, 2);
    expect(result.updates).toEqual([
      ['turn-a', 2],
      ['turn-b', 4],
    ]);
    expect(result.deletes).toEqual([]);
  });

  it('marks entries at the removed position for deletion', () => {
    const map = new Map<string, number>([
      ['turn-a', 2],
      ['turn-b', 5],
    ]);
    const result = computeIndexAdjustments(map, 2);
    expect(result.updates).toEqual([['turn-b', 4]]);
    expect(result.deletes).toEqual(['turn-a']);
  });

  it('leaves indices below the removed position untouched', () => {
    const map = new Map<string, number>([
      ['turn-a', 0],
      ['turn-b', 1],
    ]);
    const result = computeIndexAdjustments(map, 3);
    expect(result.updates).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  it('handles mixed above/below/equal positions', () => {
    const map = new Map<string, number>([
      ['below', 1],
      ['equal', 3],
      ['above', 5],
    ]);
    const result = computeIndexAdjustments(map, 3);
    // 'below' (1) — untouched
    // 'equal' (3) — deleted
    // 'above' (5) — shifted to 4
    expect(result.updates).toEqual([['above', 4]]);
    expect(result.deletes).toEqual(['equal']);
  });

  it('handles removal at index 0', () => {
    const map = new Map<string, number>([
      ['at-zero', 0],
      ['after', 2],
    ]);
    const result = computeIndexAdjustments(map, 0);
    expect(result.updates).toEqual([['after', 1]]);
    expect(result.deletes).toEqual(['at-zero']);
  });

  it('multiple entries above are all shifted', () => {
    const map = new Map<string, number>([
      ['a', 4],
      ['b', 7],
      ['c', 10],
    ]);
    const result = computeIndexAdjustments(map, 3);
    expect(result.updates).toEqual([
      ['a', 3],
      ['b', 6],
      ['c', 9],
    ]);
    expect(result.deletes).toEqual([]);
  });
});

describe('removeMessageByIdUpdater', () => {
  function makeMessages(...specs: Array<{ role: UIMessage['role']; content: string; msgId?: string }>): UIMessage[] {
    return specs.map((s) => ({ role: s.role, content: s.content, msgId: s.msgId }));
  }

  it('removes a user message by msgId and returns new array', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'hello', msgId: 'u1' },
      { role: 'assistant', content: 'hi' },
    );
    const turnIndex = new Map<string, number>();
    const result = removeMessageByIdUpdater(msgs, 'u1', turnIndex);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('assistant');
    expect(result.corruption).toBeNull();
  });

  it('returns prev unchanged when msgId is not found', () => {
    const msgs = makeMessages({ role: 'user', content: 'hello', msgId: 'u1' });
    const turnIndex = new Map<string, number>();
    const result = removeMessageByIdUpdater(msgs, 'nonexistent', turnIndex);
    expect(result.messages).toBe(msgs); // same reference — no-op
    expect(result.newTurnIndex).toBeNull();
    expect(result.corruption).toBeNull();
  });

  it('returns corruption detail on role mismatch — does not crash or mutate', () => {
    const msgs = makeMessages({ role: 'assistant', content: 'oops', msgId: 'u1' });
    const turnIndex = new Map<string, number>([['t1', 0]]);
    const result = removeMessageByIdUpdater(msgs, 'u1', turnIndex);
    expect(result.messages).toBe(msgs);
    expect(result.newTurnIndex).toBeNull();
    expect(result.corruption).toContain('state corruption');
    expect(result.corruption).toContain('role "assistant"');
    // Original turnIndex must not have been mutated
    expect(turnIndex.get('t1')).toBe(0);
    expect(turnIndex.size).toBe(1);
  });

  it('returns a new turnIndex map — does not mutate the input snapshot', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q1', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2', msgId: 'u2' },
      { role: 'assistant', content: 'a2' },
    );
    const turnIndex = new Map<string, number>([
      ['turn-a', 1],
      ['turn-b', 3],
    ]);
    // Freeze the original for verification
    const originalEntries = [...turnIndex.entries()];

    const result = removeMessageByIdUpdater(msgs, 'u2', turnIndex);

    expect(result.messages).toHaveLength(3);
    expect(result.newTurnIndex).not.toBeNull();
    // New map has correct shifted values
    expect(result.newTurnIndex!.get('turn-a')).toBe(1); // below removed idx 2 — unchanged
    expect(result.newTurnIndex!.get('turn-b')).toBe(2); // above removed idx 2 — shifted
    // Original turnIndex must NOT have been mutated
    expect([...turnIndex.entries()]).toEqual(originalEntries);
  });

  it('leaves entries below removed index untouched in new map', () => {
    const msgs = makeMessages(
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q1', msgId: 'u1' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 0]]);

    const result = removeMessageByIdUpdater(msgs, 'u1', turnIndex);

    expect(result.messages).toHaveLength(1);
    expect(result.newTurnIndex!.get('turn-a')).toBe(0);
  });

  it('handles removal when multiple turn indices need shifting', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'assistant', content: 'a2' },
      { role: 'assistant', content: 'a3' },
    );
    const turnIndex = new Map<string, number>([
      ['t1', 1],
      ['t2', 2],
      ['t3', 3],
    ]);

    const result = removeMessageByIdUpdater(msgs, 'u1', turnIndex);

    expect(result.newTurnIndex!.get('t1')).toBe(0);
    expect(result.newTurnIndex!.get('t2')).toBe(1);
    expect(result.newTurnIndex!.get('t3')).toBe(2);
  });

  it('returns null newTurnIndex on no-op (message not found)', () => {
    const msgs = makeMessages({ role: 'user', content: 'q', msgId: 'u1' });
    const turnIndex = new Map<string, number>([['t1', 0]]);

    const result = removeMessageByIdUpdater(msgs, 'missing', turnIndex);

    expect(result.newTurnIndex).toBeNull();
    expect(result.messages).toBe(msgs);
  });

  it('returns null newTurnIndex on corruption bail-out', () => {
    const msgs = makeMessages({ role: 'assistant', content: 'bad', msgId: 'u1' });
    const turnIndex = new Map<string, number>([['t1', 0]]);

    const result = removeMessageByIdUpdater(msgs, 'u1', turnIndex);

    expect(result.newTurnIndex).toBeNull();
    expect(result.corruption).not.toBeNull();
    // Input map untouched
    expect(turnIndex.get('t1')).toBe(0);
    expect(turnIndex.size).toBe(1);
  });
});

describe('removeMessageByIdUpdater — React double-invocation idempotency', () => {
  function makeMessages(...specs: Array<{ role: UIMessage['role']; content: string; msgId?: string }>): UIMessage[] {
    return specs.map((s) => ({ role: s.role, content: s.content, msgId: s.msgId }));
  }

  it('calling twice with the same prev and snapshot produces identical results', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q1', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2', msgId: 'u2' },
      { role: 'assistant', content: 'a2' },
    );
    const snapshot = new Map<string, number>([
      ['turn-a', 1],
      ['turn-b', 3],
    ]);

    // Simulate React StrictMode: call updater twice with same prev
    const result1 = removeMessageByIdUpdater(msgs, 'u2', snapshot);
    const result2 = removeMessageByIdUpdater(msgs, 'u2', snapshot);

    // Both calls must produce identical output
    expect(result1.messages).toEqual(result2.messages);
    expect(result1.messages).not.toBe(msgs); // new array, not prev
    expect(result1.newTurnIndex).toEqual(result2.newTurnIndex);
    expect(result1.corruption).toBe(result2.corruption);

    // The snapshot itself must be untouched after both calls
    expect(snapshot.get('turn-a')).toBe(1);
    expect(snapshot.get('turn-b')).toBe(3);
  });

  it('double invocation does not double-shift turn indices', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'assistant', content: 'a2' },
    );
    const snapshot = new Map<string, number>([
      ['t1', 1],
      ['t2', 2],
    ]);

    // First invocation
    const r1 = removeMessageByIdUpdater(msgs, 'u1', snapshot);
    // Second invocation with same inputs
    const r2 = removeMessageByIdUpdater(msgs, 'u1', snapshot);

    // Both must shift by exactly 1, not 2
    expect(r1.newTurnIndex!.get('t1')).toBe(0);
    expect(r1.newTurnIndex!.get('t2')).toBe(1);
    expect(r2.newTurnIndex!.get('t1')).toBe(0);
    expect(r2.newTurnIndex!.get('t2')).toBe(1);
  });

  it('simulated React double-invoke + single ref assignment yields correct state', () => {
    // End-to-end simulation of the removeMessageById callback pattern:
    // 1. Take a snapshot of turnMessageIndex.current
    // 2. React calls updater twice (StrictMode)
    // 3. Apply newTurnIndex to ref exactly once
    const msgs = makeMessages(
      { role: 'user', content: 'q1', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2', msgId: 'u2' },
      { role: 'assistant', content: 'a2' },
    );

    // Simulated ref
    let turnIndexRef = new Map<string, number>([
      ['turn-a', 1],
      ['turn-b', 3],
    ]);
    const snapshot = new Map(turnIndexRef);

    // React calls updater twice, keeps last result
    let computed: RemoveMessageResult | null = null;
    const updater = (prev: UIMessage[]) => {
      const result = removeMessageByIdUpdater(prev, 'u2', snapshot);
      computed = result;
      return result.messages;
    };
    updater(msgs); // first call (discarded)
    const finalMessages = updater(msgs); // second call (kept)

    // Apply ref update exactly once
    if (computed!.newTurnIndex !== null) {
      turnIndexRef = computed!.newTurnIndex;
    }

    // Verify final state is correct
    expect(finalMessages).toHaveLength(3);
    expect(turnIndexRef.get('turn-a')).toBe(1); // unchanged (below idx 2)
    expect(turnIndexRef.get('turn-b')).toBe(2); // shifted once (was 3, removed at 2)
    expect(turnIndexRef.size).toBe(2);
  });

  it('corruption result is idempotent across double invocation', () => {
    const msgs = makeMessages({ role: 'assistant', content: 'wrong', msgId: 'u1' });
    const snapshot = new Map<string, number>([['t1', 0]]);

    const r1 = removeMessageByIdUpdater(msgs, 'u1', snapshot);
    const r2 = removeMessageByIdUpdater(msgs, 'u1', snapshot);

    expect(r1.corruption).toBe(r2.corruption);
    expect(r1.messages).toBe(r2.messages); // both return same prev ref
    expect(r1.newTurnIndex).toBeNull();
    expect(r2.newTurnIndex).toBeNull();
  });
});

describe('applyIndexAdjustments', () => {
  it('applies updates and deletes to a mutable map', () => {
    const map = new Map<string, number>([
      ['a', 1],
      ['b', 3],
      ['c', 5],
    ]);
    applyIndexAdjustments(map, {
      updates: [['b', 2], ['c', 4]],
      deletes: ['a'],
    });
    expect(map.has('a')).toBe(false);
    expect(map.get('b')).toBe(2);
    expect(map.get('c')).toBe(4);
  });

  it('is a no-op with empty adjustments', () => {
    const map = new Map<string, number>([['x', 7]]);
    applyIndexAdjustments(map, { updates: [], deletes: [] });
    expect(map.get('x')).toBe(7);
    expect(map.size).toBe(1);
  });
});

describe('removeMessageById — rollback sequence alignment', () => {
  function makeMessages(...specs: Array<{ role: UIMessage['role']; content: string; msgId?: string }>): UIMessage[] {
    return specs.map((s) => ({ role: s.role, content: s.content, msgId: s.msgId }));
  }

  it('UI removal after store rollback keeps both surfaces aligned', () => {
    // Integration-style test: simulates the App.tsx rollback sequence
    // 1. Store rollback succeeds (simulated as a boolean gate)
    // 2. UI removeMessageById fires
    // 3. Both surfaces end up with the same logical state

    const initialMessages = makeMessages(
      { role: 'user', content: 'prior', msgId: 'u1' },
      { role: 'assistant', content: 'response' },
      { role: 'user', content: 'will-cancel', msgId: 'u2' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 1]]);

    // Step 1: Store rollback succeeds (gate)
    const storeRollbackSucceeded = true;

    // Step 2: UI removal (only if store rollback succeeded)
    let finalMessages = initialMessages;
    let finalTurnIndex = turnIndex;
    if (storeRollbackSucceeded) {
      const snapshot = new Map(turnIndex);
      const result = removeMessageByIdUpdater(initialMessages, 'u2', snapshot);
      finalMessages = result.messages;
      if (result.newTurnIndex) finalTurnIndex = result.newTurnIndex;
    }

    // Step 3: Both surfaces aligned
    // Store would have 2 messages (prior + response), UI matches
    expect(finalMessages).toHaveLength(2);
    expect(finalMessages[0].content).toBe('prior');
    expect(finalMessages[1].content).toBe('response');
    // Turn index correctly points to the assistant message
    expect(finalTurnIndex.get('turn-a')).toBe(1);
  });

  it('skipped store rollback prevents UI removal — surfaces stay aligned', () => {
    const initialMessages = makeMessages(
      { role: 'user', content: 'input', msgId: 'u1' },
      { role: 'assistant', content: 'partial response' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 1]]);

    // Store rollback failed (assistant already replied)
    const storeRollbackSucceeded = false;

    let finalMessages = initialMessages;
    if (storeRollbackSucceeded) {
      const snapshot = new Map(turnIndex);
      const result = removeMessageByIdUpdater(initialMessages, 'u1', snapshot);
      finalMessages = result.messages;
    }

    // UI unchanged — both surfaces still have user + assistant
    expect(finalMessages).toBe(initialMessages);
    expect(finalMessages).toHaveLength(2);
  });

  it('double rollback attempt (Escape + catch) is safe at the UI layer', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'prior', msgId: 'u1' },
      { role: 'user', content: 'will-cancel', msgId: 'u2' },
    );
    const turnIndex = new Map<string, number>();

    // First removal (Escape handler) — succeeds
    const snapshot1 = new Map(turnIndex);
    const r1 = removeMessageByIdUpdater(msgs, 'u2', snapshot1);
    expect(r1.messages).toHaveLength(1);

    // Second removal (catch block) — u2 no longer exists in the reduced array
    const snapshot2 = new Map(turnIndex);
    const r2 = removeMessageByIdUpdater(r1.messages, 'u2', snapshot2);
    expect(r2.messages).toBe(r1.messages); // same reference — no-op
    expect(r2.newTurnIndex).toBeNull();
    expect(r2.corruption).toBeNull();
  });
});
