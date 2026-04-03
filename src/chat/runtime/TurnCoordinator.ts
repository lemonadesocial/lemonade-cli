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
}

export interface TurnSubmitResult {
  accepted: boolean;
  error?: string;
  completion?: Promise<{ error?: string }>;
}

export interface TurnCoordinatorState {
  readonly isMainTurnActive: boolean;
  readonly activeBtwCount: number;
}

export const MAIN_TURN_BUSY = 'Please wait for the current response to finish, or press Escape to cancel. Use /btw for side questions.';

let btwCounter = 0;
let mainTurnCounter = 0;

export class TurnCoordinator {
  private deps: TurnDeps;
  private mainAbort: AbortController | null = null;
  private mainTurnActive = false;
  private mainTurnId = 0;
  private mainTurnSettling: Promise<void> | null = null;
  private btwAborts = new Map<string, AbortController>();

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
  // Caller commits user message only after checking `accepted`.
  submitMainTurn(): TurnSubmitResult {
    if (this.mainTurnActive) {
      return { accepted: false, error: MAIN_TURN_BUSY };
    }

    // Claim the turn synchronously — provides mutual exclusion during settling.
    this.mainTurnActive = true;
    const turnId = ++mainTurnCounter;
    this.mainTurnId = turnId;
    const abort = new AbortController();
    this.mainAbort = abort;

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

    const { provider, formattedTools, session, registry, chatMessages, engine } = this.deps;
    const systemPrompt: SystemMessage[] = buildSystemMessages(session, provider.name);

    let resolveSettling!: () => void;
    const settling = new Promise<void>(r => { resolveSettling = r; });
    this.mainTurnSettling = settling;

    try {
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
      }
      resolveSettling();
      if (this.mainTurnSettling === settling) {
        this.mainTurnSettling = null;
      }
    }

    return {};
  }

  submitBtwTurn(input: string): string {
    const { provider, formattedTools, session, registry, chatMessages, engine } = this.deps;

    const snapshot: Message[] = JSON.parse(JSON.stringify(chatMessages));
    snapshot.push({ role: 'user', content: input });

    const btwSession = { ...session };
    const btwTurnId = `btw-${Date.now()}-${++btwCounter}`;
    const btwSystemPrompt: SystemMessage[] = buildSystemMessages(btwSession, provider.name);
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
      engine.emit('error', { message: `BTW error: ${msg}`, fatal: false, turnId: btwTurnId });
    }).finally(() => {
      this.btwAborts.delete(btwTurnId);
    });

    return btwTurnId;
  }

  cancelMainTurn(): boolean {
    if (this.mainAbort) {
      this.mainAbort.abort();
      // Advance turn ID so the old finally block won't clear state
      this.mainTurnId = ++mainTurnCounter;
      this.mainAbort = null;
      this.mainTurnActive = false;
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

  cancelAll(): void {
    this.cancelMainTurn();
    this.cancelAllBtw();
  }
}
