import chalk from 'chalk';
import { renderMarkdown } from './MarkdownText.js';

// Formats a user message for stdout output.
// Gray background on the entire block, bold bright "You" prefix.
export function formatUserMessage(text: string): string {
  const prefix = chalk.bold.hex('#60A5FA')(' You ');
  const bg = chalk.bgHex('#2A2A2A');
  const lines = text.split('\n');
  const formatted = lines.map((line) => bg(' ' + line + ' ')).join('\n');
  return '\n' + bg(prefix) + '\n' + formatted + '\n';
}

// Formats an assistant message for stdout output.
// No background, just rendered markdown text.
export function formatAssistantMessage(text: string): string {
  const rendered = renderMarkdown(text);
  return '\n' + rendered + '\n';
}
