import { DiagReporter } from './reporter.js';

/** Public surface of InputMonitor — use this type for stubs/NOOPs so TS catches drift. */
export interface IInputMonitor {
  onKeypress(input: string, key: Record<string, boolean | undefined>): void;
  onStateChange(prev: { text: string; cursor: number }, next: { text: string; cursor: number }, trigger: string): void;
  onValueSync(source: 'internal' | 'external', prevValue: string, newValue: string, editorText: string | undefined): void;
  onOnChange(text: string): void;
  onOnSubmit(text: string): void;
  assertCursorBounds(text: string, cursor: number): void;
  assertBackspaceResult(prevText: string, nextText: string, prevCursor: number, nextCursor: number): void;
  assertInsertResult(prevText: string, nextText: string, inserted: string, prevCursor: number, nextCursor: number): void;
  assertSelectionValid(anchor: number, cursor: number, textLen: number): void;
}

export class InputMonitor implements IInputMonitor {
  private reporter: DiagReporter;
  private recentTexts: string[] = [];  // Rolling window of last 5 texts for revert detection
  private lastOperation: string = '';
  private valueSyncTimestamps: number[] = [];  // For loop detection

  constructor(reporter: DiagReporter) { this.reporter = reporter; }

  // Level 1: Every keypress
  onKeypress(input: string, key: Record<string, boolean | undefined>): void {
    const mods = Object.entries(key).filter(([, v]) => v === true).map(([k]) => k);
    this.reporter.log('input', 'INFO', 'keypress', {
      input: input.length <= 1 ? input : `[${input.length} chars]`,
      mods: mods.join('+') || 'none',
      keyReturn: key['return'], keyBackspace: key['backspace'], keyShift: key['shift'],
    });
  }

  // Level 1: State change
  onStateChange(prev: { text: string; cursor: number }, next: { text: string; cursor: number }, trigger: string): void {
    this.reporter.log('input', 'INFO', 'state_change', {
      trigger,
      prevText: prev.text.length > 50 ? prev.text.slice(0, 50) + '...' : prev.text,
      prevCursor: prev.cursor,
      nextText: next.text.length > 50 ? next.text.slice(0, 50) + '...' : next.text,
      nextCursor: next.cursor,
      textChanged: prev.text !== next.text,
      cursorDelta: next.cursor - prev.cursor,
    });

    // Level 2: Anomaly detection
    this.checkStateReset(prev, next, trigger);
    this.checkCursorJump(prev, next);
    this.checkTextRevert(next);

    // Track recent texts
    this.recentTexts.push(next.text);
    if (this.recentTexts.length > 5) this.recentTexts.shift();
    this.lastOperation = trigger;
  }

  // Level 1: Value sync
  onValueSync(source: 'internal' | 'external', prevValue: string, newValue: string, editorText: string | undefined): void {
    this.reporter.log('input', 'INFO', 'value_sync', {
      source,
      prevValue: prevValue.length > 50 ? prevValue.slice(0, 50) + '...' : prevValue,
      newValue: newValue.length > 50 ? newValue.slice(0, 50) + '...' : newValue,
      editorText: editorText ? (editorText.length > 50 ? editorText.slice(0, 50) + '...' : editorText) : 'null',
      willReset: source === 'external' && newValue !== editorText,
    });

    // Level 2: Loop detection
    const now = Date.now();
    this.valueSyncTimestamps.push(now);
    this.valueSyncTimestamps = this.valueSyncTimestamps.filter(t => now - t < 100);
    if (this.valueSyncTimestamps.length > 3) {
      this.reporter.anomaly('input', 'value_sync_loop', {
        count: this.valueSyncTimestamps.length,
        timeWindow: '100ms',
      });
    }
  }

  onOnChange(text: string): void {
    this.reporter.log('input', 'INFO', 'onChange', { text: text.length > 50 ? text.slice(0, 50) + '...' : text });
  }

  onOnSubmit(text: string): void {
    this.reporter.log('input', 'INFO', 'onSubmit', { text: text.length > 50 ? text.slice(0, 50) + '...' : text });
  }

  // Level 2: State reset after internal operation
  private checkStateReset(prev: { text: string; cursor: number }, next: { text: string; cursor: number }, trigger: string): void {
    // If cursor jumps to text.length after a backspace (should decrease by ~1)
    if (this.lastOperation === 'backspace' && next.cursor === next.text.length && next.cursor > prev.cursor) {
      this.reporter.anomaly('input', 'cursor_reset_after_backspace', {
        prevCursor: prev.cursor, nextCursor: next.cursor,
        prevTextLen: prev.text.length, nextTextLen: next.text.length,
        trigger,
      });
    }
  }

  // Level 2: Cursor jump detection
  private checkCursorJump(prev: { text: string; cursor: number }, next: { text: string; cursor: number }): void {
    const delta = Math.abs(next.cursor - prev.cursor);
    // Normal operations move cursor by small amounts. Large jumps are suspicious.
    if (delta > 20 && prev.text.length > 0) {
      this.reporter.anomaly('input', 'large_cursor_jump', {
        prevCursor: prev.cursor, nextCursor: next.cursor, delta,
        operation: this.lastOperation,
      });
    }
  }

  // Level 2: Text revert detection
  private checkTextRevert(next: { text: string }): void {
    // Check if current text matches a text from 2-3 operations ago (but not the immediately previous one, which is normal for undo)
    if (this.recentTexts.length >= 3) {
      const twoAgo = this.recentTexts[this.recentTexts.length - 3];
      if (twoAgo === next.text && this.lastOperation !== 'undo') {
        this.reporter.anomaly('input', 'text_reverted', {
          revertedTo: next.text.length > 50 ? next.text.slice(0, 50) + '...' : next.text,
          operation: this.lastOperation,
        });
      }
    }
  }

  // Level 3: Assertions
  assertCursorBounds(text: string, cursor: number): void {
    this.reporter.assertion(cursor >= 0, 'input', 'cursor >= 0', { cursor, textLen: text.length });
    this.reporter.assertion(cursor <= text.length, 'input', 'cursor <= text.length', { cursor, textLen: text.length });
  }

  assertBackspaceResult(prevText: string, nextText: string, prevCursor: number, nextCursor: number): void {
    if (prevText.length > 0) {
      this.reporter.assertion(nextText.length < prevText.length, 'input', 'backspace reduced text length', {
        prevLen: prevText.length, nextLen: nextText.length,
      });
      this.reporter.assertion(nextCursor < prevCursor, 'input', 'backspace moved cursor backward', {
        prevCursor, nextCursor,
      });
    }
  }

  assertInsertResult(prevText: string, nextText: string, inserted: string, prevCursor: number, nextCursor: number): void {
    this.reporter.assertion(nextText.length === prevText.length + inserted.length, 'input', 'insert increased text by inserted length', {
      prevLen: prevText.length, nextLen: nextText.length, insertedLen: inserted.length,
    });
    this.reporter.assertion(nextCursor === prevCursor + inserted.length, 'input', 'insert moved cursor by inserted length', {
      prevCursor, nextCursor, insertedLen: inserted.length,
    });
  }

  assertSelectionValid(anchor: number, cursor: number, textLen: number): void {
    this.reporter.assertion(anchor === -1 || (anchor >= 0 && anchor <= textLen), 'input', 'selection anchor in bounds', { anchor, textLen });
    this.reporter.assertion(cursor >= 0 && cursor <= textLen, 'input', 'selection cursor in bounds', { cursor, textLen });
  }
}
