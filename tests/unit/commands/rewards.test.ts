import { describe, it, expect } from 'vitest';

describe('Rewards Commands', () => {
  describe('wallet validation', () => {
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;

    it('accepts valid wallet address', () => {
      expect(walletRegex.test('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    });

    it('rejects short address', () => {
      expect(walletRegex.test('0x1234')).toBe(false);
    });

    it('rejects missing 0x prefix', () => {
      expect(walletRegex.test('1234567890abcdef1234567890abcdef12345678')).toBe(false);
    });

    it('rejects non-hex characters', () => {
      expect(walletRegex.test('0xgggggggggggggggggggggggggggggggggggggggg')).toBe(false);
    });
  });
});
