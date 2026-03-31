import chalk from 'chalk';
import { renderMarkdown } from './MarkdownText.js';

// Formats a user message for stdout output.
// Plain dimmed text with > prefix, no background or label.
export function formatUserMessage(text: string): string {
  const lines = text.split('\n');
  const formatted = lines.map((line) => chalk.dim('  > ' + line)).join('\n');
  return '\n' + formatted + '\n';
}

// Formats an assistant message for stdout output.
// No background, just rendered markdown text.
export function formatAssistantMessage(text: string): string {
  const rendered = renderMarkdown(text);
  return '\n' + rendered + '\n';
}
