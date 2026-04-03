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

  describe('tab handling', () => {
    it('tab has zero display width (string-width treats \\t as control char)', () => {
      expect(MeasuredText.displayWidth('\t')).toBe(0);
    });

    it('tab is a distinct grapheme that occupies 0 columns', () => {
      const m = new MeasuredText('a\tb', 80);
      expect(m.wrappedLines).toHaveLength(1);
      expect(m.wrappedLines[0].text).toBe('a\tb');
      // 'a' = 1, '\t' = 0, 'b' = 1
      expect(m.getLineLength(0)).toBe(2);
    });

    it('offsetToPosition accounts for zero-width tab', () => {
      const m = new MeasuredText('a\tb', 80);
      expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 }); // before 'a'
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 }); // after 'a', before '\t'
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 1 }); // after '\t', before 'b' (tab is 0-width)
      expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 2 }); // after 'b'
    });

    it('zero-width tab creates non-invertible offset mapping', () => {
      // Zero-width graphemes (tabs, some control chars) collapse multiple source
      // offsets onto the same display column. This is inherent to the mapping —
      // position-space has fewer slots than offset-space — and is NOT a bug.
      // positionToOffset picks the *first* offset at that column so cursor
      // movement stays predictable; trailing zero-width graphemes at the same
      // column are only reachable via offsetToPosition (arrow-key from the
      // preceding visible grapheme).
      const m = new MeasuredText('a\tb', 80);
      // offset 1 (before tab) and offset 2 (after tab) both map to column 1
      // because tab has 0 display width
      const pos1 = m.offsetToPosition(1);
      const pos2 = m.offsetToPosition(2);
      expect(pos1).toEqual(pos2); // both map to column 1
      // positionToOffset returns the *first* offset at column 1 (before the tab)
      expect(m.positionToOffset({ line: 0, column: 1 })).toBe(1);
    });

    it('leading tab: column 0 maps to start-of-line (offset 0)', () => {
      const m = new MeasuredText('\ta', 80);
      // '\t' at offset 0 has 0 display width, 'a' at offset 1 has width 1
      expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 0 });
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 1 });
      // column 0 must return offset 0 (before the tab), not skip past it
      expect(m.positionToOffset({ line: 0, column: 0 })).toBe(0);
      expect(m.positionToOffset({ line: 0, column: 1 })).toBe(2);
    });

    it('consecutive tabs: column 0 maps to first offset, not past all tabs', () => {
      const m = new MeasuredText('\t\t\tb', 80);
      // offsets 0–2 are tabs (all 0-width), offset 3 is 'b' (width 1)
      expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 0 });
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 0 });
      expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 0 });
      expect(m.offsetToPosition(4)).toEqual({ line: 0, column: 1 });
      // column 0 must return offset 0, not offset 3
      expect(m.positionToOffset({ line: 0, column: 0 })).toBe(0);
    });

    it('tab-only line: column 0 maps to start-of-line', () => {
      const m = new MeasuredText('\t\t', 80);
      expect(m.getLineLength(0)).toBe(0); // all zero-width
      // column 0 must return start-of-line (offset 0), not end-of-line
      expect(m.positionToOffset({ line: 0, column: 0 })).toBe(0);
    });

    it('mixed visible and zero-width: positions before each zero-width run are reachable', () => {
      // "a\t\tb" — 'a'(w1) '\t'(w0) '\t'(w0) 'b'(w1)
      const m = new MeasuredText('a\t\tb', 80);
      expect(m.getLineLength(0)).toBe(2); // a + b visible
      // column 0 → offset 0 (before 'a')
      expect(m.positionToOffset({ line: 0, column: 0 })).toBe(0);
      // column 1 → offset 1 (before first tab, not after second tab)
      expect(m.positionToOffset({ line: 0, column: 1 })).toBe(1);
    });
  });

  describe('mid-surrogate offsets (finding #2)', () => {
    it('offsetToPosition snaps forward for mid-surrogate offset in emoji', () => {
      // '😀' is a surrogate pair: 2 code units at indices 1..2 in "a😀b"
      const m = new MeasuredText('a😀b', 80);
      // offset 1 = start of emoji → column 1 (before emoji)
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 });
      // offset 2 = mid-surrogate → snaps forward past emoji → column 3
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 3 });
      // offset 3 = after emoji → column 3
      expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 3 });
    });

    it('offsetToPosition snaps forward for mid-surrogate in flag emoji', () => {
      // 🇯🇵 is 4 code units (two regional indicators), 1 grapheme, 2 display cols
      const flag = '🇯🇵';
      expect(flag.length).toBe(4); // confirm 4 code units
      const m = new MeasuredText('x' + flag + 'y', 80);
      // offset 1 = start of flag → column 1
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 });
      // offsets 2, 3, 4 = mid-grapheme → snap forward past flag → column 3
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 3 });
      expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 3 });
      expect(m.offsetToPosition(4)).toEqual({ line: 0, column: 3 });
      // offset 5 = after flag, at 'y'
      expect(m.offsetToPosition(5)).toEqual({ line: 0, column: 3 });
    });
  });

  describe('combining-mark graphemes (finding #3)', () => {
    it('treats base + combining mark as single grapheme', () => {
      // 'é' as e (U+0065) + combining acute (U+0301) = 2 code units, 1 grapheme
      const combining = 'e\u0301'; // é decomposed
      expect(combining.length).toBe(2);
      const m = new MeasuredText('a' + combining + 'b', 80);
      // Intl.Segmenter treats e+combining as 1 grapheme
      expect(m.wrappedLines[0].text).toBe('a' + combining + 'b');
      expect(m.getLineLength(0)).toBe(3); // a(1) + é(1) + b(1)
    });

    it('offsetToPosition handles combining mark grapheme', () => {
      const combining = 'e\u0301';
      const m = new MeasuredText('a' + combining + 'b', 80);
      expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 }); // before 'a'
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 }); // after 'a', before 'é'
      // offset 2 = mid-grapheme (between 'e' and combining mark) → snaps forward
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 2 });
      expect(m.offsetToPosition(3)).toEqual({ line: 0, column: 2 }); // after 'é', before 'b'
      expect(m.offsetToPosition(4)).toEqual({ line: 0, column: 3 }); // after 'b'
    });

    it('roundtrips at grapheme boundaries for combining marks', () => {
      const combining = 'e\u0301';
      const m = new MeasuredText('a' + combining + 'b', 80);
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const boundaries = [...segmenter.segment(m.text)].map(s => s.index);
      boundaries.push(m.text.length);
      for (const offset of boundaries) {
        const pos = m.offsetToPosition(offset);
        const rt = m.positionToOffset(pos);
        expect(rt).toBe(offset);
      }
    });

    it('wraps combining-mark grapheme as atomic unit', () => {
      // 3 columns: 'ab' (2) then 'é' (1) fits → 'abé' but length is 4 code units
      const combining = 'e\u0301';
      const m = new MeasuredText('ab' + combining + 'cd', 3);
      expect(m.wrappedLines[0].text).toBe('ab' + combining);
      expect(m.wrappedLines[1].text).toBe('cd');
    });
  });

  describe('ZWJ emoji sequences (finding #4)', () => {
    it('offsetToPosition at grapheme boundaries for ZWJ family', () => {
      const family = '👨‍👩‍👧‍👦';
      const m = new MeasuredText('a' + family + 'b', 80);
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const segs = [...segmenter.segment(m.text)];
      // Should be 3 graphemes: 'a', family, 'b'
      expect(segs).toHaveLength(3);
      expect(segs[0].segment).toBe('a');
      expect(segs[1].segment).toBe(family);
      expect(segs[2].segment).toBe('b');

      // Boundary offsets
      expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 }); // before 'a'
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 }); // after 'a'
      const afterFamily = 1 + family.length;
      expect(m.offsetToPosition(afterFamily)).toEqual({ line: 0, column: 3 }); // after family
      expect(m.offsetToPosition(afterFamily + 1)).toEqual({ line: 0, column: 4 }); // after 'b'
    });

    it('mid-grapheme offsets in ZWJ sequence snap forward', () => {
      const family = '👨‍👩‍👧‍👦';
      const m = new MeasuredText(family, 80);
      // Any offset from 1 to family.length-1 is mid-grapheme → snaps to column 2 (full width)
      for (let i = 1; i < family.length; i++) {
        const pos = m.offsetToPosition(i);
        expect(pos).toEqual({ line: 0, column: 2 });
      }
    });

    it('roundtrips ZWJ sequence at grapheme boundaries only', () => {
      const family = '👨‍👩‍👧‍👦';
      const m = new MeasuredText('x' + family + 'y', 80);
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const boundaries = [...segmenter.segment(m.text)].map(s => s.index);
      boundaries.push(m.text.length);
      for (const offset of boundaries) {
        const pos = m.offsetToPosition(offset);
        const rt = m.positionToOffset(pos);
        expect(rt).toBe(offset);
      }
    });

    it('wraps ZWJ emoji as atomic unit', () => {
      const family = '👨‍👩‍👧‍👦'; // 2 display cols
      // 3 columns: 'a' (1) + family (2) = 3 fits, 'b' wraps
      const m = new MeasuredText('a' + family + 'b', 3);
      expect(m.wrappedLines[0].text).toBe('a' + family);
      expect(m.wrappedLines[1].text).toBe('b');
    });
  });

  describe('mid-grapheme offset snap-forward contract (finding #5)', () => {
    it('mid-surrogate in simple emoji snaps forward to after-grapheme column', () => {
      const m = new MeasuredText('😀', 80);
      // offset 0 = before emoji → column 0
      expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
      // offset 1 = mid-surrogate → snap forward → column 2 (after emoji)
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 2 });
      // offset 2 = after emoji → column 2
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 2 });
    });

    it('mid-grapheme offset is non-invertible (positionToOffset returns boundary)', () => {
      const m = new MeasuredText('a😀b', 80);
      // mid-surrogate offset 2 → column 3 (snapped forward past emoji)
      const pos = m.offsetToPosition(2);
      expect(pos).toEqual({ line: 0, column: 3 });
      // column 3 → offset 3 (the canonical grapheme boundary), NOT 2
      expect(m.positionToOffset(pos)).toBe(3);
    });

    it('combining mark mid-offset is non-invertible', () => {
      // 'é' = e + U+0301, 2 code units
      const m = new MeasuredText('e\u0301', 80);
      // offset 0 = before grapheme → column 0
      expect(m.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
      // offset 1 = mid-grapheme → snap forward → column 1
      expect(m.offsetToPosition(1)).toEqual({ line: 0, column: 1 });
      // offset 2 = end → column 1
      expect(m.offsetToPosition(2)).toEqual({ line: 0, column: 1 });
      // column 1 → offset 2 (grapheme boundary), not 1
      expect(m.positionToOffset({ line: 0, column: 1 })).toBe(2);
    });
  });
});
