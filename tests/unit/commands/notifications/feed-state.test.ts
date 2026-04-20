import { describe, it, expect } from 'vitest';
import {
  feedReducer,
  initialState,
  MAX_VISIBLE,
  type FeedState,
} from '../../../../src/commands/notifications/ui/feed-state.js';

describe('feedReducer (A-009 — unit coverage for WatchFeed state machine)', () => {
  it('initialState — notifications empty, status disconnected', () => {
    expect(initialState).toEqual({ notifications: [], status: 'disconnected' });
  });

  it('notify — appends the formatted line to the end (newest last)', () => {
    const s1 = feedReducer(initialState, { type: 'notify', payload: 'line-1' });
    const s2 = feedReducer(s1, { type: 'notify', payload: 'line-2' });
    expect(s2.notifications).toEqual(['line-1', 'line-2']);
    // status is untouched by 'notify'
    expect(s2.status).toBe('disconnected');
  });

  it('notify — trims to the last MAX_VISIBLE lines when the buffer overflows', () => {
    let state: FeedState = initialState;
    // Push MAX_VISIBLE + 3 lines; expect only the last MAX_VISIBLE to survive.
    const total = MAX_VISIBLE + 3;
    for (let i = 0; i < total; i++) {
      state = feedReducer(state, { type: 'notify', payload: `line-${i}` });
    }
    expect(state.notifications).toHaveLength(MAX_VISIBLE);
    // The first 3 must be dropped; the last one in the buffer is the newest.
    expect(state.notifications[0]).toBe(`line-${total - MAX_VISIBLE}`);
    expect(state.notifications[MAX_VISIBLE - 1]).toBe(`line-${total - 1}`);
  });

  it('status — transitions connected -> disconnected -> polling -> disconnected-revoked', () => {
    let state = feedReducer(initialState, { type: 'status', payload: 'connected' });
    expect(state.status).toBe('connected');
    state = feedReducer(state, { type: 'status', payload: 'disconnected' });
    expect(state.status).toBe('disconnected');
    state = feedReducer(state, { type: 'status', payload: 'polling' });
    expect(state.status).toBe('polling');
    state = feedReducer(state, { type: 'status', payload: 'disconnected-revoked' });
    expect(state.status).toBe('disconnected-revoked');
  });

  it('status — does not mutate the notifications buffer', () => {
    const seeded = feedReducer(initialState, { type: 'notify', payload: 'keep-me' });
    const afterStatus = feedReducer(seeded, { type: 'status', payload: 'connected' });
    expect(afterStatus.notifications).toEqual(['keep-me']);
    expect(afterStatus.status).toBe('connected');
  });

  it('unknown action — returns the same state reference unchanged', () => {
    const seeded = feedReducer(initialState, { type: 'notify', payload: 'x' });
    // Cast to exercise the default branch without tripping TS exhaustiveness.
    const unknown = { type: 'nope' } as unknown as Parameters<typeof feedReducer>[1];
    const result = feedReducer(seeded, unknown);
    expect(result).toBe(seeded);
  });
});
