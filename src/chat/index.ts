#!/usr/bin/env node

import chalk from 'chalk';
import readline from 'readline';
import { graphqlRequest } from '../api/graphql.js';
import { getAuthHeader, getDefaultSpace } from '../auth/store.js';
import { AIProvider } from './providers/interface.js';
import { buildToolRegistry } from './tools/registry.js';
import { createSessionState } from './session/state.js';
import { buildSystemMessages } from './session/cache.js';
import { batchMode } from './batch.js';
import { detectApiKey, detectProvider, onboardApiKey } from './onboarding.js';
import { parseArgs } from './parseArgs.js';
import { initAiMode } from './aiMode.js';
import { getAgentName } from './skills/loader.js';
import { selectCreditsSpace, getCreditsSpaceId } from './spaceSelection.js';
import { VERSION } from './version.js';
import { runTerminalUI } from './terminal.js';

export { parseArgs } from './parseArgs.js';
export { VERSION } from './version.js';
const VALID_PROVIDERS = ['anthropic', 'openai'];

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

function printHelp(): void {
  console.log(`
  ${chalk.bold('make-lemonade')} v${VERSION}

  Interactive AI terminal for managing Lemonade events and communities.

  ${chalk.bold('Usage:')}
    make-lemonade [options]

  ${chalk.bold('Options:')}
    --provider <name>   AI provider: anthropic (default), openai
    --model <model>     Model override (e.g. claude-sonnet-4-6, gpt-4o)
    --json              Output as JSON (batch mode)
    -h, --help          Show this help

  ${chalk.bold('Environment:')}
    ANTHROPIC_API_KEY        Anthropic API key
    OPENAI_API_KEY           OpenAI API key
    MAKE_LEMONADE_PROVIDER   Override provider selection
    MAKE_LEMONADE_MODEL      Override model selection

  ${chalk.bold('Examples:')}
    make-lemonade
    echo "list my events" | make-lemonade
    echo "create event" | make-lemonade --json
`);
}

async function fetchUser(): Promise<{ _id: string; name: string; email: string; first_name: string }> {
  const result = await graphqlRequest<{ aiGetMe: { user: { _id: string; name: string; email: string; first_name: string } } }>(
    'query { aiGetMe { user { _id name email first_name } } }',
  );
  return result.aiGetMe.user;
}

