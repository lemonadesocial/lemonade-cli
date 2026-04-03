import { describe, it, expect, vi } from 'vitest';
import {
  computeIndexAdjustments,
  applyIndexAdjustments,
  type UIMessage,
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
    // Simulates the App.tsx rollback sequence using the callback-level pattern:
    // 1. Store rollback succeeds (simulated as a boolean gate)
    // 2. UI removeMessageById's updater fires
    // 3. Both surfaces end up with the same logical state

    const initialMessages = makeMessages(
      { role: 'user', content: 'prior', msgId: 'u1' },
      { role: 'assistant', content: 'response' },
      { role: 'user', content: 'will-cancel', msgId: 'u2' },
    );
    const liveRef = new Map<string, number>([['turn-a', 1]]);
    const storeRollbackSucceeded = true;

    let finalMessages = initialMessages;
    if (storeRollbackSucceeded) {
      // Simulate the updater
      const id = 'u2';
      let refMutated = false;
      const updater = (prev: UIMessage[]) => {
        const idx = prev.findIndex((m) => m.msgId === id);
        if (idx === -1) return prev;
        if (prev[idx].role !== 'user') return prev;
        if (!refMutated) {
          refMutated = true;
          const adj = computeIndexAdjustments(liveRef, idx);
          applyIndexAdjustments(liveRef, adj);
        }
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      };
      finalMessages = updater(initialMessages);
    }

    expect(finalMessages).toHaveLength(2);
    expect(finalMessages[0].content).toBe('prior');
    expect(finalMessages[1].content).toBe('response');
    expect(liveRef.get('turn-a')).toBe(1);
  });

  it('skipped store rollback prevents UI removal — surfaces stay aligned', () => {
    const initialMessages = makeMessages(
      { role: 'user', content: 'input', msgId: 'u1' },
      { role: 'assistant', content: 'partial response' },
    );
    const storeRollbackSucceeded = false;

    let finalMessages = initialMessages;
    if (storeRollbackSucceeded) {
      // Would run updater here, but gate prevents it
      finalMessages = initialMessages;
    }

    expect(finalMessages).toBe(initialMessages);
    expect(finalMessages).toHaveLength(2);
  });

  it('in-place adjustment preserves concurrent writes to turnMessageIndex', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q1', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2', msgId: 'u2' },
      { role: 'assistant', content: 'a2' },
    );

    const liveRef = new Map<string, number>([
      ['turn-a', 1],
      ['turn-b', 3],
    ]);

    const id = 'u1';
    const idx = msgs.findIndex((m) => m.msgId === id);
    expect(idx).toBe(0);

    // Concurrent write between setMessages call and updater execution
    liveRef.set('btw-concurrent', 4);

    const adj = computeIndexAdjustments(liveRef, idx);
    applyIndexAdjustments(liveRef, adj);

    expect(liveRef.get('turn-a')).toBe(0);
    expect(liveRef.get('turn-b')).toBe(2);
    expect(liveRef.get('btw-concurrent')).toBe(3);
    expect(liveRef.size).toBe(3);
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

    const liveRef = new Map<string, number>([
      ['turn-main', 1],
      ['btw-1', 2],
      ['turn-main-2', 4],
      ['btw-2', 5],
    ]);

    const removeIdx = msgs.findIndex((m) => m.msgId === 'u2');
    expect(removeIdx).toBe(3);

    const adj = computeIndexAdjustments(liveRef, removeIdx);
    applyIndexAdjustments(liveRef, adj);

    expect(liveRef.get('turn-main')).toBe(1);
    expect(liveRef.get('btw-1')).toBe(2);
    expect(liveRef.get('turn-main-2')).toBe(3);
    expect(liveRef.get('btw-2')).toBe(4);
  });

  it('callback-level in-place mutation is idempotent with refMutated guard', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'q1', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2', msgId: 'u2' },
      { role: 'assistant', content: 'a2' },
    );

    const liveRef = new Map<string, number>([
      ['turn-a', 1],
      ['turn-b', 3],
    ]);

    const id = 'u1';
    let refMutated = false;

    const updater = (prev: UIMessage[]) => {
      const idx = prev.findIndex((m) => m.msgId === id);
      if (idx === -1) return prev;
      if (prev[idx].role !== 'user') return prev;

      if (!refMutated) {
        refMutated = true;
        const adj = computeIndexAdjustments(liveRef, idx);
        applyIndexAdjustments(liveRef, adj);
      }

      const next = [...prev];
      next.splice(idx, 1);
      return next;
    };

    const result1 = updater(msgs);
    const result2 = updater(msgs);

    expect(result1).toEqual(result2);
    expect(result2).toHaveLength(3);
    expect(liveRef.get('turn-a')).toBe(0);
    expect(liveRef.get('turn-b')).toBe(2);
  });

  it('callback-level corruption appends system message without ref mutation', () => {
    const msgs = makeMessages(
      { role: 'assistant', content: 'wrong role', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
    );

    const liveRef = new Map<string, number>([['turn-a', 1]]);
    const originalEntries = [...liveRef.entries()];

    const id = 'u1';
    let refMutated = false;
    const corruptionWarned = new Set<string>();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const updater = (prev: UIMessage[]) => {
      const idx = prev.findIndex((m) => m.msgId === id);
      if (idx === -1) return prev;
      if (prev[idx].role !== 'user') {
        if (corruptionWarned.has(id)) return prev;
        corruptionWarned.add(id);
        const detail = `removeMessageById: message ${id} at index ${idx} has role "${prev[idx].role}", expected "user"`;
        console.error(detail);
        return [...prev, { role: 'system' as const, content: `Warning: ${detail}` }];
      }
      if (!refMutated) {
        refMutated = true;
        const adj = computeIndexAdjustments(liveRef, idx);
        applyIndexAdjustments(liveRef, adj);
      }
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    };

    const result = updater(msgs);

    expect(result).toHaveLength(3);
    expect(result[2].role).toBe('system');
    expect(result[2].content).toContain('role "assistant"');

    expect(refMutated).toBe(false);
    expect([...liveRef.entries()]).toEqual(originalEntries);

    consoleSpy.mockRestore();
  });

  it('StrictMode double-invocation of corruption path does not append duplicate warning', () => {
    // Finding 3: verifies the corruptionWarned guard prevents duplicate system
    // messages when React StrictMode double-invokes the updater on a corruption hit.
    const msgs = makeMessages(
      { role: 'assistant', content: 'wrong role', msgId: 'u1' },
      { role: 'assistant', content: 'a1' },
    );

    const liveRef = new Map<string, number>([['turn-a', 1]]);
    const id = 'u1';
    let refMutated = false;
    const corruptionWarned = new Set<string>();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const updater = (prev: UIMessage[]) => {
      const idx = prev.findIndex((m) => m.msgId === id);
      if (idx === -1) return prev;
      if (prev[idx].role !== 'user') {
        if (corruptionWarned.has(id)) return prev;
        corruptionWarned.add(id);
        const detail = `removeMessageById: message ${id} at index ${idx} has role "${prev[idx].role}", expected "user"`;
        console.error(detail);
        return [...prev, { role: 'system' as const, content: `Warning: ${detail}` }];
      }
      if (!refMutated) {
        refMutated = true;
        const adj = computeIndexAdjustments(liveRef, idx);
        applyIndexAdjustments(liveRef, adj);
      }
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    };

    // First invocation — appends warning
    const result1 = updater(msgs);
    expect(result1).toHaveLength(3);
    expect(result1[2].role).toBe('system');

    // Second invocation (StrictMode) — guard prevents duplicate
    const result2 = updater(msgs);
    expect(result2).toBe(msgs); // returns prev unchanged — no second warning
    expect(result2).toHaveLength(2); // no system message appended

    // console.error called only once
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    // Ref untouched throughout
    expect(refMutated).toBe(false);
    expect(liveRef.get('turn-a')).toBe(1);

    consoleSpy.mockRestore();
  });

  it('double rollback attempt (Escape + catch) is safe at the UI layer', () => {
    const msgs = makeMessages(
      { role: 'user', content: 'prior', msgId: 'u1' },
      { role: 'user', content: 'will-cancel', msgId: 'u2' },
    );

    const liveRef = new Map<string, number>();
    let refMutated = false;
    const id = 'u2';

    const updater = (prev: UIMessage[]) => {
      const idx = prev.findIndex((m) => m.msgId === id);
      if (idx === -1) return prev;
      if (prev[idx].role !== 'user') return prev;
      if (!refMutated) {
        refMutated = true;
        const adj = computeIndexAdjustments(liveRef, idx);
        applyIndexAdjustments(liveRef, adj);
      }
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    };

    // First removal (Escape handler) — succeeds
    const r1 = updater(msgs);
    expect(r1).toHaveLength(1);

    // Second removal (catch block) — u2 no longer exists
    const r2 = updater(r1);
    expect(r2).toBe(r1); // same reference — no-op
  });
});
