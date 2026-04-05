import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface LemonadeConfig {
  api_key?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: number;
  default_space?: string;
  output_format?: 'json' | 'table';
  api_url?: string;
  hydra_url?: string;
  registry_url?: string;
  anthropic_key?: string;
  openai_key?: string;
  ai_provider?: string;
  ai_mode?: 'credits' | 'own_key';
  ai_credits_space?: string;
  agent_name?: string;
}

const CONFIG_DIR = join(homedir(), '.lemonade');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULTS: Partial<LemonadeConfig> = {
  api_url: 'https://backend.lemonade.social',
  hydra_url: 'https://oauth2.lemonade.social',
  registry_url: 'https://registry.atlas-protocol.org',
  output_format: 'table',
};

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): LemonadeConfig {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULTS };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeConfig(config: LemonadeConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

let flagApiKey: string | undefined;

export function setFlagApiKey(key: string | undefined): void {
  flagApiKey = key;
}

// Refresh buffer: attempt refresh when token expires within this window.
const REFRESH_BUFFER_MS = 60_000;

// Prevent concurrent refresh attempts.
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Returns a Bearer auth header, attempting an OAuth token refresh when the
 * access_token is expired or about to expire. Falls back to api_key or
 * undefined if refresh fails or is not applicable.
 */
export async function ensureAuthHeader(): Promise<string | undefined> {
  // Flag key and env key bypass token refresh entirely.
  if (flagApiKey) return `Bearer ${flagApiKey}`;
  const envKey = process.env.LEMONADE_API_KEY;
  if (envKey) return `Bearer ${envKey}`;

  const config = readConfig();

  const accessToken = config.access_token;
  const expiresAt = config.token_expires_at;

  // Token is still valid and not about to expire — use it.
  if (accessToken && expiresAt && Date.now() < expiresAt - REFRESH_BUFFER_MS) {
    return `Bearer ${accessToken}`;
  }

  // Token is expired or expiring soon — attempt refresh if we have a refresh_token.
  const refreshToken = config.refresh_token;
  if (refreshToken) {
    if (!refreshInFlight) {
      // Claim the slot synchronously before any await, then lazy-import.
      // This closes the race where two callers both see null before either assigns.
      const slot = import('./oauth.js').then(({ refreshAccessToken }) =>
        refreshAccessToken(refreshToken),
      );
      refreshInFlight = slot.finally(() => {
        refreshInFlight = null;
      });
    }

    const newToken = await refreshInFlight;
    if (newToken) {
      return `Bearer ${newToken}`;
    }
  }

  // Refresh failed or not available. Fall through to api_key or undefined.
  if (accessToken && expiresAt && Date.now() < expiresAt) {
    return `Bearer ${accessToken}`;
  }

  const configKey = config.api_key;
  if (configKey) return `Bearer ${configKey}`;

  return undefined;
}

export function getApiUrl(): string {
  return process.env.LEMONADE_API_URL || readConfig().api_url || 'https://backend.lemonade.social';
}

export function getHydraUrl(): string {
  return process.env.LEMONADE_HYDRA_URL || readConfig().hydra_url || 'https://oauth2.lemonade.social';
}

export function getRegistryUrl(): string {
  return process.env.LEMONADE_REGISTRY_URL || readConfig().registry_url || 'https://registry.atlas-protocol.org';
}

export function setApiKey(key: string): void {
  const config = readConfig();
  config.api_key = key;
  writeConfig(config);
}

export function setTokens(access: string, refresh: string, expiresIn: number): void {
  const config = readConfig();
  config.access_token = access;
  config.refresh_token = refresh;
  config.token_expires_at = Date.now() + expiresIn * 1000;
  writeConfig(config);
}

export function clearAuth(): void {
  const config = readConfig();
  delete config.api_key;
  delete config.access_token;
  delete config.refresh_token;
  delete config.token_expires_at;
  writeConfig(config);
}

export function clearTokens(): void {
  const config = readConfig();
  delete config.access_token;
  delete config.refresh_token;
  delete config.token_expires_at;
  writeConfig(config);
}

export function getConfig(): LemonadeConfig {
  return readConfig();
}

export function setConfigValue(key: keyof LemonadeConfig, value: string): void {
  const config = readConfig();
  (config as Record<string, unknown>)[key] = value;
  writeConfig(config);
}

export function getDefaultSpace(): string | undefined {
  return readConfig().default_space;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function configExists(): boolean {
  return existsSync(CONFIG_FILE);
}

export function initConfig(): boolean {
  ensureConfigDir();
  if (existsSync(CONFIG_FILE)) {
    return false;
  }
  writeConfig({ ...DEFAULTS });
  return true;
}
