import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';

const READ_NOTIFICATIONS_MUTATION = `
  mutation ReadNotifications($_id: [MongoID!]) {
    readNotifications(_id: $_id)
  }
`;

export function registerNotificationsRead(notifications: Command): void {
  notifications
    .command('read <id...>')
    .description('Mark one or more notifications as read')
    .option('--dry-run', 'Print the intended mutation payload and exit without calling the API')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (ids: string[], opts) => {
      try {
        if (!ids || ids.length === 0) {
          if (opts.json) {
            process.stderr.write(
              JSON.stringify({ ok: false, error: { code: 'USAGE_ERROR', message: 'At least one notification ID is required' } }) + '\n',
            );
          } else {
            process.stderr.write('At least one notification ID is required\n');
          }
          process.exit(1);
        }

        const variables = { _id: ids };

        if (opts.dryRun) {
          const payload = {
            mutation: READ_NOTIFICATIONS_MUTATION.trim(),
            variables,
          };
          if (opts.json) {
            console.log(jsonSuccess({ dry_run: true, ...payload }));
          } else {
            console.log('Dry run — would send:');
            console.log(payload.mutation);
            console.log(`Variables: ${JSON.stringify(payload.variables)}`);
          }
          return;
        }

        setFlagApiKey(opts.apiKey);
        await graphqlRequest<{ readNotifications: boolean }>(
          READ_NOTIFICATIONS_MUTATION,
          variables,
        );
        setFlagApiKey(undefined);

        const count = ids.length;
        if (opts.json) {
          console.log(jsonSuccess({ read: true, count }));
        } else {
          console.log(`Marked ${count} notification(s) as read`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
