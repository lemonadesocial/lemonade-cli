import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Command } from 'commander';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// The loader scans src/commands/generated/ and src/commands/extended/
// relative to its own import.meta.dirname (src/commands/).
// We create temporary files there for testing.

const COMMANDS_DIR = join(__dirname, '..', '..', '..', 'src', 'commands');
const GENERATED_DIR = join(COMMANDS_DIR, 'generated');
const EXTENDED_DIR = join(COMMANDS_DIR, 'extended');

function writeCommandModule(dir: string, filename: string, group: string, subcommand: string): void {
  const content = `
    export const group = '${group}';
    export const subcommand = '${subcommand}';
    export const description = 'test ${group} ${subcommand}';
    export function register(parent) {
      parent.command('${subcommand}').description('test ${group} ${subcommand}');
    };
  `;
  writeFileSync(join(dir, filename), content);
}

describe('loader priority', () => {
  beforeAll(() => {
    mkdirSync(GENERATED_DIR, { recursive: true });
    mkdirSync(EXTENDED_DIR, { recursive: true });

    // Generated command: "test-group test-sub"
    writeCommandModule(GENERATED_DIR, 'test-cmd.js', 'test-group', 'test-sub');

    // Extended command with same key (should be skipped due to generated taking priority)
    writeCommandModule(EXTENDED_DIR, 'test-cmd.js', 'test-group', 'test-sub');

    // Extended command that has no conflict
    writeCommandModule(EXTENDED_DIR, 'unique-cmd.js', 'test-group', 'unique-sub');
  });

  afterAll(() => {
    if (existsSync(GENERATED_DIR)) rmSync(GENERATED_DIR, { recursive: true });
    if (existsSync(EXTENDED_DIR)) rmSync(EXTENDED_DIR, { recursive: true });
  });

  it('manual commands take priority over generated', async () => {
    const program = new Command();
    program.name('lemonade');

    // Register a manual "event search" before loading generated
    const eventGroup = program.command('event').description('Event commands');
    eventGroup.command('search').description('manual search');

    const { loadGeneratedCommands } = await import('../../../src/commands/loader');
    await loadGeneratedCommands(program);

    const event = program.commands.find((c) => c.name() === 'event');
    expect(event).toBeDefined();

    const search = event!.commands.find((c) => c.name() === 'search');
    expect(search).toBeDefined();
    expect(search!.description()).toBe('manual search');
  });

  it('generated commands take priority over extended', async () => {
    const program = new Command();
    program.name('lemonade');

    const { loadGeneratedCommands } = await import('../../../src/commands/loader');
    await loadGeneratedCommands(program);

    const group = program.commands.find((c) => c.name() === 'test-group');
    expect(group).toBeDefined();

    // test-sub should exist (from generated), not duplicated
    const subs = group!.commands.filter((c) => c.name() === 'test-sub');
    expect(subs).toHaveLength(1);
  });

  it('extended commands load when no conflict exists', async () => {
    const program = new Command();
    program.name('lemonade');

    const { loadGeneratedCommands } = await import('../../../src/commands/loader');
    await loadGeneratedCommands(program);

    const group = program.commands.find((c) => c.name() === 'test-group');
    expect(group).toBeDefined();

    const unique = group!.commands.find((c) => c.name() === 'unique-sub');
    expect(unique).toBeDefined();
    expect(unique!.description()).toBe('test test-group unique-sub');
  });
});
