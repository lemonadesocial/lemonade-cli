#!/usr/bin/env node

import chalk from 'chalk';
import readline from 'readline';
import { graphqlRequest } from '../api/graphql';
import { getAuthHeader, getDefaultSpace } from '../auth/store';
import { AIProvider, Message, ToolDef } from './providers/interface';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { buildToolRegistry } from './tools/registry';
import { createSessionState, SessionState } from './session/state';
import { buildSystemMessages } from './session/cache';
import { handleTurn } from './stream/handler';
import { batchMode } from './batch';
import { detectApiKey, detectProvider, onboardApiKey } from './onboarding';

const VERSION = '0.1.0';
const VALID_PROVIDERS = ['anthropic', 'openai'];

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

function parseArgs(argv: string[]): {
  provider?: string;
  model?: string;
  json: boolean;
  help: boolean;
} {
  const result = { provider: undefined as string | undefined, model: undefined as string | undefined, json: false, help: false };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--provider':
        result.provider = argv[++i];
        break;
      case '--model':
        result.model = argv[++i];
        break;
      case '--json':
        result.json = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
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

function createProvider(providerName: string, apiKey: string, model?: string): AIProvider {
  const resolvedModel = model || process.env.MAKE_LEMONADE_MODEL;

  if (providerName === 'openai') {
    return new OpenAIProvider(apiKey, resolvedModel);
  }
  if (providerName === 'anthropic') {
    return new AnthropicProvider(apiKey, resolvedModel);
  }

  throw new Error(`Unknown provider "${providerName}". Supported: ${VALID_PROVIDERS.join(', ')}`);
}

function printWelcome(firstName: string): void {
  console.log(`
  ${chalk.bold('make-lemonade')} v${VERSION}

  Hey ${firstName}! What would you like to do?

  Try: ${chalk.dim('"create a techno event in Berlin next Saturday"')}
       ${chalk.dim('"how are ticket sales for my warehouse party?"')}
       ${chalk.dim('"find events near me this weekend"')}

  Type ${chalk.dim('"help"')} for tips, ${chalk.dim('"exit"')} to quit.
`);
  console.log(chalk.dim('  Note: Tool results are sent to your AI provider.\n'));
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

  const messages: Message[] = [];

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

  // Determine provider
  const providerName = args.provider || detectProvider();

  // Validate provider name
  if (!VALID_PROVIDERS.includes(providerName)) {
    console.error(chalk.red(`  Unknown provider "${providerName}". Supported: ${VALID_PROVIDERS.join(', ')}`));
    process.exit(2);
  }

  let apiKey = detectApiKey(providerName);

  // Onboarding if no API key
  if (!apiKey && isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    apiKey = await onboardApiKey(rl, providerName);
    rl.close();
    if (!apiKey) {
      process.exit(2);
    }
  } else if (!apiKey) {
    console.error('No AI API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    process.exit(2);
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
  const provider = createProvider(providerName, apiKey, args.model);
  const formattedTools = provider.formatTools(toolDefs);

  if (isTTY) {
    printWelcome(user.first_name || user.name);

    // Handle Ctrl+C
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
