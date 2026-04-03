import { useState, useEffect, useCallback, useRef } from 'react';
import { SLASH_COMMANDS } from '../SlashCommands.js';

export const AC_MAX_VISIBLE = 6;

/** Pure filtering logic — used by the hook and directly testable. */
export function filterCommands(inputValue: string) {
  const showAutocomplete = inputValue.startsWith('/');
  const filteredCommands = showAutocomplete
    ? SLASH_COMMANDS.filter((cmd) => cmd.name.startsWith(inputValue))
    : [];
  return { showAutocomplete, filteredCommands };
}

/** Pure index navigation — used by the hook and directly testable. */
export function computeNavigateUp(currentIndex: number, count: number): number {
  if (count === 0) return 0;
  return currentIndex <= 0 ? count - 1 : currentIndex - 1;
}

export function computeNavigateDown(currentIndex: number, count: number): number {
  if (count === 0) return 0;
  return currentIndex >= count - 1 ? 0 : currentIndex + 1;
}

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

  const { showAutocomplete, filteredCommands } = filterCommands(inputValue);

  const filteredCommandsRef = useRef(filteredCommands);
  filteredCommandsRef.current = filteredCommands;
  const acIndexRef = useRef(acIndex);
  acIndexRef.current = acIndex;

  // Reset when input changes
  useEffect(() => {
    setAcIndex(0);
    setAcScrollOffset(0);
  }, [inputValue]);

  const navigateUp = useCallback(() => {
    setAcIndex((prev) => {
      const len = filteredCommandsRef.current.length;
      const next = computeNavigateUp(prev, len);
      setAcScrollOffset((prevOffset) => {
        if (next < prevOffset) return next;
        if (next >= prevOffset + AC_MAX_VISIBLE) return next - AC_MAX_VISIBLE + 1;
        return prevOffset;
      });
      return next;
    });
  }, []);

  const navigateDown = useCallback(() => {
    setAcIndex((prev) => {
      const len = filteredCommandsRef.current.length;
      const next = computeNavigateDown(prev, len);
      setAcScrollOffset((prevOffset) => {
        if (next >= prevOffset + AC_MAX_VISIBLE) return next - AC_MAX_VISIBLE + 1;
        if (next < prevOffset) return next;
        return prevOffset;
      });
      return next;
    });
  }, []);

  const selectCurrent = useCallback((): string | null => {
    const cmds = filteredCommandsRef.current;
    const idx = acIndexRef.current;
    if (cmds.length === 0) return null;
    return cmds[idx].name;
  }, []);

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
