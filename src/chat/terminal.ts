// Terminal UI for make-lemonade.
//
// Uses Ink (React for CLI) in fullscreen mode with an alternate screen buffer.
// Layout: scrollable message area (top), bordered input field (bottom), status toolbar.
// ChatEngine events are wired to React state via the useChatEngine hook.

import React from 'react';
import { render } from 'ink';
import { ChatEngine } from './engine/ChatEngine.js';
import { AIProvider, Message, ToolDef } from './providers/interface.js';
import { SessionState } from './session/state.js';
import { initDiagnostics } from './diagnostics/index.js';

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
  bannerOpts: {
    firstName: string;
    agentName: string;
  },
): Promise<void> {
  initDiagnostics(process.env['LEMONADE_DEBUG']);

  const engine = new ChatEngine();
  const messages: Message[] = [];

  // Enter alternate screen buffer for fullscreen mode
  process.stdout.write('\x1b[?1049h');
  // Hide cursor (Ink manages its own cursor)
  process.stdout.write('\x1b[?25l');
  // Enable Kitty keyboard protocol for modifier detection (Shift+Enter, etc.)
  process.stdout.write('\x1b[>1u');

  // Process exit cleanup for crash safety — ensures terminal is restored
  const terminalCleanup = () => {
    process.stdout.write('\x1b[<u');        // Disable CSI u
    process.stdout.write('\x1b[?2004l');    // Disable bracketed paste
    process.stdout.write('\x1b[?25h');      // Show cursor
    process.stdout.write('\x1b[?1049l');    // Leave alt screen
  };
  process.on('exit', terminalCleanup);
  process.on('SIGTERM', () => { terminalCleanup(); process.exit(143); });

  const { App } = await import('./ui/App.js');

  const instance = render(
    React.createElement(App, {
      engine,
      provider,
      formattedTools,
      session,
      registry,
      messages,
      firstName: bannerOpts.firstName,
      agentName: bannerOpts.agentName,
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
    // Disable Kitty keyboard protocol
    process.stdout.write('\x1b[<u');
    // Restore main screen buffer
    process.stdout.write('\x1b[?25h'); // Show cursor
    process.stdout.write('\x1b[?1049l'); // Leave alternate screen
    console.log('\n  See you!\n');
  }
}
