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

const mockHandleTurn = vi.mocked(handleTurn);

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
    it('does not push user message — caller owns provider-history commit', async () => {
      const chatMessages: Message[] = [];
      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      const submit = tc.submitMainTurn();
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      await submit.completion;

      // TurnCoordinator must NOT push the user message
      // (App.tsx pushes to chatMessages after acceptance)
      expect(chatMessages).toEqual([]);
      expect(mockHandleTurn).toHaveBeenCalledOnce();
    });

    it('calls handleTurn with current deps', async () => {
      const chatMessages: Message[] = [{ role: 'user', content: 'hello' }];
      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      const submit = tc.submitMainTurn();
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
      const submit = tc.submitMainTurn();
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      const result = await submit.completion;
      expect(result.error).toBeUndefined();
    });

    it('returns error message on handleTurn failure', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('API down'));
      const tc = new TurnCoordinator(makeDeps());

      const submit = tc.submitMainTurn();
      expect(submit.accepted).toBe(true);
      if (!submit.accepted) return;
      const result = await submit.completion;
      expect(result.error).toBe('Error: API down');
    });

    it('returns context-length-specific error', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('context length exceeded'));
      const tc = new TurnCoordinator(makeDeps());

      const submit = tc.submitMainTurn();
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
      const firstTurn = tc.submitMainTurn();
      expect(firstTurn.accepted).toBe(true);
      if (!firstTurn.accepted) return;

      // State should be active
      expect(tc.state.isMainTurnActive).toBe(true);

      // Second turn should be rejected synchronously
      const result = tc.submitMainTurn();
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

      const submit = tc.submitMainTurn();
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
      const mainTurn = tc.submitMainTurn();
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
      const submit = tc.submitMainTurn();
      if (!submit.accepted) throw new Error('expected accepted');

      // Wait for handleTurn to be called
      await vi.waitFor(() => expect(capturedSignal).toBeDefined());

      expect(tc.cancelMainTurn()).toBe(true);
      expect(capturedSignal!.aborted).toBe(true);
      expect(tc.state.isMainTurnActive).toBe(false);

      await submit.completion;
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

  describe('cancelAll', () => {
    it('cancels both main and btw turns', async () => {
      let mainSignal: AbortSignal | undefined;
      const btwSignals: AbortSignal[] = [];

      mockHandleTurn.mockImplementation(async (_p, _m, _t, _s, _sess, _reg, _rl, _tty, _eng, signal, turnId) => {
        if (turnId?.startsWith('btw-')) {
          if (signal) btwSignals.push(signal);
        } else {
          mainSignal = signal as AbortSignal;
        }
        await new Promise<void>((resolve) => {
          if (signal?.aborted) { resolve(); return; }
          signal?.addEventListener('abort', () => resolve());
        });
      });

      const tc = new TurnCoordinator(makeDeps());
      const mainSubmit = tc.submitMainTurn();
      if (!mainSubmit.accepted) throw new Error('expected accepted');

      await vi.waitFor(() => expect(mainSignal).toBeDefined());

      mockHandleTurn.mockImplementation(async (_p, _m, _t, _s, _sess, _reg, _rl, _tty, _eng, signal, turnId) => {
        if (turnId?.startsWith('btw-') && signal) btwSignals.push(signal);
        await new Promise<void>((resolve) => {
          if (signal?.aborted) { resolve(); return; }
          signal?.addEventListener('abort', () => resolve());
        });
      });

      tc.submitBtwTurn('side');
      await vi.waitFor(() => expect(btwSignals).toHaveLength(1));

      tc.cancelAll();

      expect(mainSignal!.aborted).toBe(true);
      expect(btwSignals[0].aborted).toBe(true);
      expect(tc.state.isMainTurnActive).toBe(false);
      expect(tc.state.activeBtwCount).toBe(0);

      await mainSubmit.completion;
    });
  });

  describe('updateDeps — stale dependency fix', () => {
    it('uses updated provider after updateDeps', async () => {
      const deps1 = makeDeps();
      const tc = new TurnCoordinator(deps1);

      const newProvider = { name: 'openai', model: 'gpt-4', formatTools: vi.fn(), stream: vi.fn() };
      const deps2 = { ...deps1, provider: newProvider };
      tc.updateDeps(deps2);

      const submit = tc.submitMainTurn();
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

      const submit = tc.submitMainTurn();
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
      const oldSubmit = tc.submitMainTurn();
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
      const newSubmit = tc.submitMainTurn();
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

  describe('cancel-then-resubmit settling gate', () => {
    it('new turn waits for cancelled turn to fully settle before starting', async () => {
      let resolveOldTurn!: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveOldTurn = resolve; }),
      );

      const chatMessages: Message[] = [{ role: 'user', content: 'first' }];
      const tc = new TurnCoordinator(makeDeps({ chatMessages }));

      // Start first turn
      const oldSubmit = tc.submitMainTurn();
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
      const newSubmit = tc.submitMainTurn();
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
      const oldSubmit = tc.submitMainTurn();
      if (!oldSubmit.accepted) throw new Error('expected accepted');

      tc.cancelMainTurn();

      // New turn captures the chatMessages snapshot when it starts
      mockHandleTurn.mockImplementationOnce((_p, msgs) => {
        snapshotBeforeNewTurn.push([...msgs]);
        return Promise.resolve();
      });

      const newSubmit = tc.submitMainTurn();
      if (!newSubmit.accepted) throw new Error('expected accepted');

      // Settle old turn — settling gate ensures new turn hasn't started yet
      resolveOldTurn();
      await oldSubmit.completion;
      await newSubmit.completion;

      // The new turn saw exactly the messages that existed before it started
      expect(snapshotBeforeNewTurn).toHaveLength(1);
      expect(snapshotBeforeNewTurn[0]).toEqual([{ role: 'user', content: 'initial' }]);
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
      const oldSubmit = tc.submitMainTurn();
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Two calls during the settling window — only the first should be accepted
      mockHandleTurn.mockResolvedValueOnce(undefined);
      const call1 = tc.submitMainTurn();
      const call2 = tc.submitMainTurn();

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

  describe('no double-push — message ownership', () => {
    it('submitMainTurn does not modify chatMessages array', async () => {
      const chatMessages: Message[] = [{ role: 'user', content: 'pre-pushed' }];
      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      const submit = tc.submitMainTurn();
      if (!submit.accepted) throw new Error('expected accepted');
      await submit.completion;

      // Only the original message should be there — coordinator must not push
      expect(chatMessages).toEqual([{ role: 'user', content: 'pre-pushed' }]);
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

      expect(errors[0].message).toContain('BTW error: network timeout');
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
      const oldSubmit = tc.submitMainTurn();
      if (!oldSubmit.accepted) throw new Error('expected accepted');
      tc.cancelMainTurn();

      // Update deps while the old turn is still settling
      const newProvider = { name: 'openai', model: 'gpt-4', formatTools: vi.fn(), stream: vi.fn() };
      tc.updateDeps({ ...deps1, provider: newProvider });

      mockHandleTurn.mockResolvedValueOnce(undefined);
      const newSubmit = tc.submitMainTurn();
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
      const submit = tc.submitMainTurn();
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
});
