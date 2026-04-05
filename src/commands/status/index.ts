import { Command } from 'commander';
import chalk from 'chalk';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { renderKeyValue } from '../../output/table.js';
import {
  getConfig,
  getConfigPath,
  configExists,
  type LemonadeConfig,
} from '../../auth/store.js';

const SENSITIVE_KEYS = new Set(['access_token', 'refresh_token', 'api_key']);

const DEFAULT_API_URL = 'https://backend.lemonade.social';

const ENV_OVERRIDES = [
  'LEMONADE_API_KEY',
  'LEMONADE_API_URL',
  'LEMONADE_HYDRA_URL',
  'LEMONADE_REGISTRY_URL',
] as const;

function redact(value: string): string {
  if (value.length <= 7) return '***';
  return value.slice(0, 3) + '...' + value.slice(-4);
}

function formatRelativeTime(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < 60_000) return `${Math.round(abs / 1000)}s`;
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}m`;
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h`;
  return `${Math.round(abs / 86_400_000)}d`;
}

function getTokenStatus(config: LemonadeConfig): string {
  if (!config.access_token) return 'n/a';
  if (!config.token_expires_at) return 'unknown (no expiry recorded)';

  const remaining = config.token_expires_at - Date.now();
  if (remaining <= 0) {
    return `expired ${formatRelativeTime(remaining)} ago`;
  }
  if (remaining < 300_000) {
    return `expiring soon (expires in ${formatRelativeTime(remaining)})`;
  }
  return `valid (expires in ${formatRelativeTime(remaining)})`;
}

function getAuthMethod(config: LemonadeConfig): string {
  if (process.env.LEMONADE_API_KEY) return 'Environment (LEMONADE_API_KEY)';
  if (config.access_token) return 'OAuth';
  if (config.api_key) return 'API Key';
  return 'Not authenticated';
}

function getAuthKeyDisplay(config: LemonadeConfig): string | undefined {
  if (process.env.LEMONADE_API_KEY) return redact(process.env.LEMONADE_API_KEY);
  if (config.access_token) return redact(config.access_token);
  if (config.api_key) return redact(config.api_key);
  return undefined;
}

function getTokenStatusDisplay(config: LemonadeConfig): string {
  if (process.env.LEMONADE_API_KEY) return 'static key (no expiry)';
  if (config.access_token) return getTokenStatus(config);
  if (config.api_key) return 'static key (no expiry)';
  return 'n/a';
}

interface StatusData {
  auth: {
    method: string;
    key?: string;
    token_status: string;
  };
  space: {
    default_space: string | null;
  };
  config: {
    path: string;
    exists: boolean;
    output_format: string;
    api_url?: string;
    ai_mode?: string;
  };
  env_overrides: Record<string, string>;
}

function collectStatus(): StatusData {
  const config = getConfig();
  const cfgPath = getConfigPath();
  const cfgExists = configExists();

  const authMethod = getAuthMethod(config);
  const keyDisplay = getAuthKeyDisplay(config);
  const tokenStatus = getTokenStatusDisplay(config);

  const envOverrides: Record<string, string> = {};
  for (const envVar of ENV_OVERRIDES) {
    const val = process.env[envVar];
    if (val) {
      envOverrides[envVar] = SENSITIVE_KEYS.has('api_key') && envVar === 'LEMONADE_API_KEY'
        ? redact(val)
        : val;
    }
  }

  const statusData: StatusData = {
    auth: {
      method: authMethod,
      ...(keyDisplay ? { key: keyDisplay } : {}),
      token_status: tokenStatus,
    },
    space: {
      default_space: config.default_space || null,
    },
    config: {
      path: cfgPath,
      exists: cfgExists,
      output_format: config.output_format || 'table',
      ...(config.api_url && config.api_url !== DEFAULT_API_URL ? { api_url: config.api_url } : {}),
      ...(config.ai_mode ? { ai_mode: config.ai_mode } : {}),
    },
    env_overrides: envOverrides,
  };

  return statusData;
}

function renderHuman(status: StatusData): string {
  const sections: string[] = [];

  // Auth section
  const authPairs: Array<[string, string]> = [
    ['Method', status.auth.method],
  ];
  if (status.auth.key) {
    authPairs.push(['Key', status.auth.key]);
  }
  authPairs.push(['Token status', status.auth.token_status]);
  sections.push(chalk.bold('Auth') + '\n' + renderKeyValue(authPairs));

  // Space section
  sections.push(
    chalk.bold('Space') + '\n' +
    renderKeyValue([['Default space', status.space.default_space || 'not set']]),
  );

  // Config section
  const configPairs: Array<[string, string]> = [
    ['Config path', status.config.path],
    ['Config exists', status.config.exists ? 'yes' : 'no'],
    ['Output format', status.config.output_format],
  ];
  if (status.config.api_url) {
    configPairs.push(['API URL', status.config.api_url]);
  }
  if (status.config.ai_mode) {
    configPairs.push(['AI mode', status.config.ai_mode]);
  }
  sections.push(chalk.bold('Config') + '\n' + renderKeyValue(configPairs));

  // Environment overrides
  const envKeys = Object.keys(status.env_overrides);
  if (envKeys.length > 0) {
    const envPairs: Array<[string, string]> = envKeys.map((k) => [k, status.env_overrides[k]]);
    sections.push(chalk.bold('Environment overrides') + '\n' + renderKeyValue(envPairs));
  }

  return sections.join('\n\n');
}

export function registerStatusCommands(program: Command): void {
  program
    .command('status')
    .description('Show current CLI state at a glance')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const status = collectStatus();

        if (opts.json) {
          console.log(jsonSuccess(status));
        } else {
          console.log(renderHuman(status));
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}
