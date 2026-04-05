import { describe, it, expect } from 'vitest';
import { getToolCategory, getCategories } from '../../../src/commands/tools/index';
import { buildToolRegistry } from '../../../src/chat/tools/registry';
import { parseSlashCommand } from '../../../src/chat/ui/SlashCommands';

describe('getToolCategory', () => {
  const registry = buildToolRegistry();

  it('returns the explicit category from the tool definition', () => {
    expect(getToolCategory(registry['event_create'])).toBe('event');
    expect(getToolCategory(registry['space_list'])).toBe('space');
    expect(getToolCategory(registry['tickets_buy'])).toBe('tickets');
    expect(getToolCategory(registry['event_ticket_sold_insight'])).toBe('event');
  });

  it('returns correct categories for tools with non-prefix-based categories', () => {
    expect(getToolCategory(registry['get_me'])).toBe('user');
    expect(getToolCategory(registry['get_backend_version'])).toBe('system');
    expect(getToolCategory(registry['event_votings'])).toBe('voting');
    expect(getToolCategory(registry['event_session_reservations'])).toBe('session');
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

  it('every tool has a non-empty category field', () => {
    for (const [name, tool] of Object.entries(registry)) {
      expect(tool.category, `Tool "${name}" is missing a category`).toBeTruthy();
      expect(tool.category.length, `Tool "${name}" has an empty category`).toBeGreaterThan(0);
    }
  });

  it('categories have at least 1 tool each', () => {
    const cats = getCategories(registry);
    for (const cat of cats) {
      const count = Object.values(registry).filter(
        (tool) => getToolCategory(tool) === cat,
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
