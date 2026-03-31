import chalk from 'chalk';
import readline from 'readline';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { setConfigValue, getConfig } from '../auth/store.js';

export function detectApiKey(provider: string): string | null {
  if (provider === 'openai') {
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) return envKey;

    const config = getConfig();
    if (config.openai_key) return config.openai_key;

    return null;
  }

  // Anthropic (default)
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  const config = getConfig();
  if (config.anthropic_key) return config.anthropic_key;

  return null;
}

export function detectProvider(): string {
  const envProvider = process.env.MAKE_LEMONADE_PROVIDER;
  if (envProvider) return envProvider;

  const config = getConfig();
  if (config.ai_provider) return config.ai_provider;

  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';

  if (config.anthropic_key) return 'anthropic';
  if (config.openai_key) return 'openai';

  return 'anthropic';
}

const PROVIDER_INFO: Record<string, { name: string; consoleUrl: string; envVar: string; configKey: 'anthropic_key' | 'openai_key' }> = {
  anthropic: {
    name: 'Anthropic',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    envVar: 'ANTHROPIC_API_KEY',
    configKey: 'anthropic_key',
  },
  openai: {
    name: 'OpenAI',
    consoleUrl: 'https://platform.openai.com/api-keys',
    envVar: 'OPENAI_API_KEY',
    configKey: 'openai_key',
  },
};

export async function onboardApiKey(rl: readline.Interface, provider: string = 'anthropic'): Promise<string | null> {
  const info = PROVIDER_INFO[provider] || PROVIDER_INFO.anthropic;

  console.log(chalk.bold('\n  Welcome to make-lemonade!\n'));
  console.log(`  To use AI mode, you need an API key from ${info.name}.`);
  if (provider === 'anthropic') {
    console.log('  Anthropic is recommended (best tool-use support).');
  }
  console.log(`\n  1. Get a key at: ${info.consoleUrl}`);
  console.log(`  2. Paste it below, or set ${info.envVar} in your environment.\n`);

  const openBrowser = await new Promise<string>((resolve) => {
    rl.question(`  Open the ${info.name} console in your browser? (yes/no) `, resolve);
  });

  if (['yes', 'y'].includes(openBrowser.trim().toLowerCase())) {
    try {
      const openModule = await import('open');
      await openModule.default(info.consoleUrl);
      console.log(chalk.dim('  Browser opened. Paste your key when ready.\n'));
    } catch {
      console.log(chalk.dim('  Could not open browser. Visit the URL above manually.\n'));
    }
  }

  const key = await new Promise<string>((resolve) => {
    rl.question(`  ${info.name} API key: `, resolve);
  });

  if (!key.trim()) return null;

  try {
    if (provider === 'openai') {
      const client = new OpenAI({ apiKey: key.trim() });
      await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      });
    } else {
      const client = new Anthropic({ apiKey: key.trim() });
      await client.messages.create({
        model: 'claude-sonnet-4-6',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      });
    }

    setConfigValue(info.configKey, key.trim());
    console.log(chalk.green('  Key saved and verified.\n'));
    return key.trim();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || (err instanceof OpenAI.AuthenticationError)) {
      console.log(chalk.red(`  Invalid key. Try again or set ${info.envVar} manually.\n`));
    } else {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  ${message}\n`));
    }
    return null;
  }
}
