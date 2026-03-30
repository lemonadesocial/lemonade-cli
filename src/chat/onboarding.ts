import chalk from 'chalk';
import readline from 'readline';
import Anthropic from '@anthropic-ai/sdk';
import { setConfigValue, getConfig } from '../auth/store';

export function detectApiKey(provider: string): string | null {
  if (provider === 'openai') {
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) return envKey;

    const config = getConfig();
    const configKey = (config as Record<string, unknown>).openai_key as string | undefined;
    if (configKey) return configKey;

    return null;
  }

  // Anthropic (default)
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  const config = getConfig();
  const configKey = (config as Record<string, unknown>).anthropic_key as string | undefined;
  if (configKey) return configKey;

  return null;
}

export function detectProvider(): string {
  const envProvider = process.env.MAKE_LEMONADE_PROVIDER;
  if (envProvider) return envProvider;

  const config = getConfig();
  const configProvider = (config as Record<string, unknown>).ai_provider as string | undefined;
  if (configProvider) return configProvider;

  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';

  const anthropicKey = (config as Record<string, unknown>).anthropic_key;
  if (anthropicKey) return 'anthropic';

  const openaiKey = (config as Record<string, unknown>).openai_key;
  if (openaiKey) return 'openai';

  return 'anthropic';
}

export async function onboardApiKey(rl: readline.Interface): Promise<string | null> {
  console.log(chalk.bold('\n  Welcome to make-lemonade!\n'));
  console.log('  To use AI mode, you need an API key from your AI provider.');
  console.log('  Anthropic is recommended (best tool-use support).\n');
  console.log('  1. Get a key at: https://console.anthropic.com/settings/keys');
  console.log('  2. Paste it below, or set ANTHROPIC_API_KEY in your environment.\n');

  const openBrowser = await new Promise<string>((resolve) => {
    rl.question('  Open the Anthropic console in your browser? (yes/no) ', resolve);
  });

  if (['yes', 'y'].includes(openBrowser.trim().toLowerCase())) {
    try {
      const openModule = await import('open');
      await openModule.default('https://console.anthropic.com/settings/keys');
      console.log(chalk.dim('  Browser opened. Paste your key when ready.\n'));
    } catch {
      console.log(chalk.dim('  Could not open browser. Visit the URL above manually.\n'));
    }
  }

  const key = await new Promise<string>((resolve) => {
    rl.question('  Anthropic API key: ', resolve);
  });

  if (!key.trim()) return null;

  try {
    const client = new Anthropic({ apiKey: key.trim() });
    await client.messages.create({
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    });
    // Store the key via the generic config setter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setConfigValue('anthropic_key' as any, key.trim());
    console.log(chalk.green('  Key saved and verified.\n'));
    return key.trim();
  } catch {
    console.log(chalk.red('  Invalid key. Try again or set ANTHROPIC_API_KEY manually.\n'));
    return null;
  }
}
