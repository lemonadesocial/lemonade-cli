import chalk from 'chalk';
import { VERSION } from './version.js';
import { THINKING_WORDS } from './ui/ThinkingIndicator.js';
import { formatUserMessage } from './ui/writeMessage.js';

// Lemon braille art — imported inline from WelcomeBanner.tsx
const LEMON = [
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⢀⣀⣠⣤⣴⣶⡶⢿⣿⣿⣿⠿⠿⠿⠿⠟⠛⢋⣁⣤⡴⠂⣠⡆⠀',
  '⠀⠀⠀⠀⠈⠙⠻⢿⣿⣿⣿⣶⣤⣤⣤⣤⣤⣴⣶⣶⣿⣿⣿⡿⠋⣠⣾⣿⠁⠀',
  '⠀⠀⠀⠀⠀⢀⣴⣤⣄⡉⠛⠻⠿⠿⣿⣿⣿⣿⡿⠿⠟⠋⣁⣤⣾⣿⣿⣿⠀⠀',
  '⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣶⣶⣤⣤⣤⣤⣤⣤⣶⣾⣿⣿⣿⣿⣿⣿⣿⡇⠀',
  '⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀',
  '⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠁⠀',
  '⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⢸⡟⢸⡟⠀⠀',
  '⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣷⡿⢿⡿⠁⠀⠀',
  '⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⢁⣴⠟⢀⣾⠃⠀⠀⠀',
  '⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠛⣉⣿⠿⣿⣶⡟⠁⠀⠀⠀⠀',
  '⠀⠀⢿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠛⣿⣏⣸⡿⢿⣯⣠⣴⠿⠋⠀⠀⠀⠀⠀⠀',
  '⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⠿⠶⣾⣿⣉⣡⣤⣿⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⢸⣿⣿⣿⣿⡿⠿⠿⠿⠶⠾⠛⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠈⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
];

const SPINNER_FRAMES = ['\u280B', '\u2819', '\u2838', '\u2830', '\u2826', '\u2807'];

function randomThinkingWord(): string {
  return THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)];
}

export function printWelcomeBanner(opts: {
  firstName: string;
  agentName: string;
  providerName: string;
  modelName: string;
}): void {
  const lemonColor = chalk.hex('#FDE047');
  const lines: string[] = [''];

  for (const line of LEMON) {
    lines.push(' ' + lemonColor(line));
  }
  lines.push(` ${chalk.bold('make-lemonade')}${chalk.dim(` v${VERSION} | ${opts.providerName} | ${opts.modelName}`)}`);
  lines.push('');
  lines.push(` Hey ${opts.firstName}! I'm ${opts.agentName}, your event concierge. What would you like to do?`);
  lines.push('');
  lines.push(chalk.dim('   1. "help me plan a techno event in Berlin next Saturday"'));
  lines.push(chalk.dim('   2. "how are ticket sales for my warehouse party?"'));
  lines.push(chalk.dim('   3. "let\'s build a community space for my meetup group"'));
  lines.push('');
  lines.push(chalk.dim('   Type /help for commands, Ctrl+D to quit'));
  lines.push('');
  lines.push(chalk.dim('   Note: Tool results (including event and guest data) are sent to your AI provider.'));
  lines.push('');

  process.stdout.write(lines.join('\n') + '\n');
}

export function printUserMessage(text: string): void {
  process.stdout.write(formatUserMessage(text));
}

export function printStatusLine(opts: {
  spaceName?: string;
  providerName: string;
  modelName: string;
  tokenCount: number;
}): void {
  const spaceLabel = opts.spaceName || 'none';
  process.stdout.write(
    chalk.dim(`  Space: ${spaceLabel} | ${opts.providerName} | ${opts.modelName} | ${opts.tokenCount} tokens`) + '\n',
  );
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

export interface SpinnerHandle {
  stop: () => void;
}

export function startThinkingSpinner(): SpinnerHandle {
  let word = randomThinkingWord();
  let frameIndex = 0;
  const interval = setInterval(() => {
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
      clearInterval(interval);
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
    if (error) {
      const truncated = String(error).split('\n').slice(0, 3).join('\n');
      process.stdout.write(chalk.dim(`    ${truncated}`) + '\n');
    }
  } else {
    process.stdout.write(`  ${chalk.hex('#10B981')('\u2714')} Done: ${name}\n`);
    if (result !== undefined && result !== null) {
      const text = typeof result === 'string' ? result : JSON.stringify(result);
      const truncated = text.split('\n').slice(0, 3).join('\n');
      if (truncated.length > 0 && truncated.length < 200) {
        process.stdout.write(chalk.dim(`    ${truncated}`) + '\n');
      }
    }
  }
}
