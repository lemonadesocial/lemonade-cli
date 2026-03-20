import Table from 'cli-table3';
import chalk from 'chalk';

export function renderTable(
  headers: string[],
  rows: string[][],
  options?: { title?: string; truncate?: number },
): string {
  const table = new Table({
    head: headers.map((h) => chalk.bold(h)),
    style: { head: [], border: [] },
    wordWrap: true,
  });

  const maxWidth = options?.truncate || 50;

  for (const row of rows) {
    table.push(row.map((cell) => (cell.length > maxWidth ? cell.slice(0, maxWidth - 3) + '...' : cell)));
  }

  let output = '';
  if (options?.title) {
    output += chalk.bold(options.title) + '\n';
  }
  output += table.toString();
  return output;
}

export function renderKeyValue(pairs: Array<[string, string]>): string {
  const maxKeyLen = Math.max(...pairs.map(([k]) => k.length));
  return pairs.map(([k, v]) => `${chalk.bold(k.padEnd(maxKeyLen))}  ${v}`).join('\n');
}
