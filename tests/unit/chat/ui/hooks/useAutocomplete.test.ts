import { describe, it, expect } from 'vitest';
import { SLASH_COMMANDS } from '../../../../../src/chat/ui/SlashCommands.js';
import {
  AC_MAX_VISIBLE,
  filterCommands,
  computeNavigateUp,
  computeNavigateDown,
} from '../../../../../src/chat/ui/hooks/useAutocomplete.js';

describe('useAutocomplete — pure logic', () => {
  it('AC_MAX_VISIBLE is 6', () => {
    expect(AC_MAX_VISIBLE).toBe(6);
  });

  it('shows autocomplete when input starts with /', () => {
    const { showAutocomplete, filteredCommands } = filterCommands('/');
    expect(showAutocomplete).toBe(true);
    expect(filteredCommands.length).toBeGreaterThan(0);
  });

  it('does not show autocomplete for non-slash input', () => {
    const { showAutocomplete, filteredCommands } = filterCommands('hello');
    expect(showAutocomplete).toBe(false);
    expect(filteredCommands).toEqual([]);
  });

  it('filters commands by prefix', () => {
    const { filteredCommands } = filterCommands('/cl');
    expect(filteredCommands.every(c => c.name.startsWith('/cl'))).toBe(true);
    expect(filteredCommands.length).toBeGreaterThan(0);
    expect(filteredCommands.some(c => c.name === '/clear')).toBe(true);
  });

  it('all SLASH_COMMANDS match when input is /', () => {
    const { filteredCommands } = filterCommands('/');
    expect(filteredCommands.length).toBe(SLASH_COMMANDS.length);
  });

  it('returns no matches for unknown command prefix', () => {
    const { filteredCommands } = filterCommands('/zzzznotreal');
    expect(filteredCommands).toEqual([]);
  });

  it('computeNavigateDown wraps around to 0', () => {
    expect(computeNavigateDown(2, 3)).toBe(0);
  });

  it('computeNavigateDown increments normally', () => {
    expect(computeNavigateDown(0, 5)).toBe(1);
    expect(computeNavigateDown(1, 5)).toBe(2);
  });

  it('computeNavigateUp wraps around to last', () => {
    expect(computeNavigateUp(0, 3)).toBe(2);
  });

  it('computeNavigateUp decrements normally', () => {
    expect(computeNavigateUp(2, 5)).toBe(1);
    expect(computeNavigateUp(3, 5)).toBe(2);
  });
});
