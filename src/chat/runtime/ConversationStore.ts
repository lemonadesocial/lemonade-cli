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
  private _activeTurnToken: number | null = null;
  private _nextToken = 1;

  /** Whether a turn is currently in progress. */
  get turnActive(): boolean {
    return this._activeTurnToken !== null;
  }

  /**
   * Mark the start of a turn. Returns a token that must be passed to endTurn().
   * Throws on reentrant call.
   */
  beginTurn(): number {
    if (this._activeTurnToken !== null) {
      throw new Error('beginTurn() called while a turn is already active — missing endTurn()?');
    }
    const token = this._nextToken++;
    this._activeTurnToken = token;
    return token;
  }

  /**
   * Mark the end of a turn. Only releases if the given token matches the
   * active turn — a stale finally from an older turn is a silent no-op.
   *
   * Two call-sites may invoke endTurn for the same token:
   *   1. The handleSubmit finally block (normal/error path).
   *   2. The Escape key handler (eager cancellation).
   * The token comparison guarantees exactly-once semantics: whichever site
   * runs first clears _activeTurnToken; the other becomes a no-op because
   * the token no longer matches.
   */
  endTurn(token: number): void {
    if (this._activeTurnToken !== token) return;
    this._activeTurnToken = null;
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

  /** Append a user message to provider history. Throws if a turn is active. */
  addUserMessage(content: string): void {
    if (this._activeTurnToken !== null) {
      throw new Error('Cannot add a user message while a turn is in progress');
    }
    this.messages.push({ role: 'user', content });
  }

  /**
   * Commit a user message during an active turn.
   * Returns the index of the committed message, which serves as a rollback
   * handle — pass it to rollbackTurnUserMessage() to undo the commit.
   */
  commitTurnUserMessage(content: string): number {
    if (this._activeTurnToken === null) {
      throw new Error('commitTurnUserMessage() requires an active turn');
    }
    const idx = this.messages.length;
    this.messages.push({ role: 'user', content });
    return idx;
  }

  /**
   * Roll back a user message committed during the current turn.
   *
   * Only succeeds if the message at `idx` is still a user-role message AND is
   * still the last entry (i.e. no assistant reply has been appended yet).
   * Returns true if the message was removed, false if rollback was skipped
   * (safe no-op when the provider already responded).
   */
  rollbackTurnUserMessage(idx: number): boolean {
    if (this._activeTurnToken === null) return false;
    if (idx < 0 || idx >= this.messages.length) return false;
    if (this.messages[idx].role !== 'user') return false;
    if (idx !== this.messages.length - 1) return false;
    this.messages.splice(idx, 1);
    return true;
  }

  /**
   * Clear all provider history (e.g. /clear, Ctrl+L).
   * Throws if a turn is in progress to prevent corrupting in-flight state.
   */
  clear(): void {
    if (this._activeTurnToken !== null) {
      throw new Error('Cannot clear conversation while a turn is in progress');
    }
    this.messages.length = 0;
  }

  /** Current message count. */
  get length(): number {
    return this.messages.length;
  }
}
