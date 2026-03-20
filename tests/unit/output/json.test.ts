import { describe, it, expect } from 'vitest';
import { jsonSuccess, jsonError } from '../../../src/output/json';

describe('JSON Output', () => {
  describe('jsonSuccess', () => {
    it('wraps data in ok envelope', () => {
      const output = JSON.parse(jsonSuccess({ id: '123' }));
      expect(output).toEqual({
        ok: true,
        data: { id: '123' },
      });
    });

    it('includes cursor and total for pagination', () => {
      const output = JSON.parse(jsonSuccess([1, 2], { cursor: 'next', total: 50 }));
      expect(output.ok).toBe(true);
      expect(output.cursor).toBe('next');
      expect(output.total).toBe(50);
    });

    it('handles null cursor', () => {
      const output = JSON.parse(jsonSuccess([], { cursor: null, total: 0 }));
      expect(output.cursor).toBeNull();
    });

    it('handles arrays as data', () => {
      const output = JSON.parse(jsonSuccess([{ a: 1 }, { a: 2 }]));
      expect(output.data).toHaveLength(2);
    });
  });

  describe('jsonError', () => {
    it('wraps error in not-ok envelope', () => {
      const output = JSON.parse(jsonError('AUTH_FAILED', 'bad token'));
      expect(output).toEqual({
        ok: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'bad token',
        },
      });
    });

    it('includes upgrade info when provided', () => {
      const output = JSON.parse(jsonError('TIER_LIMIT', 'limit', {
        upgrade_url: 'https://example.com',
        upgrade_command: 'lemonade space upgrade x',
      }));
      expect(output.error.upgrade_url).toBe('https://example.com');
      expect(output.error.upgrade_command).toBe('lemonade space upgrade x');
    });
  });
});
