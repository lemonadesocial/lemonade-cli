import { describe, it, expect, vi } from 'vitest';
import {
  computeIndexAdjustments,
  applyIndexAdjustments,
  removeMessageUpdater,
  type UIMessage,
} from '../../../../src/chat/ui/hooks/useChatEngine';

function makeMessages(...specs: Array<{ role: UIMessage['role']; content: string; msgId?: string }>): UIMessage[] {
  return specs.map((s) => ({ role: s.role, content: s.content, msgId: s.msgId }));
}

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

describe('removeMessageUpdater', () => {
  it('removes a user message and mutates turnIndex', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'hello', msgId: 'u1' },
      { role: 'assistant', content: 'hi' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 1]]);

    const result = removeMessageUpdater(msgs, 'u1', turnIndex, false);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('assistant');
    expect(result.didMutateIndex).toBe(true);
    expect(turnIndex.get('turn-a')).toBe(0);
  });

  it('returns prev unchanged when msgId is not found', () => {
    const msgs = makeMessages({ role: 'user', content: 'hello', msgId: 'u1' });
    const turnIndex = new Map<string, number>();

    const result = removeMessageUpdater(msgs, 'nonexistent', turnIndex, false);

    expect(result.messages).toBe(msgs);
    expect(result.didMutateIndex).toBe(false);
  });

  it('skips turnIndex mutation when alreadyMutatedIndex is true', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 1]]);

    const result = removeMessageUpdater(msgs, 'u1', turnIndex, true);

    expect(result.messages).toHaveLength(1);
    expect(result.didMutateIndex).toBe(false);
    // turnIndex was NOT mutated
    expect(turnIndex.get('turn-a')).toBe(1);
  });

  it('corruption path: appends system warning and does not mutate turnIndex', () => {
    const msgs = makeMessages(
      { role: 'assistant', content: 'wrong role', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 1]]);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = removeMessageUpdater(msgs, 'u1', turnIndex, false);

    expect(result.messages).toHaveLength(3);
    expect(result.messages[2].role).toBe('system');
    expect(result.messages[2].content).toContain('state corruption');
    expect(result.messages[2].content).toContain('role "assistant"');
    expect(result.didMutateIndex).toBe(false);
    expect(turnIndex.get('turn-a')).toBe(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('corruption path: original messages array is not mutated', () => {
    const msgs = makeMessages({ role: 'assistant', content: 'bad', msgId: 'u1' });
    const originalLength = msgs.length;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = removeMessageUpdater(msgs, 'u1', new Map(), false);

    expect(msgs).toHaveLength(originalLength);
    expect(result.messages).not.toBe(msgs);
    consoleSpy.mockRestore();
  });

  it('shifts multiple turn indices correctly on removal', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q1', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'assistant', content: 'btw-a1' },
      { role: 'assistant', content: 'a3' },
    );
    const turnIndex = new Map<string, number>([
      ['t1', 1],
      ['t2', 2],
      ['t3', 3],
    ]);

    removeMessageUpdater(msgs, 'u1', turnIndex, false);

    expect(turnIndex.get('t1')).toBe(0);
    expect(turnIndex.get('t2')).toBe(1);
    expect(turnIndex.get('t3')).toBe(2);
  });
});

