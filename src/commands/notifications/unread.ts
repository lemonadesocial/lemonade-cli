import { Command, Option } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';
import { NOTIFICATION_CATEGORIES } from '../../chat/tools/domains/notifications.js';

/**
 * Scalar one-shot "how many unread notifications do I have?" subcommand.
 *
 * Consumes `getNotificationUnreadCount` (shipped in lemonade-backend PR #2127).
 * Emits a single integer to stdout (or `{ ok, data: { unread } }` with --json)
 * on success. Routes all errors through `handleError()` for consistent exit
 * code mapping (0 success, 2 auth, 3 network, 1 otherwise).
 *
 * Mirrors the `read.ts` scaffold — same try/finally with setFlagApiKey,
 * same handleError-on-catch. See IMPL § Patterns Referenced row 2.
 */
const GET_NOTIFICATION_UNREAD_COUNT_QUERY = `
  query GetNotificationUnreadCount($category: NotificationCategory) {
    getNotificationUnreadCount(category: $category)
  }
`;

export function registerNotificationsUnread(notifications: Command): void {
  notifications
    .command('unread')
    .description('Print the current unread notification count')
    .addOption(
      new Option(
        '--category <category>',
        'Scope the count to a single category (event|social|messaging|payment|space|store|system)',
      ).choices([...NOTIFICATION_CATEGORIES]),
    )
    .option('--json', 'Output as JSON envelope { ok, data: { unread } }')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        // Per PRD US-2.10: omit `category` from the variables object when
        // the flag is not supplied — NOT `null`. Commander leaves the key
        // unset on opts, so a truthy check suffices.
        const variables: Record<string, unknown> = {};
        if (opts.category !== undefined && opts.category !== null && opts.category !== '') {
          variables.category = opts.category;
        }

        const result = await graphqlRequest<{ getNotificationUnreadCount: number }>(
          GET_NOTIFICATION_UNREAD_COUNT_QUERY,
          variables,
        );

        const unread = result.getNotificationUnreadCount;

        if (opts.json) {
          console.log(jsonSuccess({ unread }));
        } else {
          console.log(String(unread));
        }
      } catch (error) {
        handleError(error, !!opts.json);
      } finally {
        setFlagApiKey(undefined);
      }
    });
}
