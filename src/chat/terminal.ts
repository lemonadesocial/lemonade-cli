// Terminal UI for make-lemonade.
//
// Claude Code uses Ink (React for CLI) with ink-box, ink-link, ink-text, etc.
// We take a simpler approach: pure readline + chalk + raw stdout writes.
// No React, no virtual DOM, no Ink. Just a readline prompt with ANSI escape
// sequences for spinners and streaming output.
//
// Architecture:
//   - readline.createInterface for input (handles arrow keys, history, cursor)
//   - process.stdout.write for all output (streaming tokens, spinners, etc.)
//   - Spinners use \r\x1b[K to overwrite the current line in-place
//   - Streaming tokens are written character by character via text_delta events
//   - Escape key cancels streaming (detected via keypress events on stdin)

import readline from 'readline';
import chalk from 'chalk';
import { VERSION } from './version.js';
import { LEMON, SUGGESTED_PROMPTS } from './ui/WelcomeBanner.js';
import { THINKING_WORDS } from './ui/ThinkingIndicator.js';
import { truncateResult } from './ui/ToolCall.js';
import { parseSlashCommand } from './ui/SlashCommands.js';
import { getAgentName } from './skills/loader.js';
import { ChatEngine } from './engine/ChatEngine.js';
import { AIProvider, Message, ToolDef } from './providers/interface.js';
import { SessionState } from './session/state.js';
import { buildSystemMessages } from './session/cache.js';
import { handleTurn } from './stream/handler.js';
import { getAiModeDisplay } from './aiMode.js';
import { selectCreditsSpace, getCreditsSpaceId } from './spaceSelection.js';

const SPINNER_FRAMES = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'];

const TIPS = [
  'say "switch to my Berlin space"',
  '/help shows all commands',
  'chain actions: "create event, add ticket, publish"',
  'press Escape to cancel a response',
  'type "exit" or Ctrl+D to quit',
  '"how are ticket sales?" works naturally',
  '/clear starts a fresh session',
  '/mode credits to use community credits',
];

function randomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

function randomThinkingWord(): string {
  return THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)];
}

export interface SpinnerHandle {
  stop: () => void;
}

export function printWelcomeBanner(opts: {
  firstName: string;
  agentName: string;
  providerName: string;
  modelName: string;
}): number {
  const lemonColor = chalk.hex('#FDE047');
  const lines: string[] = [''];

  for (const line of LEMON) {
    lines.push(' ' + lemonColor(line));
  }
  lines.push(` ${chalk.bold('make-lemonade')}${chalk.dim(` v${VERSION} | ${opts.providerName} | ${opts.modelName}`)}`);
  lines.push('');
  lines.push(` Hey ${opts.firstName}! I'm ${opts.agentName}, your event concierge. What would you like to do?`);
  lines.push('');
  for (let i = 0; i < SUGGESTED_PROMPTS.length; i++) {
    lines.push(chalk.dim(`   ${i + 1}. "${SUGGESTED_PROMPTS[i]}"`));
  }
  lines.push('');
  lines.push(chalk.dim('   Type /help for commands, Ctrl+D to quit'));
  lines.push('');
  lines.push(chalk.dim('   Note: Tool results (including event and guest data) are sent to your AI provider.'));
  lines.push('');

  process.stdout.write(lines.join('\n') + '\n');
  return lines.length;
}

export function printUserMessage(text: string): void {
  const lines = text.split('\n');
  const formatted = lines.map((line) => chalk.dim('  > ' + line)).join('\n');
  process.stdout.write('\n' + formatted + '\n');
}

export function printStatusLine(opts: {
  spaceName?: string;
  providerName: string;
  modelName: string;
  tokenCount?: number;
}): void {
  const spaceLabel = opts.spaceName || 'none';
  const parts = [`Space: ${spaceLabel}`, opts.modelName];
  if (opts.tokenCount) parts.push(`${opts.tokenCount} tokens`);
  parts.push(`Tip: ${randomTip()}`);
  process.stdout.write(chalk.dim(`  ${parts.join(' | ')}`) + '\n');
}

