import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { CanonicalCapability } from '../../../src/capabilities/types';

// Mock getAllCapabilities before importing drift module
vi.mock('../../../src/chat/tools/registry', () => ({
  getAllCapabilities: vi.fn(() => []),
}));

import { checkDrift } from '../../../src/capabilities/drift';
import { getAllCapabilities } from '../../../src/chat/tools/registry';

const mockedGetAll = vi.mocked(getAllCapabilities);

function makeCapability(overrides: Partial<CanonicalCapability>): CanonicalCapability {
  return {
    name: 'test_tool',
    displayName: 'Test Tool',
    description: 'A test tool',
    category: 'events',
    params: [],
    destructive: false,
    execute: async () => ({ ok: true }),
    backendType: 'query',
    backendService: 'graphql',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    ...overrides,
  };
}

function writeSchema(dir: string, queries: string[], mutations: string[]): string {
  const path = join(dir, 'backend-resolvers.json');
  writeFileSync(path, JSON.stringify({
    generated: '2026-01-01',
    source: 'test',
    queries,
    mutations,
  }));
  return path;
}

describe('checkDrift', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'drift-test-'));
    mockedGetAll.mockReset();
  });

  it('identifies covered resolvers', () => {
    const schemaPath = writeSchema(tmpDir, ['getEvent', 'getMe'], ['createEvent']);

    mockedGetAll.mockReturnValue([
      makeCapability({ name: 'get_event', backendResolver: 'getEvent', backendType: 'query' }),
      makeCapability({ name: 'create_event', backendResolver: 'createEvent', backendType: 'mutation' }),
    ]);

    const report = checkDrift(schemaPath);

    expect(report.covered).toHaveLength(2);
    expect(report.covered.map(c => c.resolver).sort()).toEqual(['createEvent', 'getEvent']);
    expect(report.broken).toHaveLength(0);
    // getMe is not covered
    expect(report.gaps).toHaveLength(1);
    expect(report.gaps[0].resolver).toBe('getMe');

    rmSync(tmpDir, { recursive: true });
  });

  it('identifies broken mappings when CLI resolver not in backend', () => {
    const schemaPath = writeSchema(tmpDir, ['getEvent'], []);

    mockedGetAll.mockReturnValue([
      makeCapability({ name: 'get_event', backendResolver: 'getEvent', backendType: 'query' }),
      makeCapability({ name: 'get_space', backendResolver: 'getSpace', backendType: 'query' }),
    ]);

    const report = checkDrift(schemaPath);

    expect(report.covered).toHaveLength(1);
    expect(report.broken).toHaveLength(1);
    expect(report.broken[0].resolver).toBe('getSpace');
    expect(report.broken[0].tool).toBe('get_space');
    expect(report.broken[0].reason).toContain('not found in backend schema');

    rmSync(tmpDir, { recursive: true });
  });

  it('identifies gaps (backend resolver with no CLI tool)', () => {
    const schemaPath = writeSchema(tmpDir, ['getEvent', 'getMe', 'getSpace'], ['createEvent', 'updateEvent']);

    mockedGetAll.mockReturnValue([
      makeCapability({ name: 'get_event', backendResolver: 'getEvent', backendType: 'query' }),
    ]);

    const report = checkDrift(schemaPath);

    expect(report.covered).toHaveLength(1);
    expect(report.gaps.length).toBeGreaterThanOrEqual(3);
    const gapResolvers = report.gaps.map(g => g.resolver);
    expect(gapResolvers).toContain('getMe');
    expect(gapResolvers).toContain('getSpace');
    expect(gapResolvers).toContain('createEvent');
    expect(gapResolvers).toContain('updateEvent');

    rmSync(tmpDir, { recursive: true });
  });

  it('handles ai prefix variants', () => {
    const schemaPath = writeSchema(tmpDir, ['aiGetEvent', 'getEvent'], ['aiCreateEvent', 'createEvent']);

    // CLI uses aiCreateEvent, backend has both aiCreateEvent and createEvent
    mockedGetAll.mockReturnValue([
      makeCapability({ name: 'create_event', backendResolver: 'aiCreateEvent', backendType: 'mutation' }),
      makeCapability({ name: 'get_event', backendResolver: 'getEvent', backendType: 'query' }),
    ]);

    const report = checkDrift(schemaPath);

    expect(report.broken).toHaveLength(0);
    // Both ai and non-ai variants should be matched
    expect(report.covered).toHaveLength(2);

    rmSync(tmpDir, { recursive: true });
  });

  it('handles ai prefix when CLI has non-ai name but backend only has ai variant', () => {
    const schemaPath = writeSchema(tmpDir, ['aiGetEvent'], []);

    mockedGetAll.mockReturnValue([
      makeCapability({ name: 'get_event', backendResolver: 'getEvent', backendType: 'query' }),
    ]);

    const report = checkDrift(schemaPath);

    // Should find aiGetEvent as a match for getEvent
    expect(report.broken).toHaveLength(0);
    expect(report.covered).toHaveLength(1);
    expect(report.covered[0].resolver).toBe('aiGetEvent');

    rmSync(tmpDir, { recursive: true });
  });

  it('calculates coverage percentage correctly', () => {
    const schemaPath = writeSchema(tmpDir, ['getEvent', 'getMe', 'getSpace', 'getUser'], []);

    mockedGetAll.mockReturnValue([
      makeCapability({ name: 'get_event', backendResolver: 'getEvent', backendType: 'query' }),
      makeCapability({ name: 'get_me', backendResolver: 'getMe', backendType: 'query' }),
    ]);

    const report = checkDrift(schemaPath);

    expect(report.totalBackendResolvers).toBe(4);
    expect(report.totalCliResolvers).toBe(2);
    expect(report.coveragePercent).toBe(50);

    rmSync(tmpDir, { recursive: true });
  });

  it('skips capabilities without backendResolver', () => {
    const schemaPath = writeSchema(tmpDir, ['getEvent'], []);

    mockedGetAll.mockReturnValue([
      makeCapability({ name: 'get_event', backendResolver: 'getEvent', backendType: 'query' }),
      makeCapability({ name: 'local_tool', backendResolver: undefined, backendType: 'none', backendService: 'local' }),
    ]);

    const report = checkDrift(schemaPath);

    expect(report.covered).toHaveLength(1);
    expect(report.broken).toHaveLength(0);
    expect(report.totalCliResolvers).toBe(1); // Only counts caps with backendResolver

    rmSync(tmpDir, { recursive: true });
  });

  it('returns empty report for empty schema', () => {
    const schemaPath = writeSchema(tmpDir, [], []);
    mockedGetAll.mockReturnValue([]);

    const report = checkDrift(schemaPath);

    expect(report.totalBackendResolvers).toBe(0);
    expect(report.totalCliResolvers).toBe(0);
    expect(report.coveragePercent).toBe(0);
    expect(report.covered).toHaveLength(0);
    expect(report.broken).toHaveLength(0);
    expect(report.gaps).toHaveLength(0);

    rmSync(tmpDir, { recursive: true });
  });
});
