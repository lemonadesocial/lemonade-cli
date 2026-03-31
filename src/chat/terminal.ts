// Terminal UI for make-lemonade.
//
// Uses Ink (React for CLI) in fullscreen mode with an alternate screen buffer.
// Layout: scrollable message area (top), bordered input field (bottom), status toolbar.
// ChatEngine events are wired to React state via the useChatEngine hook.

import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { VERSION } from './version.js';
import { LEMON, SUGGESTED_PROMPTS } from './ui/WelcomeBanner.js';
import { THINKING_WORDS } from './ui/ThinkingIndicator.js';
import { truncateResult } from './ui/ToolCall.js';
import { ChatEngine } from './engine/ChatEngine.js';
import { AIProvider, Message, ToolDef } from './providers/interface.js';
import { SessionState } from './session/state.js';

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
  const engine = new ChatEngine();
  const messages: Message[] = [];

  // Enter alternate screen buffer for fullscreen mode
  process.stdout.write('\x1b[?1049h');
  // Hide cursor (Ink manages its own cursor)
  process.stdout.write('\x1b[?25l');

  const { App } = await import('./ui/App.js');

  const instance = render(
    React.createElement(App, {
      engine,
      provider,
      formattedTools,
      session,
      registry,
      messages,
      displayOpts,
    }),
    {
      exitOnCtrlC: false,
      patchConsole: true,
    },
  );

  try {
    await instance.waitUntilExit();
  } finally {
    // Restore main screen buffer
    process.stdout.write('\x1b[?25h'); // Show cursor
    process.stdout.write('\x1b[?1049l'); // Leave alternate screen
    console.log('\n  See you!\n');
  }
}
