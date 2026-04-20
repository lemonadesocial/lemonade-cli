import { Command } from 'commander';
import { registerNotificationsWatch } from './watch.js';
import { registerNotificationsList } from './list.js';
import { registerNotificationsRead } from './read.js';
import { registerNotificationsFilters } from './filters/index.js';

/**
 * Register the `lemonade notifications` command family (Phase 2 of
 * PRD-CLI-NOTIFICATION-CLIENT-ALIGNMENT): watch, list, read.
 *
 * Defensive guard: if a `notifications` group already exists on the program
 * (e.g. a capability-generated duplicate registered earlier), we no-op rather
 * than letting Commander throw on the duplicate `.command('notifications')`.
 * The three-phase loader at `src/commands/loader.ts:54-85` seeds `registered`
 * in Phase 1 so the manual group wins, but this guard adds defense-in-depth.
 */
export function registerNotificationCommands(program: Command): void {
  if (program.commands.find((c) => c.name() === 'notifications')) {
    return;
  }

  const notifications = program
    .command('notifications')
    .description('Watch, list, and read notifications');

  registerNotificationsWatch(notifications);
  registerNotificationsList(notifications);
  registerNotificationsRead(notifications);
  registerNotificationsFilters(notifications);
}
