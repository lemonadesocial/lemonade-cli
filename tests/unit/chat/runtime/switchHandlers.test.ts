import { describe, it, expect, vi } from 'vitest';
import {
  handleSwitchProvider,
  handleSwitchMode,
  SwitchProviderDeps,
  SwitchModeDeps,
} from '../../../../src/chat/runtime/switchHandlers';

const fakeProvider = (name = 'anthropic', model = 'claude-sonnet-4-6') => ({
  name,
  model,
  formatTools: vi.fn(() => []),
  sendMessage: vi.fn(),
  sendMessageStream: vi.fn(),
});

function makeProviderDeps(overrides: Partial<SwitchProviderDeps> = {}): SwitchProviderDeps {
  return {
    state: { isSwitching: false, isMainTurnActive: false },
    detectApiKey: vi.fn(() => 'sk-test-key'),
    createByokProvider: vi.fn(async () => fakeProvider() as any),
    setAiModeConfig: vi.fn(),
    setConfigValue: vi.fn(),
    applyRuntimeSwitch: vi.fn(),
    ...overrides,
  };
}

function makeModeDeps(overrides: Partial<SwitchModeDeps> = {}): SwitchModeDeps {
  return {
    state: { isSwitching: false, isMainTurnActive: false },
    detectProvider: vi.fn(() => 'anthropic'),
    detectApiKey: vi.fn(() => 'sk-test-key'),
    createByokProvider: vi.fn(async () => fakeProvider() as any),
    createCreditsProvider: vi.fn(async () => fakeProvider('lemonade-ai', 'Lemonade AI') as any),
    setAiModeConfig: vi.fn(),
    setConfigValue: vi.fn(),
    getCreditsSpaceId: vi.fn(() => undefined),
    getDefaultSpace: vi.fn(() => undefined),
    currentSpaceId: undefined,
    currentSpaceTitle: undefined,
    spaceName: 'Test Space',
    applyRuntimeSwitch: vi.fn(),
    ...overrides,
  };
}

describe('handleSwitchProvider', () => {
  it('blocks when a switch is already in progress', async () => {
    const deps = makeProviderDeps({ state: { isSwitching: true, isMainTurnActive: false } });
    const result = await handleSwitchProvider('openai', deps);
    expect(result).toContain('already in progress');
    expect(deps.applyRuntimeSwitch).not.toHaveBeenCalled();
  });

  it('blocks when a turn is active', async () => {
    const deps = makeProviderDeps({ state: { isSwitching: false, isMainTurnActive: true } });
    const result = await handleSwitchProvider('openai', deps);
    expect(result).toContain('turn is active');
    expect(deps.applyRuntimeSwitch).not.toHaveBeenCalled();
  });

  it('returns error when no API key is found', async () => {
    const deps = makeProviderDeps({ detectApiKey: vi.fn(() => null) });
    const result = await handleSwitchProvider('openai', deps);
    expect(result).toContain('No OpenAI API key found');
    expect(deps.applyRuntimeSwitch).not.toHaveBeenCalled();
  });

  it('returns error when provider creation fails', async () => {
    const deps = makeProviderDeps({
      createByokProvider: vi.fn(async () => { throw new Error('init failed'); }),
    });
    const result = await handleSwitchProvider('openai', deps);
    expect(result).toContain('Failed to create openai provider');
    expect(result).toContain('init failed');
    expect(deps.applyRuntimeSwitch).not.toHaveBeenCalled();
  });

  it('succeeds: updates config and applies runtime switch', async () => {
    const provider = fakeProvider('openai', 'gpt-4o');
    const deps = makeProviderDeps({
      createByokProvider: vi.fn(async () => provider as any),
    });
    const result = await handleSwitchProvider('openai', deps);

    expect(result).toContain('Switched provider to openai');
    expect(deps.setAiModeConfig).toHaveBeenCalledWith('own_key');
    expect(deps.setConfigValue).toHaveBeenCalledWith('ai_provider', 'openai');
    expect(deps.applyRuntimeSwitch).toHaveBeenCalledWith(provider, 'none');
  });
});

