#!/usr/bin/env node

import chalk from 'chalk';
import readline from 'readline';
import { graphqlRequest } from '../api/graphql.js';
import { getAuthHeader, getDefaultSpace, setConfigValue } from '../auth/store.js';
import { AIProvider } from './providers/interface.js';
import { buildToolRegistry } from './tools/registry.js';
import { createSessionState } from './session/state.js';
import { buildSystemMessages } from './session/cache.js';
import { batchMode } from './batch.js';
import { detectApiKey, detectProvider, onboardApiKey } from './onboarding.js';
import { parseArgs } from './parseArgs.js';
import { initAiMode } from './aiMode.js';
import { getAgentName } from './skills/loader.js';
import { getCreditsSpaceId } from './spaceSelection.js';
import { VERSION } from './version.js';
import { runTerminalUI } from './terminal.js';
import { createCreditsProvider } from './creditsProvider.js';
import { createByokProvider, isValidProvider, VALID_PROVIDERS } from './providerFactory.js';
import { resolveCreditsStartupMode } from './startupRecovery.js';

export { parseArgs } from './parseArgs.js';
export { VERSION } from './version.js';

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
  let aiMode = initAiMode();
  let resolvedCreditsSpace: string | undefined;
  if (aiMode === 'credits') {
    const startupResolution = await resolveCreditsStartupMode(isTTY);
    if (startupResolution.message) {
      console.log(startupResolution.message);
    }
    if (startupResolution.failed) {
      process.exit(2);
    }
    aiMode = startupResolution.mode;
    resolvedCreditsSpace = startupResolution.spaceId;
  }

  let apiKey: string | null = null;
  let provider: AIProvider;

  if (aiMode === 'own_key') {
    const providerName = args.provider || detectProvider();

    if (!isValidProvider(providerName)) {
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

    provider = await createByokProvider(providerName, apiKey!, args.model);
  } else {
    // Use the space resolved by startup recovery; fall back to config only if needed.
    const creditsSpace = resolvedCreditsSpace || getCreditsSpaceId() || getDefaultSpace();

    if (!creditsSpace) {
      console.error(chalk.red('  No credits space configured. Run /mode credits to select a space, or "lemonade space switch".'));
      process.exit(2);
    }

    // Persist so downstream code (live-switch, /credits) can find it.
    if (!getCreditsSpaceId()) {
      setConfigValue('ai_credits_space', creditsSpace);
    }

    provider = await createCreditsProvider(creditsSpace);
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
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const session = createSessionState(user, getDefaultSpace(), timezone);
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
      process.stdout.write('\x1b[<u');     // Disable Kitty keyboard protocol
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
