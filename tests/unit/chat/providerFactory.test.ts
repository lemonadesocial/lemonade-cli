import { describe, it, expect } from 'vitest';
import { isValidProvider, VALID_PROVIDERS } from '../../../src/chat/providerFactory';

describe('providerFactory', () => {
  describe('isValidProvider', () => {
    it('accepts known providers', () => {
      for (const p of VALID_PROVIDERS) {
        expect(isValidProvider(p)).toBe(true);
      }
    });

    it('rejects unknown provider names', () => {
      expect(isValidProvider('gemini')).toBe(false);
      expect(isValidProvider('')).toBe(false);
      expect(isValidProvider('ANTHROPIC')).toBe(false);
    });
  });
});
