import { Command } from 'commander';
import chalk from 'chalk';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { renderKeyValue } from '../../output/table.js';
import { formatRelativeTime } from '../../output/format.js';
import {
  getConfig,
  getConfigPath,
  configExists,
  DEFAULT_API_URL,
  type LemonadeConfig,
} from '../../auth/store.js';
import { graphqlRequest, GraphQLError } from '../../api/graphql.js';

type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';

interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
}

interface DoctorSummary {
  total: number;
  passed: number;
  failed: number;
  warned: number;
  skipped: number;
}

interface DoctorData {
  checks: CheckResult[];
  summary: DoctorSummary;
}

const STATUS_ICONS: Record<CheckStatus, string> = {
  pass: chalk.green('\u2713'),
  fail: chalk.red('\u2717'),
  warn: chalk.yellow('\u26A0'),
  skip: chalk.dim('-'),
};

function checkConfigExists(): CheckResult {
  const exists = configExists();
  return {
    name: 'config_exists',
    status: exists ? 'pass' : 'fail',
    detail: exists ? 'exists' : `not found at ${getConfigPath()}`,
  };
}

function checkConfigReadable(): CheckResult {
  try {
    getConfig();
    return { name: 'config_readable', status: 'pass', detail: 'readable' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return { name: 'config_readable', status: 'fail', detail: message };
  }
}

function checkOutputFormat(config: LemonadeConfig): CheckResult {
  const format = config.output_format;
  if (!format) {
    return { name: 'output_format', status: 'pass', detail: 'not set (default: table)' };
  }
  if (format === 'json' || format === 'table') {
    return { name: 'output_format', status: 'pass', detail: format };
  }
  return { name: 'output_format', status: 'fail', detail: `invalid value: ${format}` };
}

function checkApiUrl(config: LemonadeConfig): CheckResult {
  const url = process.env.LEMONADE_API_URL || config.api_url || DEFAULT_API_URL;
  if (url.startsWith('https://') || url === 'http://localhost' || url.startsWith('http://localhost:') || url.startsWith('http://localhost/')) {
    return { name: 'api_url', status: 'pass', detail: url };
  }
  return { name: 'api_url', status: 'fail', detail: `not valid HTTPS: ${url}` };
}

function checkAuthMethod(config: LemonadeConfig): CheckResult {
  if (process.env.LEMONADE_API_KEY) {
    return { name: 'auth_method', status: 'pass', detail: 'Environment (LEMONADE_API_KEY)' };
  }
  if (config.access_token) {
    return { name: 'auth_method', status: 'pass', detail: 'OAuth' };
  }
  if (config.api_key) {
    return { name: 'auth_method', status: 'pass', detail: 'API Key' };
  }
  return { name: 'auth_method', status: 'fail', detail: 'no auth configured' };
}

function checkTokenStatus(config: LemonadeConfig): CheckResult {
  if (process.env.LEMONADE_API_KEY) {
    return { name: 'token_status', status: 'pass', detail: 'static key (no expiry)' };
  }
  if (config.api_key && !config.access_token) {
    return { name: 'token_status', status: 'pass', detail: 'static key (no expiry)' };
  }
  if (!config.access_token) {
    return { name: 'token_status', status: 'skip', detail: 'no token' };
  }
  if (!config.token_expires_at) {
    return { name: 'token_status', status: 'warn', detail: 'unknown (no expiry recorded)' };
  }
  const remaining = config.token_expires_at - Date.now();
  if (remaining <= 0) {
    return { name: 'token_status', status: 'warn', detail: `expired ${formatRelativeTime(remaining)} ago` };
  }
  return { name: 'token_status', status: 'pass', detail: `valid (expires in ${formatRelativeTime(remaining)})` };
}

function checkRefreshToken(config: LemonadeConfig): CheckResult {
  if (process.env.LEMONADE_API_KEY) {
    return { name: 'refresh_token', status: 'skip', detail: 'not applicable (env key)' };
  }
  if (config.api_key && !config.access_token) {
    return { name: 'refresh_token', status: 'skip', detail: 'not applicable (API key)' };
  }
  if (!config.access_token) {
    return { name: 'refresh_token', status: 'skip', detail: 'no OAuth session' };
  }
  if (config.refresh_token) {
    return { name: 'refresh_token', status: 'pass', detail: 'present' };
  }
  return { name: 'refresh_token', status: 'warn', detail: 'missing (token renewal will fail)' };
}

async function checkToolRegistry(): Promise<CheckResult> {
  try {
    const { buildToolRegistry } = await import('../../chat/tools/registry.js');
    const tools = buildToolRegistry();
    const count = Object.keys(tools).length;
    if (count === 0) {
      return { name: 'tool_registry', status: 'fail', detail: 'loaded but empty' };
    }
    return { name: 'tool_registry', status: 'pass', detail: `${count} tools` };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return { name: 'tool_registry', status: 'fail', detail: message };
  }
}

// NOTE: This check sends real auth credentials via ensureAuthHeader().
// Only call after validating the API URL is safe (checkApiUrl passed).
async function checkConnectivity(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await graphqlRequest<{ __typename: string }>(
      'query { __typename }',
    );
    const elapsed = Date.now() - start;
    return { name: 'api_connectivity', status: 'pass', detail: `reachable (${elapsed}ms)` };
  } catch (err) {
    const elapsed = Date.now() - start;
    if (err instanceof GraphQLError && (err.statusCode === 401 || err.statusCode === 403)) {
      return { name: 'api_connectivity', status: 'warn', detail: `reachable but auth failed (${elapsed}ms)` };
    }
    const message = err instanceof Error ? err.message : 'unknown error';
    return { name: 'api_connectivity', status: 'fail', detail: message };
  }
}