export function printInputBorder(): void {
  const width = process.stdout.columns || 80;
  process.stdout.write(chalk.dim('\u2500'.repeat(width)) + '\n');
}

export function printErrorMessage(message: string): void {
  process.stderr.write(chalk.hex('#FF637E')(message) + '\n');
  if (message.includes('auth') || message.includes('401') || message.includes('Unauthorized')) {
    process.stderr.write(chalk.dim('  Run lemonade auth login') + '\n');
  }
  if (message.includes('context length') || message.includes('too many tokens')) {
    process.stderr.write(chalk.dim('  Use /clear to start fresh') + '\n');
  }
}

export function startThinkingSpinner(): SpinnerHandle {
  let word = randomThinkingWord();
  let frameIndex = 0;
  const wordInterval = setInterval(() => {
    word = randomThinkingWord();
  }, 2500);
  const renderInterval = setInterval(() => {
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    const frame = chalk.hex('#C4B5FD')(SPINNER_FRAMES[frameIndex]);
    const label = chalk.hex('#C4B5FD')(`${word}...`);
    process.stdout.write(`\r\x1b[K  ${frame} ${label}`);
  }, 80);

  return {
    stop() {
      clearInterval(wordInterval);
      clearInterval(renderInterval);
      process.stdout.write('\r\x1b[K');
    },
  };
}

export function startToolSpinner(toolName: string): SpinnerHandle {
  let frameIndex = 0;
  const renderInterval = setInterval(() => {
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    const frame = chalk.hex('#C4B5FD')(SPINNER_FRAMES[frameIndex]);
    process.stdout.write(`\r\x1b[K  ${frame} Running: ${toolName}...`);
  }, 80);

  return {
    stop() {
      clearInterval(renderInterval);
      process.stdout.write('\r\x1b[K');
    },
  };
}

