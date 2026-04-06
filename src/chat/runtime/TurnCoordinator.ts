import { AIProvider, Message, ToolDef, SystemMessage } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { buildSystemMessages } from '../session/cache.js';
import { handleTurn } from '../stream/handler.js';
import { ChatEngine } from '../engine/ChatEngine.js';

export interface TurnDeps {
  engine: ChatEngine;
  provider: AIProvider;
  formattedTools: unknown[];
  session: SessionState;
  registry: Record<string, ToolDef>;
  chatMessages: Message[];
  deferredToolsBlock?: string;
}

/**
 * Result of submitMainTurn.
 * Contract: `completion` always resolves — it never rejects.
 * Errors are encoded in the resolved `{ error }` field.
 */
export type TurnSubmitResult =
  | { accepted: true; completion: Promise<{ error?: string }> }
  | { accepted: false; error: string };

export interface TurnCoordinatorState {
  readonly isMainTurnActive: boolean;
  readonly activeBtwCount: number;
}

export const MAIN_TURN_BUSY = 'Please wait for the current response to finish, or press Escape to cancel. Use /btw for side questions.';

// TurnCoordinator owns turn admission (accept/reject), cancellation lifecycle,
// and session clearing (including provider history). handleTurn (stream/handler.ts)
// appends assistant/tool messages to the shared chatMessages array during a turn.
// cancelMainTurn rolls back the user message only when handleTurn hasn't appended
// anything yet; clearSession truncates the entire history unconditionally.
export class TurnCoordinator {
  private deps: TurnDeps;
  private mainAbort: AbortController | null = null;
  private mainTurnActive = false;
  private mainTurnId = 0;
  private mainTurnCounter = 0;
  private btwCounter = 0;
  private mainTurnSettling: Promise<void> | null = null;
  private btwAborts = new Map<string, AbortController>();
  // Index in chatMessages where the current turn's user message was inserted.
  // Used by cancelMainTurn to roll back uncommitted user messages.
  private mainTurnUserMsgIndex: number | null = null;

  constructor(deps: TurnDeps) {
    this.deps = deps;
  }

  updateDeps(deps: TurnDeps): void {
    this.deps = deps;
  }

  get state(): TurnCoordinatorState {
    return {
      isMainTurnActive: this.mainTurnActive,
      activeBtwCount: this.btwAborts.size,
    };
  }

  // Synchronous accept/reject — acquires the entry lock before any async work.
  // Pushes the user message to provider history before handleTurn can read it,
  // guaranteeing every provider sees the new message in params.messages.
  submitMainTurn(input: string): TurnSubmitResult {
    if (this.mainTurnActive) {
      return { accepted: false, error: MAIN_TURN_BUSY };
    }

    // Claim the turn synchronously — provides mutual exclusion during settling.
    this.mainTurnActive = true;
    const turnId = ++this.mainTurnCounter;
    this.mainTurnId = turnId;
    const abort = new AbortController();
    this.mainAbort = abort;

    // Commit user message to provider history BEFORE any async work.
    // Providers read params.messages synchronously — the message must be
    // present before executeMainTurn reaches handleTurn.
    this.mainTurnUserMsgIndex = this.deps.chatMessages.length;
    this.deps.chatMessages.push({ role: 'user', content: input });

    const completion = this.executeMainTurn(turnId, abort);
    return { accepted: true, completion };
  }

