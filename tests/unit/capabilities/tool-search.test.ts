import { describe, it, expect } from 'vitest';
import { getAllCapabilities } from '../../../src/chat/tools/registry.js';

// Get the tool_search capability directly from the registry
function getToolSearch() {
  const caps = getAllCapabilities();
  const toolSearch = caps.find(c => c.name === 'tool_search');
  if (!toolSearch) throw new Error('tool_search not found in registry');
  return toolSearch;
}

describe('tool_search', () => {
  it('exists in the registry with alwaysLoad=true', () => {
    const ts = getToolSearch();
    expect(ts.alwaysLoad).toBe(true);
    expect(ts.shouldDefer).toBe(false);
    expect(ts.category).toBe('system');
  });

  it('returns exact name match', async () => {
    const ts = getToolSearch();
    const result = await ts.execute({ query: 'get_backend_version' }) as any;
    expect(result.results.length).toBeGreaterThanOrEqual(1);
    expect(result.results[0].name).toBe('get_backend_version');
  });

  it('returns results for keyword search', async () => {
    const ts = getToolSearch();
    const result = await ts.execute({ query: 'ticket' }) as any;
    expect(result.results.length).toBeGreaterThan(0);
    // All results should have some relevance to "ticket"
    for (const r of result.results) {
      const combined = `${r.name} ${r.description} ${r.category}`.toLowerCase();
      expect(combined).toContain('ticket');
    }
  });

  it('returns results for category search', async () => {
    const ts = getToolSearch();
    const result = await ts.execute({ query: 'system' }) as any;
    expect(result.results.length).toBeGreaterThan(0);
    // At least some results should be in the system category
    const systemResults = result.results.filter((r: any) => r.category === 'system');
    expect(systemResults.length).toBeGreaterThan(0);
  });

  it('returns no results for gibberish query', async () => {
    const ts = getToolSearch();
    const result = await ts.execute({ query: 'xyzzy_nonexistent_zzzz' }) as any;
    expect(result.results.length).toBe(0);
  });

  it('respects max_results limit', async () => {
    const ts = getToolSearch();
    const result = await ts.execute({ query: 'event', max_results: 3 }) as any;
    expect(result.results.length).toBeLessThanOrEqual(3);
  });

  it('defaults to 5 results', async () => {
    const ts = getToolSearch();
    const result = await ts.execute({ query: 'event' }) as any;
    expect(result.results.length).toBeLessThanOrEqual(5);
  });

  it('includes params in results', async () => {
    const ts = getToolSearch();
    const result = await ts.execute({ query: 'credits_balance' }) as any;
    expect(result.results.length).toBeGreaterThanOrEqual(1);
    const match = result.results.find((r: any) => r.name === 'credits_balance');
    expect(match).toBeDefined();
    expect(match.params).toBeDefined();
    expect(Array.isArray(match.params)).toBe(true);
    expect(match.params.length).toBeGreaterThan(0);
    expect(match.params[0]).toHaveProperty('name');
    expect(match.params[0]).toHaveProperty('type');
    expect(match.params[0]).toHaveProperty('required');
  });

  it('formatResult handles empty results', () => {
    const ts = getToolSearch();
    const output = ts.formatResult!({ results: [], total_matches: 0 });
    expect(output).toBe('No matching tools found.');
  });

  it('formatResult formats non-empty results', () => {
    const ts = getToolSearch();
    const output = ts.formatResult!({
      results: [{
        name: 'test_tool',
        category: 'system',
        description: 'A test',
        params: [{ name: 'q', required: true }],
      }],
      total_matches: 1,
    });
    expect(output).toContain('**test_tool**');
    expect(output).toContain('system');
    expect(output).toContain('q*');
  });
});
