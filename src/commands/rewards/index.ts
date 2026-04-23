import { Command } from 'commander';

export function registerRewardCommands(program: Command): void {
  program
    .command('rewards')
    .description('Rewards commands are temporarily unavailable')
    .addHelpText(
      'after',
      '\nRewards commands are temporarily disabled because the Atlas GraphQL endpoints are not exposed on the live backend schema.\n',
    );
}
