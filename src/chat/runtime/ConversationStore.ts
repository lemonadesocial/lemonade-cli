import { Message } from '../providers/interface.js';

/**
 * Single authoritative owner of provider-format conversation history.
 *
 * All code that reads or mutates the provider message array must go through
 * this store.  handleTurn receives the backing array by reference (via
 * getMessages()) and mutates it in-place during a turn — that is intentional
 * and consistent with single-owner semantics because the store still owns
 * the array identity.
 */
export class ConversationStore {
  private messages: Message[] = [];

  /** Return the backing array.  handleTurn mutates this in-place. */
  getMessages(): Message[] {
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

  /** Clear all provider history (e.g. /clear, Ctrl+L). */
  clear(): void {
    this.messages.length = 0;
  }

  /** Current message count. */
  get length(): number {
    return this.messages.length;
  }
}
