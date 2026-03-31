export interface SlashCommandResult {
  handled: boolean;
  output?: string;
  action?: 'help' | 'clear' | 'model' | 'provider' | 'space' | 'exit';
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
] as const;

const HELP_TABLE = `
Commands:
  /help              Show commands and shortcuts
  /clear             Reset conversation
  /model             List available models
  /model <name>      Switch to a model
  /provider <name>   Switch AI provider
  /space             Show current space
  /exit, /quit       Exit the app

Keyboard shortcuts:
  Escape             Cancel streaming response
  Ctrl+C             Cancel / exit on empty input
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

    case '/exit':
    case '/quit':
      return { handled: true, action: 'exit' };

    default:
      return { handled: true, output: `Unknown command: ${cmd}. Type /help for available commands.` };
  }
}
