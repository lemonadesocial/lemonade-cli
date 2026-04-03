import { useState, useCallback } from 'react';

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

  const recordSubmit = useCallback((input: string) => {
    setCommandHistory(prev => {
      if (prev[prev.length - 1] === input) return prev;
      return [...prev, input];
    });
    setHistoryIndex(-1);
    setSavedInput('');
  }, []);

  const handleHistoryUp = useCallback((currentInput: string): string | null => {
    if (commandHistory.length === 0) return null;
    let newIdx: number;
    if (historyIndex === -1) {
      setSavedInput(currentInput);
      newIdx = commandHistory.length - 1;
    } else {
      newIdx = Math.max(0, historyIndex - 1);
    }
    setHistoryIndex(newIdx);
    return commandHistory[newIdx];
  }, [commandHistory, historyIndex]);

  const handleHistoryDown = useCallback((): string | null => {
    if (historyIndex === -1) return null;
    const idx = historyIndex + 1;
    if (idx >= commandHistory.length) {
      setHistoryIndex(-1);
      return savedInput;
    }
    setHistoryIndex(idx);
    return commandHistory[idx];
  }, [commandHistory, historyIndex, savedInput]);

  const resetBrowsing = useCallback(() => {
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setSavedInput('');
    }
  }, [historyIndex]);

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
