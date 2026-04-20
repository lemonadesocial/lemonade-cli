import { Command, Option } from 'commander';
import React from 'react';
import { render } from 'ink';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';
import { NOTIFICATION_CATEGORIES } from '../../chat/tools/domains/notifications.js';
import { ReadAllConfirm } from './ui/ReadAllConfirm.js';

const READ_NOTIFICATIONS_MUTATION = `
  mutation ReadNotifications($_id: [MongoID!]) {
    readNotifications(_id: $_id)
  }
`;

const GET_NOTIFICATION_UNREAD_COUNT_QUERY = `
  query GetNotificationUnreadCount($category: NotificationCategory) {
    getNotificationUnreadCount(category: $category)
  }
`;

const READ_ALL_NOTIFICATIONS_MUTATION = `
  mutation ReadAllNotifications($category: NotificationCategory) {
    readAllNotifications(category: $category)
  }
`;

/**
 * Build the category-scoped variables object. Per PRD US-2.10/US-3.13: omit
 * the key entirely when the flag is absent (NOT null) so the server sees the
 * field as undefined.
 */
function buildCategoryVariables(category: string | undefined): Record<string, unknown> {
  const variables: Record<string, unknown> = {};
  if (category !== undefined && category !== null && category !== '') {
    variables.category = category;
  }
  return variables;
}

