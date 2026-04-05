/**
 * Shared redaction utility for sensitive config values.
 */

export const SENSITIVE_KEYS = new Set([
  'access_token',
  'refresh_token',
  'api_key',
  'anthropic_key',
  'openai_key',
]);

/** Env vars that must always be redacted in output. */
export const SENSITIVE_ENV_VARS = new Set([
  'LEMONADE_API_KEY',
]);

/**
 * Redact a value if its key is sensitive.
 * Values under 10 chars are fully masked to avoid leaking short secrets.
 */
export function redactValue(key: string, value: unknown): string {
  const str = String(value);
  if (!SENSITIVE_KEYS.has(key)) return str;
  if (str.length < 10) return '***';
  return str.slice(0, 3) + '...' + str.slice(-4);
}
