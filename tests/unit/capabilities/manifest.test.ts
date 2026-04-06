import { describe, it, expect } from 'vitest';
import { generateManifest, capToSummary } from '../../../src/capabilities/manifest';
import { buildCapability } from '../../../src/capabilities/factory';
import { getAllCapabilities } from '../../../src/chat/tools/registry';

const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z';

describe('generateManifest', () => {
  it('returns correct top-level structure', () => {
    const manifest = generateManifest('1.0.0-test', FIXED_TIMESTAMP);

    expect(manifest.version).toBe('1.0.0-test');
    expect(manifest.generated).toBe(FIXED_TIMESTAMP);
    expect(manifest.totalCapabilities).toBeGreaterThan(0);
    expect(typeof manifest.categories).toBe('object');
    expect(typeof manifest.backendServiceDistribution).toBe('object');
    expect(typeof manifest.backendTypeDistribution).toBe('object');
    expect(typeof manifest.surfaceDistribution).toBe('object');
    expect(Array.isArray(manifest.capabilities)).toBe(true);
    expect(manifest.capabilities.length).toBe(manifest.totalCapabilities);
  });

  it('uses current time when no timestamp provided', () => {
    const before = new Date().toISOString();
    const manifest = generateManifest('1.0.0');
    const after = new Date().toISOString();

    expect(manifest.generated >= before).toBe(true);
    expect(manifest.generated <= after).toBe(true);
  });

  it('category counts match actual capabilities', () => {
    const manifest = generateManifest('1.0.0', FIXED_TIMESTAMP);
    const caps = getAllCapabilities();

    expect(manifest.totalCapabilities).toBe(caps.length);

    const catSum = Object.values(manifest.categories).reduce((a, b) => a + b, 0);
    expect(catSum).toBe(manifest.totalCapabilities);

    for (const [category, count] of Object.entries(manifest.categories)) {
      const actual = caps.filter(c => c.category === category).length;
      expect(count).toBe(actual);
    }
  });

  it('backend service distribution counts match actual capabilities', () => {
    const manifest = generateManifest('1.0.0', FIXED_TIMESTAMP);
    const caps = getAllCapabilities();

    const serviceSum = Object.values(manifest.backendServiceDistribution).reduce((a, b) => a + b, 0);
    expect(serviceSum).toBe(manifest.totalCapabilities);

    for (const [service, count] of Object.entries(manifest.backendServiceDistribution)) {
      const actual = caps.filter(c => c.backendService === service).length;
      expect(count).toBe(actual);
    }
  });

  it('backend type distribution counts match actual capabilities', () => {
    const manifest = generateManifest('1.0.0', FIXED_TIMESTAMP);
    const caps = getAllCapabilities();

    const typeSum = Object.values(manifest.backendTypeDistribution).reduce((a, b) => a + b, 0);
    expect(typeSum).toBe(manifest.totalCapabilities);

    for (const [type, count] of Object.entries(manifest.backendTypeDistribution)) {
      const actual = caps.filter(c => c.backendType === type).length;
      expect(count).toBe(actual);
    }
  });

  it('surface distribution counts match actual capabilities', () => {
    const manifest = generateManifest('1.0.0', FIXED_TIMESTAMP);
    const caps = getAllCapabilities();

    for (const [surface, count] of Object.entries(manifest.surfaceDistribution)) {
      const actual = caps.filter(c => c.surfaces.includes(surface as 'aiTool')).length;
      expect(count).toBe(actual);
    }
  });
});

describe('capToSummary', () => {
  it('strips execute and formatResult from output', () => {
    const cap = buildCapability({
      name: 'test_summary',
      displayName: 'Test Summary',
      description: 'Testing summary conversion',
      category: 'system',
      params: [{ name: 'id', type: 'string', description: 'An ID', required: true }],
      destructive: false,
      execute: async () => ({ ok: true }),
      formatResult: (r: unknown) => String(r),
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

    // No execute or formatResult functions
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
