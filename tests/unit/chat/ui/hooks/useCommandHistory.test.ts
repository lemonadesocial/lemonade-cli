import { describe, it, expect } from 'vitest';
import {
  initHistoryState,
  computeRecordSubmit,
  computeHistoryUp,
  computeHistoryDown,
  computeResetBrowsing,
} from '../../../../../src/chat/ui/hooks/useCommandHistory.js';

describe('useCommandHistory — pure logic', () => {
  it('starts with empty history and index -1', () => {
    const s = initHistoryState();
    expect(s.history).toEqual([]);
    expect(s.index).toBe(-1);
  });

  it('records submitted input', () => {
    let s = initHistoryState();
    s = computeRecordSubmit(s, 'hello');
    expect(s.history).toEqual(['hello']);
    expect(s.index).toBe(-1);
  });

  it('deduplicates consecutive identical submissions', () => {
    let s = initHistoryState();
    s = computeRecordSubmit(s, 'hello');
    s = computeRecordSubmit(s, 'hello');
    expect(s.history).toEqual(['hello']);
  });

  it('navigates up through history', () => {
    let s = initHistoryState();
    s = computeRecordSubmit(s, 'first');
    s = computeRecordSubmit(s, 'second');

    let result = computeHistoryUp(s, 'current');
    s = result.state;
    expect(result.value).toBe('second');
    expect(s.index).toBe(1);

    result = computeHistoryUp(s, 'current');
    s = result.state;
    expect(result.value).toBe('first');
    expect(s.index).toBe(0);

    // At top — stays at 0
    result = computeHistoryUp(s, 'current');
    s = result.state;
    expect(result.value).toBe('first');
    expect(s.index).toBe(0);
  });

  it('navigates down restoring saved input', () => {
    let s = initHistoryState();
    s = computeRecordSubmit(s, 'first');
    s = computeRecordSubmit(s, 'second');

    // Go up twice
    let result = computeHistoryUp(s, 'typing');
    s = result.state;
    result = computeHistoryUp(s, 'typing');
    s = result.state;

    // Go down once
    let down = computeHistoryDown(s);
    s = down.state;
    expect(down.value).toBe('second');

    // Go down past end — restores saved input
    down = computeHistoryDown(s);
    s = down.state;
    expect(down.value).toBe('typing');
    expect(s.index).toBe(-1);
  });

  it('returns null from historyUp with empty history', () => {
    const s = initHistoryState();
    const result = computeHistoryUp(s, 'x');
    expect(result.value).toBeNull();
  });

  it('returns null from historyDown when not browsing', () => {
    const s = initHistoryState();
    const result = computeHistoryDown(s);
    expect(result.value).toBeNull();
  });

  it('resetBrowsing clears history index', () => {
    let s = initHistoryState();
    s = computeRecordSubmit(s, 'hello');
    const up = computeHistoryUp(s, 'x');
    s = up.state;
    expect(s.index).toBe(0);

    s = computeResetBrowsing(s);
    expect(s.index).toBe(-1);
  });
});
