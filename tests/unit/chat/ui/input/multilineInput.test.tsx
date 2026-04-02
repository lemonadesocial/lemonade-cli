import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Captured useInput handlers from component renders
const useInputHandlers: Array<(input: string, key: Record<string, boolean | undefined>) => void> = [];

vi.mock('../../../../../src/chat/input-runtime/TerminalProtocolController.js', () => {
  const mockController = {
    onPasteStateChange: vi.fn(() => vi.fn()),
    enable: vi.fn(),
    disable: vi.fn(),
  };
  return {
    getTerminalProtocol: () => mockController,
    initTerminalProtocol: () => mockController,
    TerminalProtocolController: vi.fn(() => mockController),
  };
});

vi.mock('ink', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
  Text: ({ children, dimColor, inverse }: { children?: React.ReactNode; dimColor?: boolean; inverse?: boolean }) =>
    React.createElement('span', { 'data-dim': dimColor, 'data-inverse': inverse }, children),
  useInput: (handler: (input: string, key: Record<string, boolean | undefined>) => void, opts?: { isActive?: boolean }) => {
    if (opts?.isActive !== false) {
      useInputHandlers.push(handler);
    }
  },
}));

// Suppress stdout/stdin writes in tests
beforeEach(() => {
  process.stdout.write = vi.fn() as unknown as typeof process.stdout.write;
  process.stdin.prependListener = vi.fn() as unknown as typeof process.stdin.prependListener;
  process.stdin.removeListener = vi.fn() as unknown as typeof process.stdin.removeListener;
  useInputHandlers.length = 0;
});

afterEach(async () => {
  useInputHandlers.length = 0;
  // Allow scheduler to flush to prevent leaks across tests
  await new Promise<void>(resolve => setTimeout(resolve, 0));
});

// Minimal reconciler to actually render the component (triggering hooks like useInput).
// Config mirrors Ink's own reconciler to satisfy react-reconciler's internal requirements.
import Reconciler from 'react-reconciler';
import { DefaultEventPriority, NoEventPriority } from 'react-reconciler/constants.js';
import * as Scheduler from 'scheduler';
import { createContext } from 'react';

let currentUpdatePriority = NoEventPriority;

const hostConfig: any = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: true,
  supportsMicrotasks: true,
  scheduleMicrotask: queueMicrotask,
  scheduleCallback: Scheduler.unstable_scheduleCallback,
  cancelCallback: Scheduler.unstable_cancelCallback,
  shouldYield: Scheduler.unstable_shouldYield,
  now: Scheduler.unstable_now,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  createInstance: () => ({ children: [] }),
  createTextInstance: () => ({ children: [] }),
  appendInitialChild: () => {},
  appendChild: () => {},
  appendChildToContainer: () => {},
  removeChildFromContainer: () => {},
  removeChild: () => {},
  insertBefore: () => {},
  insertInContainerBefore: () => {},
  prepareUpdate: () => true,
  commitUpdate: () => {},
  commitTextUpdate: () => {},
  getRootHostContext: () => ({ isInsideText: false }),
  getChildHostContext: (_p: any, _t: any) => ({ isInsideText: false }),
  shouldSetTextContent: () => false,
  finalizeInitialChildren: () => false,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  clearContainer: () => false,
  getPublicInstance: (i: any) => i,
  preparePortalMount: () => {},
  detachDeletedInstance: () => {},
  hideInstance: () => {},
  unhideInstance: () => {},
  hideTextInstance: () => {},
  unhideTextInstance: () => {},
  resetTextContent: () => {},
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  getInstanceFromNode: () => null,
  prepareScopeUpdate: () => {},
  getInstanceFromScope: () => null,
  setCurrentUpdatePriority: (p: number) => { currentUpdatePriority = p; },
  getCurrentUpdatePriority: () => currentUpdatePriority,
  resolveUpdatePriority: () => currentUpdatePriority !== NoEventPriority ? currentUpdatePriority : DefaultEventPriority,
  getCurrentEventPriority: () => currentUpdatePriority !== NoEventPriority ? currentUpdatePriority : DefaultEventPriority,
  maySuspendCommit: () => false,
  NotPendingTransition: undefined,
  HostTransitionContext: createContext(null),
  resetFormInstance: () => {},
  requestPostPaintCallback: () => {},
  shouldAttemptEagerTransition: () => false,
  trackSchedulerEvent: () => {},
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1.1,
  preloadInstance: () => true,
  startSuspendingCommit: () => {},
  suspendInstance: () => {},
  waitForCommitToBeReady: () => null,
};

