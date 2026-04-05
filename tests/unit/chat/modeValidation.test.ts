import { describe, it, expect } from 'vitest';

const VALID_MODES = ['credits', 'own_key'] as const;

function validateMode(mode: string | undefined): string | null {
  if (!mode) return null;
  if (mode === 'credits' || mode === 'own_key') return null;
  return `Unknown mode "${mode}". Supported: credits, own_key`;
}

describe('--mode flag validation', () => {
  it('accepts "credits" without error', () => {
    expect(validateMode('credits')).toBeNull();
  });

  it('accepts "own_key" without error', () => {
    expect(validateMode('own_key')).toBeNull();
  });

  it('returns error for invalid mode', () => {
    const err = validateMode('turbo');
    expect(err).not.toBeNull();
    expect(err).toContain('turbo');
    expect(err).toContain('credits');
    expect(err).toContain('own_key');
  });

  it('returns null when no mode is provided', () => {
    expect(validateMode(undefined)).toBeNull();
  });

  it('rejects empty string as invalid mode', () => {
    // empty string is falsy, so treated as "not provided"
    expect(validateMode('')).toBeNull();
  });

  for (const valid of VALID_MODES) {
    it(`does not reject valid mode "${valid}"`, () => {
      expect(validateMode(valid)).toBeNull();
    });
  }
});
