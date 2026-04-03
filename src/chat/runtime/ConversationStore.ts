import { Message } from '../providers/interface.js';

/**
 * Single authoritative owner of provider-format conversation history.
 *
 * All code that reads or mutates the provider message array must go through
 * this store.  handleTurn receives the backing array by reference (via
 * getMutableRef()) and mutates it in-place during a turn — that is intentional
 * and consistent with single-owner semantics because the store still owns
 * the array identity.
 *
 * ## API contract
 *
 * - getMutableRef(): returns the live backing array. Only one caller should
 *   hold this at a time (handleTurn for the active turn). Mutations through
 *   this reference are visible to the store. Named explicitly to signal that
 *   callers receive a mutable alias, not a safe copy.
 *
 * - getSnapshot(): deep-clones the array for isolated reads (e.g. /btw side
 *   turns). Safe to mutate without affecting the store.
 *
 * - clear(): resets provider history. Throws if a turn is in progress to
 *   prevent corrupting in-flight provider state.
 */
export class ConversationStore {
  private messages: Message[] = [];
  private _turnActive = false;

  /** Whether a turn is currently in progress. */
  get turnActive(): boolean {
    return this._turnActive;
  }

  /** Mark the start of a turn. Must be paired with endTurn(). */
  beginTurn(): void {
    this._turnActive = true;
  }

  /** Mark the end of a turn. */
  endTurn(): void {
    this._turnActive = false;
  }

  /**
   * Return the live backing array.
   *
   * handleTurn mutates this in-place — callers receive a mutable alias,
   * not a defensive copy. Use getSnapshot() when isolation is needed.
   */
  getMutableRef(): Message[] {
    return this.messages;
  }

  /** Deep-clone the current history for isolated side-turns (e.g. /btw). */
  getSnapshot(): Message[] {
    return JSON.parse(JSON.stringify(this.messages));
  }

  /** Append a user message to provider history. */
  addUserMessage(content: string): void {
    this.messages.push({ role: 'user', content });
  }

  /**
   * Clear all provider history (e.g. /clear, Ctrl+L).
   * Throws if a turn is in progress to prevent corrupting in-flight state.
   */
  clear(): void {
    if (this._turnActive) {
      throw new Error('Cannot clear conversation while a turn is in progress');
    }
    this.messages.length = 0;
  }

  /** Current message count. */
  get length(): number {
    return this.messages.length;
  }
}