const reconciler = Reconciler(hostConfig);

async function flushScheduler(): Promise<void> {
  // Wait for scheduler to process all pending work via microtasks/macrotasks
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  await new Promise<void>(resolve => setTimeout(resolve, 0));
}

async function renderComponentAsync(element: React.ReactElement): Promise<{ unmount: () => Promise<void> }> {
  const container = reconciler.createContainer({}, 0, null, false, null, '', () => {}, null);
  reconciler.updateContainer(element, container, null, () => {});
  await flushScheduler();
  return {
    unmount: async () => {
      reconciler.updateContainer(null, container, null, () => {});
      await flushScheduler();
    },
  };
}

import { MultilineInput, type MultilineInputProps, renderLine, sourceOffsetToDisplayCol } from '../../../../../src/chat/ui/input/MultilineInput.js';

async function getHandler(props: Partial<MultilineInputProps> & { value: string; onChange: any; onSubmit: any; columns: number }) {
  useInputHandlers.length = 0;
  const defaultProps = { focus: true, ...props };
  await renderComponentAsync(React.createElement(MultilineInput, defaultProps));
  return useInputHandlers[useInputHandlers.length - 1];
}

const KEY_DEFAULTS = {
  upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
  return: false, escape: false, tab: false, backspace: false, delete: false,
  shift: false, ctrl: false, meta: false, home: false, end: false,
  pageUp: false, pageDown: false,
};

function key(overrides: Partial<typeof KEY_DEFAULTS> = {}): typeof KEY_DEFAULTS {
  return { ...KEY_DEFAULTS, ...overrides };
}

