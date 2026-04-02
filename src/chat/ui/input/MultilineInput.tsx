// MultilineInput — custom multiline text input component for Ink 6.
//
// Width note: all lines wrap at `effectiveColumns = columns - continuationPrefix.length`.
// Line 1 has no prefix, so it wraps ~2 chars early. This is intentional — per-line
// column widths would add significant complexity to MeasuredText for negligible benefit.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { EditorState } from './EditorState.js';
import { KillRing } from './KillRing.js';
import { UndoStack } from './UndoStack.js';
import { MeasuredText, type Position } from './MeasuredText.js';
import { getDiag } from '../../diagnostics/index.js';
import { getTerminalProtocol } from '../../input-runtime/TerminalProtocolController.js';

const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function graphemeCount(text: string): number {
  let count = 0;
  for (const _ of GRAPHEME_SEGMENTER.segment(text)) count++;
  return count;
}

/** Count graphemes whose start index < sourceOffset. */
function graphemesBeforeOffset(text: string, sourceOffset: number): number {
  let count = 0;
  for (const seg of GRAPHEME_SEGMENTER.segment(text)) {
    if (seg.index >= sourceOffset) break;
    count++;
  }
  return count;
}

export interface MultilineInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  focus?: boolean;
  columns: number;
  onHistoryUp?: () => void;
  onHistoryDown?: () => void;
  onExit?: () => void;
  onCtrlD?: (text: string) => void;
  maxVisibleLines?: number;
  placeholder?: string;
  continuationPrefix?: string;
  cursorChar?: string;
  suppressNavigation?: boolean;
  mask?: string;
  singleLine?: boolean;
  submitOnEnter?: boolean;
}

