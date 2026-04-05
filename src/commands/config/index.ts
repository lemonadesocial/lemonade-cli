import { Command } from 'commander';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { SENSITIVE_KEYS, redactValue } from '../../output/redact.js';
import {
  getConfig,
  getConfigPath,
  initConfig,
  setConfigValue,
  configExists,
} from '../../auth/store.js';
import { VALID_CONFIG_KEYS, ValidConfigKey } from '../../config/defaults.js';

export function registerConfigCommands(program: Command): void {
  const config = program
    .command('config')
    .description('Manage CLI configuration');

  config
    .command('init')
    .description('Initialize config file')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const created = initConfig();
        const path = getConfigPath();

        if (opts.json) {
          console.log(jsonSuccess({ path, created }));
        } else {
          if (created) {
            console.log(`Config initialized at ${path}`);
          } else {
            console.log(`Config already exists at ${path}`);
          }
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  config
    .command('set <key> <value>')
    .description('Set a config value')
    .addHelpText('after', `\nValid keys:\n  ${VALID_CONFIG_KEYS.join('\n  ')}`)
    .option('--json', 'Output as JSON')
    .action((key: string, value: string, opts) => {
      try {
        if (!VALID_CONFIG_KEYS.includes(key as ValidConfigKey)) {
          throw new Error(`Invalid key "${key}". Valid keys: ${VALID_CONFIG_KEYS.join(', ')}`);
        }

        setConfigValue(key as ValidConfigKey, value);

        const displayValue = redactValue(key, value);
        if (opts.json) {
          console.log(jsonSuccess({ key, value: displayValue }));
        } else {
          console.log(`Set ${key} = ${displayValue}`);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  config
    .command('get [key]')
    .description('Get a config value (or all config)')
    .option('--json', 'Output as JSON')
    .action((key: string | undefined, opts) => {
      try {
        if (!configExists()) {
          throw new Error('No config file found. Run "lemonade config init" first.');
        }

        const cfg = getConfig();

        if (!key) {
          if (opts.json) {
            const redacted: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(cfg)) {
              if (v === undefined) continue;
              redacted[k] = SENSITIVE_KEYS.has(k) ? redactValue(k, v) : v;
            }
            console.log(jsonSuccess(redacted));
          } else {
            const entries = Object.entries(cfg).filter(([, v]) => v !== undefined);
            for (const [k, v] of entries) {
              console.log(`${k} = ${redactValue(k, v)}`);
            }
          }
          return;
        }

        const value = (cfg as Record<string, unknown>)[key];
        if (value === undefined) {
          throw new Error(`Key "${key}" is not set.`);
        }

        if (opts.json) {
          console.log(jsonSuccess({ key, value: redactValue(key, value) }));
        } else {
          console.log(redactValue(key, value));
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}
