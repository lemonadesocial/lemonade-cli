export interface UndoEntry {
  text: string;
  cursor: number;
}

export class UndoStack {
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private readonly maxSize: number = 2048;

  save(text: string, cursor: number): void {
    this.undoStack.push({ text, cursor });
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    // Any new save clears the redo stack
    this.redoStack = [];
  }

  undo(current: UndoEntry): UndoEntry | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(current);
    return this.undoStack.pop()!;
  }

  redo(current: UndoEntry): UndoEntry | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(current);
    return this.redoStack.pop()!;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
