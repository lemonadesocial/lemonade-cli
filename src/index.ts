#!/usr/bin/env node

import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth';
import { registerSpaceCommands } from './commands/space';
import { registerEventCommands } from './commands/event';
import { registerTicketCommands } from './commands/tickets';
import { registerRewardCommands } from './commands/rewards';
import { registerSiteCommands } from './commands/site';
import { registerConnectorCommands } from './commands/connectors';
import { registerConfigCommands } from './commands/config';
import { loadGeneratedCommands, checkSchemaVersion } from './commands/loader';
import { version } from '../package.json';

const program = new Command();

program
  .name('lemonade')
  .description('Lemonade CLI - manage Spaces, events, and tickets')
  .version(version);

registerAuthCommands(program);
registerSpaceCommands(program);
registerEventCommands(program);
registerTicketCommands(program);
registerRewardCommands(program);
registerSiteCommands(program);
registerConnectorCommands(program);
registerConfigCommands(program);

// Load auto-generated commands (MCP + GraphQL) after manual commands.
// Manual commands take priority: generated commands with the same group:subcommand are skipped.
checkSchemaVersion();
loadGeneratedCommands(program);

program.parse();
