import { describe, it, expect } from 'vitest';
import { SLASH_COMMANDS } from '../../../../../src/chat/ui/SlashCommands.js';

// Test the autocomplete filtering and navigation logic as pure functions,
// mirroring useAutocomplete behavior without needing React rendering.

function getFilteredCommands(inputValue: string) {
  const showAutocomplete = inputValue.startsWith('/');
  const filteredCommands = showAutocomplete
    ? SLASH_COMMANDS.filter((cmd) => cmd.name.startsWith(inputValue))
    : [];
  return { showAutocomplete, filteredCommands };
}

function navigateUp(currentIndex: number, count: number): number {
  return currentIndex <= 0 ? count - 1 : currentIndex - 1;
}

function navigateDown(currentIndex: number, count: number): number {
  return currentIndex >= count - 1 ? 0 : currentIndex + 1;
}

describe('autocomplete logic', () => {
  it('shows autocomplete when input starts with /', () => {
    const { showAutocomplete, filteredCommands } = getFilteredCommands('/');
    expect(showAutocomplete).toBe(true);
    expect(filteredCommands.length).toBeGreaterThan(0);
  });

  it('does not show autocomplete for non-slash input', () => {
    const { showAutocomplete, filteredCommands } = getFilteredCommands('hello');
    expect(showAutocomplete).toBe(false);
    expect(filteredCommands).toEqual([]);
  });

  it('filters commands by prefix', () => {
    const { filteredCommands } = getFilteredCommands('/cl');
    expect(filteredCommands.every(c => c.name.startsWith('/cl'))).toBe(true);
    expect(filteredCommands.length).toBeGreaterThan(0);
    // /clear should be in the results
    expect(filteredCommands.some(c => c.name === '/clear')).toBe(true);
  });

  it('navigateDown wraps around to 0', () => {
    const count = 3;
    expect(navigateDown(2, count)).toBe(0);
  });

  it('navigateDown increments normally', () => {
    expect(navigateDown(0, 5)).toBe(1);
    expect(navigateDown(1, 5)).toBe(2);
  });

  it('navigateUp wraps around to last', () => {
    const count = 3;
    expect(navigateUp(0, count)).toBe(2);
  });

  it('navigateUp decrements normally', () => {
    expect(navigateUp(2, 5)).toBe(1);
    expect(navigateUp(3, 5)).toBe(2);
  });

  it('returns no matches for unknown command prefix', () => {
    const { filteredCommands } = getFilteredCommands('/zzzznotreal');
    expect(filteredCommands).toEqual([]);
  });

  it('all SLASH_COMMANDS match when input is /', () => {
    const { filteredCommands } = getFilteredCommands('/');
    expect(filteredCommands.length).toBe(SLASH_COMMANDS.length);
  });
});