describe('handleSwitchMode', () => {
  it('blocks when a switch is already in progress', async () => {
    const deps = makeModeDeps({ state: { isSwitching: true, isMainTurnActive: false } });
    const result = await handleSwitchMode('own_key', deps);
    expect(result).toContain('already in progress');
  });

  it('blocks when a turn is active', async () => {
    const deps = makeModeDeps({ state: { isSwitching: false, isMainTurnActive: true } });
    const result = await handleSwitchMode('credits', deps);
    expect(result).toContain('turn is active');
  });

  describe('own_key mode', () => {
    it('returns error for unknown detected provider', async () => {
      const deps = makeModeDeps({ detectProvider: vi.fn(() => 'gemini') });
      const result = await handleSwitchMode('own_key', deps);
      expect(result).toContain('Unknown provider');
      expect(result).toContain('gemini');
    });

    it('returns error when no API key exists', async () => {
      const deps = makeModeDeps({ detectApiKey: vi.fn(() => null) });
      const result = await handleSwitchMode('own_key', deps);
      expect(result).toContain('No AI API key found');
    });

    it('returns error when provider creation fails', async () => {
      const deps = makeModeDeps({
        createByokProvider: vi.fn(async () => { throw new Error('boom'); }),
      });
      const result = await handleSwitchMode('own_key', deps);
      expect(result).toContain('Failed to create anthropic provider');
      expect(result).toContain('boom');
    });

    it('succeeds: sets own_key config and applies switch with space=none', async () => {
      const provider = fakeProvider();
      const deps = makeModeDeps({
        createByokProvider: vi.fn(async () => provider as any),
      });
      const result = await handleSwitchMode('own_key', deps);

      expect(result).toContain('Switched to BYOK mode');
      expect(deps.setAiModeConfig).toHaveBeenCalledWith('own_key');
      expect(deps.applyRuntimeSwitch).toHaveBeenCalledWith(provider, 'none');
    });
  });

  describe('credits mode', () => {
    it('returns error when no credits space is available', async () => {
      const deps = makeModeDeps();
      const result = await handleSwitchMode('credits', deps);
      expect(result).toContain('No credits space configured');
    });

    it('uses getCreditsSpaceId when available', async () => {
      const deps = makeModeDeps({ getCreditsSpaceId: vi.fn(() => 'space-from-config') });
      await handleSwitchMode('credits', deps);
      expect(deps.createCreditsProvider).toHaveBeenCalledWith('space-from-config', { liveSwitch: true });
    });

    it('falls back to currentSpaceId', async () => {
      const deps = makeModeDeps({ currentSpaceId: 'current-space-id' });
      await handleSwitchMode('credits', deps);
      expect(deps.createCreditsProvider).toHaveBeenCalledWith('current-space-id', { liveSwitch: true });
    });

    it('falls back to getDefaultSpace', async () => {
      const deps = makeModeDeps({ getDefaultSpace: vi.fn(() => 'default-space') });
      await handleSwitchMode('credits', deps);
      expect(deps.createCreditsProvider).toHaveBeenCalledWith('default-space', { liveSwitch: true });
    });

    it('returns error when credits provider creation fails', async () => {
      const deps = makeModeDeps({
        getCreditsSpaceId: vi.fn(() => 'space-1'),
        createCreditsProvider: vi.fn(async () => { throw new Error('credits fail'); }),
      });
      const result = await handleSwitchMode('credits', deps);
      expect(result).toContain('Failed to switch to credits mode');
      expect(result).toContain('credits fail');
    });

    it('persists space to config when getCreditsSpaceId returns nothing', async () => {
      const deps = makeModeDeps({ currentSpaceId: 'space-fallback' });
      await handleSwitchMode('credits', deps);
      expect(deps.setConfigValue).toHaveBeenCalledWith('ai_credits_space', 'space-fallback');
    });

    it('does not persist space when getCreditsSpaceId already returns a value', async () => {
      const deps = makeModeDeps({ getCreditsSpaceId: vi.fn(() => 'already-set') });
      await handleSwitchMode('credits', deps);
      expect(deps.setConfigValue).not.toHaveBeenCalled();
    });

    it('succeeds: sets credits config and applies switch with space title', async () => {
      const provider = fakeProvider('lemonade-ai', 'Lemonade AI');
      const deps = makeModeDeps({
        getCreditsSpaceId: vi.fn(() => 'space-1'),
        createCreditsProvider: vi.fn(async () => provider as any),
        currentSpaceTitle: 'My Community',
      });
      const result = await handleSwitchMode('credits', deps);

      expect(result).toContain('Switched to Lemonade Credits mode');
      expect(deps.setAiModeConfig).toHaveBeenCalledWith('credits');
      expect(deps.applyRuntimeSwitch).toHaveBeenCalledWith(provider, 'My Community');
    });
  });
});
