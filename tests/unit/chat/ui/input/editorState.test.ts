import { describe, it, expect } from 'vitest';
import { EditorState } from '../../../../../src/chat/ui/input/EditorState.js';

describe('EditorState', () => {
  describe('factory methods', () => {
    it('empty() creates state with empty text and cursor at 0', () => {
      const s = EditorState.empty(80);
      expect(s.text).toBe('');
      expect(s.cursor).toBe(0);
      expect(s.columns).toBe(80);
      expect(s.selectionAnchor).toBe(-1);
      expect(s.stickyColumn).toBe(-1);
    });

    it('from() creates state with cursor at end', () => {
      const s = EditorState.from('hello', 80);
      expect(s.text).toBe('hello');
      expect(s.cursor).toBe(5);
    });
  });

  describe('immutability', () => {
    it('insert returns a new instance', () => {
      const s1 = EditorState.empty(80);
      const s2 = s1.insert('a');
      expect(s1.text).toBe('');
      expect(s2.text).toBe('a');
      expect(s1).not.toBe(s2);
    });

    it('all fields are readonly', () => {
      const s = EditorState.empty(80);
      // TypeScript enforces readonly at compile time; at runtime we just verify
      // the object has the expected properties
      expect(s).toHaveProperty('text');
      expect(s).toHaveProperty('cursor');
      expect(s).toHaveProperty('selectionAnchor');
      expect(s).toHaveProperty('stickyColumn');
      expect(s).toHaveProperty('columns');
    });
  });

  describe('queries', () => {
    it('isAtStart / isAtEnd', () => {
      const s = EditorState.empty(80);
      expect(s.isAtStart).toBe(true);
      expect(s.isAtEnd).toBe(true);

      const s2 = EditorState.from('abc', 80);
      expect(s2.isAtStart).toBe(false);
      expect(s2.isAtEnd).toBe(true);
    });

    it('isOnFirstLine / isOnLastLine', () => {
      const s = EditorState.from('ab\ncd', 80);
      // cursor at end = line 1 (second line)
      expect(s.isOnFirstLine).toBe(false);
      expect(s.isOnLastLine).toBe(true);
    });

    it('cursorPosition', () => {
      const s = EditorState.from('ab\ncd', 80);
      expect(s.cursorPosition).toEqual({ line: 1, column: 2 });
    });

    it('measuredText is lazily computed', () => {
      const s = EditorState.from('hello', 80);
      const m1 = s.measuredText;
      const m2 = s.measuredText;
      expect(m1).toBe(m2); // Same reference (cached)
    });
  });

  describe('navigation - left/right', () => {
    it('left moves one grapheme back', () => {
      const s = EditorState.from('abc', 80);
      const s2 = s.left();
      expect(s2.cursor).toBe(2);
    });

    it('right moves one grapheme forward', () => {
      const s = EditorState.empty(80).insert('abc');
      const s2 = s.left().left().right();
      expect(s2.cursor).toBe(2);
    });

    it('left at start stays at start', () => {
      const s = EditorState.empty(80);
      expect(s.left().cursor).toBe(0);
    });

    it('right at end stays at end', () => {
      const s = EditorState.from('abc', 80);
      expect(s.right().cursor).toBe(3);
    });

    it('left/right are grapheme-aware for emoji', () => {
      const emoji = '👨‍👩‍👧‍👦';
      const s = EditorState.from(emoji, 80);
      // Cursor at end (after emoji)
      const s2 = s.left();
      expect(s2.cursor).toBe(0); // Full emoji is one grapheme
      const s3 = s2.right();
      expect(s3.cursor).toBe(emoji.length);
    });

    it('left with selection collapses to start', () => {
      const s = EditorState.from('abc', 80).selectAll();
      const s2 = s.left();
      expect(s2.cursor).toBe(0);
      expect(s2.hasSelection).toBe(false);
    });

    it('right with selection collapses to end', () => {
      const s = EditorState.from('abc', 80).selectAll();
      const s2 = s.right();
      expect(s2.cursor).toBe(3);
      expect(s2.hasSelection).toBe(false);
    });
  });

  describe('navigation - up/down', () => {
    it('up moves to previous line', () => {
      const s = EditorState.from('ab\ncd', 80);
      // cursor at end of line 2 (offset 5, position {1,2})
      const s2 = s.up();
      expect(s2.cursorPosition.line).toBe(0);
    });

    it('down moves to next line', () => {
      const s = EditorState.empty(80).insert('ab\ncd');
      const s2 = s.startOfBuffer().down();
      expect(s2.cursorPosition.line).toBe(1);
    });

    it('up on first line stays', () => {
      const s = EditorState.from('abc', 80);
      const s2 = s.up();
      expect(s2.cursor).toBe(s.cursor);
    });

    it('down on last line stays', () => {
      const s = EditorState.from('abc', 80);
      const s2 = s.down();
      expect(s2.cursor).toBe(s.cursor);
    });

    it('sticky column is preserved across up/down', () => {
      // Line 0: "abcde" (5 chars), Line 1: "fg" (2 chars), Line 2: "hijkl" (5 chars)
      const s = EditorState.from('abcde\nfg\nhijkl', 80);
      // cursor at end of line 2, col 5
      const s2 = s.up(); // goes to line 1, col 2 (clamped), stickyColumn = 5
      expect(s2.cursorPosition.line).toBe(1);
      expect(s2.cursorPosition.column).toBe(2);
      const s3 = s2.up(); // goes to line 0, col 5 (sticky restores)
      expect(s3.cursorPosition.line).toBe(0);
      expect(s3.cursorPosition.column).toBe(5);
    });
  });

  describe('navigation - startOfLine/endOfLine', () => {
    it('startOfLine moves to beginning of current line', () => {
      const s = EditorState.from('ab\ncd', 80);
      const s2 = s.startOfLine();
      expect(s2.cursor).toBe(3); // Start of "cd"
    });

    it('endOfLine moves to end of current line', () => {
      const s = EditorState.empty(80).insert('ab\ncd');
      const s2 = s.startOfLine().endOfLine();
      expect(s2.cursor).toBe(5); // End of "cd"
    });
  });

  describe('navigation - startOfBuffer/endOfBuffer', () => {
    it('startOfBuffer moves to offset 0', () => {
      const s = EditorState.from('abc', 80).startOfBuffer();
      expect(s.cursor).toBe(0);
    });

    it('endOfBuffer moves to text.length', () => {
      const s = EditorState.empty(80).insert('abc').startOfBuffer().endOfBuffer();
      expect(s.cursor).toBe(3);
    });
  });

  describe('navigation - prevWord/nextWord', () => {
    it('prevWord skips to start of previous word', () => {
      const s = EditorState.from('hello world', 80);
      const s2 = s.prevWord();
      // Should be at start of "world"
      expect(s2.cursor).toBe(6);
    });

    it('nextWord skips to end of next word', () => {
      const s = EditorState.empty(80).insert('hello world').startOfBuffer();
      const s2 = s.nextWord();
      // Should be past "hello" and the space
      expect(s2.cursor).toBeGreaterThanOrEqual(5);
    });

    it('prevWord at start stays', () => {
      const s = EditorState.empty(80).insert('hello').startOfBuffer();
      expect(s.prevWord().cursor).toBe(0);
    });

    it('nextWord at end stays', () => {
      const s = EditorState.from('hello', 80);
      expect(s.nextWord().cursor).toBe(5);
    });
  });

  describe('stickyColumn behavior', () => {
    it('insert resets stickyColumn', () => {
      const s = EditorState.from('abcde\nfg\nhijkl', 80);
      const s2 = s.up(); // sets stickyColumn
      expect(s2.stickyColumn).not.toBe(-1);
      const s3 = s2.insert('x');
      expect(s3.stickyColumn).toBe(-1);
    });
  });

  describe('text operations - insert', () => {
    it('inserts at cursor position', () => {
      const s = EditorState.empty(80).insert('ac');
      const s2 = s.left().insert('b');
      expect(s2.text).toBe('abc');
      expect(s2.cursor).toBe(2);
    });

    it('insert replaces selection', () => {
      const s = EditorState.from('abc', 80).selectAll().insert('x');
      expect(s.text).toBe('x');
      expect(s.cursor).toBe(1);
    });
  });

  describe('text operations - backspace', () => {
    it('deletes grapheme before cursor', () => {
      const s = EditorState.from('abc', 80).backspace();
      expect(s.text).toBe('ab');
      expect(s.cursor).toBe(2);
    });

    it('backspace at start is no-op', () => {
      const s = EditorState.empty(80);
      const s2 = s.backspace();
      expect(s2.text).toBe('');
    });

    it('backspace deletes full emoji grapheme', () => {
      const emoji = '👨‍👩‍👧‍👦';
      const s = EditorState.from('a' + emoji, 80).backspace();
      expect(s.text).toBe('a');
    });

    it('backspace with selection deletes selected text', () => {
      const s = EditorState.from('abc', 80).selectAll().backspace();
      expect(s.text).toBe('');
    });
  });

  describe('text operations - delete', () => {
    it('deletes grapheme after cursor', () => {
      const s = EditorState.from('abc', 80).startOfBuffer().delete();
      expect(s.text).toBe('bc');
      expect(s.cursor).toBe(0);
    });

    it('delete at end is no-op', () => {
      const s = EditorState.from('abc', 80);
      expect(s.delete().text).toBe('abc');
    });

    it('delete removes full emoji grapheme', () => {
      const emoji = '👨‍👩‍👧‍👦';
      const s = EditorState.from(emoji + 'a', 80).startOfBuffer().delete();
      expect(s.text).toBe('a');
    });
  });

  describe('text operations - deleteToLineEnd', () => {
    it('deletes from cursor to end of line', () => {
      const s = EditorState.empty(80).insert('hello world').startOfLine();
      const { state, killed } = s.deleteToLineEnd();
      expect(state.text).toBe('');
      expect(killed).toBe('hello world');
    });

    it('at end of line deletes the newline character', () => {
      const s = EditorState.empty(80).insert('ab\ncd').startOfBuffer().endOfLine();
      const { state, killed } = s.deleteToLineEnd();
      expect(killed).toBe('\n');
      expect(state.text).toBe('abcd');
    });
  });

  describe('text operations - deleteToLineStart', () => {
    it('deletes from line start to cursor', () => {
      const s = EditorState.from('hello world', 80);
      const { state, killed } = s.deleteToLineStart();
      expect(state.text).toBe('');
      expect(killed).toBe('hello world');
    });

    it('at line start is no-op', () => {
      const s = EditorState.from('hello', 80).startOfLine();
      const { state, killed } = s.deleteToLineStart();
      expect(killed).toBe('');
      expect(state.text).toBe('hello');
    });
  });

  describe('text operations - deleteWordBefore', () => {
    it('deletes previous word', () => {
      const s = EditorState.from('hello world', 80);
      const { state, killed } = s.deleteWordBefore();
      expect(killed).toBe('world');
      expect(state.text).toBe('hello ');
    });
  });

  describe('text operations - deleteWordAfter', () => {
    it('deletes next word', () => {
      const s = EditorState.empty(80).insert('hello world').startOfBuffer();
      const { state, killed } = s.deleteWordAfter();
      expect(killed).toBe('hello ');
      expect(state.text).toBe('world');
    });
  });

  describe('selection', () => {
    it('selectLeft extends selection one grapheme left', () => {
      const s = EditorState.from('abc', 80).selectLeft();
      expect(s.hasSelection).toBe(true);
      expect(s.cursor).toBe(2);
      expect(s.selectionAnchor).toBe(3);
      expect(s.getSelectedText()).toBe('c');
    });

    it('selectRight extends selection one grapheme right', () => {
      const s = EditorState.from('abc', 80).startOfBuffer().selectRight();
      expect(s.hasSelection).toBe(true);
      expect(s.getSelectedText()).toBe('a');
    });

    it('selectUp selects to previous line', () => {
      const s = EditorState.from('ab\ncd', 80);
      const s2 = s.selectUp();
      expect(s2.hasSelection).toBe(true);
      expect(s2.selectionAnchor).toBe(5); // original cursor
      expect(s2.cursorPosition.line).toBe(0);
    });

    it('selectDown selects to next line', () => {
      const s = EditorState.empty(80).insert('ab\ncd').startOfBuffer();
      const s2 = s.selectDown();
      expect(s2.hasSelection).toBe(true);
      expect(s2.selectionAnchor).toBe(0);
      expect(s2.cursorPosition.line).toBe(1);
    });

    it('selectAll selects entire text', () => {
      const s = EditorState.from('abc', 80).selectAll();
      expect(s.hasSelection).toBe(true);
      expect(s.getSelectedText()).toBe('abc');
      expect(s.selectionAnchor).toBe(0);
      expect(s.cursor).toBe(3);
    });

    it('selectWordLeft selects previous word', () => {
      const s = EditorState.from('hello world', 80).selectWordLeft();
      expect(s.hasSelection).toBe(true);
      expect(s.getSelectedText()).toBe('world');
    });

    it('selectWordRight selects next word', () => {
      const s = EditorState.empty(80).insert('hello world').startOfBuffer().selectWordRight();
      expect(s.hasSelection).toBe(true);
      expect(s.getSelectedText().length).toBeGreaterThan(0);
    });

    it('selectToLineStart selects to line start', () => {
      const s = EditorState.from('hello', 80).selectToLineStart();
      expect(s.getSelectedText()).toBe('hello');
    });

    it('selectToLineEnd selects to line end', () => {
      const s = EditorState.empty(80).insert('hello').startOfLine().selectToLineEnd();
      expect(s.getSelectedText()).toBe('hello');
    });

    it('clearSelection clears without moving cursor', () => {
      const s = EditorState.from('abc', 80).selectAll().clearSelection();
      expect(s.hasSelection).toBe(false);
      expect(s.cursor).toBe(3); // cursor stays
    });

    it('deleteSelection deletes selected text', () => {
      const s = EditorState.from('abcde', 80);
      // Select "bcd" by going to position 1, then selectRight x3
      const s2 = s.startOfBuffer().right().selectRight().selectRight().selectRight();
      expect(s2.getSelectedText()).toBe('bcd');
      const { state, killed } = s2.deleteSelection();
      expect(state.text).toBe('ae');
      expect(killed).toBe('bcd');
    });

    it('replaceSelection replaces selected text', () => {
      const s = EditorState.from('abc', 80).selectAll().replaceSelection('xyz');
      expect(s.text).toBe('xyz');
      expect(s.cursor).toBe(3);
      expect(s.hasSelection).toBe(false);
    });

    it('selectionRange returns correct range regardless of direction', () => {
      // Forward selection
      const s = EditorState.from('abc', 80).startOfBuffer().selectRight().selectRight();
      const range = s.selectionRange;
      expect(range).toEqual({ start: 0, end: 2 });

      // Backward selection
      const s2 = EditorState.from('abc', 80).selectLeft().selectLeft();
      const range2 = s2.selectionRange;
      expect(range2).toEqual({ start: 1, end: 3 });
    });
  });

  describe('grapheme awareness', () => {
    it('backspace does not split multi-codepoint emoji', () => {
      // Flag emoji
      const flag = '🇺🇸';
      const s = EditorState.from('a' + flag + 'b', 80);
      // Move left past 'b', then backspace should remove the entire flag
      const s2 = s.left().backspace();
      expect(s2.text).toBe('ab');
    });

    it('delete does not split ZWJ sequence', () => {
      const zwj = '👨‍👩‍👧‍👦';
      const s = EditorState.from(zwj + 'a', 80).startOfBuffer();
      const s2 = s.delete();
      expect(s2.text).toBe('a');
    });

    it('left/right navigate full graphemes', () => {
      const text = 'a👨‍👩‍👧‍👦b';
      const s = EditorState.from(text, 80);
      // At end, left once should skip the 'b'
      const s2 = s.left();
      expect(s2.cursor).toBe(text.length - 1);
      // Left again should skip the entire ZWJ emoji
      const s3 = s2.left();
      expect(s3.cursor).toBe(1);
      // Left again should skip 'a'
      const s4 = s3.left();
      expect(s4.cursor).toBe(0);
    });
  });

  describe('wide character navigation', () => {
    // CJK characters are 2 display columns wide
    // 'Ａ' (U+FF21 fullwidth A) = 2 cols, 'a' = 1 col

    it('cursorPosition reports display columns for wide chars', () => {
      // 'Ａ' is 2 cols wide. Text "Ａb" = 3 display cols.
      const s = EditorState.from('Ａb', 80);
      // cursor at end: line 0, display column 3 (2 for Ａ + 1 for b)
      expect(s.cursorPosition).toEqual({ line: 0, column: 3 });
    });

    it('cursorPosition after left from wide char end', () => {
      const s = EditorState.from('Ａb', 80).left();
      // cursor before 'b': display column 2
      expect(s.cursorPosition).toEqual({ line: 0, column: 2 });
    });

    it('cursorPosition at start of wide char', () => {
      const s = EditorState.from('Ａb', 80).left().left();
      // cursor before 'Ａ': display column 0
      expect(s.cursorPosition).toEqual({ line: 0, column: 0 });
    });

    it('up/down with wide chars preserves visual column', () => {
      // Line 0: "abcde" = 5 display cols
      // Line 1: "ＡＢ"  = 4 display cols (2+2)
      // Line 2: "fghij" = 5 display cols
      const s = EditorState.withCursor('abcde\nＡＢ\nfghij', 5, 80);
      // cursor at end of line 0, col 5
      expect(s.cursorPosition).toEqual({ line: 0, column: 5 });

      const s2 = s.down(); // line 1, clamp to col 4
      expect(s2.cursorPosition.line).toBe(1);
      expect(s2.cursorPosition.column).toBe(4);
      expect(s2.stickyColumn).toBe(5);

      const s3 = s2.down(); // line 2, restore sticky col 5
      expect(s3.cursorPosition.line).toBe(2);
      expect(s3.cursorPosition.column).toBe(5);
    });

    it('sticky column uses display columns not source offsets', () => {
      // Line 0: "ＡＢＣ" = 6 display cols, 3 source chars
      // Line 1: "ab"     = 2 display cols
      // Line 2: "ＤＥＦ" = 6 display cols
      const s = EditorState.from('ＡＢＣ\nab\nＤＥＦ', 80);
      // cursor at end of line 2, col 6
      expect(s.cursorPosition).toEqual({ line: 2, column: 6 });

      const s2 = s.up(); // line 1, clamp to col 2, sticky = 6
      expect(s2.cursorPosition.line).toBe(1);
      expect(s2.cursorPosition.column).toBe(2);
      expect(s2.stickyColumn).toBe(6);

      const s3 = s2.up(); // line 0, restore sticky col 6
      expect(s3.cursorPosition.line).toBe(0);
      expect(s3.cursorPosition.column).toBe(6);
    });

    it('down into wide-char line lands on grapheme boundary', () => {
      // Line 0: "abcde" = 5 display cols
      // Line 1: "ＡＢＣ" = 6 display cols
      // Cursor at col 3 on line 0 (after 'c')
      const s = EditorState.withCursor('abcde\nＡＢＣ', 3, 80);
      expect(s.cursorPosition).toEqual({ line: 0, column: 3 });

      const s2 = s.down();
      // col 3 falls inside Ｂ (cols 2-3). positionToOffset snaps backward to col 2 (start of Ｂ)
      expect(s2.cursorPosition.line).toBe(1);
      expect(s2.cursorPosition.column).toBe(2);
    });

    it('startOfLine/endOfLine with wide chars', () => {
      const s = EditorState.from('aＡb\nＢc', 80);
      // cursor at end of line 1
      const s2 = s.startOfLine();
      expect(s2.cursorPosition).toEqual({ line: 1, column: 0 });
      const s3 = s2.endOfLine();
      expect(s3.cursorPosition).toEqual({ line: 1, column: 3 }); // Ｂ=2 + c=1
    });

    it('selection with wide chars reports correct text', () => {
      // "aＡb" — select from start to after Ａ
      const s = EditorState.from('aＡb', 80)
        .startOfBuffer()
        .selectRight()   // select 'a'
        .selectRight();  // select 'Ａ'
      expect(s.getSelectedText()).toBe('aＡ');
    });

    it('selectUp/selectDown with wide chars', () => {
      const s = EditorState.from('ＡＢ\ncd', 80);
      // cursor at end of line 1
      const s2 = s.selectUp();
      expect(s2.hasSelection).toBe(true);
      expect(s2.cursorPosition.line).toBe(0);
    });

    it('deleteToLineEnd with wide chars', () => {
      // "ＡＢＣ" cursor after Ａ (offset 1 since Ａ is 1 source char)
      const s = EditorState.withCursor('ＡＢＣ', 1, 80);
      expect(s.cursorPosition.column).toBe(2); // Ａ = 2 display cols
      const { state, killed } = s.deleteToLineEnd();
      expect(killed).toBe('ＢＣ');
      expect(state.text).toBe('Ａ');
    });

    it('deleteToLineStart with wide chars', () => {
      const s = EditorState.withCursor('ＡＢＣ', 1, 80);
      const { state, killed } = s.deleteToLineStart();
      expect(killed).toBe('Ａ');
      expect(state.text).toBe('ＢＣ');
    });
  });

  describe('vertical navigation with wrapping', () => {
    it('up/down across soft-wrapped lines', () => {
      // columns=5, text "abcdefgh" wraps to:
      //   line 0: "abcde" (cols 0-4)
      //   line 1: "fgh"   (cols 0-2)
      const s = EditorState.withCursor('abcdefgh', 3, 5);
      // cursor at offset 3 = line 0, col 3
      expect(s.cursorPosition).toEqual({ line: 0, column: 3 });

      const s2 = s.down(); // line 1, col 3 clamped to 3
      expect(s2.cursorPosition.line).toBe(1);
      expect(s2.cursorPosition.column).toBe(3);

      const s3 = s2.up(); // back to line 0, col 3
      expect(s3.cursorPosition.line).toBe(0);
      expect(s3.cursorPosition.column).toBe(3);
    });

    it('up/down across soft-wrapped wide-char lines', () => {
      // columns=6, text "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴ" wraps
      // Each fullwidth char = 2 cols, so 3 chars per 6-col line
      const text = 'ＡＢＣＤＥＦ';
      const s = EditorState.withCursor(text, 0, 6);
      expect(s.cursorPosition).toEqual({ line: 0, column: 0 });

      const s2 = s.down(); // line 1, col 0
      expect(s2.cursorPosition.line).toBe(1);
      expect(s2.cursorPosition.column).toBe(0);
    });

    it('sticky column survives wrap-line transitions with wide chars', () => {
      // columns=6
      // "ＡＢＣ" (6 display cols) + "\n" + "ab" (2 cols) + "\n" + "ＤＥＦ" (6 cols)
      // Wraps to:
      //   Line 0: "ＡＢＣ" = 6 cols (endsWithNewline)
      //   Line 1: "ab"     = 2 cols (endsWithNewline)
      //   Line 2: "ＤＥＦ" = 6 cols
      const text = 'ＡＢＣ\nab\nＤＥＦ';
      // Place cursor after ＡＢ on line 0 = offset 2, col 4
      const s0 = EditorState.withCursor(text, 2, 6);
      expect(s0.cursorPosition).toEqual({ line: 0, column: 4 });

      const s2 = s0.down(); // line 1: "ab" = 2 cols, clamp to 2, sticky=4
      expect(s2.cursorPosition.line).toBe(1);
      expect(s2.cursorPosition.column).toBe(2);
      expect(s2.stickyColumn).toBe(4);

      const s3 = s2.down(); // line 2: "ＤＥＦ" = 6 cols, restore to 4
      expect(s3.cursorPosition.line).toBe(2);
      expect(s3.cursorPosition.column).toBe(4);
    });
  });

  describe('remeasure', () => {
    it('changes columns while preserving text and cursor', () => {
      const s = EditorState.from('hello world', 80);
      const s2 = s.remeasure(40);
      expect(s2.text).toBe('hello world');
      expect(s2.cursor).toBe(11);
      expect(s2.columns).toBe(40);
    });
  });
});
