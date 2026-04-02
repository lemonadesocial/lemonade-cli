import { describe, it, expect } from 'vitest';
import { KillRing } from '../../../../../src/chat/ui/input/KillRing.js';

describe('KillRing', () => {
  describe('push and yank', () => {
    it('yank returns null when empty', () => {
      const kr = new KillRing();
      expect(kr.yank()).toBeNull();
    });

    it('push then yank returns the pushed text', () => {
      const kr = new KillRing();
      kr.push('hello');
      expect(kr.yank()).toBe('hello');
    });

    it('yank returns most recently pushed', () => {
      const kr = new KillRing();
      kr.push('first');
      kr.push('second');
      expect(kr.yank()).toBe('second');
    });

    it('ignores empty string push', () => {
      const kr = new KillRing();
      kr.push('');
      expect(kr.yank()).toBeNull();
    });
  });

  describe('yankPop', () => {
    it('returns null if last action was not yank', () => {
      const kr = new KillRing();
      kr.push('hello');
      kr.setLastAction('other');
      expect(kr.yankPop()).toBeNull();
    });

    it('cycles through ring after yank', () => {
      const kr = new KillRing();
      kr.push('first');
      kr.setLastAction('other');
      kr.push('second');
      kr.setLastAction('other');
      kr.push('third');

      const y1 = kr.yank();
      expect(y1).toBe('third');

      const y2 = kr.yankPop();
      expect(y2).toBe('second');

      const y3 = kr.yankPop();
      expect(y3).toBe('first');

      // Wraps around
      const y4 = kr.yankPop();
      expect(y4).toBe('third');
    });
  });

  describe('accumulation', () => {
    it('appends when lastAction is kill and append mode', () => {
      const kr = new KillRing();
      kr.push('hello');
      // lastAction is now 'kill' after push
      kr.push(' world', 'append');
      expect(kr.yank()).toBe('hello world');
    });

    it('prepends when lastAction is kill and prepend mode', () => {
      const kr = new KillRing();
      kr.push('world');
      kr.push('hello ', 'prepend');
      expect(kr.yank()).toBe('hello world');
    });

    it('does not accumulate when lastAction is not kill', () => {
      const kr = new KillRing();
      kr.push('hello');
      kr.setLastAction('other');
      kr.push(' world', 'append');
      // Should be separate entries
      expect(kr.yank()).toBe(' world');
    });
  });

  describe('clear', () => {
    it('clears all entries', () => {
      const kr = new KillRing();
      kr.push('hello');
      kr.push('world');
      kr.clear();
      expect(kr.yank()).toBeNull();
    });
  });

  describe('maxSize overflow', () => {
    it('evicts oldest entries when exceeding maxSize', () => {
      const kr = new KillRing();
      // maxSize is 32, push 33 entries
      for (let i = 0; i < 33; i++) {
        kr.setLastAction('other');
        kr.push(`item-${i}`);
      }
      // First item should be gone
      const items: string[] = [];
      const first = kr.yank();
      if (first) items.push(first);
      for (let i = 0; i < 31; i++) {
        const item = kr.yankPop();
        if (item) items.push(item);
      }
      expect(items).not.toContain('item-0');
      expect(items).toContain('item-1');
      expect(items).toContain('item-32');
    });
  });

  describe('setLastAction', () => {
    it('changes the tracked action', () => {
      const kr = new KillRing();
      kr.push('hello');
      kr.setLastAction('other');
      // Now push with append should NOT accumulate
      kr.push('world', 'append');
      kr.yank(); // 'world'
      const popped = kr.yankPop();
      expect(popped).toBe('hello'); // separate entry
    });
  });
});
