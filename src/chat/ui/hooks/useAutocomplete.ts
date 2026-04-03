import { useState, useEffect, useCallback } from 'react';
import { SLASH_COMMANDS } from '../SlashCommands.js';

export const AC_MAX_VISIBLE = 6;

export interface AutocompleteState {
  showAutocomplete: boolean;
  filteredCommands: typeof SLASH_COMMANDS[number][];
  acIndex: number;
  acScrollOffset: number;
}

export interface UseAutocompleteResult extends AutocompleteState {
  navigateUp: () => void;
  navigateDown: () => void;
  selectCurrent: () => string | null;
}

export function useAutocomplete(inputValue: string): UseAutocompleteResult {
  const [acIndex, setAcIndex] = useState(0);
  const [acScrollOffset, setAcScrollOffset] = useState(0);

  const showAutocomplete = inputValue.startsWith('/');
  const filteredCommands = showAutocomplete
    ? SLASH_COMMANDS.filter((cmd) => cmd.name.startsWith(inputValue))
    : [];

  // Reset when input changes
  useEffect(() => {
    setAcIndex(0);
    setAcScrollOffset(0);
  }, [inputValue]);

  const navigateUp = useCallback(() => {
    setAcIndex((prev) => {
      const next = prev <= 0 ? filteredCommands.length - 1 : prev - 1;
      if (next < acScrollOffset) {
        setAcScrollOffset(next);
      } else if (next >= acScrollOffset + AC_MAX_VISIBLE) {
        setAcScrollOffset(next - AC_MAX_VISIBLE + 1);
      }
      return next;
    });
  }, [filteredCommands.length, acScrollOffset]);

  const navigateDown = useCallback(() => {
    setAcIndex((prev) => {
      const next = prev >= filteredCommands.length - 1 ? 0 : prev + 1;
      if (next >= acScrollOffset + AC_MAX_VISIBLE) {
        setAcScrollOffset(next - AC_MAX_VISIBLE + 1);
      } else if (next < acScrollOffset) {
        setAcScrollOffset(next);
      }
      return next;
    });
  }, [filteredCommands.length, acScrollOffset]);

  const selectCurrent = useCallback((): string | null => {
    if (filteredCommands.length === 0) return null;
    return filteredCommands[acIndex].name;
  }, [filteredCommands, acIndex]);

  return {
    showAutocomplete,
    filteredCommands,
    acIndex,
    acScrollOffset,
    navigateUp,
    navigateDown,
    selectCurrent,
  };
}
