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
import { ChatEngine } from './engine/ChatEngine.js';
import { AIProvider, Message, ToolDef } from './providers/interface.js';
import { SessionState } from './session/state.js';

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
