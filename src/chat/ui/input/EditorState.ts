import { MeasuredText, type Position } from './MeasuredText.js';

const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const WORD_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'word' });

export class EditorState {
  readonly text: string;
  readonly cursor: number;
  readonly selectionAnchor: number;
  readonly stickyColumn: number;
  readonly columns: number;
  private _measured: MeasuredText | null = null;

  private constructor(
    text: string,
    cursor: number,
    columns: number,
    selectionAnchor: number = -1,
    stickyColumn: number = -1,
  ) {
    this.text = text;
    this.cursor = cursor;
    this.columns = columns;
    this.selectionAnchor = selectionAnchor;
    this.stickyColumn = stickyColumn;
  }

  // --- Factory ---

  static empty(columns: number): EditorState {
    return new EditorState('', 0, columns);
  }

  static from(text: string, columns: number): EditorState {
    return new EditorState(text, text.length, columns);
  }

  /** Create a state with cursor clamped to [0, text.length]. */
  static withCursor(text: string, cursor: number, columns: number): EditorState {
    const clamped = Math.max(0, Math.min(cursor, text.length));
    return new EditorState(text, clamped, columns);
  }

  // --- Lazy measured text ---
  // Note: MeasuredText wraps using `this.columns` uniformly for all lines.
  // In practice, line 1 may display 2 chars shorter than its capacity because
  // effectiveColumns = columns - prefixLength, but line 1 has no prefix.
  // This is intentional — the caller (InputRenderer) adjusts the columns value
  // passed to EditorState to account for the prefix, so all lines wrap consistently.

  get measuredText(): MeasuredText {
    if (!this._measured) {
      this._measured = new MeasuredText(this.text, this.columns);
    }
    return this._measured;
  }

  // --- Queries ---

  get cursorPosition(): Position {
    return this.measuredText.offsetToPosition(this.cursor);
  }

  get isAtStart(): boolean {
    return this.cursor === 0;
  }

  get isAtEnd(): boolean {
    return this.cursor === this.text.length;
  }

  get isOnFirstLine(): boolean {
    return this.cursorPosition.line === 0;
  }

  get isOnLastLine(): boolean {
    return this.cursorPosition.line === this.measuredText.lineCount - 1;
  }

  get hasSelection(): boolean {
    return this.selectionAnchor !== -1 && this.selectionAnchor !== this.cursor;
  }

  get selectionRange(): { start: number; end: number } | null {
    if (!this.hasSelection) return null;
    const start = Math.min(this.selectionAnchor, this.cursor);
    const end = Math.max(this.selectionAnchor, this.cursor);
    return { start, end };
  }

  getSelectedText(): string {
    const range = this.selectionRange;
    if (!range) return '';
    return this.text.slice(range.start, range.end);
  }

  // --- Private helpers ---

  private _new(
    text: string,
    cursor: number,
    selectionAnchor: number = -1,
    stickyColumn: number = -1,
  ): EditorState {
    return new EditorState(text, cursor, this.columns, selectionAnchor, stickyColumn);
  }

  /**
   * Find the start offset of the grapheme cluster containing or just before `offset`.
   * Returns [graphemeStart, graphemeEnd] of the grapheme at or before the offset.
   */
  private _graphemeBefore(offset: number): [number, number] | null {
    if (offset <= 0) return null;
    const segments = [...GRAPHEME_SEGMENTER.segment(this.text)];
    let result: [number, number] | null = null;
    for (const seg of segments) {
      const segEnd = seg.index + seg.segment.length;
      if (segEnd <= offset) {
        result = [seg.index, segEnd];
      } else {
        // This segment contains the offset
        if (seg.index < offset) {
          return [seg.index, segEnd];
        }
        break;
      }
    }
    return result;
  }

  private _graphemeAfter(offset: number): [number, number] | null {
    if (offset >= this.text.length) return null;
    const segments = [...GRAPHEME_SEGMENTER.segment(this.text)];
    for (const seg of segments) {
      if (seg.index >= offset) {
        return [seg.index, seg.index + seg.segment.length];
      }
    }
    return null;
  }

