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

  describe('isPrecededByNewline flag', () => {
    it('is true for first sub-line of each logical line, false for soft-wrapped continuations', () => {
      // "abcdef" wraps at 4 cols into "abcd" + "ef" (soft wrap)
      // "\ngh" is a new logical line
      const m = new MeasuredText('abcdef\ngh', 4);
      // Line 0: "abcd" — first logical line, first sub-line → true
      expect(m.wrappedLines[0].isPrecededByNewline).toBe(true);
      // Line 1: "ef" — soft-wrapped continuation of line 0 → false
      expect(m.wrappedLines[1].isPrecededByNewline).toBe(false);
      // Line 2: "gh" — first sub-line of second logical line → true
      expect(m.wrappedLines[2].isPrecededByNewline).toBe(true);
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

  describe('display-column Position.column (wide characters)', () => {
    describe('offsetToPosition returns display columns', () => {
      it('CJK character occupies 2 display columns', () => {
        // "a你b" — 'a' at col 0, '你' at col 1 (width 2), 'b' at col 3
        const m = new MeasuredText('a你b', 80);
        expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 }); // before 'a'
        expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 }); // after 'a', before '你'
        expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 3 }); // after '你', before 'b'
        expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 4 }); // after 'b'
      });

      it('multiple CJK characters', () => {
        const m = new MeasuredText('你好世', 80);
        expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
        expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 2 });
        expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 4 });
        expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 6 });
      });

      it('emoji occupies 2 display columns', () => {
        const emoji = '😀';
        const m = new MeasuredText('a' + emoji + 'b', 80);
        expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 }); // before 'a'
        expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 }); // after 'a'
        // emoji is 2 code units in JS (surrogate pair), offset 3 = after emoji
        expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 3 }); // after emoji
        expect(m.offsetToPosition(4)).toEqual({ line: 0, column: 4 }); // after 'b'
      });
    });

    describe('positionToOffset with display columns', () => {
      it('maps display column back to source offset for CJK', () => {
        // "a你b" — col 0→offset 0, col 1→offset 1, col 3→offset 2, col 4→offset 3
        const m = new MeasuredText('a你b', 80);
        expect(m.positionToOffset({ line: 0, column: 0 })).toBe(0);
        expect(m.positionToOffset({ line: 0, column: 1 })).toBe(1);
        expect(m.positionToOffset({ line: 0, column: 3 })).toBe(2);
        expect(m.positionToOffset({ line: 0, column: 4 })).toBe(3);
      });

      it('snaps mid-wide-char column to start of that grapheme', () => {
        // "你好" — col 0→offset 0, col 1 (mid '你')→offset 0, col 2→offset 1
        const m = new MeasuredText('你好', 80);
        expect(m.positionToOffset({ line: 0, column: 1 })).toBe(0); // snaps to start of '你'
        expect(m.positionToOffset({ line: 0, column: 3 })).toBe(1); // snaps to start of '好'
      });

      it('clamps past end of line to end offset', () => {
        const m = new MeasuredText('你好', 80);
        // display width is 4, column 10 clamps to end
        expect(m.positionToOffset({ line: 0, column: 10 })).toBe(2);
      });
    });

    describe('roundtrip with wide characters', () => {
      it('roundtrips CJK text', () => {
        const m = new MeasuredText('你好世界', 80);
        for (let i = 0; i <= m.text.length; i++) {
          const pos = m.offsetToPosition(i);
          const offset = m.positionToOffset(pos);
          expect(offset).toBe(i);
        }
      });

      it('roundtrips mixed ASCII and CJK', () => {
        const m = new MeasuredText('hi你好ok', 80);
        for (let i = 0; i <= m.text.length; i++) {
          const pos = m.offsetToPosition(i);
          const offset = m.positionToOffset(pos);
          expect(offset).toBe(i);
        }
      });

      it('roundtrips CJK across wrapped lines', () => {
        // 4 cols: 你好 (4 cols) | 世界 (4 cols)
        const m = new MeasuredText('你好世界', 4);
        for (let i = 0; i <= m.text.length; i++) {
          const pos = m.offsetToPosition(i);
          const offset = m.positionToOffset(pos);
          expect(offset).toBe(i);
        }
      });

      it('roundtrips emoji text', () => {
        const m = new MeasuredText('a😀b🎉c', 80);
        // Only test at grapheme boundaries
        const graphemeOffsets: number[] = [];
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        for (const seg of segmenter.segment(m.text)) {
          graphemeOffsets.push(seg.index);
        }
        graphemeOffsets.push(m.text.length);

        for (const i of graphemeOffsets) {
          const pos = m.offsetToPosition(i);
          const offset = m.positionToOffset(pos);
          expect(offset).toBe(i);
        }
      });
    });

    describe('getLineLength returns display width', () => {
      it('returns display width for CJK lines', () => {
        const m = new MeasuredText('你好\nabc', 80);
        expect(m.getLineLength(0)).toBe(4); // 你好 = 4 display cols
        expect(m.getLineLength(1)).toBe(3); // abc = 3 display cols
      });

      it('returns display width for wrapped CJK', () => {
        const m = new MeasuredText('你好世界', 4);
        expect(m.getLineLength(0)).toBe(4); // 你好
        expect(m.getLineLength(1)).toBe(4); // 世界
      });

      it('returns display width for emoji line', () => {
        const m = new MeasuredText('a😀b', 80);
        expect(m.getLineLength(0)).toBe(4); // a(1) + 😀(2) + b(1)
      });
    });

    describe('CJK with newlines and wrapping', () => {
      it('handles CJK across logical and wrapped lines', () => {
        // Line 0: 你好 (4 cols, fits in 6) → newline
        // Line 1: 世界abc (4+3=7 cols, wraps at 6) → 世界ab (4+2=6) | c (1)
        const m = new MeasuredText('你好\n世界abc', 6);
        expect(m.wrappedLines[0].text).toBe('你好');
        expect(m.getLineLength(0)).toBe(4);

        // After newline: "世界abc" wraps at 6 display cols
        // 世界 = 4, a = 5, b = 6 → "世界ab" fits
        expect(m.wrappedLines[1].text).toBe('世界ab');
        expect(m.getLineLength(1)).toBe(6);
        expect(m.wrappedLines[2].text).toBe('c');
        expect(m.getLineLength(2)).toBe(1);
      });
    });
  });
});
