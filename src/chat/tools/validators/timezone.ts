let cachedTimezones: Set<string> | null = null;

function getTimezones(): Set<string> {
  if (!cachedTimezones) {
    cachedTimezones = new Set(Intl.supportedValuesOf('timeZone'));
  }
  return cachedTimezones;
}

export function validateTimezone(tz: string): string | null {
  if (getTimezones().has(tz)) return null;
  return `Invalid timezone: "${tz}". Use IANA timezone format (e.g., "America/New_York", "Europe/London").`;
}
