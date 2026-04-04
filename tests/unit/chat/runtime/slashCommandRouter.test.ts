import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSlashCommand, SlashCommandDeps } from '../../../../src/chat/runtime/SlashCommandRouter';
import { parseSlashCommand, SLASH_COMMANDS } from '../../../../src/chat/ui/SlashCommands';

// Mock aiMode so tests can control credits vs own_key behavior
vi.mock('../../../../src/chat/aiMode', () => ({
  getAiMode: vi.fn(() => 'own_key'),
  getAiModeDisplay: vi.fn(() => 'Own API Key'),
  setAiModeConfig: vi.fn(),
}));

import { getAiMode, getAiModeDisplay } from '../../../../src/chat/aiMode';
const mockGetAiMode = vi.mocked(getAiMode);
const mockGetAiModeDisplay = vi.mocked(getAiModeDisplay);

function makeDeps(overrides: Partial<SlashCommandDeps> = {}): SlashCommandDeps {
  return {
    addSystemMessage: vi.fn(),
    addUserMessage: vi.fn(),
    onClear: vi.fn(),
    exit: vi.fn(),
    engine: { requestConfirmation: vi.fn() } as unknown as SlashCommandDeps['engine'],
    registry: {},
    session: {} as SlashCommandDeps['session'],
    chatMessages: [],
    turnCoordinator: {
      submitBtwTurn: vi.fn(),
      clearSession: vi.fn(),
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
  beforeEach(() => {
    mockGetAiMode.mockReturnValue('own_key');
    mockGetAiModeDisplay.mockReturnValue('Own API Key');
  });

  describe('/clear', () => {
    it('delegates to onClear callback', async () => {
      const chatMessages = [{ role: 'user' as const, content: 'hello' }];
      const deps = makeDeps({ chatMessages });

      await executeSlashCommand(parseSlashCommand('/clear'), deps);

      expect(deps.onClear).toHaveBeenCalled();
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

  describe('/model', () => {
    it('shows current model and available models when no args', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'anthropic', modelName: 'claude-sonnet-4-6' },
      });

      await executeSlashCommand(parseSlashCommand('/model'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Current model: claude-sonnet-4-6');
      expect(msg).toContain('anthropic');
    });

    it('informs user that model switching requires restart', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'anthropic', modelName: 'claude-sonnet-4-6' },
      });

      await executeSlashCommand(parseSlashCommand('/model claude-haiku-4-5-20251001'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('requires a session restart');
    });

    it('shows error for unknown model', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'anthropic', modelName: 'claude-sonnet-4-6' },
      });

      await executeSlashCommand(parseSlashCommand('/model nonexistent-model'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Unknown model');
    });
  });

  describe('/provider', () => {
    it('shows current provider when no args', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'anthropic', modelName: 'claude-sonnet-4-6' },
      });

      await executeSlashCommand(parseSlashCommand('/provider'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Current provider: anthropic');
    });

    it('informs user that provider switching requires restart', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/provider openai'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('requires a session restart');
    });
  });

  describe('/space', () => {
    it('shows current space and hints at /spaces', async () => {
      const deps = makeDeps({ spaceName: 'My Space' });

      await executeSlashCommand(parseSlashCommand('/space'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Current space: My Space');
      expect(msg).toContain('/spaces');
    });
  });

  describe('/tempo request', () => {
    it('shows usage when no URL provided', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/tempo request'), deps);

      expect(deps.addSystemMessage).toHaveBeenCalledWith('Usage: /tempo request <url>');
    });
  });

  describe('missing registry tool behavior', () => {
    it('shows user-visible error when a required tool is missing from registry', async () => {
      const deps = makeDeps({ registry: {} });

      await executeSlashCommand(parseSlashCommand('/events'), deps);

      const calls = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
      expect(calls.some((msg: string) => msg.includes('not available'))).toBe(true);
    });

    it('does not crash when credits tool is missing (credits mode)', async () => {
      mockGetAiMode.mockReturnValue('credits');
      const deps = makeDeps({ registry: {} });

      await executeSlashCommand(parseSlashCommand('/credits'), deps);

      const calls = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
      expect(calls.some((msg: string) => msg.includes('not available'))).toBe(true);
    });

    it('does not crash when connectors_list tool is missing', async () => {
      const deps = makeDeps({ registry: {} });

      await executeSlashCommand(parseSlashCommand('/connectors'), deps);

      const calls = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
      expect(calls.some((msg: string) => msg.includes('not available'))).toBe(true);
    });
  });

  describe('every parseable action has a non-silent routing outcome', () => {
    const ACTIONS_WITH_ARGS: Record<string, string> = {
      model: '/model',
      provider: '/provider',
      space: '/space',
      mode: '/mode',
      name: '/name',
      plan: '/plan',
      btw: '/btw test',
      version: '/version',
      status: '/status',
      credits: '/credits',
      history: '/history',
      clear: '/clear',
      exit: '/exit',
    };

    for (const [action, cmd] of Object.entries(ACTIONS_WITH_ARGS)) {
      it(`/${action} produces a visible side effect`, async () => {
        const deps = makeDeps();
        // Mock fetch for /version
        if (action === 'version') {
          vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        }

        await executeSlashCommand(parseSlashCommand(cmd), deps);

        const anyCall =
          (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls.length > 0 ||
          (deps.addUserMessage as ReturnType<typeof vi.fn>).mock.calls.length > 0 ||
          (deps.onClear as ReturnType<typeof vi.fn>).mock.calls.length > 0 ||
          (deps.exit as ReturnType<typeof vi.fn>).mock.calls.length > 0;
        expect(anyCall).toBe(true);

        if (action === 'version') {
          vi.unstubAllGlobals();
        }
      });
    }
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

  describe('credits-mode slash command UX parity', () => {
    beforeEach(() => {
      mockGetAiMode.mockReturnValue('credits');
      mockGetAiModeDisplay.mockReturnValue('Community AI Credits');
    });

    it('/model in credits mode shows backend-managed model info', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'lemonade-ai', modelName: 'Lemonade AI' },
      });

      await executeSlashCommand(parseSlashCommand('/model'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Current model: Lemonade AI');
      expect(msg).toContain('credits mode');
      expect(msg).toContain('Model switching is not available');
    });

    it('/model <name> in credits mode does not list BYOK models', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'lemonade-ai', modelName: 'Lemonade AI' },
      });

      await executeSlashCommand(parseSlashCommand('/model claude-sonnet-4-6'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('credits mode');
      expect(msg).not.toContain('claude-sonnet');
    });

    it('/provider in credits mode explains provider is community-managed', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/provider'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Credits mode');
      expect(msg).toContain('managed by your community');
      expect(msg).not.toContain('Available: anthropic, openai');
    });

    it('/provider <name> in credits mode does not offer switching', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/provider openai'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Credits mode');
      expect(msg).not.toContain('requires a session restart. Current provider');
    });

    it('/status in credits mode shows tool-calling limitation', async () => {
      const deps = makeDeps({
        displayOpts: { providerName: 'lemonade-ai', modelName: 'Lemonade AI' },
        spaceName: 'My Community',
      });

      await executeSlashCommand(parseSlashCommand('/status'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Tool calling: not available');
      expect(msg).toContain('Mode: Community AI Credits');
    });

    it('/status in BYOK mode does not show tool-calling limitation', async () => {
      mockGetAiMode.mockReturnValue('own_key');
      mockGetAiModeDisplay.mockReturnValue('Own API Key');
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/status'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).not.toContain('Tool calling');
    });

    it('/credits in BYOK mode explains credits do not apply', async () => {
      mockGetAiMode.mockReturnValue('own_key');
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/credits'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('BYOK mode');
      expect(msg).toContain('Credits do not apply');
    });

    it('/credits in credits mode with missing tool shows space-related guidance', async () => {
      const deps = makeDeps({ registry: {} });

      await executeSlashCommand(parseSlashCommand('/credits'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('not available');
      expect(msg).toContain('/spaces');
    });

    it('/plan in credits mode warns about tool-calling limitation', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/plan event_create'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('not available');
      expect(msg).toContain('Credits mode');
      expect(msg).toContain('tool calling');
      expect(deps.startManualPlan).not.toHaveBeenCalled();
    });

    it('/plan in BYOK mode still works normally', async () => {
      mockGetAiMode.mockReturnValue('own_key');
      const mockTool = { name: 'event_create', displayName: 'Create Event', execute: vi.fn() };
      const deps = makeDeps({ registry: { event_create: mockTool as any } });

      await executeSlashCommand(parseSlashCommand('/plan event_create'), deps);

      expect(deps.startManualPlan).toHaveBeenCalledWith(mockTool);
    });

    it('/mode shows approved display names in mode listing', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/mode'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Lemonade Credits');
      expect(msg).toContain('BYOK');
      expect(msg).toContain('requires restart');
    });

    it('/mode credits shows approved display name in restart message', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/mode credits'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('Lemonade Credits');
      expect(msg).toContain('Restart');
    });

    it('/mode own_key shows approved display name in restart message', async () => {
      const deps = makeDeps();

      await executeSlashCommand(parseSlashCommand('/mode own_key'), deps);

      const msg = (deps.addSystemMessage as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('BYOK');
      expect(msg).toContain('Restart');
    });
  });
});
