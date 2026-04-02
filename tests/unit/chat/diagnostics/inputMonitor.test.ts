import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputMonitor } from '../../../../src/chat/diagnostics/inputMonitor';
import { DiagReporter } from '../../../../src/chat/diagnostics/reporter';

function createMockReporter(): DiagReporter {
  return {
    log: vi.fn(),
    anomaly: vi.fn(),
    assertion: vi.fn(),
    isEnabled: true,
  } as unknown as DiagReporter;
}

describe('InputMonitor', () => {
  let reporter: ReturnType<typeof createMockReporter>;
  let monitor: InputMonitor;

  beforeEach(() => {
    reporter = createMockReporter();
    monitor = new InputMonitor(reporter);
  });

  // --- Level 1: Logging ---

  it('logs keypress events', () => {
    monitor.onKeypress('a', { shift: false, ctrl: false });
    expect(reporter.log).toHaveBeenCalledWith('input', 'INFO', 'keypress', expect.objectContaining({
      input: 'a',
    }));
  });

  it('logs keypress with modifiers', () => {
    monitor.onKeypress('', { backspace: true, shift: false });
    expect(reporter.log).toHaveBeenCalledWith('input', 'INFO', 'keypress', expect.objectContaining({
      mods: 'backspace',
    }));
  });

  it('logs state changes', () => {
    monitor.onStateChange(
      { text: 'hello', cursor: 5 },
      { text: 'hell', cursor: 4 },
      'backspace',
    );
    expect(reporter.log).toHaveBeenCalledWith('input', 'INFO', 'state_change', expect.objectContaining({
      trigger: 'backspace',
      textChanged: true,
      cursorDelta: -1,
    }));
  });

  it('logs value sync events', () => {
    monitor.onValueSync('internal', 'old', 'new', 'new');
    expect(reporter.log).toHaveBeenCalledWith('input', 'INFO', 'value_sync', expect.objectContaining({
      source: 'internal',
      prevValue: 'old',
      newValue: 'new',
    }));
  });

  it('logs onChange events', () => {
    monitor.onOnChange('hello');
    expect(reporter.log).toHaveBeenCalledWith('input', 'INFO', 'onChange', { text: 'hello' });
  });

  it('logs onSubmit events', () => {
    monitor.onOnSubmit('hello');
    expect(reporter.log).toHaveBeenCalledWith('input', 'INFO', 'onSubmit', { text: 'hello' });
  });

  // --- Level 2: Anomaly Detection ---

  it('detects cursor reset after backspace', () => {
    // First: set lastOperation to 'backspace'
    monitor.onStateChange(
      { text: 'hello', cursor: 5 },
      { text: 'hell', cursor: 4 },
      'backspace',
    );

    // Now simulate the anomaly: after a backspace operation, the next state change
    // shows cursor jumping forward to text.length (reset behavior).
    // prev.cursor=4, next.cursor=4 would not trigger (not > prev), so we simulate
    // a value_sync that bumps the cursor forward:
    monitor.onStateChange(
      { text: 'hel', cursor: 2 },
      { text: 'hel', cursor: 3 },
      'value_sync',
    );

    expect(reporter.anomaly).toHaveBeenCalledWith('input', 'cursor_reset_after_backspace', expect.objectContaining({
      prevCursor: 2,
      nextCursor: 3,
    }));
  });

  it('detects large cursor jumps', () => {
    // Need to set lastOperation to something first
    monitor.onStateChange(
      { text: 'a'.repeat(50), cursor: 0 },
      { text: 'a'.repeat(50), cursor: 0 },
      'init',
    );

    vi.clearAllMocks();

    monitor.onStateChange(
      { text: 'a'.repeat(50), cursor: 0 },
      { text: 'a'.repeat(50), cursor: 45 },
      'value_sync',
    );

    expect(reporter.anomaly).toHaveBeenCalledWith('input', 'large_cursor_jump', expect.objectContaining({
      delta: 45,
    }));
  });

  it('detects text revert', () => {
    // Build up recent texts: 'a', 'ab', 'abc'
    monitor.onStateChange({ text: '', cursor: 0 }, { text: 'a', cursor: 1 }, 'insert');
    monitor.onStateChange({ text: 'a', cursor: 1 }, { text: 'ab', cursor: 2 }, 'insert');
    monitor.onStateChange({ text: 'ab', cursor: 2 }, { text: 'abc', cursor: 3 }, 'insert');

    vi.clearAllMocks();

    // Now revert to 'a' — matches recentTexts[length-3]
    monitor.onStateChange({ text: 'abc', cursor: 3 }, { text: 'a', cursor: 1 }, 'value_sync');

    expect(reporter.anomaly).toHaveBeenCalledWith('input', 'text_reverted', expect.objectContaining({
      revertedTo: 'a',
    }));
  });

  it('detects value sync loops', () => {
    // Rapid value syncs within 100ms
    monitor.onValueSync('external', 'a', 'b', 'b');
    monitor.onValueSync('external', 'b', 'c', 'c');
    monitor.onValueSync('external', 'c', 'd', 'd');
    monitor.onValueSync('external', 'd', 'e', 'e');

    expect(reporter.anomaly).toHaveBeenCalledWith('input', 'value_sync_loop', expect.objectContaining({
      timeWindow: '100ms',
    }));
  });

  // --- Level 3: Assertions ---

  it('asserts cursor bounds — passes', () => {
    monitor.assertCursorBounds('hello', 3);
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'cursor >= 0', expect.any(Object));
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'cursor <= text.length', expect.any(Object));
  });

  it('asserts cursor bounds — fails negative', () => {
    monitor.assertCursorBounds('hello', -1);
    expect(reporter.assertion).toHaveBeenCalledWith(false, 'input', 'cursor >= 0', expect.objectContaining({ cursor: -1 }));
  });

  it('asserts cursor bounds — fails overflow', () => {
    monitor.assertCursorBounds('hello', 10);
    expect(reporter.assertion).toHaveBeenCalledWith(false, 'input', 'cursor <= text.length', expect.objectContaining({ cursor: 10, textLen: 5 }));
  });

  it('asserts backspace result — passes', () => {
    monitor.assertBackspaceResult('hello', 'hell', 5, 4);
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'backspace reduced text length', expect.any(Object));
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'backspace moved cursor backward', expect.any(Object));
  });

  it('asserts backspace result — fails if text grew', () => {
    monitor.assertBackspaceResult('hello', 'helloo', 5, 4);
    expect(reporter.assertion).toHaveBeenCalledWith(false, 'input', 'backspace reduced text length', expect.any(Object));
  });

  it('asserts insert result — passes', () => {
    monitor.assertInsertResult('hello', 'helloX', 'X', 5, 6);
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'insert increased text by inserted length', expect.any(Object));
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'insert moved cursor by inserted length', expect.any(Object));
  });

  it('asserts insert result — fails if length mismatch', () => {
    monitor.assertInsertResult('hello', 'hello', 'X', 5, 6);
    expect(reporter.assertion).toHaveBeenCalledWith(false, 'input', 'insert increased text by inserted length', expect.any(Object));
  });

  it('asserts selection validity — passes for inactive anchor and valid cursor', () => {
    monitor.assertSelectionValid(-1, 3, 5);
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'selection anchor in bounds', expect.any(Object));
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'selection cursor in bounds', expect.any(Object));
  });

  it('asserts selection validity — fails for out-of-bounds anchor', () => {
    monitor.assertSelectionValid(10, 3, 5);
    expect(reporter.assertion).toHaveBeenCalledWith(false, 'input', 'selection anchor in bounds', expect.objectContaining({ anchor: 10, textLen: 5 }));
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'selection cursor in bounds', expect.objectContaining({ cursor: 3, textLen: 5 }));
  });

  it('asserts selection validity — fails for out-of-bounds cursor', () => {
    monitor.assertSelectionValid(2, 10, 5);
    expect(reporter.assertion).toHaveBeenCalledWith(true, 'input', 'selection anchor in bounds', expect.objectContaining({ anchor: 2, textLen: 5 }));
    expect(reporter.assertion).toHaveBeenCalledWith(false, 'input', 'selection cursor in bounds', expect.objectContaining({ cursor: 10, textLen: 5 }));
  });
});