export function MultilineInput({
  value,
  onChange,
  onSubmit,
  focus = true,
  columns,
  onHistoryUp,
  onHistoryDown,
  onExit,
  onCtrlD,
  maxVisibleLines = 8,
  placeholder,
  continuationPrefix = '  ',
  cursorChar,
  suppressNavigation = false,
  mask,
  singleLine = false,
  submitOnEnter = true,
}: MultilineInputProps): React.JSX.Element {
  // singleLine forces submitOnEnter
  const effectiveSubmitOnEnter = singleLine ? true : submitOnEnter;

  const prefixLen = continuationPrefix?.length ?? 2;
  const effectiveColumns = Math.max(1, columns - prefixLen);

  const [editorState, setEditorState] = useState<EditorState>(
    () => EditorState.from(value, effectiveColumns),
  );
  const [scrollOffset, setScrollOffset] = useState(0);

  // Mutable refs for kill ring and undo stack (shared across renders)
  const killRingRef = useRef(new KillRing());
  const undoStackRef = useRef(new UndoStack());

  // Undo debounce timer
  const lastUndoSaveRef = useRef(0);

  // Bracketed paste tracking
  const isPastingRef = useRef(false);
  const pasteBufferRef = useRef('');

  // Value sync with parent
  const prevValueRef = useRef(value);
  const editorStateRef = useRef(editorState);
  editorStateRef.current = editorState;
  const internalChangeRef = useRef(false);

  // Clear killRing and undoStack when mask prop changes
  const prevMaskRef = useRef(mask);
  useEffect(() => {
    if (mask !== prevMaskRef.current) {
      prevMaskRef.current = mask;
      killRingRef.current.clear();
      undoStackRef.current.clear();
    }
  }, [mask]);

  // Sync with parent value prop (only reset state for EXTERNAL changes)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      getDiag().input.onValueSync(
        internalChangeRef.current ? 'internal' : 'external',
        prevValueRef.current, value, editorStateRef.current?.text,
      );
      prevValueRef.current = value;
      if (internalChangeRef.current) {
        // This value change was triggered by our own onChange — don't reset state
        internalChangeRef.current = false;
        return;
      }
      if (value !== editorStateRef.current?.text) {
        setEditorState(EditorState.from(value, effectiveColumns));
        setScrollOffset(0);
        undoStackRef.current.clear();
      }
    }
  }, [value, effectiveColumns]);

  // Columns reactivity
  useEffect(() => {
    if (editorStateRef.current) {
      setEditorState(prev => prev.remeasure(effectiveColumns));
    }
  }, [effectiveColumns]);

  // Bracketed paste: subscribe to protocol controller's paste-state events.
  // The controller owns enable/disable of the terminal escape sequences.
  useEffect(() => {
    if (!focus) return;

    const unsubscribe = getTerminalProtocol().onPasteStateChange((pasting) => {
      isPastingRef.current = pasting;
    });

    return unsubscribe;
  }, [focus]);

  const ensureCursorVisible = useCallback((state: EditorState) => {
    const max = maxVisibleLines;
    const cursorLine = state.cursorPosition.line;
    setScrollOffset(prev => {
      if (cursorLine < prev) return cursorLine;
      if (cursorLine >= prev + max) return cursorLine - max + 1;
      return prev;
    });
  }, [maxVisibleLines]);

  const saveUndoDebounced = useCallback((state: EditorState, force: boolean) => {
    const now = Date.now();
    if (force || now - lastUndoSaveRef.current > 300) {
      undoStackRef.current.save(state.text, state.cursor);
      lastUndoSaveRef.current = now;
    }
  }, []);

  // Note: updateState does NOT save undo — callers must call saveUndoDebounced
  // before updateState for text-modifying operations. Navigation-only changes
  // (cursor moves without text change) intentionally skip undo saves.
  const updateState = useCallback((newState: EditorState, opts?: { force?: boolean; skipOnChange?: boolean }) => {
    getDiag().input.onStateChange(
      { text: editorStateRef.current.text, cursor: editorStateRef.current.cursor },
      { text: newState.text, cursor: newState.cursor },
      'updateState',
    );
    setEditorState(newState);
    ensureCursorVisible(newState);
    if (!opts?.skipOnChange && newState.text !== editorStateRef.current.text) {
      internalChangeRef.current = true;
      getDiag().input.onOnChange(newState.text);
      onChange(newState.text);
    }
  }, [ensureCursorVisible, onChange]);

  // Keyboard handler
  useInput((input, key) => {
    getDiag().input.onKeypress(input, key as unknown as Record<string, boolean | undefined>);
    const state = editorStateRef.current;

    // Default: any action resets kill ring accumulation.
    // Kill/yank handlers override this below.
    killRingRef.current.setLastAction('other');

    // Bracketed paste accumulation
    if (isPastingRef.current) {
      pasteBufferRef.current += input;
      return;
    }

    // Flush paste buffer
    if (pasteBufferRef.current) {
      let pasted = pasteBufferRef.current + input;
      pasteBufferRef.current = '';
      if (singleLine) pasted = pasted.replace(/\n/g, ' ');
      undoStackRef.current.save(state.text, state.cursor);
      lastUndoSaveRef.current = Date.now();
      updateState(state.insert(pasted));
      return;
    }

    // --- Keys that bubble (NOT consumed) ---
    // Escape, Ctrl+C, Ctrl+L, Tab — do NOT handle
    if (key.escape) return;
    if (key.ctrl && input === 'c') return;
    if (key.ctrl && input === 'l') return;
    if (key.tab) return;

    // --- Return / Enter ---
    if (key.return) {
      // Shift+Enter → newline (if not singleLine)
      if (key.shift && !singleLine) {
        saveUndoDebounced(state, false);
        updateState(state.insert('\n'));
        return;
      }
      // Alt+Enter → newline fallback (if not singleLine)
      if (key.meta && !singleLine) {
        saveUndoDebounced(state, false);
        updateState(state.insert('\n'));
        return;
      }
      // Plain Enter
      if (effectiveSubmitOnEnter) {
        getDiag().input.onOnSubmit(state.text);
        onSubmit(state.text);
      } else {
        saveUndoDebounced(state, false);
        updateState(state.insert('\n'));
      }
      return;
    }

    // --- Ctrl+D ---
    if (input === 'd' && key.ctrl) {
      if (onCtrlD) {
        onCtrlD(state.text);
        return;
      }
      if (state.text === '') {
        onExit?.();
      } else {
        updateState(state.delete());
      }
      return;
    }

    // --- Backspace ---
    // Ink maps \x7f (macOS Backspace) to key.delete and \b to key.backspace.
    // With CSI u enabled, codepoint 127 also maps to key.delete.
    // We treat BOTH as backward-delete (backspace). Forward-delete is Ctrl+D.
    if (key.backspace || key.delete) {
      if (state.text !== '' || state.hasSelection) {
        saveUndoDebounced(state, false);
        const nextState = state.backspace();
        getDiag().input.assertCursorBounds(nextState.text, nextState.cursor);
        getDiag().input.assertBackspaceResult(state.text, nextState.text, state.cursor, nextState.cursor);
        updateState(nextState);
      }
      return;
    }

    // --- Undo / Redo ---
    if (key.ctrl && input === 'z') {
      if (key.shift) {
        // Redo
        const entry = undoStackRef.current.redo(
          { text: state.text, cursor: state.cursor },
        );
        if (entry) {
          const s = EditorState.withCursor(entry.text, entry.cursor, effectiveColumns);
          updateState(s, { skipOnChange: false });
        }
      } else {
        // Undo
        const entry = undoStackRef.current.undo(
          { text: state.text, cursor: state.cursor },
        );
        if (entry) {
          const s = EditorState.withCursor(entry.text, entry.cursor, effectiveColumns);
          updateState(s, { skipOnChange: false });
        }
      }
      return;
    }

    // --- Kill operations (always force undo save) ---

    // Ctrl+K: kill to line end
    if (key.ctrl && input === 'k') {
      undoStackRef.current.save(state.text, state.cursor);
      lastUndoSaveRef.current = Date.now();
      const result = state.deleteToLineEnd();
      killRingRef.current.push(result.killed, 'append');
      killRingRef.current.setLastAction('kill');
      updateState(result.state);
      return;
    }

    // Ctrl+U: kill to line start
    if (key.ctrl && input === 'u') {
      undoStackRef.current.save(state.text, state.cursor);
      lastUndoSaveRef.current = Date.now();
      const result = state.deleteToLineStart();
      killRingRef.current.push(result.killed, 'prepend');
      killRingRef.current.setLastAction('kill');
      updateState(result.state);
      return;
    }

    // Ctrl+W: kill word before
    if (key.ctrl && input === 'w') {
      undoStackRef.current.save(state.text, state.cursor);
      lastUndoSaveRef.current = Date.now();
      const result = state.deleteWordBefore();
      killRingRef.current.push(result.killed, 'prepend');
      killRingRef.current.setLastAction('kill');
      updateState(result.state);
      return;
    }

    // Alt+D: kill word after
    if (key.meta && input === 'd') {
      undoStackRef.current.save(state.text, state.cursor);
      lastUndoSaveRef.current = Date.now();
      const result = state.deleteWordAfter();
      killRingRef.current.push(result.killed, 'append');
      killRingRef.current.setLastAction('kill');
      updateState(result.state);
      return;
    }

    // --- Yank ---

    // Ctrl+Y: yank
    if (key.ctrl && input === 'y') {
      const text = killRingRef.current.yank();
      if (text) {
        undoStackRef.current.save(state.text, state.cursor);
        lastUndoSaveRef.current = Date.now();
        killRingRef.current.setLastAction('yank');
        updateState(state.insert(text));
      }
      return;
    }

    // Alt+Y: yank-pop
    if (key.meta && input === 'y') {
      const text = killRingRef.current.yankPop();
      if (text) {
        // Replace previous yank — undo then insert
        const undone = undoStackRef.current.undo({ text: state.text, cursor: state.cursor });
        if (undone) {
          const base = EditorState.withCursor(undone.text, undone.cursor, effectiveColumns);
          undoStackRef.current.save(base.text, base.cursor);
          updateState(base.insert(text));
        }
      }
      return;
    }

    // --- Navigation ---

    // Up arrow
    if (key.upArrow) {
      if (suppressNavigation) return;
      if (key.shift) {
        updateState(state.selectUp());
        return;
      }
      if (state.isOnFirstLine) {
        onHistoryUp?.();
      } else {
        updateState(state.up());
      }
      return;
    }

    // Down arrow
    if (key.downArrow) {
      if (suppressNavigation) return;
      if (key.shift) {
        updateState(state.selectDown());
        return;
      }
      if (state.isOnLastLine) {
        onHistoryDown?.();
      } else {
        updateState(state.down());
      }
      return;
    }

    // Left arrow
    if (key.leftArrow) {
      if (key.shift && key.ctrl) {
        updateState(state.selectWordLeft());
      } else if (key.shift) {
        updateState(state.selectLeft());
      } else if (key.ctrl || key.meta) {
        updateState(state.prevWord());
      } else {
        updateState(state.left());
      }
      return;
    }

    // Right arrow
    if (key.rightArrow) {
      if (key.shift && key.ctrl) {
        updateState(state.selectWordRight());
      } else if (key.shift) {
        updateState(state.selectRight());
      } else if (key.ctrl || key.meta) {
        updateState(state.nextWord());
      } else {
        updateState(state.right());
      }
      return;
    }

    // Home
    if (key.home) {
      if (key.ctrl) {
        updateState(state.startOfBuffer());
      } else if (key.shift) {
        updateState(state.selectToLineStart());
      } else {
        updateState(state.startOfLine());
      }
      return;
    }

    // End
    if (key.end) {
      if (key.ctrl) {
        updateState(state.endOfBuffer());
      } else if (key.shift) {
        updateState(state.selectToLineEnd());
      } else {
        updateState(state.endOfLine());
      }
      return;
    }

    // Page up/down
    if (key.pageUp || key.pageDown) return;

    // --- Emacs navigation ---

    // Ctrl+A: start of line
    if (key.ctrl && input === 'a') {
      if (key.shift) {
        updateState(state.selectAll());
      } else {
        updateState(state.startOfLine());
      }
      return;
    }

    // Ctrl+E: end of line
    if (key.ctrl && input === 'e') {
      updateState(state.endOfLine());
      return;
    }

    // Ctrl+B: left
    if (key.ctrl && input === 'b') {
      updateState(state.left());
      return;
    }

    // Ctrl+F: right
    if (key.ctrl && input === 'f') {
      updateState(state.right());
      return;
    }

    // Alt+B: prev word
    if (key.meta && input === 'b') {
      updateState(state.prevWord());
      return;
    }

    // Alt+F: next word
    if (key.meta && input === 'f') {
      updateState(state.nextWord());
      return;
    }

    // --- Text insertion ---
    if (input && input.length > 0 && !key.ctrl && !key.meta) {
      saveUndoDebounced(state, false);
      const toInsert = singleLine ? input.replace(/\n/g, ' ') : input;
      const nextState = state.insert(toInsert);
      getDiag().input.assertInsertResult(state.text, nextState.text, toInsert, state.cursor, nextState.cursor);
      updateState(nextState);
      return;
    }
  }, { isActive: focus });

  // --- Rendering ---

  const measured = editorState.measuredText;
  const cursorPos = editorState.cursorPosition;
  const selRange = editorState.selectionRange;
  const maxVisible = maxVisibleLines;
  const visibleLines = measured.wrappedLines.slice(scrollOffset, scrollOffset + maxVisible);

  if (editorState.text === '' && placeholder) {
    return <Text dimColor>{placeholder}</Text>;
  }

  return (
    <Box flexDirection="column">
      {scrollOffset > 0 && <Text dimColor>{'  \u2191 more'}</Text>}
      {visibleLines.map((wline, i) => {
        const lineIdx = i + scrollOffset;
        const prefix = lineIdx === 0 ? '' : (continuationPrefix ?? '  ');
        const displayText = mask ? mask.repeat(graphemeCount(wline.text)) : wline.text;
        const rendered = renderLine(
          displayText,
          wline.text,
          wline.startOffset,
          lineIdx,
          cursorPos,
          editorState.cursor,
          selRange,
          mask ?? null,
          focus,
          cursorChar,
        );
        return <Text key={lineIdx}>{prefix}{rendered}</Text>;
      })}
      {scrollOffset + maxVisible < measured.lineCount && <Text dimColor>{'  \u2193 more'}</Text>}
    </Box>
  );
}

