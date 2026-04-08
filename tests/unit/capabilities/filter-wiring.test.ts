import { describe, it, expect } from 'vitest';
import { buildToolRegistry, getAllCapabilities } from '../../../src/chat/tools/registry.js';
import { partitionTools } from '../../../src/capabilities/partitioner.js';
import { filterCapabilities } from '../../../src/capabilities/filter.js';

describe('filter wiring — buildToolRegistry', () => {
  it('only contains tools whose capabilities include aiTool surface', () => {
    const registry = buildToolRegistry();
    const allCaps = getAllCapabilities();
    const aiToolCaps = filterCapabilities(allCaps, { surface: 'aiTool' });

    const registryNames = Object.keys(registry).sort();
    const aiToolNames = aiToolCaps.map(c => c.name).sort();

    expect(registryNames).toEqual(aiToolNames);
  });

  it('excludes capabilities that lack aiTool surface', () => {
    const allCaps = getAllCapabilities();
    const nonAiCaps = allCaps.filter(c => !c.surfaces.includes('aiTool'));
    const registry = buildToolRegistry();

    for (const cap of nonAiCaps) {
      expect(registry).not.toHaveProperty(cap.name);
    }
  });
});

describe('filter wiring — partitionTools', () => {
  it('only partitions tools with aiTool surface', () => {
    const { alwaysLoad, deferred } = partitionTools();
    const allPartitioned = [...alwaysLoad, ...deferred];

    for (const cap of allPartitioned) {
      expect(cap.surfaces).toContain('aiTool');
    }
  });

  it('excludes tools without aiTool surface from partitions', () => {
    const allCaps = getAllCapabilities();
    const nonAiCaps = allCaps.filter(c => !c.surfaces.includes('aiTool'));
    const { alwaysLoad, deferred } = partitionTools();
    const partitionedNames = new Set([...alwaysLoad, ...deferred].map(c => c.name));

    for (const cap of nonAiCaps) {
      expect(partitionedNames.has(cap.name)).toBe(false);
    }
  });

  it('partitioned count matches filtered aiTool count', () => {
    const allCaps = getAllCapabilities();
    const aiToolCaps = filterCapabilities(allCaps, { surface: 'aiTool' });
    const { alwaysLoad, deferred } = partitionTools();

    expect(alwaysLoad.length + deferred.length).toBe(aiToolCaps.length);
  });
});
