#!/usr/bin/env node

import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth/index.js';
import { registerSpaceCommands } from './commands/space/index.js';
import { registerEventCommands } from './commands/event/index.js';
import { registerTicketCommands } from './commands/tickets/index.js';
import { registerRewardCommands } from './commands/rewards/index.js';
import { registerSiteCommands } from './commands/site/index.js';
import { registerConnectorCommands } from './commands/connectors/index.js';
import { registerConfigCommands } from './commands/config/index.js';
import { registerStatusCommands } from './commands/status/index.js';
import { registerDoctorCommands } from './commands/doctor/index.js';
import { registerToolCommands } from './commands/tools/index.js';
import { registerCapabilitiesCommands } from './commands/capabilities/index.js';
import { registerMcpCommand } from './commands/mcp/index.js';
import { registerSessionsCommands } from './commands/sessions/index.js';
import { registerNotificationCommands } from './commands/notifications/index.js';
import { loadGeneratedCommands, checkSchemaVersion } from './commands/loader.js';
import { getPackageVersion } from './config/version.js';
const version = getPackageVersion();

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
registerStatusCommands(program);
registerDoctorCommands(program);
registerToolCommands(program);
registerCapabilitiesCommands(program);
registerMcpCommand(program);
registerSessionsCommands(program);
registerNotificationCommands(program);

// Load auto-generated commands (MCP + GraphQL) after manual commands.
// Manual commands take priority: generated commands with the same group:subcommand are skipped.
checkSchemaVersion();
await loadGeneratedCommands(program);

program.parse();
