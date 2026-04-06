import { describe, it, expect } from 'vitest';
import { generateManifest, capToSummary } from '../../../src/capabilities/manifest';
import { buildCapability } from '../../../src/capabilities/factory';
import { getAllCapabilities } from '../../../src/chat/tools/registry';

describe('generateManifest', () => {
  it('returns correct top-level structure', () => {
    const manifest = generateManifest('1.0.0-test');

    expect(manifest.version).toBe('1.0.0-test');
    expect(typeof manifest.generated).toBe('string');
    expect(manifest.totalCapabilities).toBeGreaterThan(0);
    expect(typeof manifest.categories).toBe('object');
    expect(typeof manifest.backendDistribution).toBe('object');
    expect(typeof manifest.surfaceDistribution).toBe('object');
    expect(Array.isArray(manifest.capabilities)).toBe(true);
    expect(manifest.capabilities.length).toBe(manifest.totalCapabilities);
  });

  it('category counts match actual capabilities', () => {
    const manifest = generateManifest('1.0.0');
    const caps = getAllCapabilities();

    // Verify total
    expect(manifest.totalCapabilities).toBe(caps.length);

    // Verify category counts sum to total
    const catSum = Object.values(manifest.categories).reduce((a, b) => a + b, 0);
    expect(catSum).toBe(manifest.totalCapabilities);

    // Verify each category count
    for (const [category, count] of Object.entries(manifest.categories)) {
      const actual = caps.filter(c => c.category === category).length;
      expect(count).toBe(actual);
    }
  });

  it('backend distribution counts match actual capabilities', () => {
    const manifest = generateManifest('1.0.0');
    const caps = getAllCapabilities();

    const backendSum = Object.values(manifest.backendDistribution).reduce((a, b) => a + b, 0);
    expect(backendSum).toBe(manifest.totalCapabilities);

    for (const [service, count] of Object.entries(manifest.backendDistribution)) {
      const actual = caps.filter(c => c.backendService === service).length;
      expect(count).toBe(actual);
    }
  });

  it('surface distribution counts match actual capabilities', () => {
    const manifest = generateManifest('1.0.0');
    const caps = getAllCapabilities();

    for (const [surface, count] of Object.entries(manifest.surfaceDistribution)) {
      const actual = caps.filter(c => c.surfaces.includes(surface as 'aiTool')).length;
      expect(count).toBe(actual);
    }
  });
});

describe('capToSummary', () => {
  it('strips execute function from output', () => {
    const cap = buildCapability({
      name: 'test_summary',
      displayName: 'Test Summary',
      description: 'Testing summary conversion',
      category: 'system',
      params: [{ name: 'id', type: 'string', description: 'An ID', required: true }],
      destructive: false,
      execute: async () => ({ ok: true }),
      backendType: 'query',
    });

    const summary = capToSummary(cap);

    expect(summary.name).toBe('test_summary');
    expect(summary.displayName).toBe('Test Summary');
    expect(summary.description).toBe('Testing summary conversion');
    expect(summary.category).toBe('system');
    expect(summary.backendType).toBe('query');
    expect(summary.backendService).toBe('graphql');
    expect(summary.destructive).toBe(false);
    expect(summary.params).toHaveLength(1);
    expect(summary.params[0].name).toBe('id');

    // No execute function
    expect(Object.keys(summary)).not.toContain('execute');
    expect(Object.keys(summary)).not.toContain('formatResult');
  });

  it('omits deprecated/experimental when false', () => {
    const cap = buildCapability({
      name: 'not_deprecated',
      displayName: 'Not Deprecated',
      description: 'Test',
      category: 'system',
      params: [],
      destructive: false,
      execute: async () => ({}),
      backendType: 'none',
      deprecated: false,
      experimental: false,
    });

    const summary = capToSummary(cap);
    expect(summary.deprecated).toBeUndefined();
    expect(summary.experimental).toBeUndefined();
  });

  it('includes deprecated/experimental when true', () => {
    const cap = buildCapability({
      name: 'old_tool',
      displayName: 'Old Tool',
      description: 'Test',
      category: 'system',
      params: [],
      destructive: false,
      execute: async () => ({}),
      backendType: 'none',
      deprecated: true,
      experimental: true,
    });

    const summary = capToSummary(cap);
    expect(summary.deprecated).toBe(true);
    expect(summary.experimental).toBe(true);
  });
});
