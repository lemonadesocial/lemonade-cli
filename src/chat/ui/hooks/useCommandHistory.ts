import { useState, useCallback, useRef } from 'react';

/** Pure history state logic — exported for testability. */

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
  commandHistory: string[];
  historyIndex: number;
  savedInput: string;
  /** Record a submitted input line into command history. */
  recordSubmit: (input: string) => void;
  handleHistoryUp: (currentInput: string) => string | null;
  handleHistoryDown: () => string | null;
  /** Reset history browsing state (call on manual edit). */
  resetBrowsing: () => void;
}

export function useCommandHistory(): UseCommandHistoryResult {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // Keep refs current so callbacks never read stale closure values
  const commandHistoryRef = useRef(commandHistory);
  commandHistoryRef.current = commandHistory;
  const historyIndexRef = useRef(historyIndex);
  historyIndexRef.current = historyIndex;
  const savedInputRef = useRef(savedInput);
  savedInputRef.current = savedInput;

  const recordSubmit = useCallback((input: string) => {
    setCommandHistory(prev => {
      if (prev[prev.length - 1] === input) return prev;
      return [...prev, input];
    });
    setHistoryIndex(-1);
    setSavedInput('');
  }, []);

  const handleHistoryUp = useCallback((currentInput: string): string | null => {
    const history = commandHistoryRef.current;
    const idx = historyIndexRef.current;
    if (history.length === 0) return null;
    let newIdx: number;
    if (idx === -1) {
      setSavedInput(currentInput);
      newIdx = history.length - 1;
    } else {
      newIdx = Math.max(0, idx - 1);
    }
    setHistoryIndex(newIdx);
    return history[newIdx];
  }, []);

  const handleHistoryDown = useCallback((): string | null => {
    const idx = historyIndexRef.current;
    const history = commandHistoryRef.current;
    const saved = savedInputRef.current;
    if (idx === -1) return null;
    const next = idx + 1;
    if (next >= history.length) {
      setHistoryIndex(-1);
      return saved;
    }
    setHistoryIndex(next);
    return history[next];
  }, []);

  const resetBrowsing = useCallback(() => {
    if (historyIndexRef.current !== -1) {
      setHistoryIndex(-1);
      setSavedInput('');
    }
  }, []);

  return {
    commandHistory,
    historyIndex,
    savedInput,
    recordSubmit,
    handleHistoryUp,
    handleHistoryDown,
    resetBrowsing,
  };
}
