import { describe, it, expect } from 'vitest';
import { getCategories } from '../../../src/commands/tools/index';
import { buildToolRegistry } from '../../../src/chat/tools/registry';
import { parseSlashCommand } from '../../../src/chat/ui/SlashCommands';

describe('getCategories', () => {
  it('returns sorted unique categories from the full registry', () => {
    const registry = buildToolRegistry();
    const cats = getCategories(registry);
    expect(cats.length).toBeGreaterThan(5);
    expect(cats).toContain('event');
    expect(cats).toContain('space');
    expect(cats).toContain('tickets');
    // Sorted
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i].localeCompare(cats[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('/tools slash command parsing', () => {
  it('parses /tools with no args', () => {
    const result = parseSlashCommand('/tools');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('tools');
    expect(result.args).toBeUndefined();
  });

  it('parses /tools with category arg', () => {
    const result = parseSlashCommand('/tools event');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('tools');
    expect(result.args).toBe('event');
  });

  it('parses /tools info <name>', () => {
    const result = parseSlashCommand('/tools info event_create');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('tools');
    expect(result.args).toBe('info event_create');
  });

  it('is included in help output', () => {
    const help = parseSlashCommand('/help');
    expect(help.output).toContain('/tools');
  });
});
