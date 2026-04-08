import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import {
  registerCapabilityCommands,
  deriveGroupAndSubcommand,
} from '../../../src/commands/generate-from-capabilities.js';
import type { CanonicalCapability } from '../../../src/capabilities/types.js';
import type { ToolParam } from '../../../src/chat/providers/interface.js';

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

/** Helper: register a single cap and return its Command for parseAsync */
function registerAndGetCmd(cap: CanonicalCapability): Command {
  mockedGetAll.mockReturnValue([cap]);
  const program = new Command();
  program.exitOverride(); // prevent process.exit in tests
  const registered = new Set<string>();
  registerCapabilityCommands(program, registered);
  const derived = deriveGroupAndSubcommand(cap.name)!;
  const group = program.commands.find(c => c.name() === derived.group)!;
  return group.commands.find(c => c.name() === derived.subcommand)!;
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

describe('action handler', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let savedExitCode: number | undefined;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    savedExitCode = process.exitCode;
    mockedGetAll.mockReset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.exitCode = savedExitCode;
  });

  // F10: number coercion
  it('coerces number params with Number()', async () => {
    const executeFn = vi.fn(async (args: Record<string, unknown>) => args);
    const cap = makeCap({
      name: 'test_num',
      params: [{ name: 'count', type: 'number', description: 'A count', required: false }],
      execute: executeFn,
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync(['--count', '42'], { from: 'user' });

    expect(executeFn).toHaveBeenCalledWith({ count: 42 });
    expect(typeof executeFn.mock.calls[0][0].count).toBe('number');
  });

  // F10: --json wraps in { ok: true, data: ... }
  it('wraps output in { ok: true, data } with --json', async () => {
    const cap = makeCap({
      name: 'test_json',
      execute: vi.fn(async () => ({ result: 'hello' })),
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync(['--json'], { from: 'user' });

    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output).toEqual({ ok: true, data: { result: 'hello' } });
  });

  // F10: error with --json returns { ok: false, error } + exit code 1
  it('returns { ok: false, error } with exit code 1 on --json error', async () => {
    const cap = makeCap({
      name: 'test_err',
      execute: vi.fn(async () => { throw new Error('boom'); }),
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync(['--json'], { from: 'user' });

    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output).toEqual({ ok: false, error: { message: 'boom' } });
    expect(process.exitCode).toBe(1);
  });

  // F10: formatResult is called when present
  it('calls formatResult when present and --json is not set', async () => {
    const cap = makeCap({
      name: 'test_fmt',
      execute: vi.fn(async () => ({ x: 1 })),
      formatResult: (r: unknown) => `formatted: ${JSON.stringify(r)}`,
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync([], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith('formatted: {"x":1}');
  });

  // F1: number[] array coercion
  it('coerces number[] array values through Number()', async () => {
    const executeFn = vi.fn(async (args: Record<string, unknown>) => args);
    const cap = makeCap({
      name: 'test_nums',
      params: [{ name: 'ids', type: 'number[]' as const, description: 'IDs', required: false }],
      execute: executeFn,
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync(['--ids', '1', '2', '3'], { from: 'user' });

    expect(executeFn).toHaveBeenCalledWith({ ids: [1, 2, 3] });
    for (const n of executeFn.mock.calls[0][0].ids as number[]) {
      expect(typeof n).toBe('number');
    }
  });

  // F6: invalid number warns and skips
  it('warns on invalid number and skips param', async () => {
    const executeFn = vi.fn(async (args: Record<string, unknown>) => args);
    const cap = makeCap({
      name: 'test_badnum',
      params: [{ name: 'count', type: 'number', description: 'A count', required: false }],
      execute: executeFn,
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync(['--count', 'abc'], { from: 'user' });

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('invalid number'));
    expect(executeFn).toHaveBeenCalledWith({});
  });

  // F11: object type param parses JSON
  it('parses object type params from JSON string', async () => {
    const executeFn = vi.fn(async (args: Record<string, unknown>) => args);
    const cap = makeCap({
      name: 'test_obj',
      params: [{
        name: 'config',
        type: { type: 'object', properties: {} } as ToolParam['type'],
        description: 'Config object',
        required: false,
      }],
      execute: executeFn,
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync(['--config', '{"key":"value"}'], { from: 'user' });

    expect(executeFn).toHaveBeenCalledWith({ config: { key: 'value' } });
  });

  // F11: invalid JSON for object type param
  it('reports error for invalid JSON in object param', async () => {
    const executeFn = vi.fn(async () => ({}));
    const cap = makeCap({
      name: 'test_badjson',
      params: [{
        name: 'config',
        type: { type: 'object', properties: {} } as ToolParam['type'],
        description: 'Config object',
        required: false,
      }],
      execute: executeFn,
    });

    const cmd = registerAndGetCmd(cap);
    await cmd.parseAsync(['--config', 'not-json'], { from: 'user' });

    expect(executeFn).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
