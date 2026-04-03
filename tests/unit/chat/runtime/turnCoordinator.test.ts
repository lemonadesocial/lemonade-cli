import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnCoordinator, TurnDeps, TurnSubmitResult } from '../../../../src/chat/runtime/TurnCoordinator';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';
import { Message } from '../../../../src/chat/providers/interface';

// Mock handleTurn — controls what the coordinator delegates to
vi.mock('../../../../src/chat/stream/handler', () => ({
  handleTurn: vi.fn(),
}));

// Mock buildSystemMessages
vi.mock('../../../../src/chat/session/cache', () => ({
  buildSystemMessages: vi.fn(() => [{ type: 'text', text: 'system prompt' }]),
}));

import { handleTurn } from '../../../../src/chat/stream/handler';
import { buildSystemMessages } from '../../../../src/chat/session/cache';

const mockHandleTurn = vi.mocked(handleTurn);
const mockBuildSystemMessages = vi.mocked(buildSystemMessages);

function makeDeps(overrides?: Partial<TurnDeps>): TurnDeps {
  return {
    engine: new ChatEngine(),
    provider: { name: 'anthropic', model: 'test', formatTools: vi.fn(), stream: vi.fn() },
    formattedTools: [],
    session: {
      user: { _id: '1', name: 'Test', email: 'test@test.com' },
    },
    registry: {},
    chatMessages: [],
    ...overrides,
  };
}