  // --- Navigation (all clear selection, reset stickyColumn unless noted) ---

  left(): EditorState {
    if (this.hasSelection) {
      const range = this.selectionRange!;
      return this._new(this.text, range.start);
    }
    const prev = this._graphemeBefore(this.cursor);
    if (!prev) return this._new(this.text, this.cursor);
    return this._new(this.text, prev[0]);
  }

  right(): EditorState {
    if (this.hasSelection) {
      const range = this.selectionRange!;
      return this._new(this.text, range.end);
    }
    const next = this._graphemeAfter(this.cursor);
    if (!next) return this._new(this.text, this.cursor);
    return this._new(this.text, next[1]);
  }

  up(): EditorState {
    const pos = this.cursorPosition;
    if (pos.line === 0) return this._new(this.text, this.cursor, -1, this.stickyColumn);
    const targetCol = this.stickyColumn >= 0 ? this.stickyColumn : pos.column;
    const prevLine = pos.line - 1;
    const prevLineLen = this.measuredText.getLineLength(prevLine);
    const newCol = Math.min(targetCol, prevLineLen);
    const newOffset = this.measuredText.positionToOffset({ line: prevLine, column: newCol });
    return this._new(this.text, newOffset, -1, targetCol);
  }

  down(): EditorState {
    const pos = this.cursorPosition;
    if (pos.line >= this.measuredText.lineCount - 1) {
      return this._new(this.text, this.cursor, -1, this.stickyColumn);
    }
    const targetCol = this.stickyColumn >= 0 ? this.stickyColumn : pos.column;
    const nextLine = pos.line + 1;
    const nextLineLen = this.measuredText.getLineLength(nextLine);
    const newCol = Math.min(targetCol, nextLineLen);
    const newOffset = this.measuredText.positionToOffset({ line: nextLine, column: newCol });
    return this._new(this.text, newOffset, -1, targetCol);
  }

  startOfLine(): EditorState {
    const pos = this.cursorPosition;
    const offset = this.measuredText.positionToOffset({ line: pos.line, column: 0 });
    return this._new(this.text, offset);
  }

  endOfLine(): EditorState {
    const pos = this.cursorPosition;
    const lineLen = this.measuredText.getLineLength(pos.line);
    const offset = this.measuredText.positionToOffset({ line: pos.line, column: lineLen });
    return this._new(this.text, offset);
  }

  startOfBuffer(): EditorState {
    return this._new(this.text, 0);
  }

  endOfBuffer(): EditorState {
    return this._new(this.text, this.text.length);
  }

  prevWord(): EditorState {
    const offset = this._findPrevWordBoundary(this.cursor);
    return this._new(this.text, offset);
  }

  nextWord(): EditorState {
    const offset = this._findNextWordBoundary(this.cursor);
    return this._new(this.text, offset);
  }

  private _findPrevWordBoundary(from: number): number {
    if (from <= 0) return 0;
    const segments = [...WORD_SEGMENTER.segment(this.text)];
    // Find segments before cursor: skip non-word segments, then skip one word segment
    // Collect segment boundaries up to `from`
    let pos = from;

    // First, skip non-word segments backward
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      const segEnd = seg.index + seg.segment.length;
      if (segEnd > pos) continue;
      if (segEnd === pos && !seg.isWordLike) {
        pos = seg.index;
        continue;
      }
      if (segEnd <= pos) break;
    }

