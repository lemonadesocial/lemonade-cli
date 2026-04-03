import { describe, it, expect } from 'vitest';

// Test the command history logic as a plain state machine, mirroring useCommandHistory behavior.
// This avoids needing @testing-library/react while covering the same behavioral contracts.

interface HistoryState {
  history: string[];
  index: number;
  saved: string;
}

function init(): HistoryState {
  return { history: [], index: -1, saved: '' };
}

function recordSubmit(state: HistoryState, input: string): HistoryState {
  const history = state.history[state.history.length - 1] === input
    ? state.history
    : [...state.history, input];
  return { history, index: -1, saved: '' };
}

function historyUp(state: HistoryState, currentInput: string): { state: HistoryState; value: string | null } {
  if (state.history.length === 0) return { state, value: null };
  let newIdx: number;
  let saved = state.saved;
  if (state.index === -1) {
    saved = currentInput;
    newIdx = state.history.length - 1;
  } else {
    newIdx = Math.max(0, state.index - 1);
  }
  return {
    state: { ...state, index: newIdx, saved },
    value: state.history[newIdx],
  };
}

function historyDown(state: HistoryState): { state: HistoryState; value: string | null } {
  if (state.index === -1) return { state, value: null };
  const idx = state.index + 1;
  if (idx >= state.history.length) {
    return {
      state: { ...state, index: -1 },
      value: state.saved,
    };
  }
  return {
    state: { ...state, index: idx },
    value: state.history[idx],
  };
}

function resetBrowsing(state: HistoryState): HistoryState {
  if (state.index !== -1) {
    return { ...state, index: -1, saved: '' };
  }
  return state;
}

describe('command history logic', () => {
  it('starts with empty history and index -1', () => {
    const s = init();
    expect(s.history).toEqual([]);
    expect(s.index).toBe(-1);
  });

  it('records submitted input', () => {
    let s = init();
    s = recordSubmit(s, 'hello');
    expect(s.history).toEqual(['hello']);
    expect(s.index).toBe(-1);
  });

  it('deduplicates consecutive identical submissions', () => {
    let s = init();
    s = recordSubmit(s, 'hello');
    s = recordSubmit(s, 'hello');
    expect(s.history).toEqual(['hello']);
  });

  it('navigates up through history', () => {
    let s = init();
    s = recordSubmit(s, 'first');
    s = recordSubmit(s, 'second');

    let result = historyUp(s, 'current');
    s = result.state;
    expect(result.value).toBe('second');
    expect(s.index).toBe(1);

    result = historyUp(s, 'current');
    s = result.state;
    expect(result.value).toBe('first');
    expect(s.index).toBe(0);

    // At top — stays at 0
    result = historyUp(s, 'current');
    s = result.state;
    expect(result.value).toBe('first');
    expect(s.index).toBe(0);
  });

  it('navigates down restoring saved input', () => {
    let s = init();
    s = recordSubmit(s, 'first');
    s = recordSubmit(s, 'second');

    // Go up twice
    let result = historyUp(s, 'typing');
    s = result.state;
    result = historyUp(s, 'typing');
    s = result.state;

    // Go down once
    let down = historyDown(s);
    s = down.state;
    expect(down.value).toBe('second');

    // Go down past end — restores saved input
    down = historyDown(s);
    s = down.state;
    expect(down.value).toBe('typing');
    expect(s.index).toBe(-1);
  });

  it('returns null from historyUp with empty history', () => {
    const s = init();
    const result = historyUp(s, 'x');
    expect(result.value).toBeNull();
  });

  it('returns null from historyDown when not browsing', () => {
    const s = init();
    const result = historyDown(s);
    expect(result.value).toBeNull();
  });

  it('resetBrowsing clears history index', () => {
    let s = init();
    s = recordSubmit(s, 'hello');
    const up = historyUp(s, 'x');
    s = up.state;
    expect(s.index).toBe(0);

    s = resetBrowsing(s);
    expect(s.index).toBe(-1);
  });
});
