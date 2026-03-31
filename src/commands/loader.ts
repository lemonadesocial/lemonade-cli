import { Command } from 'commander';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface CommandModule {
  group: string;
  subcommand: string;
  description?: string;
  register: (parent: Command) => void;
}

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

function debug(msg: string): void {
  if (DEBUG) {
    process.stderr.write(`[loader] ${msg}\n`);
  }
}

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function getOrCreateGroup(program: Command, name: string): Command {
  const existing = program.commands.find((c) => c.name() === name);
  if (existing) return existing;
  return program.command(name).description(`Manage ${name}`);
}

async function loadModulesFromDir(dir: string): Promise<CommandModule[]> {
  const modules: CommandModule[] = [];

  for (const file of safeReaddir(dir)) {
    if (file.startsWith('_')) continue;
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const mod = await import(join(dir, file)) as CommandModule;
      if (mod.group && mod.subcommand && typeof mod.register === 'function') {
        modules.push(mod);
      }
    } catch (err) {
      debug(`Failed to load ${file}: ${(err as Error).message}`);
    }
  }

  return modules;
}

export async function loadGeneratedCommands(program: Command): Promise<void> {
  const registered = new Set<string>();

  // Phase 1: Detect manual commands already registered
  for (const group of program.commands) {
    for (const cmd of group.commands) {
      const key = `${group.name()}:${cmd.name()}`;
      registered.add(key);
      debug(`manual: ${key}`);
    }
  }

  // Phase 2: Load MCP-generated commands (skip if manual override exists)
  const generatedDir = join(import.meta.dirname, 'generated');
  const generatedModules = await loadModulesFromDir(generatedDir);

  for (const mod of generatedModules) {
    const key = `${mod.group}:${mod.subcommand}`;
    if (registered.has(key)) {
      debug(`skip generated (manual override): ${key}`);
      continue;
    }

    const parent = getOrCreateGroup(program, mod.group);
    mod.register(parent);
    registered.add(key);
    debug(`generated: ${key}`);
  }

  // Phase 3: Load GraphQL-extended commands (skip if manual or MCP override exists)
  const extendedDir = join(import.meta.dirname, 'extended');
  const extendedModules = await loadModulesFromDir(extendedDir);

  for (const mod of extendedModules) {
    const key = `${mod.group}:${mod.subcommand}`;
    if (registered.has(key)) {
      debug(`skip extended (override exists): ${key}`);
      continue;
    }

    const parent = getOrCreateGroup(program, mod.group);
    mod.register(parent);
    registered.add(key);
    debug(`extended: ${key}`);
  }
}

export function checkSchemaVersion(): void {
  try {
    const markerPath = join(import.meta.dirname, 'generated', '_schema-version.json');
    const marker = JSON.parse(readFileSync(markerPath, 'utf-8'));
    const builtVersion = marker.version as string;

    if (!builtVersion) return;

    const [builtMajor] = builtVersion.split('.').map(Number);
    const cliVersion = process.env.npm_package_version || '0.0.0';
    const [cliMajor] = cliVersion.split('.').map(Number);

    if (builtMajor !== undefined && cliMajor !== undefined && builtMajor > 0 && cliMajor > 0) {
      // Version check is best-effort for now.
    }
  } catch {
    // No schema version marker
  }
}
