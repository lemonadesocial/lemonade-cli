import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import chalk from 'chalk';

const marked = new Marked(
  markedTerminal({
    reflowText: true,
    width: process.stdout.columns ? Math.min(process.stdout.columns - 4, 120) : 80,
    tab: 2,
    showSectionPrefix: false,
    code: chalk.bgHex('#1C1B20').white,
    codespan: chalk.bgHex('#1C1B20').hex('#F472B6'),
    strong: chalk.bold,
    em: chalk.italic,
    heading: chalk.hex('#FDE047').bold,
    listitem: chalk.white,
    link: chalk.hex('#C4B5FD').underline,
    href: chalk.hex('#C4B5FD').underline,
  }),
);

export function renderMarkdown(text: string): string {
  try {
    const rendered = marked.parse(text) as string;
    return rendered.replace(/\n+$/, '');
  } catch {
    return text;
  }
}
