import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnCoordinator, TurnDeps } from '../../../../src/chat/runtime/TurnCoordinator';
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
    it('pushes user message to chatMessages and calls handleTurn', async () => {
      const chatMessages: Message[] = [];
      const deps = makeDeps({ chatMessages });
      const tc = new TurnCoordinator(deps);

      await tc.submitMainTurn('hello');

      expect(chatMessages).toEqual([{ role: 'user', content: 'hello' }]);
      expect(mockHandleTurn).toHaveBeenCalledOnce();
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

    it('returns empty object on success', async () => {
      const tc = new TurnCoordinator(makeDeps());
      const result = await tc.submitMainTurn('hello');
      expect(result.error).toBeUndefined();
    });

    it('returns error message on handleTurn failure', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('API down'));
      const tc = new TurnCoordinator(makeDeps());

      const result = await tc.submitMainTurn('hello');
      expect(result.error).toBe('Error: API down');
    });

    it('returns context-length-specific error', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('context length exceeded'));
      const tc = new TurnCoordinator(makeDeps());

      const result = await tc.submitMainTurn('hello');
      expect(result.error).toContain('Session is too long');
    });

    it('blocks concurrent main turns', async () => {
      let resolveFirst: () => void;
      mockHandleTurn.mockImplementationOnce(() =>
        new Promise<void>((resolve) => { resolveFirst = resolve; }),
      );

      const tc = new TurnCoordinator(makeDeps());
      const firstTurn = tc.submitMainTurn('first');

      // State should be active
      expect(tc.state.isMainTurnActive).toBe(true);

      // Second turn should be blocked
      const result = await tc.submitMainTurn('second');
      expect(result.error).toContain('Please wait');
      expect(mockHandleTurn).toHaveBeenCalledOnce();

      // Resolve first turn
      resolveFirst!();
      await firstTurn;
      expect(tc.state.isMainTurnActive).toBe(false);
    });

    it('resets state after error', async () => {
      mockHandleTurn.mockRejectedValueOnce(new Error('fail'));
      const tc = new TurnCoordinator(makeDeps());

      await tc.submitMainTurn('hello');
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
      const mainTurn = tc.submitMainTurn('main');

      // BTW should still work
      mockHandleTurn.mockResolvedValueOnce(undefined);
      const turnId = tc.submitBtwTurn('side');
      expect(turnId).toMatch(/^btw-\d+-\d+$/);

      resolveMain!();
      await mainTurn;
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
      const turnPromise = tc.submitMainTurn('hello');

      // Wait for handleTurn to be called
      await vi.waitFor(() => expect(capturedSignal).toBeDefined());

      expect(tc.cancelMainTurn()).toBe(true);
      expect(capturedSignal!.aborted).toBe(true);
      expect(tc.state.isMainTurnActive).toBe(false);

      await turnPromise;
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
      const mainPromise = tc.submitMainTurn('main');

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

      await mainPromise;
    });
  });
});
