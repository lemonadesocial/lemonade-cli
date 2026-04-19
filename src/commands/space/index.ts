import { Command } from 'commander';
import open from 'open';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';
import { TIER_LIMITS } from '../../config/defaults.js';

export function registerSpaceCommands(program: Command): void {
  const space = program
    .command('space')
    .description('Manage spaces');

  space
    .command('create <title>')
    .description('Create a new space')
    .option('--description <text>', 'Space description')
    .option('--slug <slug>', 'Space URL slug')
    .option('--private', 'Make space private')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (title: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ aiCreateSpace: Record<string, unknown> }>(
          `mutation($input: AISpaceInput!) {
            aiCreateSpace(input: $input) { _id title slug description }
          }`,
          {
            input: {
              title,
              description: opts.description,
              slug: opts.slug,
              private: opts.private || false,
            },
          },
        );
        setFlagApiKey(undefined);

        const s = result.aiCreateSpace;
        if (opts.json) {
          console.log(jsonSuccess(s));
        } else {
          console.log(renderKeyValue([
            ['ID', String(s._id)],
            ['Title', String(s.title)],
            ['Slug', String(s.slug)],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('list')
    .description('List your spaces')
    .option('--limit <n>', 'Max results', '20')
    .option('--cursor <str>', 'Pagination cursor (skip)')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = parseInt(opts.limit, 10);
        const skip = opts.cursor ? parseInt(opts.cursor, 10) : 0;

        const result = await graphqlRequest<{ listMySpaces: { items: Record<string, unknown>[] } }>(
          `query($limit: Int, $skip: Int) {
            listMySpaces(limit: $limit, skip: $skip) {
              items { _id title slug description }
            }
          }`,
          { limit, skip },
        );
        setFlagApiKey(undefined);

        const items = result.listMySpaces.items;
        if (opts.json) {
          const nextCursor = items.length === limit ? String(skip + limit) : null;
          console.log(jsonSuccess(items, { cursor: nextCursor }));
        } else {
          console.log(renderTable(
            ['ID', 'Title', 'Slug'],
            items.map((s) => [String(s._id), String(s.title), String(s.slug || '')]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('update <space-id>')
    .description('Update a space')
    .option('--title <text>', 'New title')
    .option('--description <text>', 'New description')
    .option('--slug <slug>', 'New slug')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (spaceId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const input: Record<string, unknown> = {};
        if (opts.title) input.title = opts.title;
        if (opts.description) input.description = opts.description;
        if (opts.slug) input.slug = opts.slug;

        const result = await graphqlRequest<{ aiUpdateSpace: Record<string, unknown> }>(
          `mutation($id: MongoID!, $input: AISpaceInput!) {
            aiUpdateSpace(id: $id, input: $input) { _id title slug }
          }`,
          { id: spaceId, input },
        );
        setFlagApiKey(undefined);

        const s = result.aiUpdateSpace;
        if (opts.json) {
          console.log(jsonSuccess(s));
        } else {
          console.log(renderKeyValue([
            ['ID', String(s._id)],
            ['Title', String(s.title)],
            ['Slug', String(s.slug)],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('connect <space-id> <platform>')
    .description('Connect a platform to a space')
    .option('--api-key-value <key>', 'API key for the connector')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (spaceId: string, platform: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const step1 = await graphqlRequest<{ connectPlatform: { connectionId: string; requiresApiKey: boolean; authUrl?: string } }>(
          `mutation($input: ConnectPlatformInput!) {
            connectPlatform(input: $input) { connectionId requiresApiKey authUrl }
          }`,
          { input: { space: spaceId, connectorType: platform } },
        );

        const conn = step1.connectPlatform;

        if (conn.requiresApiKey) {
          if (!opts.apiKeyValue) {
            throw new Error('This connector requires an API key. Provide --api-key-value <key>.');
          }
          await graphqlRequest(
            `mutation($input: SubmitApiKeyInput!) {
              submitApiKey(input: $input) { id connectorType status enabled }
            }`,
            { input: { connectionId: conn.connectionId, apiKey: opts.apiKeyValue } },
          );
        } else if (conn.authUrl) {
          await open(conn.authUrl);
        }

        setFlagApiKey(undefined);

        if (opts.json) {
          console.log(jsonSuccess({
            connectionId: conn.connectionId,
            requiresApiKey: conn.requiresApiKey,
            authUrl: conn.authUrl,
          }));
        } else {
          console.log(`Connected ${platform} to space ${spaceId}`);
          if (conn.authUrl) {
            console.log(`Opening browser for OAuth: ${conn.authUrl}`);
          }
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('connectors <space-id>')
    .description('List connected platforms')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (spaceId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ spaceConnections: Array<Record<string, unknown>> }>(
          `query($spaceId: String!) {
            spaceConnections(spaceId: $spaceId) {
              id connectorType status lastSyncAt lastSyncStatus enabled errorMessage
            }
          }`,
          { spaceId },
        );
        setFlagApiKey(undefined);

        const items = result.spaceConnections;
        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          console.log(renderTable(
            ['ID', 'Connector', 'Status', 'Last Sync', 'Enabled'],
            items.map((c) => [
              String(c.id),
              String(c.connectorType),
              String(c.status),
              c.lastSyncAt ? String(c.lastSyncAt) : '-',
              String(c.enabled),
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('analytics <space-id>')
    .description('View space analytics')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (spaceId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ getSpaceStatistics: Record<string, unknown> }>(
          `query($space: MongoID!) {
            getSpaceStatistics(space: $space) {
              admins ambassadors subscribers
              created_events submitted_events event_attendees
              avg_event_rating
            }
          }`,
          { space: spaceId },
        );
        setFlagApiKey(undefined);

        const stats = result.getSpaceStatistics;
        if (opts.json) {
          console.log(jsonSuccess(stats));
        } else {
          console.log(renderKeyValue([
            ['Admins', String(stats.admins)],
            ['Ambassadors', String(stats.ambassadors)],
            ['Subscribers', String(stats.subscribers)],
            ['Events Created', String(stats.created_events)],
            ['Events Submitted', String(stats.submitted_events)],
            ['Event Attendees', String(stats.event_attendees)],
            ['Avg Event Rating', stats.avg_event_rating != null ? String(stats.avg_event_rating) : '(none)'],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('plan <space-id-or-slug>')
    .description('View space subscription plan and usage')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (spaceIdOrSlug: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const [statsResult, connectorsResult] = await Promise.all([
          graphqlRequest<{ getSpaceStatistics: Record<string, unknown> }>(
            `query($space: MongoID!) {
              getSpaceStatistics(space: $space) {
                admins ambassadors subscribers
                created_events submitted_events event_attendees avg_event_rating
              }
            }`,
            { space: spaceIdOrSlug },
          ),
          graphqlRequest<{ spaceConnections: Array<Record<string, unknown>> }>(
            `query($spaceId: String!) {
              spaceConnections(spaceId: $spaceId) { id }
            }`,
            { spaceId: spaceIdOrSlug },
          ),
        ]);

        setFlagApiKey(undefined);

        const stats = statsResult.getSpaceStatistics;
        const connectorCount = connectorsResult.spaceConnections.length;

        const features = Object.entries(TIER_LIMITS).map(([feature, tiers]) => ({
          feature,
          tiers,
        }));

        if (opts.json) {
          console.log(jsonSuccess({
            space: spaceIdOrSlug,
            stats,
            connector_count: connectorCount,
            tier_limits: features,
          }));
        } else {
          console.log(`Space: ${spaceIdOrSlug}\n`);
          console.log(renderTable(
            ['Feature', 'Free', 'Pro', 'Plus', 'Max'],
            features.map((f) => [
              f.feature,
              formatTierValue(f.tiers.free),
              formatTierValue(f.tiers.pro),
              formatTierValue(f.tiers.plus),
              formatTierValue(f.tiers.max),
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('stripe-connect')
    .description('Connect your Stripe account for accepting payments')
    .option('--return-url <url>', 'URL to return to after Stripe onboarding', 'https://lemonade.social')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const result = await graphqlRequest<{
          generateStripeAccountLink: { url: string };
        }>(
          `mutation($return_url: String!, $refresh_url: String!) {
            generateStripeAccountLink(return_url: $return_url, refresh_url: $refresh_url) {
              url
            }
          }`,
          { return_url: opts.returnUrl, refresh_url: opts.returnUrl },
        );

        setFlagApiKey(undefined);

        const link = result.generateStripeAccountLink;

        if (opts.json) {
          console.log(jsonSuccess({ onboarding_url: link.url }));
        } else {
          console.log('Opening Stripe Connect onboarding...');
          console.log(`If the browser does not open, visit: ${link.url}`);
          await open(link.url);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('stripe-status')
    .description('Check Stripe account connection status')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const result = await graphqlRequest<{
          getMe: { stripe_connected_account?: { account_id: string; connected: boolean } };
        }>(
          `query {
            getMe {
              stripe_connected_account { account_id connected }
            }
          }`,
        );

        setFlagApiKey(undefined);

        const account = result.getMe.stripe_connected_account;

        if (opts.json) {
          console.log(jsonSuccess({
            connected: !!account?.connected,
            account_id: account?.account_id || null,
          }));
        } else if (account?.connected) {
          console.log(`Stripe: Connected (${account.account_id})`);
        } else if (account) {
          console.log('Stripe: Onboarding incomplete. Run: lemonade space stripe-connect');
        } else {
          console.log('Stripe: Not connected. Run: lemonade space stripe-connect');
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  space
    .command('upgrade <space-id-or-slug>')
    .description('Open subscription upgrade page')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (spaceIdOrSlug: string, opts) => {
      try {
        const slug = spaceIdOrSlug;
        const url = `https://lemonade.social/s/manage/${slug}/settings/subscription`;

        if (opts.json) {
          console.log(jsonSuccess({ upgrade_url: url }));
        } else {
          console.log(`Opening subscription page for ${slug}...`);
          await open(url);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}

function formatTierValue(tier: { enabled: boolean; limit?: number }): string {
  if (!tier.enabled) return 'No';
  if (tier.limit === undefined) return 'Yes';
  if (tier.limit === 0) return 'Unlimited';
  return String(tier.limit);
}
