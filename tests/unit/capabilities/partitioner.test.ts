import { describe, it, expect } from 'vitest';
import { partitionTools, formatDeferredToolList } from '../../../src/capabilities/partitioner.js';
import { getAllCapabilities } from '../../../src/chat/tools/registry.js';

describe('partitionTools', () => {
  it('returns non-empty alwaysLoad and deferred arrays', () => {
    const { alwaysLoad, deferred } = partitionTools();
    expect(alwaysLoad.length).toBeGreaterThan(0);
    expect(deferred.length).toBeGreaterThan(0);
  });

  it('puts all alwaysLoad-flagged tools in alwaysLoad partition', () => {
    const { alwaysLoad, deferred } = partitionTools();
    const deferredNames = new Set(deferred.map(c => c.name));
    for (const cap of alwaysLoad) {
      if (cap.alwaysLoad) {
        expect(deferredNames.has(cap.name)).toBe(false);
      }
    }
  });

  it('never puts alwaysLoad tools in deferred partition', () => {
    const { deferred } = partitionTools();
    for (const cap of deferred) {
      expect(cap.alwaysLoad).not.toBe(true);
    }
  });

  it('puts shouldDefer tools (without alwaysLoad) in deferred partition', () => {
    const { deferred } = partitionTools();
    for (const cap of deferred) {
      expect(cap.shouldDefer).toBe(true);
    }
  });

  it('covers all capabilities (alwaysLoad + deferred = total)', () => {
    const total = getAllCapabilities().length;
    const { alwaysLoad, deferred } = partitionTools();
    expect(alwaysLoad.length + deferred.length).toBe(total);
  });

  it('produces expected approximate counts', () => {
    const { alwaysLoad, deferred } = partitionTools();
    // alwaysLoad: ~103 (26 alwaysLoad + ~77 default non-deferred)
    expect(alwaysLoad.length).toBeGreaterThanOrEqual(90);
    expect(alwaysLoad.length).toBeLessThanOrEqual(130);
    // deferred: ~110
    expect(deferred.length).toBeGreaterThanOrEqual(90);
    expect(deferred.length).toBeLessThanOrEqual(130);
  });
});

describe('formatDeferredToolList', () => {
  it('includes all deferred tool names', () => {
    const { deferred } = partitionTools();
    const output = formatDeferredToolList(deferred);
    for (const cap of deferred) {
      expect(output).toContain(cap.name);
    }
  });

  it('groups by category', () => {
    const { deferred } = partitionTools();
    const categories = new Set(deferred.map(c => c.category));
    const output = formatDeferredToolList(deferred);
    for (const cat of categories) {
      expect(output).toContain(`## ${cat}`);
    }
  });

  it('wraps output in deferred-tools tags', () => {
    const { deferred } = partitionTools();
    const output = formatDeferredToolList(deferred);
    expect(output).toContain('<deferred-tools>');
    expect(output).toContain('</deferred-tools>');
  });

  it('includes tool_search usage hint', () => {
    const { deferred } = partitionTools();
    const output = formatDeferredToolList(deferred);
    expect(output).toContain('tool_search');
  });

  it('returns empty-ish output for empty input', () => {
    const output = formatDeferredToolList([]);
    expect(output).toContain('<deferred-tools>');
    expect(output).toContain('</deferred-tools>');
  });
});
