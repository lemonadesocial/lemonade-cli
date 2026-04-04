import chalk from 'chalk';
import readline from 'readline';
import { getDefaultSpace } from '../auth/store.js';
import { setAiModeConfig } from './aiMode.js';
import { detectApiKey, detectProvider } from './onboarding.js';
import { getCreditsSpaceId, selectCreditsSpace } from './spaceSelection.js';

export interface CreditsStartupResolution {
  mode: 'credits' | 'own_key';
  spaceId?: string;
  message?: string;
  /** When true, startup cannot proceed — the caller must exit. */
  failed?: boolean;
}

export async function resolveCreditsStartupMode(isTTY: boolean): Promise<CreditsStartupResolution> {
  const configuredSpace = getCreditsSpaceId() || getDefaultSpace();
  if (configuredSpace) {
    return { mode: 'credits', spaceId: configuredSpace };
  }

  if (isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      const selectedSpace = await selectCreditsSpace(rl);
      if (selectedSpace) {
        return { mode: 'credits', spaceId: selectedSpace };
      }
    } finally {
      rl.close();
    }
  }

  const providerName = detectProvider();
  const apiKey = detectApiKey(providerName);
  if (apiKey) {
    setAiModeConfig('own_key');
    return {
      mode: 'own_key',
      message: chalk.yellow('  No credits space selected. Starting in BYOK mode instead.'),
    };
  }

  return {
    mode: 'credits',
    failed: true,
    message: chalk.red('  No credits space configured. Run "lemonade space switch" or set up an API key to use BYOK mode.'),
  };
}
