import { describe, it, expect } from 'vitest';
import { redactValue } from '../../../src/output/redact';

describe('redactValue', () => {
  it('non-sensitive key passes through unchanged', () => {
    expect(redactValue('output_format', 'table')).toBe('table');
  });

  it('sensitive key with value >= 10 chars shows prefix...suffix', () => {
    expect(redactValue('api_key', 'abcde12345xyz')).toBe('abc...5xyz');
  });

  it('sensitive key with value < 10 chars returns "***"', () => {
    expect(redactValue('api_key', 'short')).toBe('***');
  });

  it('sensitive key with exactly 10 chars shows prefix...suffix', () => {
    expect(redactValue('api_key', '1234567890')).toBe('123...7890');
  });
});
