import { describe, it, expect } from 'vitest';
import { getToolCategory, getCategories } from '../../../src/commands/tools/index';
import { buildToolRegistry } from '../../../src/chat/tools/registry';
import { parseSlashCommand } from '../../../src/chat/ui/SlashCommands';

describe('getToolCategory', () => {
  it('extracts prefix before first underscore', () => {
    expect(getToolCategory('event_create')).toBe('event');
    expect(getToolCategory('space_list')).toBe('space');
    expect(getToolCategory('tickets_buy')).toBe('tickets');
    expect(getToolCategory('event_ticket_sold_insight')).toBe('event');
  });

  it('handles edge cases in tool name format', () => {
    expect(getToolCategory('get_me')).toBe('get');
    expect(getToolCategory('nounderscore')).toBe('general');
    expect(getToolCategory('_leadingunderscore')).toBe('general');
  });
});

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

describe('tool discoverability coverage', () => {
  const registry = buildToolRegistry();

  it('every tool gets a non-empty category', () => {
    for (const [name] of Object.entries(registry)) {
      const cat = getToolCategory(name);
      expect(cat).toBeTruthy();
      expect(cat.length).toBeGreaterThan(0);
    }
  });

  it('categories have at least 1 tool each', () => {
    const cats = getCategories(registry);
    for (const cat of cats) {
      const count = Object.keys(registry).filter(
        (name) => getToolCategory(name) === cat,
      ).length;
      expect(count).toBeGreaterThan(0);
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