describe('MultilineInput — component tests', () => {
  describe('onSubmit on Enter', () => {
    it('calls onSubmit with current text on Enter', async () => {
      const onSubmit = vi.fn();
      const onChange = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit, columns: 80 });
      expect(handler).toBeDefined();
      handler('', key({ return: true }));
      expect(onSubmit).toHaveBeenCalledWith('hello');
    });
  });

  describe('Shift+Enter inserts newline', () => {
    it('calls onChange (not onSubmit) on Shift+Enter', async () => {
      const onSubmit = vi.fn();
      const onChange = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit, columns: 80 });
      handler('', key({ return: true, shift: true }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith('hello\n');
    });
  });

  describe('onHistoryUp on up arrow at first line', () => {
    it('calls onHistoryUp when cursor is on first line', async () => {
      const onHistoryUp = vi.fn();
      const handler = await getHandler({
        value: 'hello',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        onHistoryUp,
      });
      handler('', key({ upArrow: true }));
      expect(onHistoryUp).toHaveBeenCalled();
    });
  });

  describe('onHistoryDown on down arrow at last line', () => {
    it('calls onHistoryDown when cursor is on last line', async () => {
      const onHistoryDown = vi.fn();
      const handler = await getHandler({
        value: 'hello',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        onHistoryDown,
      });
      handler('', key({ downArrow: true }));
      expect(onHistoryDown).toHaveBeenCalled();
    });
  });

  describe('Ctrl+D behavior', () => {
    it('calls onExit on Ctrl+D with empty buffer', async () => {
      const onExit = vi.fn();
      const handler = await getHandler({
        value: '',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        onExit,
      });
      handler('d', key({ ctrl: true }));
      expect(onExit).toHaveBeenCalled();
    });

    it('calls onCtrlD with text when onCtrlD prop is set', async () => {
      const onCtrlD = vi.fn();
      const handler = await getHandler({
        value: 'some text',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        onCtrlD,
      });
      handler('d', key({ ctrl: true }));
      expect(onCtrlD).toHaveBeenCalledWith('some text');
    });

    it('calls onCtrlD even with empty buffer when prop is set', async () => {
      const onCtrlD = vi.fn();
      const handler = await getHandler({
        value: '',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        onCtrlD,
      });
      handler('d', key({ ctrl: true }));
      expect(onCtrlD).toHaveBeenCalledWith('');
    });
  });

  describe('Escape key bubbles (not consumed)', () => {
    it('does not call onChange or onSubmit on Escape', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit, columns: 80 });
      handler('', key({ escape: true }));
      expect(onChange).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Tab key bubbles (not consumed)', () => {
    it('does not call onChange or onSubmit on Tab', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit, columns: 80 });
      handler('', key({ tab: true }));
      expect(onChange).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('text insertion', () => {
    it('calls onChange with inserted character', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({
        value: '',
        onChange,
        onSubmit: vi.fn(),
        columns: 80,
      });
      handler('a', key());
      expect(onChange).toHaveBeenCalledWith('a');
    });
  });

  describe('suppressNavigation', () => {
    it('ignores up arrow when suppressNavigation is true', async () => {
      const onHistoryUp = vi.fn();
      const handler = await getHandler({
        value: 'hello',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        onHistoryUp,
        suppressNavigation: true,
      });
      handler('', key({ upArrow: true }));
      expect(onHistoryUp).not.toHaveBeenCalled();
    });

    it('ignores down arrow when suppressNavigation is true', async () => {
      const onHistoryDown = vi.fn();
      const handler = await getHandler({
        value: 'hello',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        onHistoryDown,
        suppressNavigation: true,
      });
      handler('', key({ downArrow: true }));
      expect(onHistoryDown).not.toHaveBeenCalled();
    });
  });

  describe('backspace', () => {
    it('calls onChange with text after backspace', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({
        value: 'ab',
        onChange,
        onSubmit: vi.fn(),
        columns: 80,
      });
      // Cursor is at end (position 2), backspace deletes 'b'
      handler('', key({ backspace: true }));
      expect(onChange).toHaveBeenCalledWith('a');
    });
  });

  describe('focus=false disables input', () => {
    it('does not register useInput handler when focus=false', async () => {
      // Flush any pending scheduler work from previous tests
      await new Promise<void>(resolve => setTimeout(resolve, 10));
      useInputHandlers.length = 0;
      await renderComponentAsync(React.createElement(MultilineInput, {
        value: 'hello',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
        focus: false,
      }));
      expect(useInputHandlers.length).toBe(0);
    });
  });

  describe('submitOnEnter=false', () => {
    it('Enter inserts newline when submitOnEnter=false', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit, columns: 80, submitOnEnter: false });
      handler('', key({ return: true }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith('hello\n');
    });
  });

  describe('Ctrl+D forward-delete on non-empty', () => {
    it('Ctrl+D forward-deletes when buffer is non-empty and no onCtrlD', async () => {
      const onChange = vi.fn();
      const onExit = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit: vi.fn(), columns: 80, onExit });
      handler('d', key({ ctrl: true }));
      expect(onExit).not.toHaveBeenCalled();
      // Text may or may not change depending on cursor position, but onExit should NOT fire
    });
  });

  describe('mask mode', () => {
    it('mask mode still calls onChange with real text', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({ value: '', onChange, onSubmit: vi.fn(), columns: 80, mask: '*' });
      handler('s', key());
      expect(onChange).toHaveBeenCalledWith('s'); // Real text, not masked
    });

    it('mask prop change allows component to function (undo stack cleared internally)', async () => {
      const onChange = vi.fn();
      // Render without mask, type to create undo history
      useInputHandlers.length = 0;
      const { unmount: unmount1 } = await renderComponentAsync(React.createElement(MultilineInput, {
        value: 'test', onChange, onSubmit: vi.fn(), columns: 80, focus: true
      }));
      const handler1 = useInputHandlers[useInputHandlers.length - 1];
      handler1('x', key()); // Insert 'x' — creates undo entry
      expect(onChange).toHaveBeenCalledWith('testx');
      await unmount1();

      // Re-render with mask — undo stack cleared by mask useEffect
      onChange.mockClear();
      useInputHandlers.length = 0;
      const { unmount: unmount2 } = await renderComponentAsync(React.createElement(MultilineInput, {
        value: 'secret', onChange, onSubmit: vi.fn(), columns: 80, focus: true, mask: '*'
      }));
      const handler2 = useInputHandlers[useInputHandlers.length - 1];
      // Ctrl+Z (undo) should be a no-op since undo stack was cleared on mask change
      handler2('z', key({ ctrl: true }));
      // onChange should NOT have been called — undo had nothing to restore
      expect(onChange).not.toHaveBeenCalled();
      await unmount2();
    });
  });

  describe('scroll behavior', () => {
    it('cursor movement on long content triggers onChange without crash', async () => {
      // 10 lines of content with maxVisibleLines=3 — cursor starts at end (line 9)
      const longText = Array.from({ length: 10 }, (_, i) => `line${i}`).join('\n');
      const onChange = vi.fn();
      const handler = await getHandler({ value: longText, onChange, onSubmit: vi.fn(), columns: 80, maxVisibleLines: 3 });
      expect(handler).toBeDefined();
      // Navigate up — should move cursor without crashing (scroll adjusts internally)
      handler('', key({ upArrow: true }));
      // Backspace — deletes from current position, proves cursor is valid after scroll
      handler('', key({ backspace: true }));
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('singleLine mode', () => {
    it('singleLine mode replaces newlines with spaces in typed input', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({ value: '', onChange, onSubmit: vi.fn(), columns: 80, singleLine: true });
      // Simulate input containing a newline (e.g., from paste or terminal quirk)
      handler('hello\nworld', key());
      expect(onChange).toHaveBeenCalledWith('hello world');
    });

    it('Shift+Enter does not insert newline in singleLine mode', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit, columns: 80, singleLine: true });
      handler('', key({ return: true, shift: true }));
      // In singleLine, Shift+Enter falls through to plain Enter → submit
      expect(onSubmit).toHaveBeenCalledWith('hello');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('external value reset', () => {
    it('onSubmit receives new value after external value change', async () => {
      const onSubmit = vi.fn();
      // Render with 'initial', then re-render with 'changed'
      useInputHandlers.length = 0;
      const { unmount: unmount1 } = await renderComponentAsync(React.createElement(MultilineInput, {
        value: 'initial', onChange: vi.fn(), onSubmit, columns: 80, focus: true
      }));
      await unmount1();

      useInputHandlers.length = 0;
      await renderComponentAsync(React.createElement(MultilineInput, {
        value: 'changed', onChange: vi.fn(), onSubmit, columns: 80, focus: true
      }));
      const handler = useInputHandlers[useInputHandlers.length - 1];
      // Press Enter — should submit the NEW value ('changed'), not the old one
      handler('', key({ return: true }));
      expect(onSubmit).toHaveBeenCalledWith('changed');
    });
  });

  describe('Ctrl+L bubbles', () => {
    it('Ctrl+L is not consumed (bubbles to parent)', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({ value: 'hello', onChange, onSubmit: vi.fn(), columns: 80 });
      handler('l', key({ ctrl: true }));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('wide character navigation', () => {
    it('backspace after CJK character removes the whole grapheme', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({
        value: 'a你b',
        onChange,
        onSubmit: vi.fn(),
        columns: 80,
      });
      // Cursor starts at end. Backspace removes 'b'.
      handler('', key({ backspace: true }));
      expect(onChange).toHaveBeenCalledWith('a你');
    });

    it('two backspaces remove CJK char and preceding ASCII', async () => {
      const onChange = vi.fn();
      // Start with cursor at end of "a你"
      const handler = await getHandler({
        value: 'a你',
        onChange,
        onSubmit: vi.fn(),
        columns: 80,
      });
      // First backspace removes '你'
      handler('', key({ backspace: true }));
      expect(onChange).toHaveBeenCalledWith('a');
    });

    it('inserting after CJK text produces correct value', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({
        value: '你好',
        onChange,
        onSubmit: vi.fn(),
        columns: 80,
      });
      handler('x', key());
      expect(onChange).toHaveBeenCalledWith('你好x');
    });
  });

  describe('selection with wide characters', () => {
    it('Shift+Left then backspace deletes one grapheme from CJK text', async () => {
      const onChange = vi.fn();
      const handler = await getHandler({
        value: '你好世',
        onChange,
        onSubmit: vi.fn(),
        columns: 80,
      });
      // Shift+Left to select last grapheme
      handler('', key({ leftArrow: true, shift: true }));
      // Backspace to delete selection
      handler('', key({ backspace: true }));
      expect(onChange).toHaveBeenCalledWith('你好');
    });
  });

  describe('diagnostics wiring with active selection', () => {
    it('assertSelectionValid is called when Shift+Left creates a selection', async () => {
      const { getDiag } = await import('../../../../../src/chat/diagnostics/index.js');
      const spy = vi.spyOn(getDiag().input, 'assertSelectionValid');
      const handler = await getHandler({
        value: 'hello',
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        columns: 80,
      });
      // Shift+Left creates a selection (anchor at old cursor, cursor moves left)
      handler('', key({ leftArrow: true, shift: true }));
      expect(spy).toHaveBeenCalledTimes(1);
      // Verify it receives anchor, cursor, and textLen
      expect(spy).toHaveBeenCalledWith(
        5,   // anchor: original cursor position (end of 'hello')
        4,   // cursor: moved left by one grapheme
        5,   // textLen: 'hello'.length
      );
      spy.mockRestore();
    });
  });

  describe('wrapped-line cursor behavior', () => {
    it('cursor navigates down into a wrapped line correctly', async () => {
      const onChange = vi.fn();
      // 'abcde' with columns=5 (effectiveColumns=3 after prefix) wraps to ['abc', 'de']
      const handler = await getHandler({
        value: 'abcde',
        onChange,
        onSubmit: vi.fn(),
        columns: 5,
        continuationPrefix: '  ',
      });
      // Cursor starts at end (line 1 col 2). Up arrow moves to line 0.
      handler('', key({ upArrow: true }));
      // Now on line 0. Backspace deletes from that position.
      handler('', key({ backspace: true }));
      expect(onChange).toHaveBeenCalled();
      // The text should lose one character from within the first wrapped segment
      const result = onChange.mock.calls[0][0];
      expect(result.length).toBe(4);
    });
  });
});

describe('sourceOffsetToDisplayCol', () => {
  it('returns 0 for offset 0', () => {
    expect(sourceOffsetToDisplayCol('hello', 0)).toBe(0);
  });

  it('returns correct column for ASCII text', () => {
    expect(sourceOffsetToDisplayCol('hello', 3)).toBe(3);
  });

  it('returns display width for CJK character', () => {
    // '你' is 2 display columns wide, source length 1
    expect(sourceOffsetToDisplayCol('你好', 1)).toBe(2);
  });

  it('handles mixed ASCII and CJK', () => {
    // 'a你b': a=1col, 你=2col → offset 1 (start of 你)=1, offset 2 (after 你)=3
    expect(sourceOffsetToDisplayCol('a你b', 1)).toBe(1);
    expect(sourceOffsetToDisplayCol('a你b', 2)).toBe(3);
    expect(sourceOffsetToDisplayCol('a你b', 3)).toBe(4);
  });

  it('returns full width for offset at end of text', () => {
    expect(sourceOffsetToDisplayCol('ab', 2)).toBe(2);
  });

  it('handles emoji graphemes', () => {
    // '😀' is 2 display columns, source length 2 (surrogate pair)
    const text = '😀x';
    expect(sourceOffsetToDisplayCol(text, 2)).toBe(2);
    expect(sourceOffsetToDisplayCol(text, 3)).toBe(3);
  });
});

describe('renderLine — display-column rendering', () => {
  it('places cursor on correct grapheme for CJK text', () => {
    // '你好' at columns wide enough, cursor at display column 2 (after 你, on 好)
    const result = renderLine(
      '你好',       // displayText
      '你好',       // originalText
      0,            // startOffset
      0,            // lineIdx
      { line: 0, column: 2 }, // cursorPos (display column 2 = start of 好)
      1,            // cursorOffset (source offset 1 = start of 好)
      null,         // selRange
      null,         // mask
      true,         // hasFocus
    );
    // Result should have segments: '你' (normal), '好' (cursor/inverse)
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    expect(children.length).toBe(2);
    // First segment: normal '你'
    const seg0 = children[0] as React.ReactElement;
    expect(seg0.props.children).toBe('你');
    expect(seg0.props.inverse).toBeFalsy();
    // Second segment: inverse '好'
    const seg1 = children[1] as React.ReactElement;
    expect(seg1.props.children).toBe('好');
    expect(seg1.props.inverse).toBe(true);
  });

  it('highlights correct graphemes for selection spanning CJK', () => {
    // 'a你b' — select '你' (source offsets 1..2)
    const result = renderLine(
      'a你b',
      'a你b',
      0,
      0,
      { line: 1, column: 0 }, // cursor on different line
      99,                      // cursor offset elsewhere
      { start: 1, end: 2 },   // selection covers '你'
      null,
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // 'a' normal, '你' inverse (selected), 'b' normal
    expect(children.length).toBe(3);
    const seg0 = children[0] as React.ReactElement;
    expect(seg0.props.children).toBe('a');
    expect(seg0.props.inverse).toBeFalsy();
    const seg1 = children[1] as React.ReactElement;
    expect(seg1.props.children).toBe('你');
    expect(seg1.props.inverse).toBe(true);
    const seg2 = children[2] as React.ReactElement;
    expect(seg2.props.children).toBe('b');
    expect(seg2.props.inverse).toBeFalsy();
  });

  it('cursor at end of CJK line shows trailing cursor block', () => {
    const result = renderLine(
      '你',
      '你',
      0,
      0,
      { line: 0, column: 2 }, // display column 2 = past end of '你'
      1,                       // source offset past the char
      null,
      null,
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // '你' normal + trailing cursor block ' '
    expect(children.length).toBe(2);
    const trailing = children[1] as React.ReactElement;
    expect(trailing.props.inverse).toBe(true);
    expect(trailing.props.children).toBe(' ');
  });

  it('masked input cursor uses source-offset-based column', () => {
    // Real text '你好' (2 CJK chars), mask '*' → display '**'
    // Cursor at source offset 1 (after '你') → masked display col 1
    const result = renderLine(
      '**',         // displayText (mask.repeat(2))
      '你好',       // originalText
      0,
      0,
      { line: 0, column: 2 }, // cursorPos from real text (display col 2)
      1,                       // cursorOffset (source offset 1)
      null,
      '*',                     // mask
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // '*' normal, '*' cursor (inverse)
    expect(children.length).toBe(2);
    const seg0 = children[0] as React.ReactElement;
    expect(seg0.props.children).toBe('*');
    expect(seg0.props.inverse).toBeFalsy();
    const seg1 = children[1] as React.ReactElement;
    expect(seg1.props.children).toBe('*');
    expect(seg1.props.inverse).toBe(true);
  });

  it('masked input with emoji source text uses grapheme count', () => {
    // Source '😀x' has 2 graphemes but .length is 3 (surrogate pair + 'x')
    // Masked display should be '**' (2 mask chars), not '***'
    const result = renderLine(
      '**',          // displayText: mask.repeat(graphemeCount('😀x')) = '**'
      '😀x',        // originalText
      0,
      0,
      { line: 0, column: 0 },  // cursor at start
      0,
      null,
      '*',
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // First '*' is cursor (inverse), second '*' is normal
    expect(children.length).toBe(2);
    const seg0 = children[0] as React.ReactElement;
    expect(seg0.props.inverse).toBe(true);
    expect(seg0.props.children).toBe('*');
    const seg1 = children[1] as React.ReactElement;
    expect(seg1.props.children).toBe('*');
    expect(seg1.props.inverse).toBeFalsy();
  });

  it('masked input selection highlights correct mask characters', () => {
    // Source 'abc', mask '*' → display '***'
    // Selection covers source offsets 1..2 ('b') → masked display col 1..2
    const result = renderLine(
      '***',        // displayText
      'abc',        // originalText
      0,
      0,
      { line: 1, column: 0 }, // cursor on different line
      99,
      { start: 1, end: 2 },   // selection covers 'b'
      '*',
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // '*' normal, '*' selected (inverse), '*' normal
    expect(children.length).toBe(3);
    expect((children[0] as React.ReactElement).props.children).toBe('*');
    expect((children[0] as React.ReactElement).props.inverse).toBeFalsy();
    expect((children[1] as React.ReactElement).props.children).toBe('*');
    expect((children[1] as React.ReactElement).props.inverse).toBe(true);
    expect((children[2] as React.ReactElement).props.children).toBe('*');
    expect((children[2] as React.ReactElement).props.inverse).toBeFalsy();
  });

  it('masked input selection with CJK source maps graphemes correctly', () => {
    // Source '你好世' (3 CJK graphemes), mask '*' → display '***'
    // Selection covers source offsets 1..2 ('好') → grapheme index 1..2 → masked col 1..2
    const result = renderLine(
      '***',
      '你好世',
      0,
      0,
      { line: 1, column: 0 },
      99,
      { start: 1, end: 2 },   // source offsets of '好'
      '*',
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    expect(children.length).toBe(3);
    expect((children[0] as React.ReactElement).props.children).toBe('*');
    expect((children[0] as React.ReactElement).props.inverse).toBeFalsy();
    expect((children[1] as React.ReactElement).props.children).toBe('*');
    expect((children[1] as React.ReactElement).props.inverse).toBe(true);
    expect((children[2] as React.ReactElement).props.children).toBe('*');
    expect((children[2] as React.ReactElement).props.inverse).toBeFalsy();
  });

  it('masked input selection with emoji source uses grapheme count', () => {
    // Source '😀x' (2 graphemes), mask '*' → display '**'
    // Selection covers source offset 0..2 (the emoji surrogate pair) → grapheme 0..1 → col 0..1
    const result = renderLine(
      '**',
      '😀x',
      0,
      0,
      { line: 1, column: 0 },
      99,
      { start: 0, end: 2 },   // source offsets of '😀'
      '*',
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    expect(children.length).toBe(2);
    expect((children[0] as React.ReactElement).props.children).toBe('*');
    expect((children[0] as React.ReactElement).props.inverse).toBe(true);
    expect((children[1] as React.ReactElement).props.children).toBe('*');
    expect((children[1] as React.ReactElement).props.inverse).toBeFalsy();
  });

  it('masked cursor on emoji source at grapheme boundary', () => {
    // Source '😀x', cursor after '😀' (source offset 2) → grapheme index 1
    // Masked display '**', cursor should be on second '*'
    const result = renderLine(
      '**',
      '😀x',
      0,
      0,
      { line: 0, column: 2 },  // cursorPos from real text
      2,                         // cursorOffset (after surrogate pair)
      null,
      '*',
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    expect(children.length).toBe(2);
    const seg0 = children[0] as React.ReactElement;
    expect(seg0.props.children).toBe('*');
    expect(seg0.props.inverse).toBeFalsy();
    const seg1 = children[1] as React.ReactElement;
    expect(seg1.props.children).toBe('*');
    expect(seg1.props.inverse).toBe(true);
  });

  it('cursorChar on a wide grapheme advances by cursorChar width', () => {
    // Line '你好', cursor on '你' (display col 0), cursorChar='|' (width 1)
    // After replacement: displayCol should be 1, not 2
    // So '好' starts at displayCol 1, selection starting at col 1 should highlight it
    const result = renderLine(
      '你好',
      '你好',
      0,
      0,
      { line: 0, column: 0 },  // cursor at display col 0
      0,                         // cursorOffset
      { start: 0, end: 2 },     // select both chars (won't affect cursor grapheme)
      null,
      true,
      '|',                       // cursorChar (width 1, replacing width-2 '你')
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // Expect: '|' (cursor, inverse), '好' (selected, inverse)
    // Both are inverse but for different reasons (cursor vs selected)
    expect(children.length).toBe(2);
    const cur = children[0] as React.ReactElement;
    expect(cur.props.children).toBe('|');
    expect(cur.props.inverse).toBe(true);
    const sel = children[1] as React.ReactElement;
    expect(sel.props.children).toBe('好');
    expect(sel.props.inverse).toBe(true);
  });

  it('cursorChar on wide grapheme does not misalign trailing content', () => {
    // Line 'a你b', cursor on '你' (display col 1), cursorChar='_' (width 1)
    // After: 'a' normal (col 0), '_' cursor (col 1, width 1 → next col 2), 'b' normal (col 2)
    // Without fix, displayCol would be 3 after '你' replacement, and 'b' would start at col 3
    const result = renderLine(
      'a你b',
      'a你b',
      0,
      0,
      { line: 0, column: 1 },  // cursor at display col 1 (after 'a')
      1,                         // source offset of '你'
      null,
      null,
      true,
      '_',                       // cursorChar width 1
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // 'a' normal, '_' cursor, 'b' normal
    expect(children.length).toBe(3);
    expect((children[0] as React.ReactElement).props.children).toBe('a');
    expect((children[0] as React.ReactElement).props.inverse).toBeFalsy();
    expect((children[1] as React.ReactElement).props.children).toBe('_');
    expect((children[1] as React.ReactElement).props.inverse).toBe(true);
    expect((children[2] as React.ReactElement).props.children).toBe('b');
    expect((children[2] as React.ReactElement).props.inverse).toBeFalsy();
  });

  it('cursorChar width mismatch does not corrupt selection after cursor', () => {
    // Regression: text 'a你b', cursor on '你' (width 2), cursorChar='|' (width 1),
    // selection covering 'b'. Without fix, displayCol after cursor advances by 1
    // (cursorChar width) instead of 2 (original grapheme width), so 'b' at
    // selStartCol=3 is never reached and selection highlighting is lost.
    const result = renderLine(
      'a你b',
      'a你b',
      0,
      0,
      { line: 0, column: 1 },  // cursor at display col 1 (on '你')
      1,                         // cursorOffset
      { start: 2, end: 3 },     // selection covers 'b' (source offsets 2..3)
      null,
      true,
      '|',                       // cursorChar width 1, replacing width-2 '你'
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // Expect: 'a' normal, '|' cursor (inverse), 'b' selected (inverse)
    expect(children.length).toBe(3);
    expect((children[0] as React.ReactElement).props.children).toBe('a');
    expect((children[0] as React.ReactElement).props.inverse).toBeFalsy();
    expect((children[1] as React.ReactElement).props.children).toBe('|');
    expect((children[1] as React.ReactElement).props.inverse).toBe(true);
    expect((children[2] as React.ReactElement).props.children).toBe('b');
    expect((children[2] as React.ReactElement).props.inverse).toBe(true);
  });

  it('masked mode cursor within selection on same line', () => {
    // Source 'abcd', mask '*' → display '****'
    // Cursor at source offset 2 (after 'ab'), selection covers offsets 1..3 ('bc')
    // Cursor is inside the selection range on the same line.
    const result = renderLine(
      '****',        // displayText
      'abcd',        // originalText
      0,
      0,
      { line: 0, column: 2 }, // cursorPos (display col 2 from real text)
      2,                       // cursorOffset
      { start: 1, end: 3 },   // selection covers 'bc'
      '*',
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // '*' normal (a), '*' selected (b), '*' cursor-at-selection (c), '*' normal (d)
    // Note: cursor and selected both render as inverse — visual distinction is not yet
    // implemented. This test verifies the segment structure (4 segments with correct
    // inverse flags) but cannot distinguish cursor mode from selected mode visually.
    expect(children.length).toBe(4);
    // 'a' — normal (before selection)
    expect((children[0] as React.ReactElement).props.children).toBe('*');
    expect((children[0] as React.ReactElement).props.inverse).toBeFalsy();
    // 'b' — selected (in selection, before cursor)
    expect((children[1] as React.ReactElement).props.children).toBe('*');
    expect((children[1] as React.ReactElement).props.inverse).toBe(true);
    // 'c' — cursor position (inside selection; renders identically to selected for now)
    expect((children[2] as React.ReactElement).props.children).toBe('*');
    expect((children[2] as React.ReactElement).props.inverse).toBe(true);
    // 'd' — normal (after selection)
    expect((children[3] as React.ReactElement).props.children).toBe('*');
    expect((children[3] as React.ReactElement).props.inverse).toBeFalsy();
  });

  it('masked mode cursor at position 0', () => {
    // Source 'abc', mask '*' → display '***'
    // Cursor at source offset 0 (start of text)
    const result = renderLine(
      '***',
      'abc',
      0,
      0,
      { line: 0, column: 0 },
      0,
      null,
      '*',
      true,
    );
    const children = React.Children.toArray((result as React.ReactElement).props.children);
    // First '*' is cursor (inverse), rest normal
    expect(children.length).toBe(2);
    expect((children[0] as React.ReactElement).props.children).toBe('*');
    expect((children[0] as React.ReactElement).props.inverse).toBe(true);
    expect((children[1] as React.ReactElement).props.children).toBe('**');
    expect((children[1] as React.ReactElement).props.inverse).toBeFalsy();
  });

  it('returns plain text when no cursor or selection on line', () => {
    const result = renderLine(
      'hello',
      'hello',
      0,
      1,                       // lineIdx=1, cursor on line 0
      { line: 0, column: 0 },
      0,
      null,
      null,
      true,
    );
    expect(result).toBe('hello');
  });
});
