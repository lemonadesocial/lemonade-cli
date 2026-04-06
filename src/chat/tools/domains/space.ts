import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';
import { parseJsonObject, setSpaceImage } from '../utils/index.js';

const VALID_FEATURE_CODES = [
    'AI', 'EventInvitation', 'DataDashboard', 'CSVGuestList', 'GuestListDashboard',
    'EventSettings', 'TicketingSettings', 'EmailManager', 'PromotionCodes',
    'CollectibleData', 'Checkin', 'Poap', 'Ticket', 'ViewSpace', 'ManageSpace',
    'SpaceStatistic', 'ViewSpaceMembership', 'ManageSpaceMembership',
    'ViewSpaceEvent', 'ManageSpaceEvent', 'ManageSpaceEventRequest',
    'ViewSpaceTag', 'ManageSpaceTag', 'ManageSpaceTokenGate',
    'ViewSpaceNewsletter', 'ManageSpaceNewsletter', 'ManageSubscription',
  ];
const VALID_FEATURE_CODES_SET = new Set(VALID_FEATURE_CODES);

export const spaceTools: CanonicalCapability[] = [
  buildCapability({
    name: 'space_create',
    category: 'space',
    displayName: 'space create',
    description: 'Create a new space (community).',
    params: [
      { name: 'title', type: 'string', description: 'Space title', required: true },
      { name: 'description', type: 'string', description: 'Space description', required: false },
      { name: 'slug', type: 'string', description: 'Space URL slug (e.g. my-community)', required: false },
      { name: 'private', type: 'boolean', description: 'Make space private', required: false },
      { name: 'handle_twitter', type: 'string', description: 'Twitter/X handle', required: false },
      { name: 'handle_instagram', type: 'string', description: 'Instagram handle', required: false },
      { name: 'handle_linkedin', type: 'string', description: 'LinkedIn handle', required: false },
      { name: 'handle_youtube', type: 'string', description: 'YouTube handle', required: false },
      { name: 'handle_tiktok', type: 'string', description: 'TikTok handle', required: false },
      { name: 'website', type: 'string', description: 'Community website URL', required: false },
      { name: 'tint_color', type: 'string', description: 'Brand color (hex, e.g. #FF5500)', required: false },
      { name: 'address', type: 'string', description: 'Community location', required: false },
      { name: 'theme_data', type: 'string', description: 'Theme configuration as JSON (use theme_build tool to generate)', required: false },
      { name: 'theme_name', type: 'string', description: 'Theme preset name', required: false },
      { name: 'dark_theme_image', type: 'string', description: 'File ID for dark mode background image (from file_upload)', required: false },
      { name: 'light_theme_image', type: 'string', description: 'File ID for light mode background image (from file_upload)', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createSpace',
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const input: Record<string, unknown> = { title: args.title };
      if (args.description !== undefined) input.description = args.description;
      if (args.slug !== undefined) input.slug = args.slug;
      if (args.private !== undefined) input.private = args.private;
      if (args.handle_twitter !== undefined) input.handle_twitter = args.handle_twitter;
      if (args.handle_instagram !== undefined) input.handle_instagram = args.handle_instagram;
      if (args.handle_linkedin !== undefined) input.handle_linkedin = args.handle_linkedin;
      if (args.handle_youtube !== undefined) input.handle_youtube = args.handle_youtube;
      if (args.handle_tiktok !== undefined) input.handle_tiktok = args.handle_tiktok;
      if (args.website !== undefined) input.website = args.website;
      if (args.tint_color !== undefined) input.tint_color = args.tint_color;
      if (args.address !== undefined) input.address = { title: args.address };
      if (args.theme_data !== undefined) input.theme_data = parseJsonObject(args.theme_data as string, 'theme_data');
      if (args.theme_name !== undefined) input.theme_name = args.theme_name;
      if (args.dark_theme_image !== undefined) input.dark_theme_image = args.dark_theme_image;
      if (args.light_theme_image !== undefined) input.light_theme_image = args.light_theme_image;

      const result = await graphqlRequest<{ createSpace: unknown }>(
        `mutation($input: SpaceInput!) {
          createSpace(input: $input) {
            _id title slug description
            handle_twitter handle_instagram handle_linkedin handle_youtube handle_tiktok
            website tint_color private
            theme_data theme_name dark_theme_image light_theme_image
            address { title city country }
          }
        }`,
        { input },
      );
      return result.createSpace;
    },
    formatResult: (result) => {
      const r = result as Record<string, unknown>;
      const parts = [`Created space "${r.title}" (${r._id})`];
      if (r.slug) parts.push(`slug: ${r.slug}`);
      if (r.private) parts.push('(private)');
      if (r.website) parts.push(`website: ${r.website}`);
      if (r.tint_color) parts.push(`brand color: ${r.tint_color}`);
      const socials = ['handle_twitter', 'handle_instagram', 'handle_linkedin', 'handle_youtube', 'handle_tiktok']
        .filter(k => r[k])
        .map(k => `${k.replace('handle_', '')}: ${r[k]}`);
      if (socials.length) parts.push(`socials: ${socials.join(', ')}`);
      return parts.join(' | ');
    },
  }),
  buildCapability({
    name: 'space_list',
    category: 'space',
    displayName: 'space list',
    description: 'List your spaces.',
    params: [
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '100' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiListMySpaces',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand', 'slashCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ aiListMySpaces: unknown }>(
        `query($limit: Int, $skip: Int) {
          aiListMySpaces(limit: $limit, skip: $skip) {
            items { _id title slug description }
          }
        }`,
        // Backend aiListMySpaces includes creator, admin, and ambassador roles
      { limit: (args.limit as number) || 100, skip: (args.skip as number) || 0 },
      );
      return result.aiListMySpaces;
    },
  }),
  buildCapability({
    name: 'space_switch',
    category: 'space',
    displayName: 'space switch',
    description:
      'Switch the active space for this session. All subsequent space-scoped commands will use this space.',
    params: [
      { name: 'space_id', type: 'string', description: 'The space ID to switch to', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiListMySpaces',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{
        aiListMySpaces: { items: Array<{ _id: string; title: string; slug: string }> };
      }>(
        `query {
          aiListMySpaces(limit: 100, skip: 0) {
            items { _id title slug }
          }
        }`,
      );
      const spaces = result.aiListMySpaces.items;
      const match = spaces.find((s) => s._id === args.space_id);
      if (!match) {
        throw new Error('Space not found. Run space_list to see your spaces.');
      }
      return { _id: match._id, title: match.title, slug: match.slug };
    },
    formatResult: (result) => {
      const r = result as { _id: string; title: string };
      return `Switched to ${r.title}.`;
    },
  }),
  buildCapability({
    name: 'space_update',
    category: 'space',
    displayName: 'space update',
    description: 'Update a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'title', type: 'string', description: 'New title', required: false },
      { name: 'description', type: 'string', description: 'New description', required: false },
      { name: 'slug', type: 'string', description: 'New slug', required: false },
      { name: 'private', type: 'boolean', description: 'Make space private', required: false },
      { name: 'handle_twitter', type: 'string', description: 'Twitter/X handle', required: false },
      { name: 'handle_instagram', type: 'string', description: 'Instagram handle', required: false },
      { name: 'handle_linkedin', type: 'string', description: 'LinkedIn handle', required: false },
      { name: 'handle_youtube', type: 'string', description: 'YouTube handle', required: false },
      { name: 'handle_tiktok', type: 'string', description: 'TikTok handle', required: false },
      { name: 'website', type: 'string', description: 'Community website URL', required: false },
      { name: 'tint_color', type: 'string', description: 'Brand color (hex, e.g. #FF5500)', required: false },
      { name: 'address', type: 'string', description: 'Community location', required: false },
      { name: 'state', type: 'string', description: 'Space state (active or archived)', required: false, enum: ['active', 'archived'] },
      { name: 'theme_data', type: 'string', description: 'Theme configuration as JSON (use theme_build tool to generate)', required: false },
      { name: 'theme_name', type: 'string', description: 'Theme preset name', required: false },
      { name: 'dark_theme_image', type: 'string', description: 'File ID for dark mode background image (from file_upload)', required: false },
      { name: 'light_theme_image', type: 'string', description: 'File ID for light mode background image (from file_upload)', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateSpace',
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.title !== undefined) input.title = args.title;
      if (args.description !== undefined) input.description = args.description;
      if (args.slug !== undefined) input.slug = args.slug;
      if (args.private !== undefined) input.private = args.private;
      if (args.handle_twitter !== undefined) input.handle_twitter = args.handle_twitter;
      if (args.handle_instagram !== undefined) input.handle_instagram = args.handle_instagram;
      if (args.handle_linkedin !== undefined) input.handle_linkedin = args.handle_linkedin;
      if (args.handle_youtube !== undefined) input.handle_youtube = args.handle_youtube;
      if (args.handle_tiktok !== undefined) input.handle_tiktok = args.handle_tiktok;
      if (args.website !== undefined) input.website = args.website;
      if (args.tint_color !== undefined) input.tint_color = args.tint_color;
      if (args.address !== undefined) input.address = { title: args.address };
      if (args.state !== undefined) input.state = args.state;
      if (args.theme_data !== undefined) input.theme_data = parseJsonObject(args.theme_data as string, 'theme_data');
      if (args.theme_name !== undefined) input.theme_name = args.theme_name;
      if (args.dark_theme_image !== undefined) input.dark_theme_image = args.dark_theme_image;
      if (args.light_theme_image !== undefined) input.light_theme_image = args.light_theme_image;

      const result = await graphqlRequest<{ updateSpace: unknown }>(
        `mutation($id: MongoID!, $input: SpaceInput!) {
          updateSpace(_id: $id, input: $input) {
            _id title slug description state
            handle_twitter handle_instagram handle_linkedin handle_youtube handle_tiktok
            website tint_color private
            theme_data theme_name dark_theme_image light_theme_image
            address { title city country }
          }
        }`,
        { id: args.space_id, input },
      );
      return result.updateSpace;
    },
    formatResult: (result) => {
      const r = result as Record<string, unknown>;
      const parts = [`Space "${r.title}" updated`];
      if (r.slug) parts.push(`slug: ${r.slug}`);
      if (r.private != null) parts.push(r.private ? '(private)' : '(public)');
      if (r.state) parts.push(`state: ${r.state}`);
      if (r.website) parts.push(`website: ${r.website}`);
      if (r.tint_color) parts.push(`brand color: ${r.tint_color}`);
      const addr = r.address as { title?: string } | undefined;
      if (addr?.title) parts.push(`location: ${addr.title}`);
      const socials = ['handle_twitter', 'handle_instagram', 'handle_linkedin', 'handle_youtube', 'handle_tiktok']
        .filter(k => r[k])
        .map(k => `${k.replace('handle_', '')}: ${r[k]}`);
      if (socials.length) parts.push(`socials: ${socials.join(', ')}`);
      return parts.join(' | ');
    },
  }),
  buildCapability({
    name: 'space_stats',
    category: 'space',
    displayName: 'space analytics',
    description: 'Get space analytics (members, events, ratings).',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiGetSpaceStats',
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetSpaceStats: unknown }>(
        `query($space: MongoID!) {
          aiGetSpaceStats(space: $space) {
            total_members admins ambassadors subscribers
            total_events total_attendees average_event_rating
          }
        }`,
        { space: args.space_id },
      );
      return result.aiGetSpaceStats;
    },
    formatResult: (result) => {
      const r = result as { total_members: number; admins: number; ambassadors: number; subscribers: number; total_events: number; total_attendees: number; average_event_rating?: number };
      const rating = r.average_event_rating ? `${r.average_event_rating}/5 rating` : 'no ratings yet';
      return `Space: ${r.total_members} members (${r.admins} admins, ${r.ambassadors} ambassadors, ${r.subscribers} subscribers), ${r.total_events} events, ${r.total_attendees} attendees, ${rating}.`;
    },
  }),
  buildCapability({
    name: 'space_members',
    category: 'space',
    displayName: 'space members',
    description: 'List members of a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiGetSpaceMembers',
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetSpaceMembers: unknown }>(
        `query($space: MongoID!) {
          aiGetSpaceMembers(space: $space) {
            items { name email role joined_at }
          }
        }`,
        { space: args.space_id },
      );
      return result.aiGetSpaceMembers;
    },
  }),
  buildCapability({
    name: 'space_add_member',
    category: 'space',
    displayName: 'space add-member',
    description: 'Add a member to a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'user_id', type: 'string', description: 'User ID to add', required: true },
      { name: 'role', type: 'string', description: 'Role: admin|host|member', required: false, default: 'member' },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiAddSpaceMember',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiAddSpaceMember: unknown }>(
        `mutation($space: MongoID!, $user: MongoID!, $role: String) {
          aiAddSpaceMember(space: $space, user: $user, role: $role)
        }`,
        { space: args.space_id, user: args.user_id, role: args.role || 'member' },
      );
      return result.aiAddSpaceMember;
    },
  }),
  buildCapability({
    name: 'space_remove_member',
    category: 'space',
    displayName: 'space remove-member',
    description: 'Remove a member from a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'user_id', type: 'string', description: 'User ID to remove', required: true },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'aiRemoveSpaceMember',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiRemoveSpaceMember: unknown }>(
        `mutation($space: MongoID!, $user: MongoID!) {
          aiRemoveSpaceMember(space: $space, user: $user)
        }`,
        { space: args.space_id, user: args.user_id },
      );
      return result.aiRemoveSpaceMember;
    },
  }),
  buildCapability({
    name: 'space_connectors',
    category: 'space',
    displayName: 'space connectors',
    description: 'List connected platforms for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'spaceConnections',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ spaceConnections: unknown }>(
        `query($space: MongoID!) {
          spaceConnections(space: $space) {
            id connectorType status lastSyncAt lastSyncStatus enabled errorMessage
          }
        }`,
        { space: args.space_id },
      );
      return result.spaceConnections;
    },
  }),
  buildCapability({
    name: 'space_stripe_connect',
    category: 'space',
    displayName: 'space stripe-connect',
    description: 'Get a Stripe Connect onboarding URL.',
    params: [
      { name: 'return_url', type: 'string', description: 'URL to return to after onboarding', required: false,
        default: 'https://lemonade.social' },
      { name: 'space_slug', type: 'string', description: 'Space slug for fallback URL (from session)', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'generateStripeAccountLink',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const returnUrl = (args.return_url as string) || 'https://lemonade.social';
      try {
        const result = await graphqlRequest<{ generateStripeAccountLink: { url: string; expires_at?: string } }>(
          `mutation($return_url: String!, $refresh_url: String!) {
            generateStripeAccountLink(return_url: $return_url, refresh_url: $refresh_url) {
              url expires_at
            }
          }`,
          { return_url: returnUrl, refresh_url: returnUrl },
        );
        return result.generateStripeAccountLink;
      } catch {
        const slug = (args.space_slug as string) || '';
        const settingsUrl = slug
          ? `https://lemonade.social/c/${slug}/settings/payment`
          : 'https://lemonade.social';
        return {
          error: 'Could not generate Stripe onboarding link.',
          manual_setup_url: settingsUrl,
          hint: `Complete Stripe setup manually at: ${settingsUrl}`,
        };
      }
    },
  }),
  buildCapability({
    name: 'space_stripe_status',
    category: 'space',
    displayName: 'space stripe-status',
    description: 'Check Stripe account connection status.',
    params: [],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getMe',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequest<{ getMe: { stripe_connected_account?: { account_id: string; connected: boolean } } }>(
        'query { getMe { stripe_connected_account { account_id connected } } }',
      );
      const account = result.getMe.stripe_connected_account;
      return {
        connected: !!account?.connected,
        account_id: account?.account_id || null,
      };
    },
    formatResult: (result) => {
      const r = result as { connected: boolean; account_id?: string };
      if (r.connected) return `Stripe is connected (${r.account_id}).`;
      return 'Stripe is not connected. Use /plan space_stripe_connect to set up.';
    },
  }),
  buildCapability({
    name: 'space_delete',
    category: 'space',
    displayName: 'space delete',
    description: 'Delete a space permanently. This cannot be undone.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID to delete', required: true },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteSpace',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteSpace: boolean }>(
        `mutation($_id: String!) {
          deleteSpace(_id: $_id)
        }`,
        { _id: args.space_id },
      );
      return { deleted: result.deleteSpace };
    },
    formatResult: (result) => {
      const r = result as { deleted: boolean };
      return r.deleted ? 'Space deleted permanently.' : 'Failed to delete space.';
    },
  }),
  buildCapability({
    name: 'space_deep_stats',
    category: 'space',
    displayName: 'space deep analytics',
    description: 'Get detailed community statistics including admins, ambassadors, subscribers, events, attendees, and ratings.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceStatistics',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceStatistics: unknown }>(
        `query($space: String!) {
          getSpaceStatistics(space: $space) {
            admins ambassadors subscribers
            created_events submitted_events event_attendees
            avg_event_rating
          }
        }`,
        { space: args.space_id },
      );
      return result.getSpaceStatistics;
    },
    formatResult: (result) => {
      const r = result as { admins: number; ambassadors: number; subscribers: number; created_events: number; submitted_events: number; event_attendees: number; avg_event_rating?: number };
      const rating = r.avg_event_rating ? `${r.avg_event_rating.toFixed(1)}/5 avg rating` : 'no ratings yet';
      return `Community: ${r.admins} admins, ${r.ambassadors} ambassadors, ${r.subscribers} subscribers. ${r.created_events} events created, ${r.submitted_events} submitted, ${r.event_attendees} total attendees. ${rating}.`;
    },
  }),
  buildCapability({
    name: 'space_top_hosts',
    category: 'space',
    displayName: 'space top hosts',
    description: 'Get leaderboard of top event hosts in a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getTopSpaceHosts',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getTopSpaceHosts: unknown }>(
        `query($space: String!, $limit: Float!) {
          getTopSpaceHosts(space: $space, limit: $limit) {
            user_expanded { _id name email }
            space_member { _id role }
            hosted_event_count
          }
        }`,
        { space: args.space_id, limit: (args.limit as number) || 10 },
      );
      return result.getTopSpaceHosts;
    },
  }),
  buildCapability({
    name: 'space_member_leaderboard',
    category: 'space',
    displayName: 'space member leaderboard',
    description: 'Get member activity leaderboard — attended events, hosted events, submitted events.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
      { name: 'search', type: 'string', description: 'Search by name', required: false },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceMembersLeaderboard',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceMembersLeaderboard: unknown }>(
        `query($space: String!, $limit: Float!, $skip: Float!, $search: String) {
          getSpaceMembersLeaderboard(space: $space, limit: $limit, skip: $skip, search: $search) {
            total
            items { _id user_name email role attended_count hosted_event_count submitted_event_count }
          }
        }`,
        {
          space: args.space_id,
          limit: (args.limit as number) || 10,
          skip: (args.skip as number) || 0,
          search: args.search as string | undefined,
        },
      );
      return result.getSpaceMembersLeaderboard;
    },
  }),
  buildCapability({
    name: 'space_events_insight',
    category: 'space',
    displayName: 'space events insight',
    description: 'Get events performance overview for a space — checkins, ticket sales, ratings.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
      { name: 'search', type: 'string', description: 'Search events', required: false },
      { name: 'event_tense', type: 'string', description: 'Filter by timing', required: false, enum: ['past', 'upcoming', 'live'] },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceEventsInsight',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceEventsInsight: unknown }>(
        `query($space: String!, $limit: Float!, $skip: Float!, $search: String, $eventTense: String) {
          getSpaceEventsInsight(space: $space, limit: $limit, skip: $skip, search: $search, event_tense: $eventTense) {
            total
            items { _id title checkins tickets_count rating }
          }
        }`,
        {
          space: args.space_id,
          limit: (args.limit as number) || 10,
          skip: (args.skip as number) || 0,
          search: args.search as string | undefined,
          eventTense: args.event_tense as string | undefined,
        },
      );
      return result.getSpaceEventsInsight;
    },
  }),
  buildCapability({
    name: 'space_member_update',
    category: 'space',
    displayName: 'space member update',
    description: 'Update a space member role or visibility.',
    params: [
      { name: 'member_id', type: 'string', description: 'Space member ID', required: true },
      { name: 'role', type: 'string', description: 'New role', required: false, enum: ['admin', 'ambassador', 'member'] },
      { name: 'visible', type: 'boolean', description: 'Member visibility', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateSpaceMember',
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { _id: args.member_id };
      if (args.role) input.role = args.role;
      if (args.visible !== undefined) input.visible = args.visible;
      const result = await graphqlRequest<{ updateSpaceMember: unknown }>(
        `mutation($input: UpdateSpaceMemberInput!) {
          updateSpaceMember(input: $input) {
            _id role visible state
          }
        }`,
        { input },
      );
      return result.updateSpaceMember;
    },
    formatResult: (result) => {
      const r = result as { _id: string; role: string } | null;
      if (!r) return 'Member not found.';
      return `Member updated: role=${r.role}.`;
    },
  }),
  buildCapability({
    name: 'space_pin_event',
    category: 'space',
    displayName: 'space pin event',
    description: 'Pin/feature events on a space page.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'event_ids', type: 'string[]', description: 'Event IDs to pin', required: true },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'pinEventsToSpace',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ pinEventsToSpace: { requests?: Array<{ _id: string; event: string; state: string }> } }>(
        `mutation($space: String!, $events: [String!]!) {
          pinEventsToSpace(space: $space, events: $events) {
            requests { _id event state }
          }
        }`,
        { space: args.space_id, events: args.event_ids },
      );
      return result.pinEventsToSpace;
    },
    formatResult: (result) => {
      const r = result as { requests?: Array<{ state: string }> };
      const count = r.requests?.length || 0;
      return `${count} event(s) pinned to space.`;
    },
  }),
  buildCapability({
    name: 'space_unpin_event',
    category: 'space',
    displayName: 'space unpin event',
    description: 'Unpin/unfeature events from a space page.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'event_ids', type: 'string[]', description: 'Event IDs to unpin', required: true },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'unpinEventsFromSpace',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ unpinEventsFromSpace: boolean }>(
        `mutation($space: String!, $events: [String!]!) {
          unpinEventsFromSpace(space: $space, events: $events)
        }`,
        { space: args.space_id, events: args.event_ids },
      );
      return { unpinned: result.unpinEventsFromSpace };
    },
    formatResult: (result) => {
      const r = result as { unpinned: boolean };
      return r.unpinned ? 'Events unpinned from space.' : 'Failed to unpin events.';
    },
  }),
  buildCapability({
    name: 'space_tags_list',
    category: 'space',
    displayName: 'space tags list',
    description: 'List tags for a space with optional type filter.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'type', type: 'string', description: 'Tag type filter', required: false,
        enum: ['event', 'member'] },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'listSpaceTags',
    requiresEvent: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { space: args.space_id };
      if (args.type) vars.type = args.type;

      const result = await graphqlRequest<{ listSpaceTags: unknown }>(
        `query($space: MongoID!, $type: SpaceTagType) {
          listSpaceTags(space: $space, type: $type) {
            _id space tag color type targets_count
          }
        }`,
        vars,
      );
      return result.listSpaceTags;
    },
  }),
  buildCapability({
    name: 'space_tag_upsert',
    category: 'space',
    displayName: 'space tag upsert',
    description: 'Create or update a space tag.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'tag', type: 'string', description: 'Tag label', required: true },
      { name: 'color', type: 'string', description: 'Tag color', required: true },
      { name: 'type', type: 'string', description: 'Tag type', required: true,
        enum: ['event', 'member'] },
      { name: 'tag_id', type: 'string', description: 'Existing tag ObjectId (for update)', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'insertSpaceTag',
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        space: args.space_id,
        tag: args.tag,
        color: args.color,
        type: args.type,
      };
      if (args.tag_id) input._id = args.tag_id;

      const result = await graphqlRequest<{ insertSpaceTag: unknown }>(
        `mutation($input: SpaceTagInput!) {
          insertSpaceTag(input: $input) {
            _id space tag color type
          }
        }`,
        { input },
      );
      return result.insertSpaceTag;
    },
  }),
  buildCapability({
    name: 'space_tag_delete',
    category: 'space',
    displayName: 'space tag delete',
    description: 'Delete a space tag.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'tag_id', type: 'string', description: 'Tag ObjectId', required: true },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteSpaceTag',
    requiresEvent: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($space: MongoID!, $_id: MongoID!) {
          deleteSpaceTag(space: $space, _id: $_id)
        }`,
        { space: args.space_id, _id: args.tag_id },
      );
      return { deleted: true, tag_id: args.tag_id };
    },
  }),
  buildCapability({
    name: 'space_tag_manage',
    category: 'space',
    displayName: 'space tag manage',
    description: 'Add or remove a target (event or member) from a space tag.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'tag_id', type: 'string', description: 'Tag ObjectId', required: true },
      { name: 'target', type: 'string', description: 'Target ID (event or user ObjectId/email)', required: true },
      { name: 'tagged', type: 'boolean', description: 'true to add, false to remove', required: true },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'manageSpaceTag',
    requiresEvent: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($space: MongoID!, $_id: MongoID!, $target: String!, $tagged: Boolean!) {
          manageSpaceTag(space: $space, _id: $_id, target: $target, tagged: $tagged)
        }`,
        { space: args.space_id, _id: args.tag_id, target: args.target, tagged: args.tagged },
      );
      return { managed: true, tag_id: args.tag_id, target: args.target, tagged: args.tagged };
    },
  }),
  buildCapability({
    name: 'space_event_requests',
    category: 'space',
    displayName: 'space event requests',
    description: 'List event requests submitted to a space for moderation.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'state', type: 'string', description: 'Filter by state', required: false,
        enum: ['pending', 'approved', 'declined'] },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '25' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceEventRequests',
    requiresEvent: false,
    execute: async (args) => {
      let limit = 25;
      if (args.limit !== undefined) {
        const n = Number(args.limit);
        if (!isNaN(n)) limit = Math.max(1, n);
      }
      let skip = 0;
      if (args.skip !== undefined) {
        const n = Number(args.skip);
        if (!isNaN(n)) skip = Math.max(0, n);
      }
      const variables: Record<string, unknown> = {
        space: args.space_id,
        limit,
        skip,
      };
      if (args.state !== undefined) variables.state = args.state;
      const result = await graphqlRequest<{ getSpaceEventRequests: unknown }>(
        `query($space: MongoID!, $state: SpaceEventRequestState, $limit: Int!, $skip: Int!) {
          getSpaceEventRequests(space: $space, state: $state, limit: $limit, skip: $skip) {
            total
            records {
              _id state created_at
              event_expanded { _id title shortid start }
              created_by_expanded { _id name }
              decided_at decided_by_expanded { _id name }
            }
          }
        }`,
        variables,
      );
      return result.getSpaceEventRequests;
    },
    formatResult: (result) => {
      const r = result as { total: number; records: Array<{ _id: string; state: string; created_at: string; event_expanded?: { title: string }; created_by_expanded?: { name: string }; decided_at?: string; decided_by_expanded?: { name: string } }> };
      if (!r || !r.records) return JSON.stringify(result);
      const lines = [`Total: ${r.total}`];
      for (const rec of r.records) {
        const event = rec.event_expanded?.title ?? 'Unknown';
        const by = rec.created_by_expanded?.name ?? 'Unknown';
        let line = `- [${rec.state}] "${event}" by ${by} (${rec.created_at})`;
        if (rec.decided_at && rec.decided_by_expanded) {
          line += ` (decided by ${rec.decided_by_expanded.name || 'unknown'})`;
        }
        lines.push(line);
      }
      return lines.join('\n');
    },
  }),
  buildCapability({
    name: 'space_event_requests_decide',
    category: 'space',
    displayName: 'space event requests decide',
    description: 'Approve or decline event requests submitted to a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'request_ids', type: 'string', description: 'Comma-separated request IDs', required: true },
      { name: 'decision', type: 'string', description: 'Decision', required: true,
        enum: ['approved', 'declined'] },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'decideSpaceEventRequests',
    requiresEvent: false,
    execute: async (args) => {
      const requests = (args.request_ids as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (requests.length === 0) throw new Error('At least one request ID is required');
      const result = await graphqlRequest<{ decideSpaceEventRequests: unknown }>(
        `mutation($input: DecideSpaceEventRequestsInput!) {
          decideSpaceEventRequests(input: $input)
        }`,
        {
          input: {
            space: args.space_id,
            requests,
            decision: args.decision,
          },
        },
      );
      return result.decideSpaceEventRequests;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      return result ? 'Event request decision applied.' : 'No changes applied — requests may have already been decided.';
    },
  }),
  buildCapability({
    name: 'space_event_summary',
    category: 'space',
    displayName: 'space event summary',
    description: 'Get aggregate event counts for a space (total, virtual, IRL, live, upcoming, past). For per-event performance, use space_events_insight.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceEventSummary',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceEventSummary: unknown }>(
        `query($space: MongoID!) {
          getSpaceEventSummary(space: $space) {
            all_events virtual_events irl_events live_events upcoming_events past_events
          }
        }`,
        { space: args.space_id },
      );
      return result.getSpaceEventSummary;
    },
    formatResult: (result) => {
      const r = result as { all_events: number; virtual_events: number; irl_events: number; live_events: number; upcoming_events: number; past_events: number };
      if (!r || r.all_events === undefined) return JSON.stringify(result);
      return `All: ${r.all_events}, Virtual: ${r.virtual_events}, IRL: ${r.irl_events}, Live: ${r.live_events}, Upcoming: ${r.upcoming_events}, Past: ${r.past_events}`;
    },
  }),
  buildCapability({
    name: 'space_sending_quota',
    category: 'space',
    displayName: 'space sending quota',
    description: 'Check newsletter/email sending quota for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceSendingQuota',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceSendingQuota: unknown }>(
        `query($space: MongoID!) {
          getSpaceSendingQuota(space: $space) {
            type reset_frequency remain total used
          }
        }`,
        { space: args.space_id },
      );
      return result.getSpaceSendingQuota;
    },
    formatResult: (result) => {
      const r = result as { type: string; reset_frequency: string; remain: number; total: number; used: number };
      if (!r || r.total === undefined) return JSON.stringify(result);
      return `Quota type: ${r.type}, Used: ${r.used}/${r.total}, Remaining: ${r.remain}, Reset: ${r.reset_frequency}`;
    },
  }),
  buildCapability({
    name: 'space_my_event_requests',
    category: 'space',
    displayName: 'space my event requests',
    description: 'List your own event requests submitted to a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'state', type: 'string', description: 'Filter by state', required: false,
        enum: ['pending', 'approved', 'declined'] },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '25' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getMySpaceEventRequests',
    requiresEvent: false,
    execute: async (args) => {
      let limit = 25;
      if (args.limit !== undefined) {
        const n = Number(args.limit);
        if (!isNaN(n)) limit = Math.max(1, n);
      }
      let skip = 0;
      if (args.skip !== undefined) {
        const n = Number(args.skip);
        if (!isNaN(n)) skip = Math.max(0, n);
      }
      const variables: Record<string, unknown> = {
        space: args.space_id,
        limit,
        skip,
      };
      if (args.state !== undefined) variables.state = args.state;
      const result = await graphqlRequest<{ getMySpaceEventRequests: unknown }>(
        `query($space: MongoID!, $state: SpaceEventRequestState, $limit: Int!, $skip: Int!) {
          getMySpaceEventRequests(space: $space, state: $state, limit: $limit, skip: $skip) {
            total
            records {
              _id state created_at decided_at
              event_expanded { _id title shortid start }
            }
          }
        }`,
        variables,
      );
      return result.getMySpaceEventRequests;
    },
    formatResult: (result) => {
      const r = result as { total: number; records: Array<{ _id: string; state: string; created_at: string; event_expanded?: { title: string } }> };
      if (!r || !r.records) return JSON.stringify(result);
      const lines = [`Total: ${r.total}`];
      for (const rec of r.records) {
        const event = rec.event_expanded?.title ?? 'Unknown';
        lines.push(`- [${rec.state}] "${event}" (${rec.created_at})`);
      }
      return lines.join('\n');
    },
  }),
  buildCapability({
    name: 'space_role_features',
    category: 'space',
    displayName: 'space role features',
    description: 'List features/permissions enabled for a specific role in a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'role', type: 'string', description: 'Space role', required: true,
        enum: ['unsubscriber', 'subscriber', 'ambassador', 'admin', 'creator'] },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'listSpaceRoleFeatures',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ listSpaceRoleFeatures: unknown }>(
        `query($space: MongoID!, $role: SpaceRole!) {
          listSpaceRoleFeatures(space: $space, role: $role) {
            features { code title }
            codes
          }
        }`,
        { space: args.space_id, role: args.role },
      );
      return result.listSpaceRoleFeatures;
    },
    formatResult: (result) => {
      const r = result as { features: Array<{ code: string; title: string }>; codes: string[] };
      if (!r || !r.features) return JSON.stringify(result);
      const lines = [`Role features (${r.features.length}):`];
      for (const f of r.features) {
        lines.push(`- ${f.code}: ${f.title}`);
      }
      return lines.join('\n');
    },
  }),
  buildCapability({
    name: 'space_role_features_update',
    category: 'space',
    displayName: 'space role features update',
    description: `Set the complete list of features/permissions for a role in a space. This REPLACES all current features — include every feature code the role should have. Available codes: ${VALID_FEATURE_CODES.join(', ')}`,
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'role', type: 'string', description: 'Space role', required: true,
        enum: ['unsubscriber', 'subscriber', 'ambassador', 'admin', 'creator'] },
      { name: 'codes', type: 'string', description: 'Comma-separated feature codes to enable for this role', required: true },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'updateSpaceRoleFeatures',
    requiresEvent: false,
    execute: async (args) => {
      const codes = (args.codes as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (codes.length === 0) throw new Error('At least one feature code is required');
      const invalid = codes.filter(c => !VALID_FEATURE_CODES_SET.has(c));
      if (invalid.length > 0) {
        throw new Error(`Invalid feature code(s): ${invalid.join(', ')}. Valid codes: ${VALID_FEATURE_CODES.join(', ')}`);
      }
      const input = { space: args.space_id, role: args.role, codes };
      const result = await graphqlRequest<{ updateSpaceRoleFeatures: unknown }>(
        `mutation($input: UpdateSpaceRoleFeaturesInput!) {
          updateSpaceRoleFeatures(input: $input)
        }`,
        { input },
      );
      return result.updateSpaceRoleFeatures;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      return result ? 'Role features updated. Use space_role_features to verify the current state.' : 'No changes applied — features may already match the requested configuration.';
    },
  }),
  buildCapability({
    name: 'space_member_growth',
    category: 'space',
    displayName: 'space member growth',
    description: 'Get member growth time series for a space by role over a date range.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'role', type: 'string', description: 'Role to track', required: true,
        enum: ['unsubscriber', 'subscriber', 'ambassador', 'admin', 'creator'] },
      { name: 'start', type: 'string', description: 'Start date (ISO 8601)', required: true },
      { name: 'end', type: 'string', description: 'End date (ISO 8601)', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceMemberAmountByDate',
    requiresEvent: false,
    execute: async (args) => {
      const startDate = new Date(args.start as string);
      if (isNaN(startDate.getTime())) throw new Error('Invalid start date');
      const endDate = new Date(args.end as string);
      if (isNaN(endDate.getTime())) throw new Error('Invalid end date');
      if (startDate >= endDate) throw new Error('start date must be before end date');
      const result = await graphqlRequest<{ getSpaceMemberAmountByDate: unknown }>(
        `query($space: MongoID!, $role: SpaceRole!, $start: DateTimeISO!, $end: DateTimeISO!) {
          getSpaceMemberAmountByDate(space: $space, role: $role, start: $start, end: $end) {
            _id total
          }
        }`,
        { space: args.space_id, role: args.role, start: startDate.toISOString(), end: endDate.toISOString() },
      );
      return result.getSpaceMemberAmountByDate;
    },
    formatResult: (result) => {
      const items = result as Array<{ _id: string; total: number }>;
      if (!Array.isArray(items)) return JSON.stringify(result);
      if (!items.length) return 'No data found for the given parameters.';
      const lines = items.map((p) => `- ${p._id}: ${p.total}`);
      return `${items.length} data point(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'space_top_attendees',
    category: 'space',
    displayName: 'space top attendees',
    description: 'Get top event attendees leaderboard for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getTopSpaceEventAttendees',
    requiresEvent: false,
    execute: async (args) => {
      let limit = 10;
      if (args.limit !== undefined) {
        const n = Number(args.limit);
        if (!isNaN(n)) limit = Math.max(1, n);
      }
      const result = await graphqlRequest<{ getTopSpaceEventAttendees: unknown }>(
        `query($space: MongoID!, $limit: Float!) {
          getTopSpaceEventAttendees(space: $space, limit: $limit) {
            attended_event_count
            user_expanded { _id name email }
            non_login_user { _id name email }
          }
        }`,
        { space: args.space_id, limit },
      );
      return result.getTopSpaceEventAttendees;
    },
    formatResult: (result) => {
      const items = result as Array<{ attended_event_count: number; user_expanded?: { name: string; email: string }; non_login_user?: { name: string; email: string } }>;
      if (!Array.isArray(items)) return JSON.stringify(result);
      if (!items.length) return 'No attendees found for this space.';
      const lines = items.map((a) => {
        const user = a.user_expanded || a.non_login_user;
        const name = user?.name || 'Unknown';
        const email = user?.email || '';
        const emailPart = email ? ` (${email})` : '';
        return `- ${name}${emailPart}: ${a.attended_event_count} event(s)`;
      });
      return `${items.length} attendee(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'space_location_leaderboard',
    category: 'space',
    displayName: 'space location leaderboard',
    description: 'Get geographic distribution of events in a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'by_city', type: 'boolean', description: 'Group by city instead of country', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceEventLocationsLeaderboard',
    requiresEvent: false,
    execute: async (args) => {
      let limit = 10;
      if (args.limit !== undefined) {
        const n = Number(args.limit);
        if (!isNaN(n)) limit = Math.max(1, n);
      }
      const variables: Record<string, unknown> = { space: args.space_id, limit };
      if (args.by_city !== undefined) variables.city = args.by_city;
      const result = await graphqlRequest<{ getSpaceEventLocationsLeaderboard: unknown }>(
        `query($space: MongoID!, $city: Boolean, $limit: Float!) {
          getSpaceEventLocationsLeaderboard(space: $space, city: $city, limit: $limit) {
            country city total
          }
        }`,
        variables,
      );
      return result.getSpaceEventLocationsLeaderboard;
    },
    formatResult: (result) => {
      const items = result as Array<{ country: string; city: string | null; total: number }>;
      if (!Array.isArray(items)) return JSON.stringify(result);
      if (!items.length) return 'No location data found for this space.';
      const lines = items.map((loc) => {
        const label = loc.city ? `${loc.city}, ${loc.country}` : loc.country;
        return `- ${label}: ${loc.total}`;
      });
      return `${items.length} location(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'space_reward_stats',
    category: 'space',
    displayName: 'space reward stats',
    description: 'Get token reward program statistics for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceRewardStatistics',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceRewardStatistics: unknown }>(
        `query($space: MongoID!) {
          getSpaceRewardStatistics(space: $space) {
            events_count checkin_settings_count ticket_settings_count unique_recipients_count
          }
        }`,
        { space: args.space_id },
      );
      return result.getSpaceRewardStatistics;
    },
    formatResult: (result) => {
      const r = result as { events_count: number; checkin_settings_count: number; ticket_settings_count: number; unique_recipients_count: number };
      if (!r || typeof r !== 'object') return JSON.stringify(result);
      return `Reward stats: ${r.events_count} event(s), ${r.checkin_settings_count} checkin setting(s), ${r.ticket_settings_count} ticket setting(s), ${r.unique_recipients_count} unique recipient(s)`;
    },
  }),
  buildCapability({
    name: 'space_set_avatar',
    category: 'space',
    displayName: 'space set avatar',
    description:
      'Set a space profile photo from a local file or existing file ID. Recommended: 800x800 pixels for best display.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'file_id', type: 'string', description: 'Existing file ID from file_upload (provide this OR file_path, not both)', required: false },
      { name: 'file_path', type: 'string', description: 'Local file path to upload (provide this OR file_id, not both)', required: false },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'updateSpace',
    requiresEvent: false,
    execute: async (args) => {
      return setSpaceImage(
        args.space_id as string,
        'image_avatar',
        args.file_id as string | undefined,
        args.file_path as string | undefined,
      );
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; title: string; image_avatar: string };
      return `Avatar set for space "${r.title}" (${r._id}).`;
    },
  }),
  buildCapability({
    name: 'space_set_cover',
    category: 'space',
    displayName: 'space set cover',
    description:
      'Set a space cover image from a local file or existing file ID. Recommended: 800x800 pixels for best display.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'file_id', type: 'string', description: 'Existing file ID from file_upload (provide this OR file_path, not both)', required: false },
      { name: 'file_path', type: 'string', description: 'Local file path to upload (provide this OR file_id, not both)', required: false },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'updateSpace',
    requiresEvent: false,
    execute: async (args) => {
      return setSpaceImage(
        args.space_id as string,
        'image_cover',
        args.file_id as string | undefined,
        args.file_path as string | undefined,
      );
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; title: string; image_cover: string };
      return `Cover image set for space "${r.title}" (${r._id}).`;
    },
  }),
];