    // Then skip the word segment
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      const segEnd = seg.index + seg.segment.length;
      if (segEnd > pos) continue;
      if (segEnd === pos && seg.isWordLike) {
        return seg.index;
      }
      if (segEnd <= pos) break;
    }

    // Fallback: skip remaining non-word
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      const segEnd = seg.index + seg.segment.length;
      if (segEnd <= pos) {
        return seg.index;
      }
    }

    return 0;
  }

  private _findNextWordBoundary(from: number): number {
    if (from >= this.text.length) return this.text.length;
    const segments = [...WORD_SEGMENTER.segment(this.text)];

    let pos = from;

    // Skip current word segment forward
    for (const seg of segments) {
      if (seg.index < pos) continue;
      if (seg.index === pos && seg.isWordLike) {
        pos = seg.index + seg.segment.length;
        break;
      }
      if (seg.index > pos) break;
    }

    // Then skip non-word segments forward
    for (const seg of segments) {
      if (seg.index < pos) continue;
      if (seg.index === pos && !seg.isWordLike) {
        pos = seg.index + seg.segment.length;
        continue;
      }
      break;
    }

    return pos;
  }

  // --- Text operations ---

  insert(str: string): EditorState {
    // Normalize to NFC to prevent combining character issues
    const normalized = str.normalize('NFC');
    if (this.hasSelection) {
      return this.replaceSelection(normalized);
    }
    const newText = this.text.slice(0, this.cursor) + normalized + this.text.slice(this.cursor);
    return this._new(newText, this.cursor + normalized.length);
  }

  backspace(): EditorState {
    if (this.hasSelection) return this.deleteSelection().state;
    if (this.cursor === 0) return this;
    const prev = this._graphemeBefore(this.cursor);
    if (!prev) return this;
    const newText = this.text.slice(0, prev[0]) + this.text.slice(prev[1]);
    return this._new(newText, prev[0]);
  }

  delete(): EditorState {
    if (this.hasSelection) return this.deleteSelection().state;
    if (this.cursor >= this.text.length) return this;
    const next = this._graphemeAfter(this.cursor);
    if (!next) return this;
    const newText = this.text.slice(0, next[0]) + this.text.slice(next[1]);
    return this._new(newText, this.cursor);
  }

  deleteToLineEnd(): { state: EditorState; killed: string } {
    if (this.hasSelection) return this.deleteSelection();
    const pos = this.cursorPosition;
    const lineLen = this.measuredText.getLineLength(pos.line);
    const lineEnd = this.measuredText.positionToOffset({ line: pos.line, column: lineLen });
    if (this.cursor === lineEnd) {
      // At end of line — delete the newline if there is one
      if (this.cursor < this.text.length) {
        const killed = this.text[this.cursor];
        const newText = this.text.slice(0, this.cursor) + this.text.slice(this.cursor + 1);
        return { state: this._new(newText, this.cursor), killed };
      }
      return { state: this, killed: '' };
    }
    const killed = this.text.slice(this.cursor, lineEnd);
    const newText = this.text.slice(0, this.cursor) + this.text.slice(lineEnd);
    return { state: this._new(newText, this.cursor), killed };
  }

  deleteToLineStart(): { state: EditorState; killed: string } {
    if (this.hasSelection) return this.deleteSelection();
    const pos = this.cursorPosition;
    const lineStart = this.measuredText.positionToOffset({ line: pos.line, column: 0 });
    if (this.cursor === lineStart) {
      return { state: this, killed: '' };
    }
    const killed = this.text.slice(lineStart, this.cursor);
    const newText = this.text.slice(0, lineStart) + this.text.slice(this.cursor);
    return { state: this._new(newText, lineStart), killed };
  }

  deleteWordBefore(): { state: EditorState; killed: string } {
    if (this.hasSelection) return this.deleteSelection();
    const boundary = this._findPrevWordBoundary(this.cursor);
    if (boundary === this.cursor) return { state: this, killed: '' };
    const killed = this.text.slice(boundary, this.cursor);
    const newText = this.text.slice(0, boundary) + this.text.slice(this.cursor);
    return { state: this._new(newText, boundary), killed };
  }

  deleteWordAfter(): { state: EditorState; killed: string } {
    if (this.hasSelection) return this.deleteSelection();
    const boundary = this._findNextWordBoundary(this.cursor);
    if (boundary === this.cursor) return { state: this, killed: '' };
    const killed = this.text.slice(this.cursor, boundary);
    const newText = this.text.slice(0, this.cursor) + this.text.slice(boundary);
    return { state: this._new(newText, this.cursor), killed };
  }

  // --- Selection ---

  selectLeft(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const prev = this._graphemeBefore(this.cursor);
    if (!prev) return this._new(this.text, this.cursor, anchor);
    return this._new(this.text, prev[0], anchor);
  }

  selectRight(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const next = this._graphemeAfter(this.cursor);
    if (!next) return this._new(this.text, this.cursor, anchor);
    return this._new(this.text, next[1], anchor);
  }

  selectUp(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const pos = this.cursorPosition;
    if (pos.line === 0) {
      // Move to start of buffer but keep selection
      return this._new(this.text, 0, anchor, this.stickyColumn >= 0 ? this.stickyColumn : pos.column);
    }
    const targetCol = this.stickyColumn >= 0 ? this.stickyColumn : pos.column;
    const prevLine = pos.line - 1;
    const prevLineLen = this.measuredText.getLineLength(prevLine);
    const newCol = Math.min(targetCol, prevLineLen);
    const newOffset = this.measuredText.positionToOffset({ line: prevLine, column: newCol });
    return this._new(this.text, newOffset, anchor, targetCol);
  }

  selectDown(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const pos = this.cursorPosition;
    if (pos.line >= this.measuredText.lineCount - 1) {
      // Move to end of buffer but keep selection
      return this._new(this.text, this.text.length, anchor, this.stickyColumn >= 0 ? this.stickyColumn : pos.column);
    }
    const targetCol = this.stickyColumn >= 0 ? this.stickyColumn : pos.column;
    const nextLine = pos.line + 1;
    const nextLineLen = this.measuredText.getLineLength(nextLine);
    const newCol = Math.min(targetCol, nextLineLen);
    const newOffset = this.measuredText.positionToOffset({ line: nextLine, column: newCol });
    return this._new(this.text, newOffset, anchor, targetCol);
  }

  selectWordLeft(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const offset = this._findPrevWordBoundary(this.cursor);
    return this._new(this.text, offset, anchor);
  }

  selectWordRight(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const offset = this._findNextWordBoundary(this.cursor);
    return this._new(this.text, offset, anchor);
  }

  selectToLineStart(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const pos = this.cursorPosition;
    const offset = this.measuredText.positionToOffset({ line: pos.line, column: 0 });
    return this._new(this.text, offset, anchor);
  }

  selectToLineEnd(): EditorState {
    const anchor = this.selectionAnchor === -1 ? this.cursor : this.selectionAnchor;
    const pos = this.cursorPosition;
    const lineLen = this.measuredText.getLineLength(pos.line);
    const offset = this.measuredText.positionToOffset({ line: pos.line, column: lineLen });
    return this._new(this.text, offset, anchor);
  }

  selectAll(): EditorState {
    return this._new(this.text, this.text.length, 0);
  }

  clearSelection(): EditorState {
    return this._new(this.text, this.cursor);
  }

  deleteSelection(): { state: EditorState; killed: string } {
    const range = this.selectionRange;
    if (!range) return { state: this, killed: '' };
    const killed = this.text.slice(range.start, range.end);
    const newText = this.text.slice(0, range.start) + this.text.slice(range.end);
    return { state: this._new(newText, range.start), killed };
  }

  replaceSelection(text: string): EditorState {
    const range = this.selectionRange;
    if (!range) return this.insert(text);
    const newText = this.text.slice(0, range.start) + text + this.text.slice(range.end);
    return this._new(newText, range.start + text.length);
  }

  // --- Resize ---

  remeasure(columns: number): EditorState {
    return new EditorState(this.text, this.cursor, columns, this.selectionAnchor, this.stickyColumn);
  }
}
