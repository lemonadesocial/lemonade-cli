import chalk from 'chalk';

export const VALID_MODES = ['credits', 'own_key'] as const;

export function validateMode(mode: string | undefined): void {
  if (mode && !(VALID_MODES as readonly string[]).includes(mode)) {
    console.error(chalk.red(`  Unknown mode "${mode}". Supported: ${VALID_MODES.join(', ')}`));
    process.exit(2);
    return;
  }
}
