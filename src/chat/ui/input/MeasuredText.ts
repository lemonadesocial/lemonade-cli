import stringWidth from 'string-width';

const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export interface WrappedLine {
  text: string;
  startOffset: number;
  length: number;
  isPrecededByNewline: boolean;
  endsWithNewline: boolean;
}

export interface Position {
  line: number;
  column: number;
}

export class MeasuredText {
  readonly text: string;
  readonly columns: number;
  readonly wrappedLines: WrappedLine[];

  constructor(text: string, columns: number) {
    this.text = text;
    // [L-4] Clamp columns to minimum of 1
    this.columns = Math.max(1, Math.floor(columns));
    this.wrappedLines = this._wrap();
  }

  private _wrap(): WrappedLine[] {
    if (this.text === '') {
      return [{
        text: '',
        startOffset: 0,
        length: 0,
        isPrecededByNewline: true,
        endsWithNewline: false,
      }];
    }

    const lines: WrappedLine[] = [];
    const logicalLines = this.text.split('\n');
    let offset = 0;

    for (let i = 0; i < logicalLines.length; i++) {
      const logicalLine = logicalLines[i];
      const hasNewline = i < logicalLines.length - 1;

      if (logicalLine === '') {
        lines.push({
          text: '',
          startOffset: offset,
          length: 0,
          isPrecededByNewline: true,
          endsWithNewline: hasNewline,
        });
      } else {
        const wrapped = this._wrapLogicalLine(logicalLine, offset, hasNewline);
        // First sub-line of each logical line is preceded by newline (or start of text)
        if (wrapped.length > 0) {
          wrapped[0].isPrecededByNewline = true;
        }
        lines.push(...wrapped);
      }

      // Advance offset past the logical line + the \n separator
      offset += logicalLine.length + (hasNewline ? 1 : 0);
    }

    // Trailing newline: text ending with \n produces an extra empty line,
    // already handled by the split loop above (last element is '').

    return lines;
  }

  private _wrapLogicalLine(line: string, baseOffset: number, endsWithNewline: boolean): WrappedLine[] {
    const segments = [...GRAPHEME_SEGMENTER.segment(line)];
    const result: WrappedLine[] = [];

    let currentText = '';
    let currentWidth = 0;
    let lineStartOffset = baseOffset;

    for (let si = 0; si < segments.length; si++) {
      const seg = segments[si];
      const grapheme = seg.segment;
      const gWidth = MeasuredText.displayWidth(grapheme);

      // If adding this grapheme exceeds columns AND current line is not empty, wrap
      if (currentWidth + gWidth > this.columns && currentText !== '') {
        result.push({
          text: currentText,
          startOffset: lineStartOffset,
          length: currentText.length,
          isPrecededByNewline: false,
          endsWithNewline: false,
        });
        lineStartOffset = baseOffset + seg.index;
        currentText = '';
        currentWidth = 0;
      }

      // Handle grapheme wider than columns (force it onto its own line)
      if (gWidth > this.columns && currentText === '') {
        result.push({
          text: grapheme,
          startOffset: lineStartOffset,
          length: grapheme.length,
          isPrecededByNewline: false,
          endsWithNewline: false,
        });
        lineStartOffset = baseOffset + seg.index + grapheme.length;
        continue;
      }

      currentText += grapheme;
      currentWidth += gWidth;
    }

    // Push remaining text
    if (currentText !== '' || result.length === 0) {
      result.push({
        text: currentText,
        startOffset: lineStartOffset,
        length: currentText.length,
        isPrecededByNewline: false,
        endsWithNewline: endsWithNewline,
      });
    } else if (result.length > 0) {
      // Mark the last sub-line
      result[result.length - 1].endsWithNewline = endsWithNewline;
    }

    return result;
  }

  offsetToPosition(offset: number): Position {
    // Clamp offset
    const clampedOffset = Math.max(0, Math.min(offset, this.text.length));
    const lines = this.wrappedLines;

    // Binary search for the line containing the offset
    let lo = 0;
    let hi = lines.length - 1;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      const lineEnd = lines[mid].startOffset + lines[mid].length;
      // If the offset is beyond this line's range, search higher
      // But also consider: if offset equals lineEnd and the next line starts at that offset,
      // the cursor belongs to the next line (unless this line ends with newline)
      if (clampedOffset > lineEnd || (clampedOffset === lineEnd && !lines[mid].endsWithNewline && mid + 1 < lines.length && lines[mid + 1].startOffset === lineEnd)) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    const line = lo;
    const wl = lines[line];
    const localOffset = clampedOffset - wl.startOffset;

    // Walk graphemes to compute visual display column.
    // Snap-forward: if localOffset falls mid-grapheme (e.g. between surrogates
    // of an emoji pair), the grapheme whose start index < localOffset is fully
    // counted, so the returned column is the position *after* that grapheme.
    // This is intentional — callers must supply grapheme-boundary offsets for
    // exact results; mid-grapheme offsets always round forward.
    let displayCol = 0;
    for (const seg of GRAPHEME_SEGMENTER.segment(wl.text)) {
      if (seg.index >= localOffset) break;
      displayCol += MeasuredText.displayWidth(seg.segment);
    }

    return { line, column: displayCol };
  }

  positionToOffset(pos: Position): number {
    const line = Math.max(0, Math.min(pos.line, this.wrappedLines.length - 1));
    const wl = this.wrappedLines[line];
    const targetCol = Math.max(0, pos.column);
    const lineDisplayWidth = MeasuredText.displayWidth(wl.text);

    // Clamp to line display width
    if (targetCol >= lineDisplayWidth) {
      return wl.startOffset + wl.length;
    }

    // Walk graphemes to find the source offset matching the display column
    let displayCol = 0;
    let localOffset = 0;
    for (const seg of GRAPHEME_SEGMENTER.segment(wl.text)) {
      const gWidth = MeasuredText.displayWidth(seg.segment);
      if (displayCol + gWidth > targetCol) break;
      displayCol += gWidth;
      localOffset = seg.index + seg.segment.length;
    }

    return wl.startOffset + localOffset;
  }

  get lineCount(): number {
    return this.wrappedLines.length;
  }

  getLineLength(line: number): number {
    if (line < 0 || line >= this.wrappedLines.length) return 0;
    return MeasuredText.displayWidth(this.wrappedLines[line].text);
  }

  static displayWidth(str: string): number {
    return stringWidth(str);
  }
}