  private async executeMainTurn(
    turnId: number,
    abort: AbortController,
  ): Promise<{ error?: string }> {
    // Wait for previous cancelled turn to fully settle before starting.
    if (this.mainTurnSettling) {
      await this.mainTurnSettling;
    }

    // If the turn was cancelled while we were waiting for the settling gate,
    // exit before doing any provider work.
    if (abort.signal.aborted) {
      return {};
    }

    let resolveSettling!: () => void;
    const settling = new Promise<void>(r => { resolveSettling = r; });
    this.mainTurnSettling = settling;

    try {
      // Dep capture and system-message build are inside try so that any
      // throw here is caught and cannot leave mainTurnActive stuck.
      const { provider, formattedTools, session, registry, chatMessages, engine, deferredToolsBlock } = this.deps;
      const systemPrompt: SystemMessage[] = buildSystemMessages(session, provider.name, deferredToolsBlock);

      await handleTurn(
        provider,
        chatMessages,
        formattedTools,
        systemPrompt,
        session,
        registry,
        null,
        true,
        engine,
        abort.signal,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      // Roll back the user message when executeMainTurn itself throws
      // (before handleTurn had a chance to run or commit assistant content).
      this.rollbackUncommittedUserMessage();
      if (msg.includes('context length') || msg.includes('too many tokens')) {
        return { error: 'Error: Session is too long. Start a new session: exit and run make-lemonade again.' };
      }
      return { error: `Error: ${msg}` };
    } finally {
      // Only clear state if this is still the active turn.
      // A newer turn (started after cancelMainTurn) must not be stomped.
      if (this.mainTurnId === turnId) {
        this.mainTurnActive = false;
        this.mainAbort = null;
        this.mainTurnUserMsgIndex = null;
      }
      // Clear the settling reference BEFORE resolving so awaiting code
      // never observes a stale resolved promise in mainTurnSettling.
      if (this.mainTurnSettling === settling) {
        this.mainTurnSettling = null;
      }
      resolveSettling();
    }

    return {};
  }

  submitBtwTurn(input: string): string {
    const { provider, formattedTools, session, registry, chatMessages, engine, deferredToolsBlock } = this.deps;

    const snapshot: Message[] = JSON.parse(JSON.stringify(chatMessages));
    snapshot.push({ role: 'user', content: input });

    const btwSession = { ...session };
    const btwTurnId = `btw-${Date.now()}-${++this.btwCounter}`;
    const btwSystemPrompt: SystemMessage[] = buildSystemMessages(btwSession, provider.name, deferredToolsBlock);
    btwSystemPrompt.push({
      type: 'text',
      text: 'BTW SIDE REQUEST: Keep response to 1-2 sentences MAX. Answer the specific question only. Do not reference or modify the main task in progress. No follow-up questions. Execute at most one tool call. No personality flair.',
    });

    const btwAbort = new AbortController();
    this.btwAborts.set(btwTurnId, btwAbort);

    handleTurn(
      provider, snapshot, formattedTools, btwSystemPrompt,
      btwSession, registry, null, true, engine, btwAbort.signal, btwTurnId,
    ).catch((err) => {
      // Emit error for failures that don't produce engine events (e.g. network
      // errors thrown before streaming begins).
      const msg = err instanceof Error ? err.message : 'Unknown error';
      engine.emit('error', { message: `[btw] ${msg}`, fatal: false, turnId: btwTurnId });
    }).finally(() => {
      this.btwAborts.delete(btwTurnId);
    });

    return btwTurnId;
  }

  /**
   * Roll back the user message pushed by submitMainTurn if no assistant
   * or tool content was appended after it.  Shared by cancelMainTurn and
   * the error-recovery path in executeMainTurn.
   */
  private rollbackUncommittedUserMessage(): void {
    if (this.mainTurnUserMsgIndex === null) return;
    const msgs = this.deps.chatMessages;
    if (
      msgs.length === this.mainTurnUserMsgIndex + 1 &&
      msgs[this.mainTurnUserMsgIndex].role === 'user'
    ) {
      msgs.splice(this.mainTurnUserMsgIndex, 1);
    }
    this.mainTurnUserMsgIndex = null;
  }

  cancelMainTurn(): boolean {
    if (this.mainAbort) {
      this.mainAbort.abort();
      // Advance turn ID so the old finally block won't clear state
      this.mainTurnId = ++this.mainTurnCounter;
      this.mainAbort = null;
      this.mainTurnActive = false;

      // Roll back the user message if no assistant/tool content was committed
      // after it.
      this.rollbackUncommittedUserMessage();

      return true;
    }
    return false;
  }

  cancelAllBtw(): boolean {
    if (this.btwAborts.size === 0) return false;
    for (const [, controller] of this.btwAborts) {
      controller.abort();
    }
    this.btwAborts.clear();
    return true;
  }

  // Clears the entire session: aborts active turns, empties shared
  // chatMessages, and resets provider-internal state (e.g. server-side
  // session ID for credits-mode). Both /clear and Ctrl+L must use this
  // method so clearing is coordinated with turn lifecycle — never mutate
  // chatMessages directly from UI code.
  //
  // Unlike cancelMainTurn, this does NOT roll back individual user messages
  // because the entire history is truncated immediately after.
  clearSession(): void {
    if (this.mainAbort) {
      this.mainAbort.abort();
      this.mainTurnId = ++this.mainTurnCounter;
      this.mainAbort = null;
      this.mainTurnActive = false;
      this.mainTurnUserMsgIndex = null;
    }
    this.cancelAllBtw();
    // Discard any stale settling promise so the next turn does not
    // wait on a resolved gate from a previous cancelled turn.
    this.mainTurnSettling = null;
    this.deps.chatMessages.length = 0;
    // Reset provider-side session state (server-side session ID, etc.).
    // Stateless/BYOK providers omit resetSession — the optional call is safe.
    this.deps.provider.resetSession?.();
  }

}