async function runChecks(checkConnectivityFlag: boolean): Promise<DoctorData> {
  const checks: CheckResult[] = [];

  // Config checks
  checks.push(checkConfigExists());
  checks.push(checkConfigReadable());

  let config: LemonadeConfig;
  try {
    config = getConfig();
  } catch {
    config = {};
  }

  checks.push(checkOutputFormat(config));
  const apiUrlResult = checkApiUrl(config);
  checks.push(apiUrlResult);

  // Auth checks
  checks.push(checkAuthMethod(config));
  checks.push(checkTokenStatus(config));
  checks.push(checkRefreshToken(config));

  // Tool registry
  checks.push(await checkToolRegistry());

  // Connectivity — only run if explicitly requested AND the API URL is valid
  // (credentials are sent with the request, so we must not send them to untrusted URLs)
  if (checkConnectivityFlag && apiUrlResult.status === 'pass') {
    checks.push(await checkConnectivity());
  } else if (checkConnectivityFlag && apiUrlResult.status !== 'pass') {
    checks.push({ name: 'api_connectivity', status: 'skip', detail: 'skipped (API URL validation failed)' });
  } else {
    checks.push({ name: 'api_connectivity', status: 'skip', detail: 'skipped' });
  }

  const summary: DoctorSummary = {
    total: checks.length,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warned: checks.filter((c) => c.status === 'warn').length,
    skipped: checks.filter((c) => c.status === 'skip').length,
  };

  return { checks, summary };
}

const DISPLAY_NAMES: Record<string, string> = {
  config_exists: 'Config file',
  config_readable: 'Config readable',
  output_format: 'Output format',
  api_url: 'API URL',
  auth_method: 'Auth method',
  token_status: 'Token status',
  refresh_token: 'Refresh token',
  tool_registry: 'Registry loads',
  api_connectivity: 'API endpoint',
};

const SECTIONS: Array<{ title: string; checks: string[] }> = [
  { title: 'Config', checks: ['config_exists', 'config_readable', 'output_format', 'api_url'] },
  { title: 'Auth', checks: ['auth_method', 'token_status', 'refresh_token'] },
  { title: 'Tools', checks: ['tool_registry'] },
  { title: 'Connectivity', checks: ['api_connectivity'] },
];

function renderHuman(data: DoctorData): string {
  const checkMap = new Map(data.checks.map((c) => [c.name, c]));
  const sections: string[] = [];

  for (const section of SECTIONS) {
    const pairs: Array<[string, string]> = [];
    for (const checkName of section.checks) {
      const check = checkMap.get(checkName);
      if (!check) continue;
      const icon = STATUS_ICONS[check.status];
      const label = DISPLAY_NAMES[checkName] || checkName;
      pairs.push([label, `${icon} ${check.detail}`]);
    }
    // Show hint when connectivity was skipped (not explicitly enabled)
    let title = section.title;
    if (section.title === 'Connectivity') {
      const connCheck = checkMap.get('api_connectivity');
      if (connCheck && connCheck.status === 'skip' && connCheck.detail === 'skipped') {
        title = 'Connectivity (--check-connectivity to enable)';
      }
    }
    sections.push(chalk.bold(title) + '\n' + renderKeyValue(pairs));
  }

  const { summary } = data;
  const activeParts: string[] = [];
  activeParts.push(`${summary.passed} passed`);
  if (summary.failed > 0) activeParts.push(chalk.red(`${summary.failed} failed`));
  if (summary.warned > 0) activeParts.push(chalk.yellow(`${summary.warned} warnings`));
  if (summary.skipped > 0) activeParts.push(chalk.dim(`${summary.skipped} skipped`));

  let summaryLine = `Summary: ${activeParts.join(', ')}`;

  // F4: Warn when config file is missing — downstream checks may be incomplete
  const configCheck = data.checks.find((c) => c.name === 'config_exists');
  if (configCheck && configCheck.status === 'fail') {
    summaryLine += ' (config file missing \u2014 some checks may be incomplete)';
  }

  sections.push(summaryLine);

  return sections.join('\n\n');
}

export function registerDoctorCommands(program: Command): void {
  program
    .command('doctor')
    .description('Run health checks on CLI setup')
    .option('--json', 'Output as JSON')
    .option('--check-connectivity', 'Test API endpoint reachability')
    .action(async (opts) => {
      try {
        const data = await runChecks(!!opts.checkConnectivity);

        if (opts.json) {
          console.log(jsonSuccess(data));
        } else {
          console.log(renderHuman(data));
        }

        if (data.summary.failed > 0) {
          process.exit(1);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}

// Exported for testing
export { runChecks, renderHuman, checkConfigExists, checkConfigReadable,
  checkOutputFormat, checkApiUrl, checkAuthMethod, checkTokenStatus,
  checkRefreshToken, checkToolRegistry, checkConnectivity };
export type { CheckResult, DoctorData, DoctorSummary, CheckStatus };
