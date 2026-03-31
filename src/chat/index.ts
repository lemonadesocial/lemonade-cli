#!/usr/bin/env node

import chalk from 'chalk';
import readline from 'readline';
import { graphqlRequest } from '../api/graphql.js';
import { getAuthHeader, getDefaultSpace } from '../auth/store.js';
import { AIProvider, Message, ToolDef } from './providers/interface.js';
import { buildToolRegistry } from './tools/registry.js';
import { createSessionState, SessionState } from './session/state.js';
import { buildSystemMessages } from './session/cache.js';
import { handleTurn } from './stream/handler.js';
import { batchMode } from './batch.js';
import { detectApiKey, detectProvider, onboardApiKey } from './onboarding.js';
import { ChatEngine } from './engine/ChatEngine.js';
import { parseArgs } from './parseArgs.js';
import { VERSION } from './version.js';
import { initAiMode, getAiModeDisplay } from './aiMode.js';
import { parseSlashCommand } from './ui/SlashCommands.js';
import { getAgentName } from './skills/loader.js';
import { selectCreditsSpace, getCreditsSpaceId } from './spaceSelection.js';

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
    --simple            Use legacy readline mode (no Ink UI)
    --json              Output as JSON (batch mode)
    -h, --help          Show this help

  ${chalk.bold('Environment:')}
    ANTHROPIC_API_KEY        Anthropic API key
    OPENAI_API_KEY           OpenAI API key
    MAKE_LEMONADE_PROVIDER   Override provider selection
    MAKE_LEMONADE_MODEL      Override model selection

  ${chalk.bold('Examples:')}
    make-lemonade
    make-lemonade --simple
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

function printWelcome(firstName: string): void {
  const modeDisplay = getAiModeDisplay();
  const agentName = getAgentName();
  console.log(`
  ${chalk.bold('make-lemonade')} v${VERSION}  ${chalk.dim(`[${modeDisplay}]`)}

  Hey ${firstName}! I'm ${agentName}, your event concierge. What would you like to do?

  Try: ${chalk.dim('"create a techno event in Berlin next Saturday"')}
       ${chalk.dim('"how are ticket sales for my warehouse party?"')}
       ${chalk.dim('"find events near me this weekend"')}

  Type ${chalk.dim('"help"')} for tips, ${chalk.dim('"exit"')} to quit.
`);
  console.log(chalk.dim('  Note: Tool results (including event and guest data) are sent to your AI provider.\n'));
}

