import { describe, it, expect } from 'vitest';
import { UndoStack } from '../../../../../src/chat/ui/input/UndoStack.js';

describe('UndoStack', () => {
  describe('save and undo', () => {
    it('undo returns null when empty', () => {
      const stack = new UndoStack();
      expect(stack.undo({ text: 'current', cursor: 0 })).toBeNull();
    });

    it('undo returns previously saved entry', () => {
      const stack = new UndoStack();
      stack.save('hello', 5);
      const result = stack.undo({ text: 'hello world', cursor: 11 });
      expect(result).toEqual({ text: 'hello', cursor: 5 });
    });

    it('multiple undos return entries in reverse order', () => {
      const stack = new UndoStack();
      stack.save('a', 1);
      stack.save('ab', 2);
      stack.save('abc', 3);

      const r1 = stack.undo({ text: 'abcd', cursor: 4 });
      expect(r1).toEqual({ text: 'abc', cursor: 3 });

      const r2 = stack.undo({ text: 'abc', cursor: 3 });
      expect(r2).toEqual({ text: 'ab', cursor: 2 });

      const r3 = stack.undo({ text: 'ab', cursor: 2 });
      expect(r3).toEqual({ text: 'a', cursor: 1 });

      // No more to undo
      expect(stack.undo({ text: 'a', cursor: 1 })).toBeNull();
    });
  });

  describe('redo', () => {
    it('redo returns null when no undo has been done', () => {
      const stack = new UndoStack();
      stack.save('hello', 5);
      expect(stack.redo({ text: 'hello', cursor: 5 })).toBeNull();
    });

    it('redo restores undone entry', () => {
      const stack = new UndoStack();
      stack.save('hello', 5);
      const undone = stack.undo({ text: 'hello world', cursor: 11 });
      expect(undone).toEqual({ text: 'hello', cursor: 5 });

      const redone = stack.redo({ text: 'hello', cursor: 5 });
      expect(redone).toEqual({ text: 'hello world', cursor: 11 });
    });

    it('new save clears redo stack', () => {
      const stack = new UndoStack();
      stack.save('a', 1);
      stack.save('ab', 2);

      // Undo once
      stack.undo({ text: 'abc', cursor: 3 });

      // New save should clear redo
      stack.save('ax', 2);
      expect(stack.redo({ text: 'ax', cursor: 2 })).toBeNull();
    });
  });

  describe('clear', () => {
    it('clears both undo and redo stacks', () => {
      const stack = new UndoStack();
      stack.save('hello', 5);
      stack.save('world', 5);
      stack.undo({ text: 'current', cursor: 0 });

      stack.clear();
      expect(stack.undo({ text: 'anything', cursor: 0 })).toBeNull();
      expect(stack.redo({ text: 'anything', cursor: 0 })).toBeNull();
    });
  });

  describe('maxSize overflow', () => {
    it('evicts oldest entries when exceeding maxSize', () => {
      const stack = new UndoStack();
      // maxSize is 2048
      for (let i = 0; i < 2050; i++) {
        stack.save(`text-${i}`, i);
      }

      // Should still be able to undo 2048 times
      let count = 0;
      let result = stack.undo({ text: 'current', cursor: 0 });
      while (result !== null) {
        count++;
        result = stack.undo({ text: result.text, cursor: result.cursor });
      }
      expect(count).toBe(2048);
    });
  });
});
