import { useCallback, useRef } from 'react';

/** Pure history state logic — used by the hook and directly testable. */

export interface HistoryState {
  history: string[];
  index: number;
  saved: string;
}

export function initHistoryState(): HistoryState {
  return { history: [], index: -1, saved: '' };
}

export function computeRecordSubmit(state: HistoryState, input: string): HistoryState {
  const history = state.history[state.history.length - 1] === input
    ? state.history
    : [...state.history, input];
  return { history, index: -1, saved: '' };
}

export function computeHistoryUp(state: HistoryState, currentInput: string): { state: HistoryState; value: string | null } {
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

export function computeHistoryDown(state: HistoryState): { state: HistoryState; value: string | null } {
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

export function computeResetBrowsing(state: HistoryState): HistoryState {
  if (state.index !== -1) {
    return { ...state, index: -1, saved: '' };
  }
  return state;
}

export interface UseCommandHistoryResult {
  /** Record a submitted input line into command history. */
  recordSubmit: (input: string) => void;
  handleHistoryUp: (currentInput: string) => string | null;
  handleHistoryDown: () => string | null;
  /** Reset history browsing state (call on manual edit). */
  resetBrowsing: () => void;
}

export function useCommandHistory(): UseCommandHistoryResult {
  const stateRef = useRef<HistoryState>(initHistoryState());

  const recordSubmit = useCallback((input: string) => {
    stateRef.current = computeRecordSubmit(stateRef.current, input);
  }, []);

  const handleHistoryUp = useCallback((currentInput: string): string | null => {
    const result = computeHistoryUp(stateRef.current, currentInput);
    stateRef.current = result.state;
    return result.value;
  }, []);

  const handleHistoryDown = useCallback((): string | null => {
    const result = computeHistoryDown(stateRef.current);
    stateRef.current = result.state;
    return result.value;
  }, []);

  const resetBrowsing = useCallback(() => {
    stateRef.current = computeResetBrowsing(stateRef.current);
  }, []);

  return {
    recordSubmit,
    handleHistoryUp,
    handleHistoryDown,
    resetBrowsing,
  };
}