export function printToolResult(name: string, error?: string, result?: unknown): void {
  if (error) {
    process.stdout.write(`  ${chalk.hex('#FF637E')('\u2718')} Failed: ${name}\n`);
    const truncated = truncateResult(String(error));
    process.stdout.write(chalk.dim(`    ${truncated}`) + '\n');
  } else {
    process.stdout.write(`  ${chalk.hex('#10B981')('\u2714')} Done: ${name}\n`);
    if (result !== undefined && result !== null) {
      const text = typeof result === 'string' ? result : JSON.stringify(result);
      const truncated = truncateResult(text);
      if (truncated.length > 0 && truncated.length < 200) {
        process.stdout.write(chalk.dim(`    ${truncated}`) + '\n');
      }
    }
  }
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export async function runTerminalUI(
  provider: AIProvider,
  formattedTools: unknown[],
  session: SessionState,
  registry: Record<string, ToolDef>,
  displayOpts: {
    spaceName?: string;
    providerName: string;
    modelName: string;
  },
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.hex('#FDE047')('> '),
  });

  const engine = new ChatEngine();
  const messages: Message[] = [];

  let textStarted = false;
  let thinkingSpinner: SpinnerHandle | null = null;
  let toolSpinner: SpinnerHandle | null = null;
  let turnTokenCount = 0;
  let streamAbort: AbortController | null = null;

  // Enable keypress events for Escape detection during streaming
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.on('keypress', (_ch: string, key: { name?: string; ctrl?: boolean }) => {
    if (key?.name === 'escape' && streamAbort) {
      streamAbort.abort();
      streamAbort = null;
      if (thinkingSpinner) {
        thinkingSpinner.stop();
        thinkingSpinner = null;
      }
      if (toolSpinner) {
        toolSpinner.stop();
        toolSpinner = null;
      }
      process.stdout.write('\r\x1b[K');
      if (textStarted) {
        process.stdout.write('\n');
        textStarted = false;
      }
      console.log(chalk.dim('  (cancelled)'));
      printInputBorder();
      rl.prompt();
    }
  });

  // Stream text tokens directly to stdout
  engine.on('text_delta', (data) => {
    if (thinkingSpinner) {
      thinkingSpinner.stop();
      thinkingSpinner = null;
    }
    if (!textStarted) {
      process.stdout.write('\n  ');
      textStarted = true;
    }
    process.stdout.write(chalk.white(data.text));
  });

  engine.on('tool_start', (data) => {
    if (thinkingSpinner) {
      thinkingSpinner.stop();
      thinkingSpinner = null;
    }
    toolSpinner = startToolSpinner(data.name);
  });

  engine.on('tool_done', (data) => {
    if (toolSpinner) {
      toolSpinner.stop();
      toolSpinner = null;
    }
    printToolResult(data.name, data.error, data.result);
  });

  engine.on('warning', (data) => {
    console.log(chalk.yellow(`\n  ${data.message}`));
    printInputBorder();
    rl.prompt();
  });

  engine.on('error', (data) => {
    if (thinkingSpinner) {
      thinkingSpinner.stop();
      thinkingSpinner = null;
    }
    if (toolSpinner) {
      toolSpinner.stop();
      toolSpinner = null;
    }
    process.stdout.write('\r\x1b[K');
    if (textStarted) process.stdout.write('\n');
    printErrorMessage(`  Error: ${data.message}`);
    printInputBorder();
    rl.prompt();
  });

  engine.on('confirm_request', (data) => {
    if (toolSpinner) {
      toolSpinner.stop();
      toolSpinner = null;
    }
    rl.question(chalk.hex('#FDE047')(`\n  Confirm: ${data.description}? (yes/no) `), (answer) => {
      engine.confirmAction(data.id, ['yes', 'y'].includes(answer.trim().toLowerCase()));
    });
  });

  engine.on('turn_done', (data) => {
    if (thinkingSpinner) {
      thinkingSpinner.stop();
      thinkingSpinner = null;
    }
    if (textStarted) {
      process.stdout.write('\n\n');
      textStarted = false;
    }
    turnTokenCount = data.usage.input_tokens + data.usage.output_tokens;
    printStatusLine({
      ...displayOpts,
      tokenCount: turnTokenCount,
    });
    printInputBorder();
    rl.prompt();
  });

  printStatusLine(displayOpts);
  printInputBorder();
  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();

    if (!input) {
      printInputBorder();
      rl.prompt();
      continue;
    }

    if (['exit', 'quit', 'bye'].includes(input.toLowerCase())) {
      console.log('\n  See you!\n');
      rl.close();
      return;
    }

    // Slash commands
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
        console.clear();
        printWelcomeBanner({
          firstName: session.user.first_name || session.user.name,
          agentName: getAgentName(),
          ...displayOpts,
        });
        printStatusLine(displayOpts);
      } else if (slashResult.action === 'exit') {
        console.log('\n  See you!\n');
        rl.close();
        return;
      }
      printInputBorder();
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
      printInputBorder();
      rl.prompt();
      continue;
    }

    printUserMessage(input);
    textStarted = false;
    thinkingSpinner = startThinkingSpinner();
    messages.push({ role: 'user', content: input });

    const systemPrompt = buildSystemMessages(session, provider.name);

    streamAbort = new AbortController();
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
        streamAbort.signal,
      );
    } catch (err) {
      if (thinkingSpinner) {
        thinkingSpinner.stop();
        thinkingSpinner = null;
      }
      const msg = safeErrorMessage(err);
      if (msg.includes('context length') || msg.includes('too many tokens')) {
        printErrorMessage('\n  Session is too long. Start a new session: exit and run make-lemonade again.');
      } else {
        printErrorMessage(`\n  Error: ${msg}`);
      }
      printInputBorder();
      rl.prompt();
    }
    streamAbort = null;

    console.log('');
  }

  // Ctrl+D (EOF)
  console.log('\n  See you!\n');
}
