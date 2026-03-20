import { describe, it, expect } from 'vitest';
import { VALID_CONFIG_KEYS } from '../../../src/config/defaults';

describe('Config Commands', () => {
  describe('valid config keys', () => {
    it('contains expected keys', () => {
      expect(VALID_CONFIG_KEYS).toContain('default_space');
      expect(VALID_CONFIG_KEYS).toContain('output_format');
      expect(VALID_CONFIG_KEYS).toContain('api_url');
      expect(VALID_CONFIG_KEYS).toContain('registry_url');
    });

    it('rejects unknown keys', () => {
      expect(VALID_CONFIG_KEYS.includes('password' as never)).toBe(false);
    });
  });
});
