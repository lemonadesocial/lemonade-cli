import chalk from 'chalk';
import readline from 'readline';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { setConfigValue, getConfig } from '../auth/store.js';
import { setAiModeConfig } from './aiMode.js';
import { selectCreditsSpace } from './spaceSelection.js';

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

const LOGO = chalk.hex('#FDE047')(`
 _                                      _
| |    ___ _ __ ___   ___  _ __   __ _ | |  ___
| |   / _ | '_ \` _ \\ / _ \\| '_ \\ / _\` || | / _ \\
| |__|  __| | | | | | (_) | | | | (_| || ||  __/
|_____\\___|_| |_| |_|\\___/|_| |_|\\__,_||_| \\___|
`);

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function askSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);

    let input = '';
    const onData = (data: Buffer) => {
      const ch = data.toString();
      if (ch === '\r' || ch === '\n') {
        stdin.removeListener('data', onData);
        if (stdin.isTTY && wasRaw !== undefined) stdin.setRawMode(wasRaw);
        process.stdout.write('\n');
        resolve(input);
      } else if (ch === '\u0003') {
        // Ctrl+C
        stdin.removeListener('data', onData);
        if (stdin.isTTY && wasRaw !== undefined) stdin.setRawMode(wasRaw);
        process.stdout.write('\n');
        process.exit(0);
      } else if (ch === '\u007f' || ch === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (ch.charCodeAt(0) >= 32) {
        input += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
    stdin.resume();
  });
}

async function setupProviderKey(
  rl: readline.Interface,
  provider: string,
): Promise<string | null> {
  const info = PROVIDER_INFO[provider] || PROVIDER_INFO.anthropic;

  console.log(`\n  Get a key at: ${info.consoleUrl}`);

  const openBrowser = await ask(rl, `  Open ${info.name} console in your browser? (yes/no) `);

  if (['yes', 'y'].includes(openBrowser.trim().toLowerCase())) {
    try {
      const openModule = await import('open');
      await openModule.default(info.consoleUrl);
      console.log(chalk.dim('  Browser opened. Paste your key when ready.\n'));
    } catch {
      console.log(chalk.dim('  Could not open browser. Visit the URL above manually.\n'));
    }
  }

  const key = await askSecret(`  ${info.name} API key: `);

  if (!key.trim()) {
    console.log(chalk.dim('  Skipped.\n'));
    return null;
  }

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
    console.log(chalk.hex('#10B981')('  Key saved and verified.\n'));
    return key.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(chalk.hex('#FF637E')(`  ${message}\n`));

    const retry = await ask(rl, '  Try again? (yes/no) ');
    if (['yes', 'y'].includes(retry.trim().toLowerCase())) {
      return setupProviderKey(rl, provider);
    }
    return null;
  }
}

export async function onboardApiKey(
  rl: readline.Interface,
  _requestedProvider: string = 'anthropic',
  hasCredits: boolean = false,
): Promise<string | null> {
  console.log(LOGO);
  console.log(chalk.bold('  Welcome to make-lemonade!\n'));

  if (hasCredits) {
    console.log('  How would you like to power the AI assistant?\n');
    console.log('    1. Use my community\'s AI credits (no API key needed)');
    console.log(chalk.dim('       Your community\'s subscription includes AI credits.\n'));
    console.log('    2. Use my own API key (Anthropic or OpenAI)');
    console.log(chalk.dim('       Your key stays local. Lemonade never sees it.\n'));

    const modeChoice = await ask(rl, '  Enter 1 or 2: ');
    const modeSelected = modeChoice.trim();

    if (modeSelected === '1') {
      const spaceId = await selectCreditsSpace(rl);
      if (!spaceId) {
        console.log(chalk.dim('  Falling back to own API key mode.\n'));
      } else {
        setAiModeConfig('credits');
        console.log(chalk.hex('#10B981')('  Mode set: Community AI Credits\n'));
        console.log('  You can switch modes anytime with /mode.\n');
        return 'credits-mode';
      }
    }
  }

  // Own API key flow
  setAiModeConfig('own_key');

  console.log(chalk.dim('  Your API keys are stored locally on your machine (~/.lemonade/config.json)'));
  console.log(chalk.dim('  and sent directly to the AI provider. Lemonade never sees or stores your keys.\n'));

  console.log('  Choose your AI provider:\n');
  console.log('    1. Anthropic (Claude) -- recommended, best tool-use support');
  console.log('    2. OpenAI (GPT-4o)');
  console.log('    3. I have both -- set up both now\n');

  const choice = await ask(rl, '  Enter 1, 2, or 3: ');
  const selected = choice.trim();

  let apiKey: string | null = null;

  if (selected === '1' || selected === '') {
    apiKey = await setupProviderKey(rl, 'anthropic');
    if (apiKey) {
      setConfigValue('ai_provider', 'anthropic');
    }
  } else if (selected === '2') {
    apiKey = await setupProviderKey(rl, 'openai');
    if (apiKey) {
      setConfigValue('ai_provider', 'openai');
    }
  } else if (selected === '3') {
    const anthropicKey = await setupProviderKey(rl, 'anthropic');
    const openaiKey = await setupProviderKey(rl, 'openai');

    // Default to Anthropic when both are set up
    setConfigValue('ai_provider', 'anthropic');
    apiKey = anthropicKey || openaiKey;
  } else {
    console.log(chalk.dim('  Invalid choice. Defaulting to Anthropic.\n'));
    apiKey = await setupProviderKey(rl, 'anthropic');
    if (apiKey) {
      setConfigValue('ai_provider', 'anthropic');
    }
  }

  if (apiKey) {
    console.log('  You can switch providers anytime with /provider or Tab.\n');
  }

  return apiKey;
}