async function interactiveMode(
  provider: AIProvider,
  formattedTools: unknown[],
  session: SessionState,
  registry: Record<string, ToolDef>,
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('> '),
  });

  const engine = new ChatEngine();
  const messages: Message[] = [];

  // Simple-mode adapter: bridge engine events to display.ts + readline
  const { writeStreamToken, writeNewline, printWarning } = await import('./stream/display.js');
  const ora = (await import('ora')).default;
  let textStarted = false;
  let toolSpinner: ReturnType<typeof ora> | null = null;

  engine.on('text_delta', (data) => {
    if (!textStarted) {
      process.stdout.write('\n  ');
      textStarted = true;
    }
    writeStreamToken(data.text, true);
  });

  engine.on('tool_start', (data) => {
    toolSpinner = ora(`Running: ${data.name}...`).start();
  });

  engine.on('tool_done', (data) => {
    if (toolSpinner) {
      if (data.error) {
        toolSpinner.fail(`Failed: ${data.name}`);
      } else {
        toolSpinner.succeed(`Done: ${data.name}`);
      }
      toolSpinner = null;
    }
  });

  engine.on('warning', (data) => {
    printWarning(data.message);
  });

  engine.on('error', (data) => {
    if (textStarted) writeNewline();
    printWarning(data.message);
  });

  engine.on('confirm_request', (data) => {
    rl.question(chalk.yellow(`\n  Confirm: ${data.description}? (yes/no) `), (answer) => {
      engine.confirmAction(data.id, ['yes', 'y'].includes(answer.trim().toLowerCase()));
    });
  });

  engine.on('turn_done', () => {
    if (textStarted) {
      writeNewline();
      textStarted = false;
    }
  });

  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      continue;
    }

    if (['exit', 'quit', 'bye'].includes(input.toLowerCase())) {
      console.log('\n  See you!\n');
      rl.close();
      return;
    }

    // Handle slash commands
    const slashResult = parseSlashCommand(input);
    if (slashResult.handled) {
      if (slashResult.action === 'mode') {
        const currentMode = getAiModeDisplay();
        if (slashResult.args === 'credits') {
          const spaceId = await selectCreditsSpace(rl);
          if (spaceId) {
            const { setAiModeConfig } = await import('./aiMode.js');
            setAiModeConfig('credits');
            console.log(chalk.dim('  Restart the session to use credits mode.\n'));
          }
        } else if (slashResult.args === 'own_key') {
          const { setAiModeConfig } = await import('./aiMode.js');
          setAiModeConfig('own_key');
          console.log(chalk.dim('  Restart the session to use own API key mode.\n'));
        } else {
          console.log(`\n  Current AI mode: ${chalk.bold(currentMode)}`);
          const creditsSpace = getCreditsSpaceId();
          if (creditsSpace) {
            console.log(chalk.dim(`  Credits space: ${creditsSpace}`));
          }
          console.log(chalk.dim('  Usage: /mode credits  or  /mode own_key'));
          console.log(chalk.dim('  Mode changes take effect after restarting the session.\n'));
        }
      } else if (slashResult.action === 'name') {
        if (slashResult.args) {
          const { setAgentName } = await import('./skills/loader.js');
          setAgentName(slashResult.args.trim());
          console.log(chalk.dim(`\n  Agent renamed to "${slashResult.args.trim()}".\n`));
        } else {
          const agentName = getAgentName();
          console.log(`\n  Agent name: ${chalk.bold(agentName)}\n`);
        }
      } else if (slashResult.output) {
        console.log(`\n  ${slashResult.output}\n`);
      } else if (slashResult.action === 'clear') {
        messages.length = 0;
        console.log(chalk.dim('\n  Conversation cleared.\n'));
      } else if (slashResult.action === 'exit') {
        console.log('\n  See you!\n');
        rl.close();
        return;
      }
      rl.prompt();
      continue;
    }

    if (input.toLowerCase() === 'help') {
      console.log(`
  ${chalk.bold('Tips:')}
  - Ask in natural language: "create an event called Demo Night tomorrow at 7pm"
  - Chain actions: "create an event, add a free ticket, and publish it"
  - Reference context: "add tickets to it" (refers to the last event)
  - Destructive actions (cancel, delete) will ask for confirmation
  - Type "exit" or press Ctrl+D to quit
`);
      rl.prompt();
      continue;
    }

    textStarted = false;
    messages.push({ role: 'user', content: input });

    const systemPrompt = buildSystemMessages(session, provider.name);

    try {
      await handleTurn(
        provider,
        messages,
        formattedTools,
        systemPrompt,
        session,
        registry,
        rl,
        true,
        engine,
      );
    } catch (err) {
      const msg = safeErrorMessage(err);
      if (msg.includes('context length') || msg.includes('too many tokens')) {
        console.log(chalk.red('\n  Session is too long. Start a new session: exit and run make-lemonade again.\n'));
      } else {
        console.error(chalk.red(`\n  Error: ${msg}\n`));
      }
    }

    console.log('');
    rl.prompt();
  }

  // Ctrl+D (EOF)
  console.log('\n  See you!\n');
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
    // Mode 1: Own API Key -- SDK providers only, no lemonade-ai contact
    const providerName = args.provider || detectProvider();

    if (!VALID_PROVIDERS.includes(providerName)) {
      console.error(chalk.red(`  Unknown provider "${providerName}". Supported: ${VALID_PROVIDERS.join(', ')}`));
      process.exit(2);
    }

    apiKey = detectApiKey(providerName);

    if (!apiKey && isTTY) {
      // Check if user has community credits available for the dual-mode choice
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
    // Mode 2: Lemonade AI Credits -- no SDK imports, only lemonade-ai endpoint
    const { LemonadeAIProvider } = await import('./providers/lemonade-ai.js');
    const creditsSpace = getCreditsSpaceId();
    const defaultSpace = creditsSpace || getDefaultSpace();

    if (!defaultSpace) {
      console.error(chalk.red('  No credits space configured. Run /mode credits to select a space, or "lemonade space switch".'));
      process.exit(2);
    }

    // Check credit balance before starting
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

    // Fetch available model info for display
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

  // Fetch user profile
  let user: { _id: string; name: string; email: string; first_name: string };
  try {
    user = await fetchUser();
  } catch (err) {
    console.error(chalk.red(`  Failed to fetch user profile: ${safeErrorMessage(err)}`));
    process.exit(2);
    return;
  }

  // Build tools and session
  const registry = buildToolRegistry();
  const toolDefs = Object.values(registry);
  const session = createSessionState(user, getDefaultSpace());
  const formattedTools = provider.formatTools(toolDefs);

  // Resolve credits space name for display
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

  if (isTTY && !args.simple) {
    // Ink UI mode (default for TTY)
    const { renderApp } = await import('./ui/App.js');
    await renderApp({ provider, session, registry, formattedTools, user, creditsSpaceName });
  } else if (isTTY) {
    // --simple: legacy readline mode
    printWelcome(user.first_name || user.name);

    process.on('SIGINT', () => {
      console.log('\n  See you!\n');
      process.exit(0);
    });

    await interactiveMode(provider, formattedTools, session, registry);
  } else {
    const systemPrompt = buildSystemMessages(session, provider.name);
    await batchMode(provider, formattedTools, systemPrompt, session, registry, args.json);
  }
}

main().catch((err) => {
  console.error(chalk.red(`Fatal: ${safeErrorMessage(err)}`));
  process.exit(1);
});
