import { getConfig, setConfigValue } from '../auth/store.js';

export type AiMode = 'credits' | 'own_key';

// Frozen at startup. Cannot change mid-session.
let lockedMode: AiMode | null = null;

export function initAiMode(): AiMode {
  if (lockedMode !== null) return lockedMode;

  const config = getConfig();
  const stored = config.ai_mode;

  if (stored === 'credits' || stored === 'own_key') {
    lockedMode = stored;
  } else {
    // Default: if user has an API key, use own_key; otherwise credits
    const hasApiKey = !!(config.anthropic_key || config.openai_key ||
      process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
    lockedMode = hasApiKey ? 'own_key' : 'credits';
  }

  return lockedMode;
}

export function getAiMode(): AiMode {
  if (lockedMode === null) return initAiMode();
  return lockedMode;
}

export function setAiModeConfig(mode: AiMode): void {
  setConfigValue('ai_mode', mode);
}

export function getAiModeDisplay(): string {
  const mode = getAiMode();
  return mode === 'credits' ? 'Community AI Credits' : 'Own API Key';
}
