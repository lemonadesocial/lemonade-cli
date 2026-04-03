import { describe, it, expect, vi } from 'vitest';
import { computeIndexAdjustments, removeMessageByIdUpdater, type UIMessage } from '../../../../src/chat/ui/hooks/useChatEngine';

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
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('assistant');
  });

  it('returns prev unchanged when msgId is not found', () => {
    const msgs = makeMessages({ role: 'user', content: 'hello', msgId: 'u1' });
    const turnIndex = new Map<string, number>();
    const result = removeMessageByIdUpdater(msgs, 'nonexistent', turnIndex);
    expect(result).toBe(msgs); // same reference — no-op
  });

  it('does not crash on role mismatch — logs error and returns prev', () => {
    const msgs = makeMessages({ role: 'assistant', content: 'oops', msgId: 'u1' });
    const turnIndex = new Map<string, number>();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = removeMessageByIdUpdater(msgs, 'u1', turnIndex);
    expect(result).toBe(msgs);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('possible state corruption');
    spy.mockRestore();
  });

  it('adjusts turnMessageIndex atomically — shifts entries above removed index', () => {
    // Messages: [user(0), assistant(1), user(2), assistant(3)]
    // Remove user at index 2 → assistant at 3 should shift to 2
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

    const result = removeMessageByIdUpdater(msgs, 'u2', turnIndex);

    expect(result).toHaveLength(3);
    // turn-a at index 1 is below removed index 2 — unchanged
    expect(turnIndex.get('turn-a')).toBe(1);
    // turn-b at index 3 is above removed index 2 — shifted to 2
    expect(turnIndex.get('turn-b')).toBe(2);
  });

  it('adjusts turnMessageIndex atomically — leaves entries below removed index untouched', () => {
    const msgs = makeMessages(
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q1', msgId: 'u1' },
    );
    const turnIndex = new Map<string, number>([['turn-a', 0]]);

    const result = removeMessageByIdUpdater(msgs, 'u1', turnIndex);

    expect(result).toHaveLength(1);
    expect(turnIndex.get('turn-a')).toBe(0);
  });

  it('handles removal when multiple turn indices need shifting', () => {
    // [user(0,msgId=u1), assistant(1), assistant(2), assistant(3)]
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

    removeMessageByIdUpdater(msgs, 'u1', turnIndex);

    expect(turnIndex.get('t1')).toBe(0);
    expect(turnIndex.get('t2')).toBe(1);
    expect(turnIndex.get('t3')).toBe(2);
  });

  it('does not mutate turnIndex on no-op (message not found)', () => {
    const msgs = makeMessages({ role: 'user', content: 'q', msgId: 'u1' });
    const turnIndex = new Map<string, number>([['t1', 0]]);

    removeMessageByIdUpdater(msgs, 'missing', turnIndex);

    expect(turnIndex.get('t1')).toBe(0);
    expect(turnIndex.size).toBe(1);
  });

  it('does not mutate turnIndex on corruption bail-out', () => {
    const msgs = makeMessages({ role: 'assistant', content: 'bad', msgId: 'u1' });
    const turnIndex = new Map<string, number>([['t1', 0]]);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    removeMessageByIdUpdater(msgs, 'u1', turnIndex);

    expect(turnIndex.get('t1')).toBe(0);
    expect(turnIndex.size).toBe(1);
    vi.restoreAllMocks();
  });
});