describe('removeMessageUpdater — React StrictMode double-invocation', () => {
  it('corruption path: both invocations produce identical results (deterministic warning)', () => {
    // Under StrictMode, React calls the updater twice with the same prev.
    // Both must return [...prev, warning] — React keeps the second, yielding exactly one warning.
    const msgs = makeMessages(
      { role: 'assistant', content: 'wrong role', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 1]]);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate StrictMode: call twice with same prev
    const r1 = removeMessageUpdater(msgs, 'u1', turnIndex, false);
    const r2 = removeMessageUpdater(msgs, 'u1', turnIndex, false);

    // Both produce identical output — the warning is always present
    expect(r1.messages).toEqual(r2.messages);
    expect(r1.messages).toHaveLength(3);
    expect(r2.messages).toHaveLength(3);
    expect(r1.messages[2].role).toBe('system');
    expect(r2.messages[2].role).toBe('system');

    // Neither mutated turnIndex
    expect(r1.didMutateIndex).toBe(false);
    expect(r2.didMutateIndex).toBe(false);
    expect(turnIndex.get('turn-a')).toBe(1);

    // console.error fires on each call (acceptable StrictMode dev noise)
    expect(consoleSpy).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });

  it('normal path: refMutated flag prevents double index mutation', () => {
    // Simulates the exact removeMessageById closure pattern:
    // let refMutated = false;
    // setMessages((prev) => {
    //   const result = removeMessageUpdater(prev, id, turnIndex, refMutated);
    //   if (result.didMutateIndex) refMutated = true;
    //   return result.messages;
    // });
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

    // Simulate the closure exactly as the hook does it
    let refMutated = false;
    const updater = (prev: UIMessage[]) => {
      const result = removeMessageUpdater(prev, 'u1', turnIndex, refMutated);
      if (result.didMutateIndex) refMutated = true;
      return result.messages;
    };

    // Call 1 (StrictMode — React may discard)
    const result1 = updater(msgs);
    // Call 2 (StrictMode — React keeps)
    const result2 = updater(msgs);

    // Both return same logical result
    expect(result1).toEqual(result2);
    expect(result2).toHaveLength(3);

    // turnIndex mutated exactly once
    expect(turnIndex.get('turn-a')).toBe(0);
    expect(turnIndex.get('turn-b')).toBe(2);
  });

  it('corruption path has no stale suppression — warning always appears after clear', () => {
    // Verifies Finding 1: no corruptionWarned ref means no stale suppression.
    // After a "clear" (new state), a fresh corruption event still produces a warning.
    const msgs1 = makeMessages({ role: 'assistant', content: 'bad', msgId: 'u1' });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First corruption
    const r1 = removeMessageUpdater(msgs1, 'u1', new Map(), false);
    expect(r1.messages).toHaveLength(2);
    expect(r1.messages[1].role).toBe('system');

    // Simulate clear (caller sets messages to []) + new messages arrive
    const msgs2 = makeMessages({ role: 'assistant', content: 'bad again', msgId: 'u1' });

    // Second corruption with same msgId — still produces warning (no stale suppression)
    const r2 = removeMessageUpdater(msgs2, 'u1', new Map(), false);
    expect(r2.messages).toHaveLength(2);
    expect(r2.messages[1].role).toBe('system');

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    consoleSpy.mockRestore();
  });
});

describe('removeMessageUpdater — rollback sequence alignment', () => {
  it('UI removal after store rollback keeps both surfaces aligned', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'prior', msgId: 'u1' },
      { role: 'assistant', content: 'response' },
      { role: 'user', content: 'will-cancel', msgId: 'u2' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 1]]);

    const result = removeMessageUpdater(msgs, 'u2', turnIndex, false);

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('prior');
    expect(result.messages[1].content).toBe('response');
    expect(turnIndex.get('turn-a')).toBe(1);
  });

  it('in-place adjustment preserves concurrent writes to turnMessageIndex', () => {
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

    // Concurrent write between setMessages call and updater execution
    turnIndex.set('btw-concurrent', 4);

    removeMessageUpdater(msgs, 'u1', turnIndex, false);

    expect(turnIndex.get('turn-a')).toBe(0);
    expect(turnIndex.get('turn-b')).toBe(2);
    expect(turnIndex.get('btw-concurrent')).toBe(3);
    expect(turnIndex.size).toBe(3);
  });

  it('removal with active turn indices adjusts all affected entries', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q1', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'assistant', content: 'btw-a1' },
      { role: 'user', content: 'q2', msgId: 'u2' },
      { role: 'assistant', content: 'a2' },
      { role: 'assistant', content: 'btw-a2' },
    );
    const turnIndex = new Map<string, number>([
      ['turn-main', 1],
      ['btw-1', 2],
      ['turn-main-2', 4],
      ['btw-2', 5],
    ]);

    removeMessageUpdater(msgs, 'u2', turnIndex, false);

    expect(turnIndex.get('turn-main')).toBe(1);
    expect(turnIndex.get('btw-1')).toBe(2);
    expect(turnIndex.get('turn-main-2')).toBe(3);
    expect(turnIndex.get('btw-2')).toBe(4);
  });

  it('double rollback attempt (Escape + catch) is safe', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'prior', msgId: 'u1' },
      { role: 'user', content: 'will-cancel', msgId: 'u2' },
    );
    const turnIndex = new Map<string, number>();

    // First removal (Escape handler) — succeeds
    const r1 = removeMessageUpdater(msgs, 'u2', turnIndex, false);
    expect(r1.messages).toHaveLength(1);

    // Second removal (catch block) — u2 no longer exists in reduced array
    const r2 = removeMessageUpdater(r1.messages, 'u2', turnIndex, false);
    expect(r2.messages).toBe(r1.messages); // same reference — no-op
    expect(r2.didMutateIndex).toBe(false);
  });
});
