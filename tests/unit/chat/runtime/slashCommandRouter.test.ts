import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSlashCommand, SlashCommandDeps } from '../../../../src/chat/runtime/SlashCommandRouter';
import { parseSlashCommand, SLASH_COMMANDS } from '../../../../src/chat/ui/SlashCommands';

function makeDeps(overrides: Partial<SlashCommandDeps> = {}): SlashCommandDeps {
  return {
    addSystemMessage: vi.fn(),
    addUserMessage: vi.fn(),
    clearMessages: vi.fn(),
    exit: vi.fn(),
    engine: { requestConfirmation: vi.fn() } as unknown as SlashCommandDeps['engine'],
    registry: {},
    session: {} as SlashCommandDeps['session'],
    chatMessages: [],
    turnCoordinator: {
      submitBtwTurn: vi.fn(),
    } as unknown as SlashCommandDeps['turnCoordinator'],
    startManualPlan: vi.fn(),
    setSpaceName: vi.fn(),
    setApiKeyPrompt: vi.fn(),
    uiMessages: [],
    displayOpts: { providerName: 'anthropic', modelName: 'claude-sonnet-4-6' },
    spaceName: 'Test Space',
    cachedSpacesRef: { current: null },
    ...overrides,
  };
}

describe('SlashCommandRouter', () => {
  describe('/clear', () => {
    it('clears chatMessages and UI messages', async () => {
      const chatMessages = [{ role: 'user' as const, content: 'hello' }];
      const deps = makeDeps({ chatMessages });

      await executeSlashCommand(parseSlashCommand('/clear'), deps);

      expect(chatMessages.length).toBe(0);
      expect(deps.clearMessages).toHaveBeenCalled();
      expect(deps.addSystemMessage).toHaveBeenCalledWith('Session cleared.');
    });
  });

  describe('/btw', () => {
    it('submits a btw turn with the provided message', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/btw what time is it?'), deps);

      expect(deps.addUserMessage).toHaveBeenCalledWith('btw: what time is it?');
      expect(deps.turnCoordinator.submitBtwTurn).toHaveBeenCalledWith('what time is it?');
    });

    it('shows usage when no message is provided', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/btw'), deps);

      expect(deps.addSystemMessage).toHaveBeenCalledWith('Usage: /btw <message>');
      expect(deps.turnCoordinator.submitBtwTurn).not.toHaveBeenCalled();
    });
  });

  describe('/exit', () => {
    it('calls exit', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/exit'), deps);

      expect(deps.exit).toHaveBeenCalled();
    });

    it('/quit also calls exit', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/quit'), deps);

      expect(deps.exit).toHaveBeenCalled();
    });
  });

  describe('/help', () => {
    it('displays help text', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/help'), deps);

      expect(deps.addSystemMessage).toHaveBeenCalledTimes(1);
      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('/help');
      expect(msg).toContain('/clear');
    });
  });

  describe('/status', () => {
    it('displays session status', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'anthropic', modelName: 'claude-sonnet-4-6' },
        spaceName: 'My Space',
      });

      await executeSlashCommand(parseSlashCommand('/status'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Model: claude-sonnet-4-6');
      expect(msg).toContain('Provider: anthropic');
      expect(msg).toContain('Space: My Space');
    });
  });

  describe('/history', () => {
    it('shows recent UI messages', async () => {
      const deps = makeDeps({
        uiMessages: [
          { role: 'user', content: 'hello' },
          { role: 'assistant', content: 'hi there' },
        ],
      });

      await executeSlashCommand(parseSlashCommand('/history'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('[You] hello');
      expect(msg).toContain('[Zesty] hi there');
    });

    it('shows empty message when no history', async () => {
      const deps = makeDeps({ uiMessages: [] });

      await executeSlashCommand(parseSlashCommand('/history'), deps);

      expect(deps.addSystemMessage).toHaveBeenCalledWith('No conversation history yet.');
    });

    it('redacts credentials in history output', async () => {
      const deps = makeDeps({
        uiMessages: [
          { role: 'user', content: 'my api_key: sk-12345' },
        ],
      });

      await executeSlashCommand(parseSlashCommand('/history'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('[REDACTED]');
      expect(msg).not.toContain('sk-12345');
    });
  });

  describe('/plan', () => {
    it('starts manual plan when tool is found by key', async () => {
      const mockTool = { name: 'event_create', displayName: 'Create Event', execute: vi.fn() };
      const deps = makeDeps({ registry: { event_create: mockTool as any } });

      await executeSlashCommand(parseSlashCommand('/plan event_create'), deps);

      expect(deps.startManualPlan).toHaveBeenCalledWith(mockTool);
    });

    it('shows usage when no tool arg', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/plan'), deps);

      expect(deps.addSystemMessage).toHaveBeenCalledWith(expect.stringContaining('Usage: /plan'));
    });

    it('shows error for unknown tool', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/plan nonexistent'), deps);

      expect(deps.addSystemMessage).toHaveBeenCalledWith(expect.stringContaining('Unknown tool'));
    });
  });

  describe('unknown command', () => {
    it('displays error for unknown slash commands', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/banana'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Unknown command');
      expect(msg).toContain('/banana');
    });
  });

  describe('routing preserves parse→execute separation', () => {
    it('parseSlashCommand returns handled:false for non-slash input', () => {
      const result = parseSlashCommand('hello world');
      expect(result.handled).toBe(false);
    });

    it('every SLASH_COMMANDS entry is handled by parseSlashCommand', () => {
      for (const cmd of SLASH_COMMANDS) {
        const result = parseSlashCommand(cmd.name);
        expect(result.handled).toBe(true);
      }
    });
  });
});
