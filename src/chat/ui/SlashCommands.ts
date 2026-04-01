export interface SlashCommandResult {
  handled: boolean;
  output?: string;
  action?: 'help' | 'clear' | 'model' | 'provider' | 'space' | 'exit' | 'mode' | 'name' | 'plan' | 'btw' | 'version' | 'status' | 'events' | 'spaces' | 'credits' | 'history';
  args?: string;
}

export const SLASH_COMMANDS = [
  { name: '/help', description: 'Show commands and shortcuts' },
  { name: '/clear', description: 'Reset conversation' },
  { name: '/model', description: 'List or switch models' },
  { name: '/provider', description: 'Switch AI provider' },
  { name: '/space', description: 'Show current space' },
  { name: '/exit', description: 'Exit the app' },
  { name: '/quit', description: 'Exit the app' },
  { name: '/mode', description: 'Show or switch AI mode (credits / own_key)' },
  { name: '/name', description: 'Set agent name' },
  { name: '/plan', description: 'Start guided mode for a tool' },
  { name: '/btw', description: 'Ask a side question (runs in parallel)' },
  { name: '/version', description: 'Check CLI version and update' },
  { name: '/status', description: 'Show session status' },
  { name: '/events', description: 'List your events' },
  { name: '/spaces', description: 'List or switch spaces' },
  { name: '/credits', description: 'Check credits balance' },
  { name: '/history', description: 'Show recent conversation' },
] as const;

const HELP_TABLE = `
Commands:
  /help              Show commands and shortcuts
  /clear             Reset conversation
  /model             List available models
  /model <name>      Switch to a model
  /provider <name>   Switch AI provider
  /space             Show current space
  /mode              Show current AI mode (credits / own_key)
  /mode <mode>       Switch AI mode (restarts session)
  /name              Show agent name
  /name <name>       Rename the agent
  /plan <tool>       Start guided mode for a tool
  /btw <message>     Ask a side question (runs in parallel)
  /version           Check CLI version and update if available
  /status            Show session status (model, space, event, mode)
  /events            List your events
  /spaces            List your spaces
  /spaces <n>        Switch to space by number
  /spaces <name>     Switch to space by name
  /credits           Check credits balance
  /history [n]       Show last n conversation turns (default 10)
  /exit, /quit       Exit the app

Keyboard shortcuts:
  Shift+Enter        Insert newline (multiline input)
  Escape             Cancel streaming response
  Ctrl+C             Cancel / exit on empty input
  Ctrl+L             Clear screen
  Ctrl+U             Clear input line
  Tab (empty input)  Cycle to next model
`.trim();

export const ANTHROPIC_MODELS = [
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-6',
];

export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'o1-preview',
  'o1-mini',
];

export function getModelsForProvider(providerName: string): string[] {
  switch (providerName) {
    case 'anthropic':
      return ANTHROPIC_MODELS;
    case 'openai':
      return OPENAI_MODELS;
    default:
      return [];
  }
}

export function parseSlashCommand(input: string): SlashCommandResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return { handled: false };

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1).join(' ').trim();

  switch (cmd) {
    case '/help':
      return { handled: true, output: HELP_TABLE, action: 'help' };

    case '/clear':
      return { handled: true, action: 'clear' };

    case '/model':
      return { handled: true, action: 'model', args: rest || undefined };

    case '/provider':
      return { handled: true, action: 'provider', args: rest || undefined };

    case '/space':
      return { handled: true, action: 'space' };

    case '/mode':
      return { handled: true, action: 'mode', args: rest || undefined };

    case '/name':
      return { handled: true, action: 'name', args: rest || undefined };

    case '/plan':
      return { handled: true, action: 'plan', args: rest || undefined };

    case '/btw':
      return { handled: true, action: 'btw', args: rest || undefined };

    case '/version':
      return { handled: true, action: 'version' };

    case '/status':
      return { handled: true, action: 'status' };
    case '/events':
      return { handled: true, action: 'events', args: rest || undefined };
    case '/spaces':
      return { handled: true, action: 'spaces', args: rest || undefined };
    case '/credits':
      return { handled: true, action: 'credits' };
    case '/history':
      return { handled: true, action: 'history', args: rest || undefined };

    case '/exit':
    case '/quit':
      return { handled: true, action: 'exit' };

    default:
      return { handled: true, output: `Unknown command: ${cmd}. Type /help for available commands.` };
  }
}
