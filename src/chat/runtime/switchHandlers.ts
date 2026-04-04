import { AIProvider } from '../providers/interface.js';
import { ByokProviderName, isValidProvider } from '../providerFactory.js';
import type { AiMode } from '../aiMode.js';
import type { LemonadeConfig } from '../../auth/store.js';

export interface SwitchState {
  isMainTurnActive: boolean;
}

export interface SwitchProviderDeps {
  state: SwitchState;
  detectApiKey: (provider: string) => string | null | undefined;
  createByokProvider: (name: ByokProviderName, apiKey: string) => Promise<AIProvider>;
  setAiModeConfig: (mode: AiMode) => void;
  setConfigValue: (key: keyof LemonadeConfig, value: string) => void;
  applyRuntimeSwitch: (provider: AIProvider, spaceName?: string) => void;
}

export async function handleSwitchProvider(
  nextProviderName: ByokProviderName,
  deps: SwitchProviderDeps,
): Promise<string> {
  if (deps.state.isMainTurnActive) {
    return 'Cannot switch provider while a turn is active. Wait for it to finish or press Escape to cancel.';
  }
  const apiKey = deps.detectApiKey(nextProviderName);
  if (!apiKey) {
    const label = nextProviderName === 'openai' ? 'OpenAI' : 'Anthropic';
    return `No ${label} API key found. Configure it first, then try /provider ${nextProviderName} again.`;
  }

  let nextProvider: AIProvider;
  try {
    nextProvider = await deps.createByokProvider(nextProviderName, apiKey);
  } catch (err) {
    return `Failed to create ${nextProviderName} provider: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }

  deps.setAiModeConfig('own_key');
  deps.setConfigValue('ai_provider', nextProviderName);
  deps.applyRuntimeSwitch(nextProvider);
  return `Switched provider to ${nextProviderName}. Session cleared.`;
}

export interface SwitchModeDeps {
  state: SwitchState;
  detectProvider: () => string;
  detectApiKey: (provider: string) => string | null | undefined;
  createByokProvider: (name: ByokProviderName, apiKey: string) => Promise<AIProvider>;
  createCreditsProvider: (spaceId: string, opts: { liveSwitch: boolean }) => Promise<AIProvider>;
  setAiModeConfig: (mode: AiMode) => void;
  setConfigValue: (key: keyof LemonadeConfig, value: string) => void;
  getCreditsSpaceId: () => string | undefined;
  getDefaultSpace: () => string | undefined;
  resolveSpaceTitle: (spaceId: string) => Promise<string | undefined>;
  currentSpaceId: string | undefined;
  spaceName: string;
  applyRuntimeSwitch: (provider: AIProvider, spaceName?: string) => void;
}

export async function handleSwitchMode(
  nextMode: 'credits' | 'own_key',
  deps: SwitchModeDeps,
): Promise<string> {
  if (deps.state.isMainTurnActive) {
    return 'Cannot switch mode while a turn is active. Wait for it to finish or press Escape to cancel.';
  }

  if (nextMode === 'own_key') {
    const detected = deps.detectProvider();
    if (!isValidProvider(detected)) {
      return `Unknown provider "${detected}". Supported: anthropic, openai. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.`;
    }
    const apiKey = deps.detectApiKey(detected);
    if (!apiKey) {
      return 'No AI API key found. Configure ANTHROPIC_API_KEY or OPENAI_API_KEY to use BYOK mode.';
    }

    let nextProvider: AIProvider;
    try {
      nextProvider = await deps.createByokProvider(detected, apiKey);
    } catch (err) {
      return `Failed to create ${detected} provider: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }

    deps.setAiModeConfig('own_key');
    deps.setConfigValue('ai_provider', detected);
    deps.applyRuntimeSwitch(nextProvider);
    return `Switched to BYOK mode using ${detected}. Session cleared.`;
  }

  const nextCreditsSpace = deps.getCreditsSpaceId() || deps.currentSpaceId || deps.getDefaultSpace();
  if (!nextCreditsSpace) {
    return 'No credits space configured. Use /spaces to select a space or run "lemonade space switch", then try /mode credits again.';
  }

  let nextProvider: AIProvider;
  try {
    nextProvider = await deps.createCreditsProvider(nextCreditsSpace, { liveSwitch: true });
  } catch (err) {
    return `Failed to switch to credits mode: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }

  if (!deps.getCreditsSpaceId()) {
    deps.setConfigValue('ai_credits_space', nextCreditsSpace);
  }
  deps.setAiModeConfig('credits');
  const resolvedTitle = await deps.resolveSpaceTitle(nextCreditsSpace) || deps.spaceName;
  deps.applyRuntimeSwitch(nextProvider, resolvedTitle);
  return `Switched to Lemonade Credits mode. Session cleared.`;
}
