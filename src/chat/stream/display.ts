import chalk from 'chalk';

const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

export function writeStreamToken(text: string, isTTY: boolean): void {
  if (isTTY) {
    process.stdout.write(chalk.white(text));
  } else {
    process.stdout.write(text);
  }
}

export function writeNewline(): void {
  process.stdout.write('\n');
}

export function printToolError(message: string): void {
  console.error(chalk.red(`\n  ${message}`));
}

export function printWarning(message: string): void {
  console.log(chalk.yellow(`\n  ${message}`));
}
