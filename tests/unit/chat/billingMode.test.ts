import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the store module before importing aiMode
vi.mock('../../../src/auth/store', () => {
  let mockConfig: Record<string, unknown> = {};
  return {
    getConfig: () => mockConfig,
    setConfigValue: vi.fn((key: string, value: unknown) => { mockConfig[key] = value; }),
    getDefaultSpace: () => mockConfig.default_space as string | undefined,
    __setMockConfig: (config: Record<string, unknown>) => { mockConfig = config; },
  };
});

describe('Billing Safety: AI Mode', () => {
  let getAiMode: () => string;
  let initAiMode: () => string;
  let setAiModeConfig: (mode: string) => void;
  let getAiModeDisplay: () => string;
  let __setMockConfig: (config: Record<string, unknown>) => void;

  beforeEach(async () => {
    vi.resetModules();
    const storeModule = await import('../../../src/auth/store');
    __setMockConfig = (storeModule as unknown as { __setMockConfig: (c: Record<string, unknown>) => void }).__setMockConfig;
    __setMockConfig({});

    const aiModeModule = await import('../../../src/chat/aiMode');
    getAiMode = aiModeModule.getAiMode;
    initAiMode = aiModeModule.initAiMode;
    setAiModeConfig = aiModeModule.setAiModeConfig;
    getAiModeDisplay = aiModeModule.getAiModeDisplay;
  });

  it('defaults to own_key when API key exists in config', () => {
    __setMockConfig({ anthropic_key: 'sk-test-123' });
    const mode = initAiMode();
    expect(mode).toBe('own_key');
  });

  it('defaults to credits when no API key exists', () => {
    __setMockConfig({});
    const mode = initAiMode();
    expect(mode).toBe('credits');
  });

  it('uses stored ai_mode from config', () => {
    __setMockConfig({ ai_mode: 'credits', anthropic_key: 'sk-test' });
    const mode = initAiMode();
    expect(mode).toBe('credits');
  });

  it('uses stored ai_mode own_key from config', () => {
    __setMockConfig({ ai_mode: 'own_key' });
    const mode = initAiMode();
    expect(mode).toBe('own_key');
  });

  it('setAiModeConfig writes to config', async () => {
    __setMockConfig({});
    initAiMode();
    setAiModeConfig('credits');
    const storeModule = await import('../../../src/auth/store');
    expect(storeModule.setConfigValue).toHaveBeenCalledWith('ai_mode', 'credits');
  });

  it('getAiModeDisplay returns friendly name for credits', () => {
    __setMockConfig({ ai_mode: 'credits' });
    initAiMode();
    expect(getAiModeDisplay()).toBe('Community AI Credits');
  });

  it('getAiModeDisplay returns friendly name for own_key', () => {
    __setMockConfig({ ai_mode: 'own_key' });
    initAiMode();
    expect(getAiModeDisplay()).toBe('Own API Key');
  });
});

describe('Billing Safety: Mode Isolation', () => {
  it('LemonadeAIProvider does not import Anthropic or OpenAI SDK', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const providerPath = path.join(process.cwd(), 'src/chat/providers/lemonade-ai.ts');
    const content = fs.readFileSync(providerPath, 'utf-8');

    expect(content).not.toContain("from '@anthropic-ai/sdk'");
    expect(content).not.toContain("from 'openai'");
    expect(content).not.toContain('new Anthropic');
    expect(content).not.toContain('new OpenAI');
  });

  it('LemonadeAIProvider implements AIProvider interface with correct capabilities', async () => {
    const { LemonadeAIProvider } = await import('../../../src/chat/providers/lemonade-ai');
    const provider = new LemonadeAIProvider('test-model', 'space123');

    expect(provider.name).toBe('lemonade-ai');
    expect(provider.model).toBe('test-model');
    expect(typeof provider.formatTools).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(provider.capabilities).toBeDefined();
    expect(provider.capabilities.supportsToolCalling).toBe(false);
    expect(provider.formatTools([])).toEqual([]);
  });
});

describe('Billing Safety: /mode slash command', () => {
  it('/mode is recognized by slash command parser', async () => {
    const { parseSlashCommand } = await import('../../../src/chat/ui/SlashCommands');
    const result = parseSlashCommand('/mode');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('mode');
    expect(result.args).toBeUndefined();
  });

  it('/mode credits passes credits as arg', async () => {
    const { parseSlashCommand } = await import('../../../src/chat/ui/SlashCommands');
    const result = parseSlashCommand('/mode credits');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('mode');
    expect(result.args).toBe('credits');
  });

  it('/mode own_key passes own_key as arg', async () => {
    const { parseSlashCommand } = await import('../../../src/chat/ui/SlashCommands');
    const result = parseSlashCommand('/mode own_key');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('mode');
    expect(result.args).toBe('own_key');
  });

  it('/mode appears in help output', async () => {
    const { parseSlashCommand } = await import('../../../src/chat/ui/SlashCommands');
    const result = parseSlashCommand('/help');
    expect(result.output).toContain('/mode');
  });
});

describe('Billing Safety: createCreditsProvider contract', () => {
  it('createCreditsProvider returns an AIProvider (not a tuple with dead fields)', async () => {
    const { createCreditsProvider } = await import('../../../src/chat/creditsProvider');

    // Mock graphqlRequest to return healthy credits + model
    const graphql = await import('../../../src/api/graphql');
    const spy = vi.spyOn(graphql, 'graphqlRequest')
      .mockResolvedValueOnce({ getStandCredits: { credits: 10, subscription_tier: 'pro' } })
      .mockResolvedValueOnce({ getAvailableModels: [{ name: 'test-model', is_default: true }] });

    const result = await createCreditsProvider('space-1');

    // Return type is AIProvider directly — no wrapper object with modelName
    expect(result.name).toBe('lemonade-ai');
    expect(result.model).toBe('test-model');
    expect(result.capabilities.supportsToolCalling).toBe(false);
    expect(typeof result.stream).toBe('function');
    expect(typeof result.formatTools).toBe('function');

    spy.mockRestore();
  });
});
