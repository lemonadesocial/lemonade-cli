import { Command } from 'commander';
import { jsonSuccess } from '../../output/json';
import { handleError } from '../../output/error';
import {
  getConfig,
  getConfigPath,
  initConfig,
  setConfigValue,
  configExists,
} from '../../auth/store';
import { VALID_CONFIG_KEYS, ValidConfigKey } from '../../config/defaults';

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
    .option('--json', 'Output as JSON')
    .action((key: string, value: string, opts) => {
      try {
        if (!VALID_CONFIG_KEYS.includes(key as ValidConfigKey)) {
          throw new Error(`Invalid key "${key}". Valid keys: ${VALID_CONFIG_KEYS.join(', ')}`);
        }

        setConfigValue(key as ValidConfigKey, value);

        if (opts.json) {
          console.log(jsonSuccess({ key, value }));
        } else {
          console.log(`Set ${key} = ${value}`);
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
            console.log(jsonSuccess(cfg));
          } else {
            const entries = Object.entries(cfg).filter(([, v]) => v !== undefined);
            for (const [k, v] of entries) {
              console.log(`${k} = ${v}`);
            }
          }
          return;
        }

        const value = (cfg as Record<string, unknown>)[key];
        if (value === undefined) {
          throw new Error(`Key "${key}" is not set.`);
        }

        if (opts.json) {
          console.log(jsonSuccess({ key, value }));
        } else {
          console.log(String(value));
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}