describe('TurnCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleTurn.mockResolvedValue(undefined);
  });

  describe('state', () => {
    it('reports idle state initially', () => {
      const tc = new TurnCoordinator(makeDeps());
      expect(tc.state.isMainTurnActive).toBe(false);
      expect(tc.state.activeBtwCount).toBe(0);
    });
  });

  describe('submitMainTurn', () => {
    it('commits user message to chatMessages before handleTurn reads them', async () => {
      const chatMessages: Message[] = [];
      let capturedMessages: Message[] | undefined;
      mockHandleTurn.mockImplementationOnce((_p, msgs) => {
        capturedMessages = [...msgs];
        return Promise.resolve();
      });

      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      const submit = tc.submitMainTurn('hello world');
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      await submit.completion;

      // Provider must see the user message at the point handleTurn reads params.messages
      expect(capturedMessages).toBeDefined();
      expect(capturedMessages).toContainEqual({ role: 'user', content: 'hello world' });
      // chatMessages array should also contain it
      expect(chatMessages).toContainEqual({ role: 'user', content: 'hello world' });
    });

    it('user message is present even when settling gate is active', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const chatMessages: Message[] = [];
      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      // Start and cancel to create settling window
      const oldSubmit = tc.submitMainTurn('old');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      let capturedMessages: Message[] | undefined;
      mockHandleTurn.mockImplementationOnce((_p, msgs) => {
        capturedMessages = [...msgs];
        return Promise.resolve();
      });

      const newSubmit = tc.submitMainTurn('new message');
      if (!newSubmit.accepted) throw new Error('expected accepted');

      // User message committed synchronously, before settling completes
      expect(chatMessages).toContainEqual({ role: 'user', content: 'new message' });

      resolveOldTurn();
      await oldSubmit.completion;
      await newSubmit.completion;

      // handleTurn also saw it
      expect(capturedMessages).toBeDefined();
      expect(capturedMessages).toContainEqual({ role: 'user', content: 'new message' });
    });

    it('calls handleTurn with current deps', async () => {
      const chatMessages: Message[] = [];
      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      const submit = tc.submitMainTurn('hello');
      if (!submit.accepted) throw new Error('expected accepted');
      await submit.completion;

      expect(mockHandleTurn).toHaveBeenCalledWith(
        deps.provider,
        chatMessages,
        deps.formattedTools,
        expect.any(Array),
        deps.session,
        deps.registry,
        null,
        true,
        deps.engine,
        expect.any(AbortSignal),
      );
    });

    it('returns accepted with no error on success', async () => {
      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      const result = await submit.completion;
      expect(result.error).toBeUndefined();
    });

    it('returns error message on handleTurn failure', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('API down'));
      const tc = new TurnCoordinator(makeDeps());

      const submit = tc.submitMainTurn('test');
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      const result = await submit.completion;
      expect(result.error).toBe('Error: API down');
    });

    it('returns context-length-specific error', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('context length exceeded'));
      const tc = new TurnCoordinator(makeDeps());

      const submit = tc.submitMainTurn('test');
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      const result = await submit.completion;
      expect(result.error).toContain('Session is too long');
    });

    it('blocks concurrent main turns', async () => {
      let resolveFirst: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveFirst = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());
      const firstTurn = tc.submitMainTurn('first');
      expect(firstTurn.accepted).toBe(true);
      if (!firstTurn.accepted) return;

      // State should be active
      expect(tc.state.isMainTurnActive).toBe(true);

      // Second turn should be rejected synchronously
      const result = tc.submitMainTurn('second');
      expect(result.accepted).toBe(false);
      if (result.accepted) return;
      expect(result.error).toContain('Please wait');
      expect(mockHandleTurn).toHaveBeenCalledOnce();

      // Resolve first turn
      resolveFirst!();
      await firstTurn.completion;
      expect(tc.state.isMainTurnActive).toBe(false);
    });

    it('resets state after error', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('fail'));
      const tc = new TurnCoordinator(makeDeps());

      const submit = tc.submitMainTurn('test');
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      await submit.completion;
      expect(tc.state.isMainTurnActive).toBe(false);
    });
  });

  describe('submitBtwTurn', () => {
    it('returns a btw turnId', () => {
      const tc = new TurnCoordinator(makeDeps());
      const turnId = tc.submitBtwTurn('side question');
      expect(turnId).toMatch(/^btw-\d+-\d+$/);
    });

    it('calls handleTurn with cloned messages and btw system prompt', async () => {
      const chatMessages: Message[] = [{ role: 'user', content: 'original' }];
      const tc = new TurnCoordinator(makeDeps({ chatMessages }));

      tc.submitBtwTurn('side question');

      // Wait for the async call to be made
      await vi.waitFor(() => expect(mockHandleTurn).toHaveBeenCalledOnce());

      const call = mockHandleTurn.mock.calls[0];
      // messages arg should be a clone with the btw input appended
      const passedMessages = call[1] as Message[];
      expect(passedMessages).toHaveLength(2);
      expect(passedMessages[0]).toEqual({ role: 'user', content: 'original' });
      expect(passedMessages[1]).toEqual({ role: 'user', content: 'side question' });

      // Original chatMessages should be untouched
      expect(chatMessages).toHaveLength(1);

      // Should have btw system prompt appended
      const systemPrompt = call[3] as Array<{ type: string; text: string }>;
      expect(systemPrompt.some(s => s.text.includes('BTW SIDE REQUEST'))).toBe(true);

      // Should pass turnId
      const turnId = call[10];
      expect(turnId).toMatch(/^btw-\d+-\d+$/);
    });

    it('tracks active btw count', () => {
      let resolveFirst: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveFirst = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());
      tc.submitBtwTurn('q1');
      expect(tc.state.activeBtwCount).toBe(1);

      // Resolve to clean up
      resolveFirst!();
    });

    it('does not block during active main turn', async () => {
      let resolveMain: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveMain = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());
      const mainTurn = tc.submitMainTurn('test');
      if (!mainTurn.accepted) throw new Error('expected accepted');

      // BTW should still work
      mockHandleTurn.mockResolvedValueOnce(undefined);
      const turnId = tc.submitBtwTurn('side');
      expect(turnId).toMatch(/^btw-\d+-\d+$/);

      resolveMain!();
      await mainTurn.completion;
    });
  });

  describe('cancelMainTurn', () => {
    it('returns false when no main turn active', () => {
      const tc = new TurnCoordinator(makeDeps());
      expect(tc.cancelMainTurn()).toBe(false);
    });

    it('aborts active main turn and returns true', async () => {
      let capturedSignal: AbortSignal | undefined;
      mockHandleTurn.mockImplementationOnce(async (_p, _m, _t, _s, _sess, _reg, _rl, _tty, _eng, signal) => {
        capturedSignal = signal as AbortSignal;
        // Simulate waiting for abort
        await new Promise<void>((resolve) => {
          if (signal?.aborted) { resolve(); return; }
          signal?.addEventListener('abort', () => resolve());
        });
      });

      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      if (!submit.accepted) throw new Error('expected accepted');

      // Wait for handleTurn to be called
      await vi.waitFor(() => expect(capturedSignal).toBeDefined());

      expect(tc.cancelMainTurn()).toBe(true);
      expect(capturedSignal!.aborted).toBe(true);
      expect(tc.state.isMainTurnActive).toBe(false);

      await submit.completion;
    });

    it('double cancel returns false on second call and does not throw', async () => {
      let resolveFirst!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveFirst = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      if (!submit.accepted) throw new Error('expected accepted');

      expect(tc.cancelMainTurn()).toBe(true);
      expect(tc.cancelMainTurn()).toBe(false);
      expect(tc.state.isMainTurnActive).toBe(false);

      resolveFirst();
      await submit.completion;
    });

    it('cancel during settling-await window cleans up correctly', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // Start and cancel turn A to create a settling window
      const oldSubmit = tc.submitMainTurn('test');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Start turn B — it will await the settling promise internally.
      // No handleTurn mock needed: turn B is cancelled before settling
      // completes, so it exits early (abort check after settling gate).
      const newSubmit = tc.submitMainTurn('test');
      if (!newSubmit.accepted) throw new Error('expected accepted');

      // Turn B is awaiting settling — cancel it now
      expect(tc.cancelMainTurn()).toBe(true);
      expect(tc.state.isMainTurnActive).toBe(false);

      // Let old turn settle so new turn can proceed past the gate and see abort
      resolveOldTurn();
      await oldSubmit.completion;
      await newSubmit.completion;

      // State should be idle — turn B exited early, no stale state left
      expect(tc.state.isMainTurnActive).toBe(false);
      // handleTurn was only called for turn A
      expect(mockHandleTurn).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelAllBtw', () => {
    it('returns false when no btw turns active', () => {
      const tc = new TurnCoordinator(makeDeps());
      expect(tc.cancelAllBtw()).toBe(false);
    });

    it('aborts all active btw turns', async () => {
      const capturedSignals: AbortSignal[] = [];
      mockHandleTurn.mockImplementation(async (_p, _m, _t, _s, _sess, _reg, _rl, _tty, _eng, signal) => {
        if (signal) capturedSignals.push(signal);
        // Hold open until aborted
        return new Promise<void>((resolve) => {
          if (signal?.aborted) { resolve(); return; }
          signal?.addEventListener('abort', () => resolve());
          // Safety timeout
          setTimeout(resolve, 5000);
        });
      });

      const tc = new TurnCoordinator(makeDeps());
      tc.submitBtwTurn('q1');

      // Ensure first call is processed before launching second
      await vi.waitFor(() => expect(capturedSignals).toHaveLength(1));

      tc.submitBtwTurn('q2');
      await vi.waitFor(() => expect(capturedSignals).toHaveLength(2));

      expect(tc.state.activeBtwCount).toBe(2);
      expect(tc.cancelAllBtw()).toBe(true);
      expect(capturedSignals[0].aborted).toBe(true);
      expect(capturedSignals[1].aborted).toBe(true);
      expect(tc.state.activeBtwCount).toBe(0);
    });
  });

  describe('updateDeps — stale dependency fix', () => {
    it('uses updated provider after updateDeps', async () => {
      const deps1 = makeDeps();
      const tc = new TurnCoordinator(deps1);

      const newProvider = { name: 'openai', model: 'gpt-4', formatTools: vi.fn(), stream: vi.fn() };
      const deps2 = { ...deps1, provider: newProvider };
      tc.updateDeps(deps2);

      const submit = tc.submitMainTurn('test');
      if (!submit.accepted) throw new Error('expected accepted');
      await submit.completion;

      expect(mockHandleTurn).toHaveBeenCalledWith(
        newProvider,
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
        expect.anything(),
        expect.anything(),
        null,
        true,
        expect.anything(),
        expect.any(AbortSignal),
      );
    });

    it('uses updated session after updateDeps', async () => {
      const deps1 = makeDeps();
      const tc = new TurnCoordinator(deps1);

      const newSession = { user: { _id: '2', name: 'Other', email: 'o@o.com' } };
      tc.updateDeps({ ...deps1, session: newSession });

      const submit = tc.submitMainTurn('test');
      if (!submit.accepted) throw new Error('expected accepted');
      await submit.completion;

      const passedSession = mockHandleTurn.mock.calls[0][4];
      expect(passedSession).toBe(newSession);
    });
  });

  describe('per-turn identity — cancel race fix', () => {
    it('stale finally does not stomp a new turn after cancel', async () => {
      let resolveOldTurn!: () => void;
      let resolveNewTurn!: () => void;

      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // Start first turn
      const oldSubmit = tc.submitMainTurn('test');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      expect(tc.state.isMainTurnActive).toBe(true);

      // Cancel first turn — this advances the turn ID
      tc.cancelMainTurn();
      expect(tc.state.isMainTurnActive).toBe(false);

      // Queue up the new turn's mock (will be used after settling gate clears)
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveNewTurn = resolve; }),
      );

      // Start second turn — accepted synchronously, awaits settling internally
      const newSubmit = tc.submitMainTurn('test');
      expect(newSubmit.accepted).toBe(true);
      if (!newSubmit.accepted) return;

      // Settle the old turn so the new one can proceed
      resolveOldTurn();
      await oldSubmit.completion;

      // Give the new turn's settling gate a tick to proceed
      await new Promise(r => setTimeout(r, 0));

      // The old finally must NOT have stomped the new turn's active state
      expect(tc.state.isMainTurnActive).toBe(true);

      // Let the new turn finish
      resolveNewTurn();
      await newSubmit.completion;
      expect(tc.state.isMainTurnActive).toBe(false);
    });
  });

  describe('showThinking race — cancel turn A, start turn B, turn A settles', () => {
    it('turn B keeps active state when turn A completion settles after cancel→resubmit', async () => {
      let resolveOldTurn!: () => void;
      let resolveNewTurn!: () => void;

      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // 1. Start turn A
      const turnA = tc.submitMainTurn('turn A');
      if (!turnA.accepted) throw new Error('expected accepted');
      expect(tc.state.isMainTurnActive).toBe(true);

      // 2. Cancel turn A
      tc.cancelMainTurn();
      expect(tc.state.isMainTurnActive).toBe(false);

      // 3. Immediately start turn B
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveNewTurn = resolve; }),
      );
      const turnB = tc.submitMainTurn('turn B');
      expect(turnB.accepted).toBe(true);
      if (!turnB.accepted) return;
      expect(tc.state.isMainTurnActive).toBe(true);

      // 4. Turn A settles — its finally must NOT clear isMainTurnActive
      resolveOldTurn();
      await turnA.completion;
      await new Promise(r => setTimeout(r, 0));

      // Verify turn B still holds the active lock
      expect(tc.state.isMainTurnActive).toBe(true);

      // 5. Turn B completes normally
      resolveNewTurn();
      await turnB.completion;
      expect(tc.state.isMainTurnActive).toBe(false);
    });

    it('simulates App-level turn identity guard — stale completion does not clear thinking', async () => {
      // This mirrors the submitTurnIdRef pattern in App.tsx
      let submitTurnId = 0;
      let showThinking = false;

      let resolveOldTurn!: () => void;
      let resolveNewTurn!: () => void;

      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // Submit turn A (mirrors handleSubmit flow)
      const turnA = tc.submitMainTurn('turn A');
      if (!turnA.accepted) throw new Error('expected accepted');
      const turnAId = ++submitTurnId;
      showThinking = true;

      // Cancel turn A
      tc.cancelMainTurn();
      showThinking = false; // Escape handler clears immediately

      // Submit turn B
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveNewTurn = resolve; }),
      );
      const turnB = tc.submitMainTurn('turn B');
      if (!turnB.accepted) throw new Error('expected accepted');
      const turnBId = ++submitTurnId;
      showThinking = true;

      // Turn A settles — stale finally with turn identity guard
      resolveOldTurn();
      await turnA.completion;
      if (submitTurnId === turnAId) {
        showThinking = false; // This must NOT execute
      }

      // Thinking should still be true — turn B owns it
      expect(showThinking).toBe(true);
      expect(submitTurnId).toBe(turnBId);

      // Turn B finishes — its guard matches
      resolveNewTurn();
      await turnB.completion;
      if (submitTurnId === turnBId) {
        showThinking = false;
      }

      expect(showThinking).toBe(false);
    });
  });

  describe('cancel-then-resubmit settling gate', () => {
    it('new turn waits for cancelled turn to fully settle before starting', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const chatMessages: Message[] = [{ role: 'user', content: 'first' }];
      const tc = new TurnCoordinator(makeDeps({ chatMessages }));

      // Start first turn
      const oldSubmit = tc.submitMainTurn('test');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      expect(tc.state.isMainTurnActive).toBe(true);

      // Cancel — sets mainTurnActive=false but old handleTurn hasn't settled
      tc.cancelMainTurn();
      expect(tc.state.isMainTurnActive).toBe(false);

      // Track whether the new turn's handleTurn has been called
      let newTurnStarted = false;
      mockHandleTurn.mockImplementationOnce(() => {
        newTurnStarted = true;
        return Promise.resolve();
      });

      // Start second turn — accepted synchronously, settling awaited internally
      const newSubmit = tc.submitMainTurn('test');
      expect(newSubmit.accepted).toBe(true);
      if (!newSubmit.accepted) return;

      // Old turn hasn't settled yet, so new handleTurn must not have started
      expect(newTurnStarted).toBe(false);

      // Let old turn settle
      resolveOldTurn();
      await oldSubmit.completion;

      // Now the new turn should proceed
      await newSubmit.completion;
      expect(newTurnStarted).toBe(true);
      expect(tc.state.isMainTurnActive).toBe(false);
    });

    it('stale cancelled turn cannot mutate shared history after new turn starts', async () => {
      const chatMessages: Message[] = [{ role: 'user', content: 'initial' }];
      const snapshotBeforeNewTurn: Message[][] = [];

      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce((_p, _msgs) => {
        return new Promise<void>((resolve) => { resolveOldTurn = resolve; });
      });

      const tc = new TurnCoordinator(makeDeps({ chatMessages }));
      const oldSubmit = tc.submitMainTurn('old input');
      if (!oldSubmit.accepted) throw new Error('expected accepted');

      tc.cancelMainTurn();

      // New turn captures the chatMessages snapshot when it starts
      mockHandleTurn.mockImplementationOnce((_p, msgs) => {
        snapshotBeforeNewTurn.push([...msgs]);
        return Promise.resolve();
      });

      const newSubmit = tc.submitMainTurn('new input');
      if (!newSubmit.accepted) throw new Error('expected accepted');

      // Settle old turn — settling gate ensures new turn hasn't started yet
      resolveOldTurn();
      await oldSubmit.completion;
      await newSubmit.completion;

      // The new turn saw the original message + both user messages committed by
      // submitMainTurn. No stale assistant/tool messages from the cancelled turn.
      expect(snapshotBeforeNewTurn).toHaveLength(1);
      expect(snapshotBeforeNewTurn[0]).toEqual([
        { role: 'user', content: 'initial' },
        { role: 'user', content: 'old input' },
        { role: 'user', content: 'new input' },
      ]);
    });
  });

  describe('cancelled during settling — early exit before provider call', () => {
    it('executeMainTurn exits early when signal is aborted after settling wait', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // Start and cancel turn A to create a settling window
      const oldSubmit = tc.submitMainTurn('old');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Start turn B — no mock needed since it will exit before reaching handleTurn
      const newSubmit = tc.submitMainTurn('new');
      if (!newSubmit.accepted) throw new Error('expected accepted');

      // Cancel turn B while it's still waiting for the settling gate
      expect(tc.cancelMainTurn()).toBe(true);

      // Let old turn settle so new turn can proceed past the gate
      resolveOldTurn();
      await oldSubmit.completion;
      await newSubmit.completion;

      // handleTurn should only have been called once (the old turn).
      // Turn B should have exited early without calling handleTurn.
      expect(mockHandleTurn).toHaveBeenCalledTimes(1);
      expect(tc.state.isMainTurnActive).toBe(false);
    });

    it('provider/handleTurn is not called when signal is already aborted after settling wait', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // Start and cancel turn A
      const oldSubmit = tc.submitMainTurn('old');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Start turn B, then cancel it before settling completes
      // No mock needed — turn B exits early before reaching handleTurn
      const newSubmit = tc.submitMainTurn('new');
      if (!newSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Settle old turn
      resolveOldTurn();
      await oldSubmit.completion;
      await newSubmit.completion;

      // buildSystemMessages should not have been called for turn B
      // (it's called once for turn A before cancel)
      expect(mockBuildSystemMessages).toHaveBeenCalledTimes(1);
      // handleTurn called only for turn A
      expect(mockHandleTurn).toHaveBeenCalledTimes(1);

      // Coordinator is reusable — next turn should work
      const retrySubmit = tc.submitMainTurn('retry');
      expect(retrySubmit.accepted).toBe(true);
      if (!retrySubmit.accepted) return;
      await retrySubmit.completion;
      expect(mockHandleTurn).toHaveBeenCalledTimes(2);
    });
  });

  describe('settling window mutual exclusion', () => {
    it('two submitMainTurn calls during one settling window — only one proceeds', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // Start and cancel a turn to create a settling window
      const oldSubmit = tc.submitMainTurn('test');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Two calls during the settling window — only the first should be accepted
      mockHandleTurn.mockResolvedValueOnce(undefined);
      const call1 = tc.submitMainTurn('test');
      const call2 = tc.submitMainTurn('test');

      expect(call1.accepted).toBe(true);
      expect(call2.accepted).toBe(false);
      if (!call1.accepted) return;
      if (call2.accepted) return;
      expect(call2.error).toContain('Please wait');

      // Only one additional handleTurn call should occur (the accepted one)
      resolveOldTurn();
      await oldSubmit.completion;
      await call1.completion;

      // handleTurn called twice total: old turn + accepted new turn
      expect(mockHandleTurn).toHaveBeenCalledTimes(2);
    });
  });

  describe('message ownership — coordinator owns provider-history push', () => {
    it('submitMainTurn pushes exactly one user message', async () => {
      const chatMessages: Message[] = [{ role: 'user', content: 'prior' }];
      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      const submit = tc.submitMainTurn('new input');
      if (!submit.accepted) throw new Error('expected accepted');
      await submit.completion;

      // Should contain prior message + the new one pushed by coordinator
      const userMessages = chatMessages.filter(m => m.role === 'user');
      expect(userMessages).toEqual([
        { role: 'user', content: 'prior' },
        { role: 'user', content: 'new input' },
      ]);
    });
  });

  describe('BTW error reporting', () => {
    it('emits engine error event when handleTurn throws before streaming', async () => {
      const engine = new ChatEngine();
      const errors: Array<{ message: string; fatal: boolean; turnId?: string }> = [];
      engine.on('error', (data) => errors.push(data));

      mockHandleTurn.mockRejectedValueOnce(new Error('network timeout'));

      const deps = makeDeps({ engine });
      const tc = new TurnCoordinator(deps);

      const btwTurnId = tc.submitBtwTurn('side question');

      // Wait for the error to propagate
      await vi.waitFor(() => expect(errors).toHaveLength(1));

      expect(errors[0].message).toBe('network timeout');
      expect(errors[0].fatal).toBe(false);
      expect(errors[0].turnId).toBe(btwTurnId);
    });

    it('cleans up btw abort entry after error', async () => {
      const engine = new ChatEngine();
      engine.on('error', () => {}); // prevent unhandled error throw
      mockHandleTurn.mockRejectedValueOnce(new Error('fail'));
      const tc = new TurnCoordinator(makeDeps({ engine }));

      tc.submitBtwTurn('q');

      await vi.waitFor(() => expect(tc.state.activeBtwCount).toBe(0));
    });
  });

  describe('updateDeps during settling window', () => {
    it('turn accepted after settling picks up deps updated mid-settle', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const deps1 = makeDeps();
      const tc = new TurnCoordinator(deps1);

      // Start and cancel to create a settling window
      const oldSubmit = tc.submitMainTurn('test');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Update deps while the old turn is still settling
      const newProvider = { name: 'openai', model: 'gpt-4', formatTools: vi.fn(), stream: vi.fn() };
      tc.updateDeps({ ...deps1, provider: newProvider });

      mockHandleTurn.mockResolvedValueOnce(undefined);
      const newSubmit = tc.submitMainTurn('test');
      if (!newSubmit.accepted) throw new Error('expected accepted');

      // Settle old turn
      resolveOldTurn();
      await oldSubmit.completion;
      await newSubmit.completion;

      // The second handleTurn call (index 1) should use the updated provider
      const secondCall = mockHandleTurn.mock.calls[1];
      expect(secondCall[0]).toBe(newProvider);
    });
  });

  describe('synchronous handleTurn throw', () => {
    it('returns error when handleTurn throws synchronously', async () => {
      mockHandleTurn.mockImplementationOnce(() => {
        throw new Error('sync kaboom');
      });

      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;

      const result = await submit.completion;
      expect(result.error).toBe('Error: sync kaboom');
      expect(tc.state.isMainTurnActive).toBe(false);
    });
  });

  describe('counter isolation across instances', () => {
    it('separate coordinator instances have independent counters', () => {
      const tc1 = new TurnCoordinator(makeDeps());
      const tc2 = new TurnCoordinator(makeDeps());

      const btw1 = tc1.submitBtwTurn('a');
      const btw2 = tc2.submitBtwTurn('b');

      // Both should start from counter 1 independently
      expect(btw1).toMatch(/^btw-\d+-1$/);
      expect(btw2).toMatch(/^btw-\d+-1$/);
    });
  });

  describe('pre-stream setup throw does not deadlock', () => {
    it('buildSystemMessages throwing returns error and releases lock', async () => {
      mockBuildSystemMessages.mockImplementationOnce(() => {
        throw new Error('cache corrupt');
      });

      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;

      const result = await submit.completion;
      expect(result.error).toBe('Error: cache corrupt');
      // Lock must be released — next turn must be accepted
      expect(tc.state.isMainTurnActive).toBe(false);

      mockBuildSystemMessages.mockImplementation(() => [{ type: 'text', text: 'system prompt' }]);
      const retry = tc.submitMainTurn('retry');
      expect(retry.accepted).toBe(true);
      if (!retry.accepted) return;
      await retry.completion;
      expect(tc.state.isMainTurnActive).toBe(false);
    });

    it('dep capture throwing during settling window still cleans up', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());

      // Start and cancel to create settling window
      const oldSubmit = tc.submitMainTurn('old');
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Make buildSystemMessages throw for the next turn
      mockBuildSystemMessages.mockImplementationOnce(() => {
        throw new Error('session expired');
      });

      const newSubmit = tc.submitMainTurn('new');
      if (!newSubmit.accepted) throw new Error('expected accepted');

      // Let old turn settle
      resolveOldTurn();
      await oldSubmit.completion;

      const result = await newSubmit.completion;
      expect(result.error).toBe('Error: session expired');
      expect(tc.state.isMainTurnActive).toBe(false);

      // Coordinator is reusable
      mockBuildSystemMessages.mockImplementation(() => [{ type: 'text', text: 'system prompt' }]);
      const retry = tc.submitMainTurn('works now');
      expect(retry.accepted).toBe(true);
    });
  });

  describe('completion never-reject contract', () => {
    it('completion resolves (not rejects) even when handleTurn throws', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('provider crash'));

      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      if (!submit.accepted) return;

      // Must not reject — await should succeed and return an error object
      const result = await submit.completion;
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('provider crash');
    });

    it('completion resolves (not rejects) when buildSystemMessages throws', async () => {
      mockBuildSystemMessages.mockImplementationOnce(() => {
        throw new Error('build failed');
      });

      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      if (!submit.accepted) return;

      const result = await submit.completion;
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('build failed');
    });

    it('completion resolves to empty object on success', async () => {
      const tc = new TurnCoordinator(makeDeps());
      const submit = tc.submitMainTurn('test');
      if (!submit.accepted) return;

      const result = await submit.completion;
      expect(result.error).toBeUndefined();
    });
  });
});
