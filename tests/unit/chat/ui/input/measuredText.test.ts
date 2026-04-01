import { describe, it, expect } from 'vitest';
import { MeasuredText } from '../../../../../src/chat/ui/input/MeasuredText.js';

describe('MeasuredText', () => {
  describe('constructor', () => {
    it('wraps empty string to one WrappedLine', () => {
      const m = new MeasuredText('', 80);
      expect(m.wrappedLines).toHaveLength(1);
      expect(m.wrappedLines[0].text).toBe('');
      expect(m.wrappedLines[0].startOffset).toBe(0);
      expect(m.wrappedLines[0].length).toBe(0);
    });

    it('clamps columns < 1 to 1', () => {
      const m = new MeasuredText('abc', 0);
      expect(m.columns).toBe(1);
      // Should still produce valid output without infinite loop
      expect(m.wrappedLines.length).toBeGreaterThan(0);
    });

    it('clamps negative columns to 1', () => {
      const m = new MeasuredText('abc', -5);
      expect(m.columns).toBe(1);
    });
  });

  describe('single line', () => {
    it('does not wrap text shorter than columns', () => {
      const m = new MeasuredText('hello', 80);
      expect(m.wrappedLines).toHaveLength(1);
      expect(m.wrappedLines[0].text).toBe('hello');
      expect(m.wrappedLines[0].startOffset).toBe(0);
      expect(m.wrappedLines[0].length).toBe(5);
    });
  });

  describe('newline handling', () => {
    it('splits on newlines', () => {
      const m = new MeasuredText('ab\ncd', 80);
      expect(m.wrappedLines).toHaveLength(2);
      expect(m.wrappedLines[0].text).toBe('ab');
      expect(m.wrappedLines[0].endsWithNewline).toBe(true);
      expect(m.wrappedLines[1].text).toBe('cd');
      expect(m.wrappedLines[1].startOffset).toBe(3);
    });

    it('trailing newline produces empty trailing line', () => {
      const m = new MeasuredText('ab\n', 80);
      expect(m.wrappedLines).toHaveLength(2);
      expect(m.wrappedLines[0].text).toBe('ab');
      expect(m.wrappedLines[0].endsWithNewline).toBe(true);
      expect(m.wrappedLines[1].text).toBe('');
      expect(m.wrappedLines[1].startOffset).toBe(3);
    });
  });

  describe('word wrapping', () => {
    it('wraps long word at column boundary', () => {
      const m = new MeasuredText('abcdefgh', 4);
      expect(m.wrappedLines).toHaveLength(2);
      expect(m.wrappedLines[0].text).toBe('abcd');
      expect(m.wrappedLines[1].text).toBe('efgh');
    });

    it('wraps at grapheme boundaries', () => {
      const m = new MeasuredText('abcde', 3);
      expect(m.wrappedLines.length).toBeGreaterThanOrEqual(2);
      expect(m.wrappedLines[0].text).toBe('abc');
      expect(m.wrappedLines[1].text).toBe('de');
    });
  });

  describe('emoji handling', () => {
    it('does not split ZWJ sequence (👨‍👩‍👧‍👦)', () => {
      const family = '👨‍👩‍👧‍👦';
      const m = new MeasuredText(family, 80);
      expect(m.wrappedLines).toHaveLength(1);
      expect(m.wrappedLines[0].text).toBe(family);
    });

    it('treats emoji as 2 display columns', () => {
      expect(MeasuredText.displayWidth('👨‍👩‍👧‍👦')).toBe(2);
    });

    it('wraps emoji that would overflow', () => {
      // 3 columns: emoji needs 2, so one emoji per line
      const m = new MeasuredText('a👨‍👩‍👧‍👦b', 3);
      expect(m.wrappedLines.length).toBeGreaterThanOrEqual(2);
      // 'a' + emoji = 3 columns exactly
      expect(m.wrappedLines[0].text).toBe('a👨‍👩‍👧‍👦');
    });
  });

  describe('CJK handling', () => {
    it('treats CJK characters as 2 display columns each', () => {
      expect(MeasuredText.displayWidth('你好')).toBe(4);
    });

    it('wraps CJK correctly', () => {
      // 4 columns: each CJK char is 2 wide, so 2 per line
      const m = new MeasuredText('你好世界', 4);
      expect(m.wrappedLines).toHaveLength(2);
      expect(m.wrappedLines[0].text).toBe('你好');
      expect(m.wrappedLines[1].text).toBe('世界');
    });
  });

  describe('offsetToPosition / positionToOffset roundtrip', () => {
    it('roundtrips for simple text', () => {
      const m = new MeasuredText('hello\nworld', 80);
      for (let i = 0; i <= m.text.length; i++) {
        const pos = m.offsetToPosition(i);
        const offset = m.positionToOffset(pos);
        expect(offset).toBe(i);
      }
    });

    it('roundtrips for wrapped text', () => {
      const m = new MeasuredText('abcdefgh', 4);
      for (let i = 0; i <= m.text.length; i++) {
        const pos = m.offsetToPosition(i);
        const offset = m.positionToOffset(pos);
        expect(offset).toBe(i);
      }
    });

    it('clamps out-of-range offset', () => {
      const m = new MeasuredText('abc', 80);
      const pos = m.offsetToPosition(100);
      expect(pos.line).toBe(0);
      expect(pos.column).toBe(3);
    });

    it('clamps negative offset', () => {
      const m = new MeasuredText('abc', 80);
      const pos = m.offsetToPosition(-5);
      expect(pos.line).toBe(0);
      expect(pos.column).toBe(0);
    });
  });

  describe('lineCount and getLineLength', () => {
    it('returns correct lineCount', () => {
      const m = new MeasuredText('ab\ncd\nef', 80);
      expect(m.lineCount).toBe(3);
    });

    it('returns correct line lengths', () => {
      const m = new MeasuredText('ab\ncd\nef', 80);
      expect(m.getLineLength(0)).toBe(2);
      expect(m.getLineLength(1)).toBe(2);
      expect(m.getLineLength(2)).toBe(2);
    });

    it('returns 0 for out-of-range line', () => {
      const m = new MeasuredText('abc', 80);
      expect(m.getLineLength(5)).toBe(0);
      expect(m.getLineLength(-1)).toBe(0);
    });
  });

  describe('displayWidth', () => {
    it('handles ASCII', () => {
      expect(MeasuredText.displayWidth('hello')).toBe(5);
    });

    it('handles empty string', () => {
      expect(MeasuredText.displayWidth('')).toBe(0);
    });
  });
});