/**
 * Convert a local source offset within a line's text to a display column
 * by walking graphemes and accumulating their display widths.
 */
export function sourceOffsetToDisplayCol(text: string, localOffset: number): number {
  let col = 0;
  for (const seg of GRAPHEME_SEGMENTER.segment(text)) {
    if (seg.index >= localOffset) break;
    col += MeasuredText.displayWidth(seg.segment);
  }
  return col;
}

/**
 * Render a single line with cursor and selection highlighting.
 * All comparisons use display-column coordinates, not character indices.
 *
 * @param displayText  Visible text (masked or real)
 * @param originalText Unmasked line text, used for offset→display-column mapping
 * @param startOffset  Absolute source offset of the line start
 * @param cursorOffset Absolute source cursor offset
 * @param mask         Mask character (null when unmasked)
 */
export function renderLine(
  displayText: string,
  originalText: string,
  startOffset: number,
  lineIdx: number,
  cursorPos: Position,
  cursorOffset: number,
  selRange: { start: number; end: number } | null,
  mask: string | null,
  hasFocus: boolean,
  cursorChar?: string,
): React.ReactNode {
  const isCursorLine = lineIdx === cursorPos.line;
  const isMasked = mask != null;

  // Compute cursor display column for this line
  let cursorDisplayCol = -1;
  if (isCursorLine) {
    if (isMasked) {
      // Count graphemes before cursor, not code units
      const localOffset = cursorOffset - startOffset;
      const maskWidth = MeasuredText.displayWidth(mask);
      cursorDisplayCol = graphemesBeforeOffset(originalText, localOffset) * maskWidth;
    } else {
      cursorDisplayCol = cursorPos.column;
    }
  }

  // Early exit: no cursor on this line and no selection overlap
  const lineEnd = startOffset + originalText.length;
  if (!isCursorLine && (!selRange || selRange.end <= startOffset || selRange.start >= lineEnd)) {
    return displayText;
  }

  // Selection bounds in display columns
  let selStartCol = -1;
  let selEndCol = -1;
  if (selRange && selRange.end > startOffset && selRange.start < lineEnd) {
    const localSelStart = Math.max(0, selRange.start - startOffset);
    const localSelEnd = Math.min(originalText.length, selRange.end - startOffset);
    if (isMasked) {
      // Map source offsets to masked display columns via grapheme counting
      const maskWidth = MeasuredText.displayWidth(mask!);
      selStartCol = graphemesBeforeOffset(originalText, localSelStart) * maskWidth;
      selEndCol = graphemesBeforeOffset(originalText, localSelEnd) * maskWidth;
    } else {
      selStartCol = sourceOffsetToDisplayCol(originalText, localSelStart);
      selEndCol = sourceOffsetToDisplayCol(originalText, localSelEnd);
    }
  }

  const segments: React.ReactNode[] = [];

  let currentText = '';
  // Note: cursor and selected currently render identically (<Text inverse>).
  // Kept separate for future visual differentiation (e.g., cursor blink, different color).
  let currentMode: 'normal' | 'selected' | 'cursor' = 'normal';
  let displayCol = 0;

  const flush = (key: string): void => {
    if (currentText === '') return;
    if (currentMode === 'selected' || currentMode === 'cursor') {
      segments.push(<Text key={key} inverse>{currentText}</Text>);
    } else {
      segments.push(<Text key={key}>{currentText}</Text>);
    }
    currentText = '';
  };

  let gi = 0;
  for (const seg of GRAPHEME_SEGMENTER.segment(displayText)) {
    const grapheme = seg.segment;
    const gWidth = MeasuredText.displayWidth(grapheme);

    let mode: 'normal' | 'selected' | 'cursor' = 'normal';

    if (isCursorLine && displayCol === cursorDisplayCol && hasFocus) {
      mode = 'cursor';
    } else if (selStartCol >= 0 && displayCol >= selStartCol && displayCol < selEndCol) {
      mode = 'selected';
    }

    if (mode !== currentMode) {
      flush(`seg-${lineIdx}-${gi}`);
      currentMode = mode;
    }

    if (mode === 'cursor' && cursorChar) {
      flush(`seg-${lineIdx}-${gi}`);
      segments.push(<Text key={`cur-${lineIdx}`} inverse>{cursorChar}</Text>);
      currentMode = 'normal';
      // Advance by original grapheme width to stay in the same column space
      // as selStartCol/selEndCol (computed from original text display widths).
      displayCol += gWidth;
    } else {
      currentText += grapheme;
      displayCol += gWidth;
    }
    gi++;
  }

  // Flush remaining
  flush(`seg-${lineIdx}-end`);

  // Cursor at end of line (past last grapheme)
  if (isCursorLine && cursorDisplayCol >= displayCol && hasFocus) {
    const curChar = cursorChar ?? ' ';
    segments.push(<Text key={`cur-${lineIdx}-end`} inverse>{curChar}</Text>);
  }

  return <>{segments}</>;
}
