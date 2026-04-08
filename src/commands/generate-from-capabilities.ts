import { Command } from 'commander';
import { getAllCapabilities } from '../chat/tools/registry.js';
import { setFlagApiKey } from '../auth/store.js';
import type { CanonicalCapability } from '../capabilities/types.js';
import type { ToolParam } from '../chat/providers/interface.js';

const NAME_MAP: Record<string, { group: string; subcommand: string } | null> = {
  get_me: { group: 'auth', subcommand: 'me' },
  cli_version: { group: 'system', subcommand: 'version' },
  tool_search: null, // skip — system tool, not useful as CLI
};

const PREFIX_REMAP: Record<string, string> = {
  accept_event: 'event',
  decline_event: 'event',
};

export function deriveGroupAndSubcommand(
  name: string,
): { group: string; subcommand: string } | null {
  if (name in NAME_MAP) return NAME_MAP[name];

  // Check prefix remaps (e.g. accept_event → event:accept)
  for (const [prefix, group] of Object.entries(PREFIX_REMAP)) {
    if (name === prefix) {
      const sub = name.split('_')[0];
      return { group, subcommand: sub };
    }
  }

  const parts = name.split('_');
  if (parts.length < 2) return null;

  const group = parts[0];
  const subcommand = parts.slice(1).join('-');
  return { group, subcommand };
}

function toKebab(snakeName: string): string {
  return snakeName.replace(/_/g, '-');
}

function toCamel(snakeName: string): string {
  return snakeName.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function isArrayType(type: ToolParam['type']): boolean {
  return type === 'string[]' || type === 'number[]' || type === 'object[]';
}

function addParamOption(cmd: Command, param: ToolParam): void {
  const kebab = toKebab(param.name);

  if (param.type === 'boolean') {
    if (param.required) {
      cmd.requiredOption(`--${kebab}`, param.description);
    } else {
      cmd.option(`--${kebab}`, param.description);
    }
  } else if (isArrayType(param.type)) {
    if (param.required) {
      cmd.requiredOption(`--${kebab} <values...>`, param.description);
    } else {
      cmd.option(`--${kebab} <values...>`, param.description);
    }
  } else {
    if (param.required) {
      cmd.requiredOption(`--${kebab} <value>`, param.description);
    } else {
      cmd.option(`--${kebab} <value>`, param.description);
    }
  }
}

function getOrCreateGroup(program: Command, name: string): Command {
  const existing = program.commands.find((c) => c.name() === name);
  if (existing) return existing;
  return program.command(name).description(`Manage ${name}`);
}

function buildAction(cap: CanonicalCapability) {
  return async (opts: Record<string, unknown>) => {
    try {
      if (opts.apiKey) setFlagApiKey(opts.apiKey as string);

      const args: Record<string, unknown> = {};
      for (const param of cap.params) {
        const camelKey = toCamel(param.name);
        if (opts[camelKey] !== undefined) {
          let val = opts[camelKey];
          if (param.type === 'number') val = parseFloat(val as string);
          args[param.name] = val;
        }
      }

      const result = await cap.execute(args);

      if (opts.apiKey) setFlagApiKey(undefined);

      if (opts.json) {
        console.log(JSON.stringify({ ok: true, data: result }, null, 2));
      } else if (cap.formatResult) {
        console.log(cap.formatResult(result));
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      if (opts.apiKey) setFlagApiKey(undefined);
      if (opts.json) {
        console.log(
          JSON.stringify({
            ok: false,
            error: {
              message:
                error instanceof Error ? error.message : String(error),
            },
          }),
        );
      } else {
        console.error(
          error instanceof Error ? error.message : String(error),
        );
        process.exit(1);
      }
    }
  };
}

export function registerCapabilityCommands(
  program: Command,
  registered: Set<string>,
): void {
  const capabilities = getAllCapabilities();

  for (const cap of capabilities) {
    if (!cap.surfaces.includes('cliCommand')) continue;

    const derived = deriveGroupAndSubcommand(cap.name);
    if (!derived) continue;

    const { group, subcommand } = derived;
    const key = `${group}:${subcommand}`;

    if (registered.has(key)) continue;

    const parent = getOrCreateGroup(program, group);

    const cmd = parent.command(subcommand).description(cap.description);

    for (const param of cap.params) {
      addParamOption(cmd, param);
    }

    cmd.option('--json', 'Output as JSON');
    cmd.option('--api-key <key>', 'API key override');

    cmd.action(buildAction(cap));

    registered.add(key);
  }
}
