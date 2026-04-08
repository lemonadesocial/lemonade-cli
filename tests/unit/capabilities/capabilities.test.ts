import { describe, it, expect } from 'vitest';
import { buildCapability } from '../../../src/capabilities/factory.js';
import { toToolDef, capabilitiesToRegistry } from '../../../src/capabilities/adapter.js';
import type { CanonicalCapability } from '../../../src/capabilities/types.js';
import type { ToolDef } from '../../../src/chat/providers/interface.js';

// Minimal valid input for buildCapability
function makeInput(overrides: Partial<Parameters<typeof buildCapability>[0]> = {}) {
  return {
    name: 'test_tool',
    displayName: 'Test Tool',
    description: 'A test tool',
    category: 'system' as const,
    params: [],
    destructive: false,
    execute: async () => ({ ok: true }),
    backendType: 'mutation' as const,
    ...overrides,
  };
}

describe('buildCapability', () => {
  it('applies fail-closed defaults correctly', () => {
    const cap = buildCapability(makeInput());

    expect(cap.backendType).toBe('mutation');
    expect(cap.backendService).toBe('graphql');
    expect(cap.requiresSpace).toBe(true);
    expect(cap.requiresEvent).toBe(true);
    expect(cap.deprecated).toBe(false);
    expect(cap.experimental).toBe(false);
    expect(cap.surfaces).toEqual(['aiTool']);
  });

  it('respects overrides for all defaulted fields', () => {
    const cap = buildCapability(makeInput({
      backendType: 'query',
      backendService: 'atlas',
      requiresSpace: false,
      requiresEvent: false,
      deprecated: true,
      experimental: true,
      surfaces: ['cliCommand', 'slashCommand'],
    }));

    expect(cap.backendType).toBe('query');
    expect(cap.backendService).toBe('atlas');
    expect(cap.requiresSpace).toBe(false);
    expect(cap.requiresEvent).toBe(false);
    expect(cap.deprecated).toBe(true);
    expect(cap.experimental).toBe(true);
    expect(cap.surfaces).toEqual(['cliCommand', 'slashCommand']);
  });

  it('preserves optional metadata fields', () => {
    const cap = buildCapability(makeInput({
      backendResolver: 'getEvents',
      whenToUse: 'when user asks about events',
      tags: ['events', 'hosting'],
      permissions: ['space_admin', 'event_host'],
    }));

    expect(cap.backendResolver).toBe('getEvents');
    expect(cap.whenToUse).toBe('when user asks about events');
    expect(cap.tags).toEqual(['events', 'hosting']);
    expect(cap.permissions).toEqual(['space_admin', 'event_host']);
  });

  it('uses fail-closed defaults when explicit undefined is passed for defaulted fields', () => {
    const cap = buildCapability(makeInput({
      requiresSpace: undefined,
      requiresEvent: undefined,
      backendService: undefined,
      deprecated: undefined,
      experimental: undefined,
      surfaces: undefined,
    }));

    expect(cap.requiresSpace).toBe(true);
    expect(cap.requiresEvent).toBe(true);
    expect(cap.backendService).toBe('graphql');
    expect(cap.deprecated).toBe(false);
    expect(cap.experimental).toBe(false);
    expect(cap.surfaces).toEqual(['aiTool']);
  });

  it('creates a fresh surfaces array (not shared reference)', () => {
    const cap1 = buildCapability(makeInput());
    const cap2 = buildCapability(makeInput());

    cap1.surfaces.push('cliCommand');
    expect(cap2.surfaces).toEqual(['aiTool']);
  });

  it('preserves required fields from input', () => {
    const execute = async () => ({ result: 'done' });
    const cap = buildCapability(makeInput({
      name: 'my_tool',
      displayName: 'My Tool',
      description: 'Does stuff',
      category: 'event',
      params: [{ name: 'id', type: 'string', description: 'Event ID', required: true }],
      destructive: true,
      execute,
    }));

    expect(cap.name).toBe('my_tool');
    expect(cap.displayName).toBe('My Tool');
    expect(cap.description).toBe('Does stuff');
    expect(cap.category).toBe('event');
    expect(cap.params).toHaveLength(1);
    expect(cap.params[0].name).toBe('id');
    expect(cap.destructive).toBe(true);
    expect(cap.execute).toBe(execute);
  });
});

