import { describe, it, expect } from 'vitest';
import { generateManifest } from '../../../src/capabilities/manifest';
import { getAllCapabilities } from '../../../src/chat/tools/registry';
import { filterCapabilities, findCapability, getSuggestions } from '../../../src/capabilities/filter';

const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z';

describe('capabilities stats', () => {
  it('outputs correct total and category counts', () => {
    const manifest = generateManifest('1.0.0', FIXED_TIMESTAMP);
    const caps = getAllCapabilities();

    expect(manifest.totalCapabilities).toBe(caps.length);
    expect(Object.keys(manifest.categories).length).toBeGreaterThan(0);

    const catSum = Object.values(manifest.categories).reduce((a, b) => a + b, 0);
    expect(catSum).toBe(manifest.totalCapabilities);
  });
});

describe('capabilities list --category', () => {
  it('filters correctly by category', () => {
    const caps = getAllCapabilities();
    const eventCaps = filterCapabilities(caps, { category: 'event' });

    expect(eventCaps.length).toBeGreaterThan(0);
    for (const cap of eventCaps) {
      expect(cap.category).toBe('event');
    }
  });

  it('filters case-insensitively', () => {
    const caps = getAllCapabilities();
    const lower = filterCapabilities(caps, { category: 'event' });
    const upper = filterCapabilities(caps, { category: 'Event' });
    const mixed = filterCapabilities(caps, { category: 'EVENT' });

    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBe(mixed.length);
    expect(lower.length).toBeGreaterThan(0);
  });

  it('returns empty for non-existent category', () => {
    const caps = getAllCapabilities();
    const result = filterCapabilities(caps, { category: 'nonexistent_category_xyz' });
    expect(result.length).toBe(0);
  });
});

describe('capabilities inspect', () => {
  it('finds a capability and returns correct metadata', () => {
    const caps = getAllCapabilities();
    const firstCap = caps[0];
    const found = findCapability(caps, firstCap.name);

    expect(found).toBeDefined();
    expect(found!.name).toBe(firstCap.name);
    expect(found!.category).toBe(firstCap.category);
    expect(found!.description).toBe(firstCap.description);
  });

  it('finds capability case-insensitively', () => {
    const caps = getAllCapabilities();
    const firstCap = caps[0];
    const found = findCapability(caps, firstCap.name.toUpperCase());

    expect(found).toBeDefined();
    expect(found!.name).toBe(firstCap.name);
  });

  it('returns undefined for missing capability', () => {
    const caps = getAllCapabilities();
    const found = findCapability(caps, 'nonexistent_capability_xyz_123');
    expect(found).toBeUndefined();
  });

  it('provides suggestions for partial matches', () => {
    const caps = getAllCapabilities();
    // Use 'event' as partial - should match some event_* capabilities
    const suggestions = getSuggestions(caps, 'event');
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(s.toLowerCase()).toContain('event');
    }
  });
});
