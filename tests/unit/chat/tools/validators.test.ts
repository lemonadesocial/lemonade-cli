import { describe, it, expect } from 'vitest';
import { validateTimezone } from '../../../../src/chat/tools/validators/timezone.js';
import { validateCurrency } from '../../../../src/chat/tools/validators/currency.js';
import { validateISODate, validateDateRange } from '../../../../src/chat/tools/validators/date.js';
import { validateArgs } from '../../../../src/chat/tools/schema.js';
import type { ToolParam } from '../../../../src/chat/providers/interface.js';

describe('validateTimezone', () => {
  it('returns null for valid timezone', () => {
    expect(validateTimezone('America/New_York')).toBeNull();
    expect(validateTimezone('Europe/London')).toBeNull();
    expect(validateTimezone('Asia/Tokyo')).toBeNull();
  });

  it('returns error for invalid timezone', () => {
    const result = validateTimezone('Not/A_Zone');
    expect(result).toContain('Invalid timezone');
    expect(result).toContain('Not/A_Zone');
  });
});

describe('validateCurrency', () => {
  it('returns null for valid currency codes', () => {
    expect(validateCurrency('USD')).toBeNull();
    expect(validateCurrency('EUR')).toBeNull();
    expect(validateCurrency('GBP')).toBeNull();
  });

  it('is case insensitive', () => {
    expect(validateCurrency('usd')).toBeNull();
    expect(validateCurrency('eur')).toBeNull();
    expect(validateCurrency('Gbp')).toBeNull();
  });

  it('returns error for invalid currency code', () => {
    const result = validateCurrency('FAKE');
    expect(result).toContain('Invalid currency code');
    expect(result).toContain('FAKE');
  });
});

describe('validateISODate', () => {
  it('returns null for valid ISO dates', () => {
    expect(validateISODate('2025-01-15')).toBeNull();
    expect(validateISODate('2025-01-15T09:00:00Z')).toBeNull();
    expect(validateISODate('2025-01-15T09:00:00+05:30')).toBeNull();
  });

  it('returns error for invalid date format', () => {
    const result = validateISODate('January 15, 2025');
    expect(result).toContain('Invalid date format');
  });

  it('returns error for invalid date values', () => {
    const result = validateISODate('2025-13-45');
    expect(result).not.toBeNull();
  });

  it('returns error for date rollover (e.g. Feb 30)', () => {
    const result = validateISODate('2025-02-30');
    expect(result).not.toBeNull();
    expect(result).toContain('Invalid date');
  });
});

describe('validateDateRange', () => {
  it('returns null when end is after start', () => {
    expect(validateDateRange('2025-01-01', '2025-01-02')).toBeNull();
  });

  it('returns null when no end provided', () => {
    expect(validateDateRange('2025-01-01')).toBeNull();
  });

  it('returns error when end is before start', () => {
    const result = validateDateRange('2025-01-15', '2025-01-10');
    expect(result).toContain('Invalid date range');
  });

  it('returns error when end equals start', () => {
    const result = validateDateRange('2025-01-15', '2025-01-15');
    expect(result).toContain('Invalid date range');
  });
});

describe('validateArgs integration', () => {
  it('validates timezone params semantically', () => {
    const params: ToolParam[] = [
      { name: 'timezone', type: 'string', description: 'IANA timezone' },
    ];
    const result = validateArgs({ timezone: 'Fake/Zone' }, params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid timezone'))).toBe(true);
  });

  it('validates currency params semantically', () => {
    const params: ToolParam[] = [
      { name: 'currency', type: 'string', description: 'Currency code' },
    ];
    const result = validateArgs({ currency: 'FAKE' }, params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid currency'))).toBe(true);
  });

  it('validates date params semantically', () => {
    const params: ToolParam[] = [
      { name: 'start', type: 'string', description: 'Start date' },
      { name: 'end', type: 'string', description: 'End date' },
    ];
    const result = validateArgs(
      { start: '2025-01-15', end: '2025-01-10' },
      params,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid date range'))).toBe(true);
  });

  it('passes valid timezone, currency, and dates', () => {
    const params: ToolParam[] = [
      { name: 'timezone', type: 'string', description: 'TZ' },
      { name: 'currency', type: 'string', description: 'Currency' },
      { name: 'start', type: 'string', description: 'Start' },
      { name: 'end', type: 'string', description: 'End' },
    ];
    const result = validateArgs(
      {
        timezone: 'America/New_York',
        currency: 'USD',
        start: '2025-01-01',
        end: '2025-01-15',
      },
      params,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
