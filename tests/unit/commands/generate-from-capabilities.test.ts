import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import {
  registerCapabilityCommands,
  deriveGroupAndSubcommand,
} from '../../../src/commands/generate-from-capabilities.js';
import type { CanonicalCapability } from '../../../src/capabilities/types.js';

// Mock the registry to control which capabilities are returned
vi.mock('../../../src/chat/tools/registry.js', () => ({
  getAllCapabilities: vi.fn(() => []),
}));

// Mock auth store
vi.mock('../../../src/auth/store.js', () => ({
  setFlagApiKey: vi.fn(),
}));

import { getAllCapabilities } from '../../../src/chat/tools/registry.js';

const mockedGetAll = vi.mocked(getAllCapabilities);

function makeCap(
  overrides: Partial<CanonicalCapability> & Pick<CanonicalCapability, 'name'>,
): CanonicalCapability {
  return {
    displayName: overrides.name,
    description: `Description for ${overrides.name}`,
    category: 'event',
    params: [],
    destructive: false,
    execute: vi.fn(async () => ({})),
    backendType: 'query',
    backendService: 'graphql',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['cliCommand'],
    ...overrides,
  };
}

describe('registerCapabilityCommands', () => {
  let program: Command;
  let registered: Set<string>;

  beforeEach(() => {
    program = new Command();
    registered = new Set<string>();
    mockedGetAll.mockReset();
  });

  it('is a function', () => {
    expect(typeof registerCapabilityCommands).toBe('function');
  });

  it('registers commands for capabilities with cliCommand surface', () => {
    mockedGetAll.mockReturnValue([
      makeCap({ name: 'event_create' }),
      makeCap({ name: 'event_list', surfaces: ['aiTool'] }), // no cliCommand
    ]);

    registerCapabilityCommands(program, registered);

    expect(registered.has('event:create')).toBe(true);
    expect(registered.has('event:list')).toBe(false);
  });

  it('skips capabilities already in the registered set', () => {
    mockedGetAll.mockReturnValue([makeCap({ name: 'event_create' })]);

    registered.add('event:create');
    registerCapabilityCommands(program, registered);

    // The group command should not have been created since the only cap was skipped
    const eventGroup = program.commands.find((c) => c.name() === 'event');
    expect(eventGroup).toBeUndefined();
  });

  it('adds --json and --api-key options to every generated command', () => {
    mockedGetAll.mockReturnValue([makeCap({ name: 'event_create' })]);

    registerCapabilityCommands(program, registered);

    const eventGroup = program.commands.find((c) => c.name() === 'event');
    expect(eventGroup).toBeDefined();

    const createCmd = eventGroup!.commands.find((c) => c.name() === 'create');
    expect(createCmd).toBeDefined();

    const optionFlags = createCmd!.options.map((o) => o.long);
    expect(optionFlags).toContain('--json');
    expect(optionFlags).toContain('--api-key');
  });

  it('adds param options to generated commands', () => {
    mockedGetAll.mockReturnValue([
      makeCap({
        name: 'event_create',
        params: [
          { name: 'title', type: 'string', description: 'Event title', required: true },
          { name: 'guest_limit', type: 'number', description: 'Max guests', required: false },
          { name: 'virtual', type: 'boolean', description: 'Virtual event', required: false },
          { name: 'tags', type: 'string[]', description: 'Tags', required: false },
        ],
      }),
    ]);

    registerCapabilityCommands(program, registered);

    const eventGroup = program.commands.find((c) => c.name() === 'event');
    const createCmd = eventGroup!.commands.find((c) => c.name() === 'create');
    const optionFlags = createCmd!.options.map((o) => o.long);

    expect(optionFlags).toContain('--title');
    expect(optionFlags).toContain('--guest-limit');
    expect(optionFlags).toContain('--virtual');
    expect(optionFlags).toContain('--tags');
  });
});

describe('deriveGroupAndSubcommand', () => {
  it('derives event:create from event_create', () => {
    expect(deriveGroupAndSubcommand('event_create')).toEqual({
      group: 'event',
      subcommand: 'create',
    });
  });

  it('derives tickets:create-type from tickets_create_type', () => {
    expect(deriveGroupAndSubcommand('tickets_create_type')).toEqual({
      group: 'tickets',
      subcommand: 'create-type',
    });
  });

  it('maps get_me to auth:me', () => {
    expect(deriveGroupAndSubcommand('get_me')).toEqual({
      group: 'auth',
      subcommand: 'me',
    });
  });

  it('maps cli_version to system:version', () => {
    expect(deriveGroupAndSubcommand('cli_version')).toEqual({
      group: 'system',
      subcommand: 'version',
    });
  });

  it('skips tool_search (returns null)', () => {
    expect(deriveGroupAndSubcommand('tool_search')).toBeNull();
  });

  it('maps accept_event to event:accept', () => {
    expect(deriveGroupAndSubcommand('accept_event')).toEqual({
      group: 'event',
      subcommand: 'accept',
    });
  });

  it('maps decline_event to event:decline', () => {
    expect(deriveGroupAndSubcommand('decline_event')).toEqual({
      group: 'event',
      subcommand: 'decline',
    });
  });

  it('returns null for single-part names', () => {
    expect(deriveGroupAndSubcommand('event')).toBeNull();
  });
});
