import { Command, Option } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';
import { NOTIFICATION_CATEGORIES } from '../../chat/tools/domains/notifications.js';

/**
 * Item shape returned by `getNotifications`. Matches the query in
 * `src/chat/tools/domains/notifications.ts:150-157` (verbatim reuse — no new
 * fields introduced in Phase 2).
 */
interface NotificationListItem {
  _id: string;
  type: string;
  title?: string | null;
  message?: string | null;
  created_at: string;
  is_seen?: boolean | null;
  from_expanded?: { _id: string; name?: string | null } | null;
  ref_event_expanded?: { _id: string; title?: string | null } | null;
  ref_space_expanded?: { _id: string; title?: string | null } | null;
}

const GET_NOTIFICATIONS_QUERY = `
  query GetNotifications($skip: Int, $limit: Int, $category: NotificationCategory) {
    getNotifications(skip: $skip, limit: $limit, category: $category) {
      _id type title message created_at is_seen
      from_expanded { _id name }
      ref_event_expanded { _id title }
      ref_space_expanded { _id title }
    }
  }
`;

export function registerNotificationsList(notifications: Command): void {
  notifications
    .command('list')
    .description('List recent notifications (optionally filtered by category)')
    .addOption(
      new Option(
        '--category <category>',
        'Filter by category (event|social|messaging|payment|space|store|system)',
      ).choices([...NOTIFICATION_CATEGORIES]),
    )
    .option('--limit <n>', 'Max results (default 25, cap 1000)', '25')
    .option('--skip <n>', 'Pagination offset (default 0)', '0')
    .option('--unseen', 'Show only unseen notifications')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const rawLimit = parseInt(opts.limit, 10);
        const rawSkip = parseInt(opts.skip, 10);
        const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 25, 1000);
        const skip = Number.isFinite(rawSkip) ? rawSkip : 0;

        const variables: Record<string, unknown> = { skip, limit };
        if (opts.category !== undefined && opts.category !== null && opts.category !== '') {
          variables.category = opts.category;
        }

        const result = await graphqlRequest<{ getNotifications: NotificationListItem[] }>(
          GET_NOTIFICATIONS_QUERY,
          variables,
        );
        setFlagApiKey(undefined);

        const items = opts.unseen
          ? result.getNotifications.filter((n) => !n.is_seen)
          : result.getNotifications;

        if (opts.json) {
          const nextCursor =
            result.getNotifications.length === limit ? String(skip + limit) : null;
          console.log(jsonSuccess(items, { cursor: nextCursor }));
        } else {
          console.log(
            renderTable(
              ['ID', 'Type', 'Seen', 'Time', 'Title', 'Message'],
              items.map((n) => [
                String(n._id),
                String(n.type),
                n.is_seen ? 'Yes' : 'No',
                String(n.created_at),
                String(n.title ?? ''),
                String(n.message ?? ''),
              ]),
            ),
          );
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