async function createProvider(providerName: string, apiKey: string, model?: string): Promise<AIProvider> {
  const resolvedModel = model || process.env.MAKE_LEMONADE_MODEL;

  if (providerName === 'openai') {
    const { OpenAIProvider } = await import('./providers/openai.js');
    return new OpenAIProvider(apiKey, resolvedModel);
  }
  if (providerName === 'anthropic') {
    const { AnthropicProvider } = await import('./providers/anthropic.js');
    return new AnthropicProvider(apiKey, resolvedModel);
  }

  throw new Error(`Unknown provider "${providerName}". Supported: ${VALID_PROVIDERS.join(', ')}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Check Lemonade auth
  const auth = getAuthHeader();
  if (!auth) {
    console.error(chalk.red('  Not authenticated. Run "lemonade auth login" first.'));
    process.exit(2);
  }

  const isTTY = process.stdin.isTTY === true;

  // Apply --mode flag before initializing (so initAiMode reads the updated config)
  if (args.mode === 'credits' || args.mode === 'own_key') {
    const { setAiModeConfig } = await import('./aiMode.js');
    setAiModeConfig(args.mode);
  }

  // Initialize AI mode (locked for entire session)
  const aiMode = initAiMode();

  // If switching to credits via --mode and no space configured, prompt for one
  if (args.mode === 'credits' && !getCreditsSpaceId() && isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const spaceId = await selectCreditsSpace(rl);
    rl.close();
    if (!spaceId) {
      console.error(chalk.red('  No space selected. Cannot use credits mode.'));
      process.exit(2);
    }
  }

  let apiKey: string | null = null;
  let provider: AIProvider;

  if (aiMode === 'own_key') {
    const providerName = args.provider || detectProvider();

    if (!VALID_PROVIDERS.includes(providerName)) {
      console.error(chalk.red(`  Unknown provider "${providerName}". Supported: ${VALID_PROVIDERS.join(', ')}`));
      process.exit(2);
    }

    apiKey = detectApiKey(providerName);

    if (!apiKey && isTTY) {
      let hasCredits = false;
      try {
        const spacesResult = await graphqlRequest<{ aiListMySpaces: { items: Array<{ _id: string }> } }>(
          'query { aiListMySpaces { items { _id } } }',
        );
        const spaces = spacesResult.aiListMySpaces.items;
        if (spaces.length > 0) {
          const spaceId = getDefaultSpace() || spaces[0]._id;
          const creditsResult = await graphqlRequest<{ getStandCredits: { credits: number; subscription_tier: string } | null }>(
            `query($stand_id: String!) {
              getStandCredits(stand_id: $stand_id) { credits subscription_tier }
            }`,
            { stand_id: spaceId },
          );
          const info = creditsResult.getStandCredits;
          if (info && (info.credits > 0 || info.subscription_tier !== 'free')) {
            hasCredits = true;
          }
        }
      } catch {
        // Non-fatal: fall through to own-key-only onboarding
      }

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      apiKey = await onboardApiKey(rl, providerName, hasCredits);
      rl.close();
      if (!apiKey) {
        process.exit(2);
      }
    } else if (!apiKey) {
      console.error('No AI API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
      process.exit(2);
    }

    provider = await createProvider(providerName, apiKey!, args.model);
  } else {
    // Mode 2: Lemonade AI Credits
    const { LemonadeAIProvider } = await import('./providers/lemonade-ai.js');
    const creditsSpace = getCreditsSpaceId();
    const defaultSpace = creditsSpace || getDefaultSpace();

    if (!defaultSpace) {
      console.error(chalk.red('  No credits space configured. Run /mode credits to select a space, or "lemonade space switch".'));
      process.exit(2);
    }

    try {
      const balanceResult = await graphqlRequest<{ getStandCredits: { credits: number; subscription_tier: string; subscription_renewal_date?: string } | null }>(
        `query($stand_id: String!) {
          getStandCredits(stand_id: $stand_id) {
            credits subscription_tier subscription_renewal_date
          }
        }`,
        { stand_id: defaultSpace },
      );

      const credits = balanceResult.getStandCredits;

      if (!credits || (credits.credits <= 0 && credits.subscription_tier === 'free')) {
        console.error(chalk.red('  Your community is on the free plan with no AI credits.'));
        console.error(chalk.dim('  Upgrade your plan or use your own API key (run with ai_mode: own_key).'));
        process.exit(2);
      }

      if (credits.credits <= 0) {
        console.log(chalk.yellow(`  Your community has 0 credits remaining. Credits renew on ${credits.subscription_renewal_date || 'next billing cycle'}.`));
        console.log(chalk.dim('  You can buy more credits with "credits buy" or switch to your own API key.'));
      }
    } catch {
      // Non-fatal: continue even if balance check fails
    }

    let modelName = 'Lemonade AI';
    try {
      const modelsResult = await graphqlRequest<{ getAvailableModels: Array<{ name: string; is_default: boolean }> }>(
        `query($spaceId: String) {
          getAvailableModels(spaceId: $spaceId) { name is_default }
        }`,
        { spaceId: defaultSpace },
      );
      const defaultModel = modelsResult.getAvailableModels.find((m) => m.is_default);
      if (defaultModel) modelName = defaultModel.name;
    } catch {
      // Non-fatal
    }

    provider = new LemonadeAIProvider(modelName, defaultSpace);
  }

  let user: { _id: string; name: string; email: string; first_name: string };
  try {
    user = await fetchUser();
  } catch (err) {
    console.error(chalk.red(`  Failed to fetch user profile: ${safeErrorMessage(err)}`));
    process.exit(2);
    return;
  }

  const registry = buildToolRegistry();
  const toolDefs = Object.values(registry);
  const session = createSessionState(user, getDefaultSpace());
  const formattedTools = provider.formatTools(toolDefs);

  let creditsSpaceName: string | undefined;
  const creditsSpaceId = getCreditsSpaceId();
  if (creditsSpaceId && aiMode === 'credits') {
    try {
      const { fetchMySpaces } = await import('./spaceSelection.js');
      const spaces = await fetchMySpaces();
      const match = spaces.find((s) => s._id === creditsSpaceId);
      if (match) creditsSpaceName = match.title;
    } catch {
      // Non-fatal
    }
  }

  if (isTTY) {
    const displayOpts = {
      spaceName: creditsSpaceName || session.defaultSpace || undefined,
      providerName: provider.name,
      modelName: provider.model,
    };

    process.on('SIGINT', () => {
      process.stdout.write('\x1b[?25h');   // show cursor
      process.stdout.write('\x1b[?1049l'); // leave alternate screen
      console.log('\n  See you!\n');
      process.exit(0);
    });

    await runTerminalUI(provider, formattedTools, session, registry, displayOpts, {
      firstName: user.first_name || user.name,
      agentName: getAgentName(),
    });
  } else {
    const systemPrompt = buildSystemMessages(session, provider.name);
    await batchMode(provider, formattedTools, systemPrompt, session, registry, args.json);
  }
}

main().catch((err) => {
  console.error(chalk.red(`Fatal: ${safeErrorMessage(err)}`));
  process.exit(1);
});