describe('toToolDef', () => {
  it('strips metadata fields, preserving only ToolDef fields', () => {
    const cap = buildCapability(makeInput({
      backendResolver: 'doStuff',
      backendType: 'query',
      backendService: 'atlas',
      requiresSpace: true,
      requiresEvent: true,
      permissions: ['space_admin'],
      deprecated: true,
      experimental: true,
      whenToUse: 'always',
      tags: ['test'],
      surfaces: ['aiTool', 'cliCommand'],
    }));

    const toolDef = toToolDef(cap);

    // ToolDef fields present
    expect(toolDef.name).toBe('test_tool');
    expect(toolDef.category).toBe('system');
    expect(toolDef.displayName).toBe('Test Tool');
    expect(toolDef.description).toBe('A test tool');
    expect(toolDef.params).toEqual([]);
    expect(toolDef.destructive).toBe(false);
    expect(typeof toolDef.execute).toBe('function');

    // Metadata fields absent
    const keys = Object.keys(toolDef);
    expect(keys).not.toContain('backendResolver');
    expect(keys).toContain('backendType');
    expect(keys).not.toContain('backendService');
    expect(keys).not.toContain('requiresSpace');
    expect(keys).not.toContain('requiresEvent');
    expect(keys).not.toContain('permissions');
    expect(keys).not.toContain('deprecated');
    expect(keys).not.toContain('experimental');
    expect(keys).not.toContain('whenToUse');
    expect(keys).not.toContain('tags');
    expect(keys).not.toContain('surfaces');
  });

  it('preserves formatResult when present', () => {
    const formatter = (r: unknown) => `Result: ${String(r)}`;
    const cap = buildCapability(makeInput({ formatResult: formatter }));
    const toolDef = toToolDef(cap);

    expect(toolDef.formatResult).toBe(formatter);
  });

  it('omits formatResult when absent', () => {
    const cap = buildCapability(makeInput());
    const toolDef = toToolDef(cap);

    expect(Object.keys(toolDef)).not.toContain('formatResult');
  });
});

describe('capabilitiesToRegistry', () => {
  it('converts array to Record<string, ToolDef>', () => {
    const caps = [
      buildCapability(makeInput({ name: 'tool_a' })),
      buildCapability(makeInput({ name: 'tool_b' })),
      buildCapability(makeInput({ name: 'tool_c' })),
    ];

    const registry = capabilitiesToRegistry(caps);

    expect(Object.keys(registry)).toEqual(['tool_a', 'tool_b', 'tool_c']);
    expect(registry['tool_a'].name).toBe('tool_a');
    expect(registry['tool_b'].name).toBe('tool_b');
    expect(registry['tool_c'].name).toBe('tool_c');
  });

  it('returns empty record for empty array', () => {
    const registry = capabilitiesToRegistry([]);
    expect(registry).toEqual({});
  });

  it('throws on duplicate capability names', () => {
    const caps = [
      buildCapability(makeInput({ name: 'dupe_tool' })),
      buildCapability(makeInput({ name: 'dupe_tool' })),
    ];

    expect(() => capabilitiesToRegistry(caps)).toThrow('Duplicate capability name: "dupe_tool"');
  });

  it('each entry is a valid ToolDef (no metadata leaks)', () => {
    const caps = [
      buildCapability(makeInput({
        name: 'enriched_tool',
        backendResolver: 'doSomething',
        whenToUse: 'when needed',
        tags: ['foo'],
        surfaces: ['aiTool', 'slashCommand'],
      })),
    ];

    const registry = capabilitiesToRegistry(caps);
    const keys = Object.keys(registry['enriched_tool']);

    expect(keys).not.toContain('backendResolver');
    expect(keys).not.toContain('whenToUse');
    expect(keys).not.toContain('tags');
    expect(keys).not.toContain('surfaces');
  });
});

describe('round-trip', () => {
  it('buildCapability → toToolDef produces valid ToolDef shape', () => {
    const execute = async (args: Record<string, unknown>) => args;
    const formatter = (r: unknown) => JSON.stringify(r);

    const cap = buildCapability({
      name: 'round_trip_tool',
      displayName: 'Round Trip',
      description: 'Tests round-trip conversion',
      category: 'event',
      params: [
        { name: 'event_id', type: 'string', description: 'The event ID', required: true },
      ],
      destructive: true,
      execute,
      formatResult: formatter,
      backendResolver: 'getEvent',
      backendType: 'query',
      backendService: 'graphql',
      requiresSpace: true,
      whenToUse: 'when user asks for event details',
    });

    const toolDef = toToolDef(cap);

    // Verify it matches ToolDef shape exactly
    expect(toolDef).toEqual({
      name: 'round_trip_tool',
      category: 'event',
      displayName: 'Round Trip',
      description: 'Tests round-trip conversion',
      params: [
        { name: 'event_id', type: 'string', description: 'The event ID', required: true },
      ],
      destructive: true,
      execute,
      formatResult: formatter,
      backendType: 'query',
    });
  });
});

describe('type safety', () => {
  it('CanonicalCapability fields are assignable to ToolDef for shared fields', () => {
    const cap: CanonicalCapability = buildCapability(makeInput());

    // This assignment should compile — toToolDef extracts a valid ToolDef
    const toolDef: ToolDef = toToolDef(cap);
    expect(toolDef.name).toBe(cap.name);
    expect(toolDef.category).toBe(cap.category);
    expect(toolDef.displayName).toBe(cap.displayName);
    expect(toolDef.description).toBe(cap.description);
    expect(toolDef.params).toBe(cap.params);
    expect(toolDef.destructive).toBe(cap.destructive);
    expect(toolDef.execute).toBe(cap.execute);
  });
});
