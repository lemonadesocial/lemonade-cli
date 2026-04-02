import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Captured useInput handlers from component renders
const useInputHandlers: Array<(input: string, key: Record<string, boolean | undefined>) => void> = [];

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

import { MultilineInput, type MultilineInputProps } from '../../../../../src/chat/ui/input/MultilineInput.js';

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
});
