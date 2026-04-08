import { Command } from 'commander';
import { getAllCapabilities } from '../chat/tools/registry.js';
import { getOrCreateGroup } from './loader.js';
import { setFlagApiKey } from '../auth/store.js';
import type { CanonicalCapability } from '../capabilities/types.js';
import type { ToolParam } from '../chat/providers/interface.js';

const NAME_MAP: Record<string, { group: string; subcommand: string } | null> = {
  get_me: { group: 'auth', subcommand: 'me' },
  cli_version: { group: 'system', subcommand: 'version' },
  tool_search: null, // skip — system tool, not useful as CLI
};

const NAME_OVERRIDES: Record<string, string> = {
  accept_event: 'event',
  decline_event: 'event',
};

export function deriveGroupAndSubcommand(
  name: string,
): { group: string; subcommand: string } | null {
  if (name in NAME_MAP) return NAME_MAP[name];

  // Check exact name overrides (e.g. accept_event → event:accept)
  if (name in NAME_OVERRIDES) {
    const sub = name.split('_')[0];
    return { group: NAME_OVERRIDES[name], subcommand: sub };
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

export function toCamel(snakeName: string): string {
  return snakeName.replace(/_([a-z0-9])/gi, (_, c: string) => c.toUpperCase());
}

function isObjectType(type: ToolParam['type']): type is { type: 'object'; properties: Record<string, ToolParam> } {
  return typeof type === 'object' && type !== null && 'type' in type && type.type === 'object';
}

function isArrayType(type: ToolParam['type']): boolean {
  return type === 'string[]' || type === 'number[]' || type === 'object[]';
}

function addParamOption(cmd: Command, param: ToolParam): void {
  const kebab = toKebab(param.name);

  if (param.type === 'boolean') {
    cmd.option(`--${kebab}`, param.description);
  } else if (isObjectType(param.type)) {
    if (param.required) {
      cmd.requiredOption(`--${kebab} <json>`, param.description);
    } else {
      cmd.option(`--${kebab} <json>`, param.description);
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

function buildAction(cap: CanonicalCapability) {
  return async (opts: Record<string, unknown>) => {
    const hadApiKey = !!opts.apiKey;
    try {
      if (opts.apiKey) setFlagApiKey(opts.apiKey as string);

      const args: Record<string, unknown> = {};
      for (const param of cap.params) {
        const camelKey = toCamel(param.name);
        if (opts[camelKey] !== undefined) {
          let val = opts[camelKey];

          // Coerce to number, reject NaN
          if (param.type === 'number') {
            const num = Number(val);
            if (isNaN(num)) {
              console.error(`Warning: invalid number for --${toKebab(param.name)}: ${val}`);
              continue;
            }
            val = num;
          } else if (param.type === 'number[]' && Array.isArray(val)) {
            const nums: number[] = [];
            let hasInvalid = false;
            for (const el of val) {
              const num = Number(el);
              if (isNaN(num)) {
                console.error(`Warning: invalid number in --${toKebab(param.name)}: ${el}`);
                hasInvalid = true;
                break;
              }
              nums.push(num);
            }
            if (hasInvalid) continue;
            val = nums;
          } else if (param.type === 'object[]' && Array.isArray(val)) {
            const objs: unknown[] = [];
            for (const el of val) {
              try {
                objs.push(JSON.parse(el as string));
              } catch {
                console.error(`Warning: invalid JSON element in --${toKebab(param.name)}: ${el}`);
                objs.push(el);
              }
            }
            val = objs;
          } else if (isObjectType(param.type)) {
            try {
              val = JSON.parse(val as string);
            } catch (e) {
              console.error(`Error: invalid JSON for --${toKebab(param.name)}: ${(e as Error).message}`);
              process.exitCode = 1;
              return;
            }
          }

          args[param.name] = val;
        }
      }

      const result = await cap.execute(args);

      if (opts.json) {
        console.log(JSON.stringify({ ok: true, data: result }, null, 2));
      } else if (cap.formatResult) {
        console.log(cap.formatResult(result));
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      if (opts.json) {
        process.exitCode = 1;
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
    } finally {
      // Clear API key override
      if (hadApiKey) setFlagApiKey(undefined);
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