export function registerNotificationsRead(notifications: Command): void {
  notifications
    // Optional-variadic (`[id...]`) so Commander does not fire its own
    // "missing required argument" error before our custom US-3.6 guard can
    // emit the exact message mandated by the PRD
    // ("At least one notification ID is required"). A-008 remediation.
    //
    // NEW in this PR: --all branch takes priority BEFORE the
    // idList.length === 0 guard, so zero positional IDs + --all is valid.
    .command('read [id...]')
    .description('Mark one or more notifications as read (or --all to drain)')
    .addOption(
      new Option(
        '--category <category>',
        'Scope --all to a single category (event|social|messaging|payment|space|store|system)',
      ).choices([...NOTIFICATION_CATEGORIES]),
    )
    .option('--all', 'Mark every unread notification as read (requires confirmation)')
    .option('--yes', 'Skip confirmation prompt (required for --all in non-interactive mode)')
    .option('--dry-run', 'Print the intended mutation payload and exit without calling the API')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (ids: string[] | undefined, opts) => {
      const idList = ids ?? [];

      // ──────────────────────────────────────────────────────────────────
      // --all branch (US-3). Takes priority BEFORE the idList.length === 0
      // guard so zero positional IDs + --all is a valid invocation.
      // ──────────────────────────────────────────────────────────────────
      if (opts.all) {
        // US-3.11 — --all + positional IDs is a usage error.
        if (idList.length > 0) {
          handleError(
            new Error('--all cannot be combined with positional notification IDs.'),
            !!opts.json,
          );
          return; // unreachable — handleError calls process.exit
        }

        const isTty = !!process.stdout.isTTY;

        // US-3.8 — JSON + interactive prompt would corrupt stdout. Reject
        // --json without --yes or --dry-run before any network call.
        if (opts.json && !opts.yes && !opts.dryRun) {
          handleError(
            new Error('--all with --json requires --yes (non-interactive) or --dry-run (preview).'),
            true,
          );
          return;
        }

        // US-3.8 — non-TTY (piped stdout) also cannot render the Ink prompt.
        if (!isTty && !opts.yes && !opts.dryRun) {
          handleError(
            new Error('--all requires confirmation; re-run with --yes for non-interactive use or --dry-run to preview.'),
            !!opts.json,
          );
          return;
        }

        try {
          setFlagApiKey(opts.apiKey);

          const categoryVars = buildCategoryVariables(opts.category);

          // Pre-fetch unread count (all paths need this: prompt, dry-run,
          // zero-unread short-circuit).
          const pre = await graphqlRequest<{ getNotificationUnreadCount: number }>(
            GET_NOTIFICATION_UNREAD_COUNT_QUERY,
            categoryVars,
          );
          const wouldMark = pre.getNotificationUnreadCount;
          const categorySuffix = opts.category ? ` in category ${opts.category}` : '';

          // US-3.12 — zero-unread short-circuit. No prompt, no mutation.
          if (wouldMark === 0) {
            if (opts.json) {
              console.log(jsonSuccess({ marked: 0, unread: 0 }));
            } else {
              console.log('No unread notifications. Nothing to mark.');
            }
            return;
          }

          // US-3.5 / US-3.6 — dry-run. Count already fetched; DO NOT call
          // the mutation. This is the PRD's primary safety invariant —
          // tested with a negative assertion on mockGraphqlRequest.
          if (opts.dryRun) {
            if (opts.json) {
              console.log(jsonSuccess({ dry_run: true, would_mark: wouldMark }));
            } else {
              console.log(`Would mark ${wouldMark} notifications as read${categorySuffix} (dry run). No changes made.`);
            }
            return;
          }

          // US-3.1 / US-3.3 — interactive: render Ink confirm and await
          // decision.
          let confirmed: boolean;
          if (opts.yes) {
            confirmed = true;
          } else {
            confirmed = await new Promise<boolean>((resolve) => {
              let settled = false;
              const decide = (answer: boolean) => {
                if (settled) return;
                settled = true;
                resolve(answer);
              };
              const instance = render(
                React.createElement(ReadAllConfirm, {
                  count: wouldMark,
                  onDecision: decide,
                }),
                { exitOnCtrlC: false, patchConsole: true },
              );
              // Defense-in-depth: if the Ink process exits for any reason
              // before the component calls onDecision (component unmount
              // also fires onDecision(false), but belt-and-braces), the
              // waitUntilExit promise resolves and we cancel.
              instance
                .waitUntilExit()
                .then(() => decide(false))
                .catch(() => decide(false));
            });
          }

          if (!confirmed) {
            // US-3.3 — cancel path. No mutation.
            if (opts.json) {
              console.log(jsonSuccess({ marked: 0, unread: wouldMark, cancelled: true }));
            } else {
              console.log('Cancelled. No changes made.');
            }
            return;
          }

          // US-3.2 / US-3.4 — confirmed: run the bulk mutation.
          const mutResult = await graphqlRequest<{ readAllNotifications: number }>(
            READ_ALL_NOTIFICATIONS_MUTATION,
            categoryVars,
          );
          const marked = mutResult.readAllNotifications;

          // Post-mutation refetch (best-effort — surface the actual count,
          // even if non-zero because new notifications arrived during the
          // drain). PRD Risks row 2 + US-3.2.
          let unreadAfter = 0;
          try {
            const post = await graphqlRequest<{ getNotificationUnreadCount: number }>(
              GET_NOTIFICATION_UNREAD_COUNT_QUERY,
              categoryVars,
            );
            unreadAfter = post.getNotificationUnreadCount;
          } catch {
            // Refetch failed — fall back to 0 so the success string still
            // prints. The mutation itself succeeded.
            unreadAfter = 0;
          }

          if (opts.json) {
            console.log(jsonSuccess({ marked, unread: unreadAfter }));
          } else {
            console.log(`Marked ${marked} notifications as read${categorySuffix}. Unread: ${unreadAfter}.`);
          }
        } catch (error) {
          handleError(error, !!opts.json);
        } finally {
          setFlagApiKey(undefined);
        }
        return;
      }

      // ──────────────────────────────────────────────────────────────────
      // Positional [id...] path — existing behaviour (unchanged).
      // ──────────────────────────────────────────────────────────────────
      if (idList.length === 0) {
        if (opts.json) {
          process.stderr.write(
            JSON.stringify({ ok: false, error: { code: 'USAGE_ERROR', message: 'At least one notification ID is required' } }) + '\n',
          );
        } else {
          process.stderr.write('At least one notification ID is required\n');
        }
        process.exit(1);
      }

      const variables = { _id: idList };

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

      try {
        setFlagApiKey(opts.apiKey);
        await graphqlRequest<{ readNotifications: boolean }>(
          READ_NOTIFICATIONS_MUTATION,
          variables,
        );

        const count = idList.length;
        if (opts.json) {
          console.log(jsonSuccess({ read: true, count }));
        } else {
          console.log(`Marked ${count} notification(s) as read`);
        }
      } catch (error) {
        handleError(error, !!opts.json);
      } finally {
        setFlagApiKey(undefined);
      }
    });
}
