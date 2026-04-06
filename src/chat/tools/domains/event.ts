import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';
import { registrySearch } from '../../../api/registry.js';
import { getDefaultSpace } from '../../../auth/store.js';
import { parseJsonObject } from '../utils/index.js';

export const eventTools: CanonicalCapability[] = [
  buildCapability({
    name: 'event_create',
    category: 'event',
    displayName: 'event create',
    description: 'Create a new event with full configuration options. Returns the event ID, title, and status.',
    params: [
      { name: 'title', type: 'string', description: 'Event title', required: true },
      { name: 'start', type: 'string', description: 'Start date (ISO 8601)', required: true },
      { name: 'end', type: 'string', description: 'End date (ISO 8601)', required: false },
      { name: 'description', type: 'string', description: 'Event description', required: false },
      { name: 'space', type: 'string', description: 'Space ID', required: false },
      { name: 'address', type: 'string', description: 'Venue address', required: false },
      { name: 'guest_limit', type: 'number', description: 'Maximum number of guests', required: false },
      { name: 'guest_limit_per', type: 'number', description: 'Maximum guests per registration', required: false },
      { name: 'ticket_limit_per', type: 'number', description: 'Maximum tickets per user', required: false },
      { name: 'private', type: 'boolean', description: 'Private event (requires approval to join)', required: false },
      { name: 'approval_required', type: 'boolean', description: 'Require approval for registrations', required: false },
      { name: 'application_required', type: 'boolean', description: 'Require application form', required: false },
      { name: 'timezone', type: 'string', description: 'Event timezone (e.g. America/New_York)', required: false },
      { name: 'virtual', type: 'boolean', description: 'Virtual event', required: false },
      { name: 'virtual_url', type: 'string', description: 'Virtual event URL', required: false },
      { name: 'registration_disabled', type: 'boolean', description: 'Disable registration', required: false },
      { name: 'currency', type: 'string', description: 'Payment currency code (e.g. USD)', required: false },
      { name: 'tags', type: 'string[]', description: 'Event tags', required: false },
      { name: 'guest_directory_enabled', type: 'boolean', description: 'Enable guest directory', required: false },
      { name: 'subevent_enabled', type: 'boolean', description: 'Enable sub-events', required: false },
      { name: 'terms_text', type: 'string', description: 'Terms and conditions text', required: false },
      { name: 'welcome_text', type: 'string', description: 'Welcome message for attendees', required: false },
      { name: 'theme_data', type: 'string', description: 'Theme configuration as JSON (use theme_build tool to generate)', required: false },
      { name: 'dark_theme_image', type: 'string', description: 'File ID for dark mode background image (from file_upload)', required: false },
      { name: 'light_theme_image', type: 'string', description: 'File ID for light mode background image (from file_upload)', required: false },
    ],
    whenToUse: 'to set up a new event with title, date, location, and details',
    searchHint: 'create new event plan schedule host organize',
    alwaysLoad: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createEvent',
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const spaceId = (args.space as string) || getDefaultSpace();
      const input: Record<string, unknown> = {
        title: args.title,
        start: new Date(args.start as string).toISOString(),
        end: args.end ? new Date(args.end as string).toISOString() : undefined,
        description: args.description,
        space: spaceId,
        address: args.address ? { title: args.address } : undefined,
      };
      if (args.guest_limit !== undefined) {
        const n = Number(args.guest_limit);
        if (!isNaN(n)) input.guest_limit = n;
      }
      if (args.guest_limit_per !== undefined) {
        const n = Number(args.guest_limit_per);
        if (!isNaN(n)) input.guest_limit_per = n;
      }
      if (args.ticket_limit_per !== undefined) {
        const n = Number(args.ticket_limit_per);
        if (!isNaN(n)) input.ticket_limit_per = n;
      }
      if (args.private !== undefined) input.private = args.private;
      if (args.approval_required !== undefined) input.approval_required = args.approval_required;
      if (args.application_required !== undefined) input.application_required = args.application_required;
      if (args.timezone !== undefined) input.timezone = args.timezone;
      if (args.virtual !== undefined) input.virtual = args.virtual;
      if (args.virtual_url !== undefined) input.virtual_url = args.virtual_url;
      if (args.registration_disabled !== undefined) input.registration_disabled = args.registration_disabled;
      if (args.currency !== undefined) input.currency = args.currency;
      if (args.tags !== undefined) input.tags = args.tags;
      if (args.guest_directory_enabled !== undefined) input.guest_directory_enabled = args.guest_directory_enabled;
      if (args.subevent_enabled !== undefined) input.subevent_enabled = args.subevent_enabled;
      if (args.terms_text !== undefined) input.terms_text = args.terms_text;
      if (args.welcome_text !== undefined) input.welcome_text = args.welcome_text;
      if (args.theme_data !== undefined) input.theme_data = parseJsonObject(args.theme_data as string, 'theme_data');
      if (args.dark_theme_image !== undefined) input.dark_theme_image = args.dark_theme_image;
      if (args.light_theme_image !== undefined) input.light_theme_image = args.light_theme_image;

      const result = await graphqlRequest<{ createEvent: unknown }>(
        `mutation($input: EventInput!) {
          createEvent(input: $input) {
            _id title shortid start end published description
            virtual virtual_url private guest_limit guest_limit_per timezone approval_required
            address { title city country latitude longitude }
            theme_data dark_theme_image light_theme_image
          }
        }`,
        { input },
      );
      return result.createEvent;
    },
    formatResult: (result) => {
      const r = result as { _id: string; title: string; published: boolean; private?: boolean; virtual?: boolean; guest_limit?: number; approval_required?: boolean };
      const config: string[] = [];
      if (r.private) config.push('private');
      if (r.virtual) config.push('virtual');
      if (r.guest_limit != null) config.push(`limit: ${r.guest_limit}`);
      if (r.approval_required) config.push('approval required');
      const configStr = config.length > 0 ? ` [${config.join(', ')}]` : '';
      return `Event created: "${r.title}" (${r.published ? 'published' : 'draft'})${configStr}. Add tickets with /plan tickets_create_type.`;
    },
  }),
  buildCapability({
    name: 'event_list',
    category: 'event',
    displayName: 'event list',
    description: 'List your hosted events.',
    params: [
      { name: 'draft', type: 'boolean', description: 'Show only drafts', required: false },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'to list events the user is hosting or has organized',
    searchHint: 'list show events hosting upcoming organized managed',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getHostingEvents',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'slashCommand', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getHostingEvents: { items: Array<Record<string, unknown>> } }>(
        `query($draft: Boolean, $search: String, $limit: Int, $skip: Int) {
          getHostingEvents(draft: $draft, search: $search, limit: $limit, skip: $skip) {
            items { _id title shortid start end published }
          }
        }`,
        {
          draft: args.draft || undefined,
          search: args.search as string | undefined,
          limit: (args.limit as number) || 20,
          skip: (args.skip as number) || 0,
        },
      );
      return result.getHostingEvents;
    },
  }),
  buildCapability({
    name: 'event_search',
    category: 'event',
    displayName: 'event search',
    description: 'Search events across all platforms via federated search.',
    params: [
      { name: 'query', type: 'string', description: 'Search keywords', required: true },
      { name: 'lat', type: 'number', description: 'Latitude', required: false },
      { name: 'lng', type: 'number', description: 'Longitude', required: false },
      { name: 'radius_km', type: 'number', description: 'Radius in km', required: false, default: '25' },
      { name: 'category', type: 'string', description: 'Category filter', required: false },
      { name: 'date_from', type: 'string', description: 'Start date (ISO 8601)', required: false },
      { name: 'date_to', type: 'string', description: 'End date (ISO 8601)', required: false },
      { name: 'price_min', type: 'number', description: 'Min price', required: false },
      { name: 'price_max', type: 'number', description: 'Max price', required: false },
      { name: 'sort', type: 'string', description: 'Sort order', required: false,
        enum: ['relevance', 'price_asc', 'price_desc', 'date_asc', 'date_desc', 'distance'] },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
    ],
    whenToUse: 'to find events by keyword, location, date, or category',
    searchHint: 'search find discover events nearby explore browse filter',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendService: 'external',
    // No backendResolver — uses external registry search API, not GraphQL
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      return registrySearch({
        q: args.query as string,
        lat: args.lat as number | undefined,
        lng: args.lng as number | undefined,
        radius_km: args.radius_km as number | undefined,
        category: args.category as string | undefined,
        start_after: args.date_from as string | undefined,
        start_before: args.date_to as string | undefined,
        price_min: args.price_min as number | undefined,
        price_max: args.price_max as number | undefined,
        sort: args.sort as string | undefined,
        limit: (args.limit as number) || 10,
      });
    },
  }),
  buildCapability({
    name: 'event_get',
    category: 'event',
    displayName: 'event get',
    description: 'Get detailed information about a specific event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'to retrieve full details for a specific event by ID',
    searchHint: 'get details info event specific view fetch',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEvent',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getEvent: unknown }>(
        `query($id: MongoID!) {
          getEvent(id: $id) {
            _id title shortid start end published description
            virtual virtual_url private guest_limit guest_limit_per ticket_limit_per
            timezone approval_required application_required registration_disabled
            currency tags guest_directory_enabled subevent_enabled terms_text welcome_text
            theme_data dark_theme_image light_theme_image
            address { title city country latitude longitude }
          }
        }`,
        { id: args.event_id },
      );
      return result.getEvent;
    },
  }),
  buildCapability({
    name: 'event_update',
    category: 'event',
    displayName: 'event update',
    description: 'Update an existing event with full configuration options.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'title', type: 'string', description: 'New title', required: false },
      { name: 'start', type: 'string', description: 'New start date (ISO 8601)', required: false },
      { name: 'end', type: 'string', description: 'New end date (ISO 8601)', required: false },
      { name: 'description', type: 'string', description: 'New description', required: false },
      { name: 'address', type: 'string', description: 'New venue address', required: false },
      { name: 'guest_limit', type: 'number', description: 'Maximum number of guests', required: false },
      { name: 'guest_limit_per', type: 'number', description: 'Maximum guests per registration', required: false },
      { name: 'ticket_limit_per', type: 'number', description: 'Maximum tickets per user', required: false },
      { name: 'private', type: 'boolean', description: 'Private event (requires approval to join)', required: false },
      { name: 'approval_required', type: 'boolean', description: 'Require approval for registrations', required: false },
      { name: 'application_required', type: 'boolean', description: 'Require application form', required: false },
      { name: 'timezone', type: 'string', description: 'Event timezone (e.g. America/New_York)', required: false },
      { name: 'virtual', type: 'boolean', description: 'Virtual event', required: false },
      { name: 'virtual_url', type: 'string', description: 'Virtual event URL', required: false },
      { name: 'registration_disabled', type: 'boolean', description: 'Disable registration', required: false },
      { name: 'currency', type: 'string', description: 'Payment currency code (e.g. USD)', required: false },
      { name: 'tags', type: 'string[]', description: 'Event tags', required: false },
      { name: 'guest_directory_enabled', type: 'boolean', description: 'Enable guest directory', required: false },
      { name: 'subevent_enabled', type: 'boolean', description: 'Enable sub-events', required: false },
      { name: 'terms_text', type: 'string', description: 'Terms and conditions text', required: false },
      { name: 'welcome_text', type: 'string', description: 'Welcome message for attendees', required: false },
      { name: 'theme_data', type: 'string', description: 'Theme configuration as JSON (use theme_build tool to generate)', required: false },
      { name: 'dark_theme_image', type: 'string', description: 'File ID for dark mode background image (from file_upload)', required: false },
      { name: 'light_theme_image', type: 'string', description: 'File ID for light mode background image (from file_upload)', required: false },
    ],
    whenToUse: 'to change an event\'s title, date, location, or other settings',
    searchHint: 'update edit modify change event settings configure',
    alwaysLoad: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateEvent',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.title !== undefined) input.title = args.title;
      if (args.start !== undefined) input.start = new Date(args.start as string).toISOString();
      if (args.end !== undefined) input.end = new Date(args.end as string).toISOString();
      if (args.description !== undefined) input.description = args.description;
      if (args.address !== undefined) input.address = { title: args.address };
      if (args.virtual !== undefined) input.virtual = args.virtual;
      if (args.guest_limit !== undefined) {
        const n = Number(args.guest_limit);
        if (!isNaN(n)) input.guest_limit = n;
      }
      if (args.guest_limit_per !== undefined) {
        const n = Number(args.guest_limit_per);
        if (!isNaN(n)) input.guest_limit_per = n;
      }
      if (args.ticket_limit_per !== undefined) {
        const n = Number(args.ticket_limit_per);
        if (!isNaN(n)) input.ticket_limit_per = n;
      }
      if (args.private !== undefined) input.private = args.private;
      if (args.approval_required !== undefined) input.approval_required = args.approval_required;
      if (args.application_required !== undefined) input.application_required = args.application_required;
      if (args.timezone !== undefined) input.timezone = args.timezone;
      if (args.virtual_url !== undefined) input.virtual_url = args.virtual_url;
      if (args.registration_disabled !== undefined) input.registration_disabled = args.registration_disabled;
      if (args.currency !== undefined) input.currency = args.currency;
      if (args.tags !== undefined) input.tags = args.tags;
      if (args.guest_directory_enabled !== undefined) input.guest_directory_enabled = args.guest_directory_enabled;
      if (args.subevent_enabled !== undefined) input.subevent_enabled = args.subevent_enabled;
      if (args.terms_text !== undefined) input.terms_text = args.terms_text;
      if (args.welcome_text !== undefined) input.welcome_text = args.welcome_text;
      if (args.theme_data !== undefined) input.theme_data = parseJsonObject(args.theme_data as string, 'theme_data');
      if (args.dark_theme_image !== undefined) input.dark_theme_image = args.dark_theme_image;
      if (args.light_theme_image !== undefined) input.light_theme_image = args.light_theme_image;

      const result = await graphqlRequest<{ updateEvent: unknown }>(
        `mutation($id: MongoID!, $input: EventInput!) {
          updateEvent(_id: $id, input: $input) {
            _id title shortid start end published description
            virtual virtual_url private guest_limit guest_limit_per timezone approval_required
            theme_data dark_theme_image light_theme_image
          }
        }`,
        { id: args.event_id, input },
      );
      return result.updateEvent;
    },
    formatResult: (result) => {
      const r = result as { _id: string; title: string };
      return `"${r.title}" updated.`;
    },
  }),
  buildCapability({
    name: 'event_publish',
    category: 'event',
    displayName: 'event publish',
    description: 'Publish a draft event to make it live.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'after creating an event, to make it visible to attendees',
    searchHint: 'publish launch go live event activate release',
    alwaysLoad: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiPublishEvent',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ aiPublishEvent: unknown }>(
        `mutation($id: MongoID!) {
          aiPublishEvent(id: $id) { _id title published shortid }
        }`,
        { id: args.event_id },
      );
      return result.aiPublishEvent;
    },
    formatResult: (result) => {
      const r = result as { _id: string; title: string };
      return `"${r.title}" is now published and live.`;
    },
  }),
  buildCapability({
    name: 'event_cancel',
    category: 'event',
    displayName: 'event cancel',
    description: 'Cancel an event. This action cannot be undone.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'to cancel an event and notify registered attendees',
    searchHint: 'cancel abort stop event delete discontinue',
    alwaysLoad: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'cancelEvent',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      await graphqlRequest(
        'mutation($id: MongoID!) { cancelEvent(id: $id) }',
        { id: args.event_id },
      );
      return { cancelled: true, event_id: args.event_id };
    },
  }),
  buildCapability({
    name: 'event_ticket_sold_insight',
    category: 'event',
    displayName: 'event ticket sales',
    description: 'Get ticket sales data for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants ticket sales analytics',
    searchHint: 'ticket sales insight analytics sold revenue',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventTicketSoldChartData',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventTicketSoldChartData: unknown }>(
        `query($event: MongoID!) {
          getEventTicketSoldChartData(event: $event) {
            total_sold total_revenue_cents currency
            by_type { ticket_type_id title sold revenue_cents }
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventTicketSoldChartData;
    },
  }),
  buildCapability({
    name: 'event_view_insight',
    category: 'event',
    displayName: 'event view stats',
    description: 'Get page view statistics for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants event page view analytics',
    searchHint: 'views insight analytics traffic pageviews',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventViewChartData',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventViewChartData: unknown }>(
        `query($event: MongoID!) {
          getEventViewChartData(event: $event) {
            total_views unique_visitors
            top_sources { source count }
            top_cities { city count }
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventViewChartData;
    },
  }),
  buildCapability({
    name: 'event_guest_stats',
    category: 'event',
    displayName: 'event guest stats',
    description: 'Get guest statistics for an event (going, pending, declined, checked in).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'to get a summary of RSVPs, approvals, and attendance numbers',
    searchHint: 'guest stats attendance rsvp count breakdown',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventGuestsStatistics',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventGuestsStatistics: unknown }>(
        `query($event: MongoID!) {
          getEventGuestsStatistics(event: $event) {
            going pending_approval pending_invite declined checked_in total
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventGuestsStatistics;
    },
    formatResult: (result) => {
      const r = result as { going: number; pending_approval: number; pending_invite: number; declined: number; checked_in: number; total: number };
      return `Guests: ${r.going} going, ${r.pending_approval} pending approval, ${r.pending_invite} pending invite, ${r.declined} declined, ${r.checked_in} checked in (${r.total} total).`;
    },
  }),
  buildCapability({
    name: 'event_guests',
    category: 'event',
    displayName: 'event guests',
    description: 'List attendees for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'search', type: 'string', description: 'Search guests by name or email', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '50' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'to view the list of registered attendees for an event',
    searchHint: 'guests attendees list registered participants roster',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listEventGuests',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ listEventGuests: unknown }>(
        `query($event: MongoID!, $search: String, $limit: Int, $skip: Int) {
          listEventGuests(event: $event, search: $search, limit: $limit, skip: $skip) {
            items { name email status ticket_type_title checked_in }
          }
        }`,
        {
          event: args.event_id,
          search: args.search as string | undefined,
          limit: (args.limit as number) || 50,
          skip: (args.skip as number) || 0,
        },
      );
      return result.listEventGuests;
    },
  }),
  buildCapability({
    name: 'event_invite',
    category: 'event',
    displayName: 'event invite',
    description: 'Send email invitations to an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'emails', type: 'string[]', description: 'Email addresses to invite', required: true },
    ],
    whenToUse: 'when user wants to invite people to an event',
    searchHint: 'invite send invitation guests email',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'inviteEvent',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      await graphqlRequest(
        'mutation($input: InviteEventInput!) { inviteEvent(input: $input) }',
        { input: { event: args.event_id, emails: args.emails } },
      );
      return { sent: true, count: (args.emails as string[]).length };
    },
  }),
  buildCapability({
    name: 'event_approvals',
    category: 'event',
    displayName: 'event approvals',
    description: 'Approve or decline event join requests.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'decision', type: 'string', description: 'Decision: approved or declined', required: true,
        enum: ['approved', 'declined'] },
      { name: 'request_ids', type: 'string[]', description: 'Specific request IDs (optional)', required: false },
    ],
    whenToUse: 'when user wants to approve or reject join requests',
    searchHint: 'approve reject requests pending join',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'decideEventCohostRequest',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ decideEventCohostRequest: unknown }>(
        `mutation($event: MongoID!, $decision: String!, $request_ids: [MongoID!]) {
          decideEventCohostRequest(event: $event, decision: $decision, request_ids: $request_ids) {
            processed_count decision
          }
        }`,
        {
          event: args.event_id,
          decision: args.decision,
          request_ids: args.request_ids as string[] | undefined,
        },
      );
      return result.decideEventCohostRequest;
    },
  }),
  buildCapability({
    name: 'event_feedback_summary',
    category: 'event',
    displayName: 'event feedback summary',
    description: 'Get feedback summary (average rating, distribution) for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants event feedback overview',
    searchHint: 'feedback summary reviews ratings satisfaction',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventFeedbackSummary',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventFeedbackSummary: unknown }>(
        `query($event: MongoID!) {
          getEventFeedbackSummary(event: $event) {
            average_rating total_reviews
            rating_distribution { rating count }
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventFeedbackSummary;
    },
    formatResult: (result) => {
      const r = result as { average_rating: number; total_reviews: number };
      return `Feedback: ${r.average_rating}/5 average from ${r.total_reviews} reviews.`;
    },
  }),
  buildCapability({
    name: 'event_feedbacks',
    category: 'event',
    displayName: 'event feedbacks',
    description: 'List individual feedback entries for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'rate_value', type: 'number', description: 'Filter by rating (1-5)', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'when user wants individual event feedback entries',
    searchHint: 'feedbacks reviews individual entries comments',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listEventFeedBacks',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ listEventFeedBacks: unknown }>(
        `query($event: MongoID!, $rate_value: Float, $limit: Int, $skip: Int) {
          listEventFeedBacks(event: $event, rate_value: $rate_value, limit: $limit, skip: $skip) {
            items { user_name rating comment created_at }
          }
        }`,
        {
          event: args.event_id,
          rate_value: args.rate_value as number | undefined,
          limit: (args.limit as number) || 20,
          skip: (args.skip as number) || 0,
        },
      );
      return result.listEventFeedBacks;
    },
  }),
  buildCapability({
    name: 'event_checkins',
    category: 'event',
    displayName: 'event checkins',
    description: 'List check-in history for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'to see which attendees have checked in at the door',
    searchHint: 'checkins checked in arrivals scanned entry',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventCheckins',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventCheckins: unknown }>(
        `query($event: MongoID!, $limit: Int, $skip: Int) {
          getEventCheckins(event: $event, limit: $limit, skip: $skip) {
            items { name email ticket_type_title checked_in_at }
          }
        }`,
        {
          event: args.event_id,
          limit: (args.limit as number) || 20,
          skip: (args.skip as number) || 0,
        },
      );
      return result.getEventCheckins;
    },
  }),
  buildCapability({
    name: 'event_application_answers',
    category: 'event',
    displayName: 'event applications',
    description: 'Get application answers for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants to review application form responses',
    searchHint: 'application answers responses form submissions',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventApplicationAnswers',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      // Returns [AIEventApplicationAnswerEntry!]! — flat list, no items wrapper
      const result = await graphqlRequest<{ getEventApplicationAnswers: unknown }>(
        `query($event: MongoID!) {
          getEventApplicationAnswers(event: $event) {
            user_name email answers { question answer } submitted_at
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventApplicationAnswers;
    },
  }),
  buildCapability({
    name: 'accept_event',
    category: 'event',
    displayName: 'accept event',
    description: 'Accept an event invitation.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants to accept an event invitation',
    searchHint: 'accept rsvp yes attend confirm invitation',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'acceptEvent',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ acceptEvent: unknown }>(
        'mutation($id: MongoID!) { acceptEvent(id: $id) }',
        { id: args.event_id },
      );
      return result.acceptEvent;
    },
  }),
  buildCapability({
    name: 'decline_event',
    category: 'event',
    displayName: 'decline event',
    description: 'Decline an event invitation.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants to decline an event invitation',
    searchHint: 'decline reject rsvp no skip invitation',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'declineEvent',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ declineEvent: unknown }>(
        'mutation($id: MongoID!) { declineEvent(id: $id) }',
        { id: args.event_id },
      );
      return result.declineEvent;
    },
  }),
  buildCapability({
    name: 'event_clone',
    category: 'event',
    displayName: 'event clone',
    description: 'Clone an event to one or more new dates. Returns array of new event IDs.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID to clone', required: true },
      { name: 'dates', type: 'string[]', description: 'Array of ISO 8601 dates for the cloned events', required: true },
    ],
    whenToUse: 'when user wants to duplicate an existing event',
    searchHint: 'clone duplicate copy repeat event template',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'cloneEvent',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ cloneEvent: string[] }>(
        `mutation($input: CloneEventInput!) {
          cloneEvent(input: $input)
        }`,
        { input: { event: args.event_id, dates: args.dates } },
      );
      return { cloned_event_ids: result.cloneEvent, count: result.cloneEvent.length };
    },
    formatResult: (result) => {
      const r = result as { cloned_event_ids: string[]; count: number };
      return `Cloned ${r.count} event(s). IDs: ${r.cloned_event_ids.join(', ')}`;
    },
  }),
  buildCapability({
    name: 'event_recurring_dates',
    category: 'event',
    displayName: 'event recurring dates',
    description: 'Generate dates for a recurring event series. Returns array of dates.',
    params: [
      { name: 'start', type: 'string', description: 'Start date (ISO 8601)', required: true },
      { name: 'utc_offset_minutes', type: 'number', description: 'UTC offset in minutes (e.g., -300 for EST)', required: true },
      { name: 'repeat', type: 'string', description: 'Recurrence pattern', required: true, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] },
      { name: 'day_of_weeks', type: 'number[]', description: 'Days of week (0=Sun, 6=Sat)', required: false },
      { name: 'end', type: 'string', description: 'End date (ISO 8601)', required: false },
      { name: 'count', type: 'number', description: 'Number of dates to generate (max 100)', required: false },
    ],
    whenToUse: 'when user wants to set up recurring event dates',
    searchHint: 'recurring repeat schedule series dates weekly',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'generateRecurringDates',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        start: args.start,
        utcOffsetMinutes: args.utc_offset_minutes,
        repeat: args.repeat,
      };
      if (args.day_of_weeks) input.dayOfWeeks = args.day_of_weeks;
      if (args.end) input.end = args.end;
      if (args.count) input.count = args.count;
      const result = await graphqlRequest<{ generateRecurringDates: string[] }>(
        `query($input: GenerateRecurringDatesInput!) {
          generateRecurringDates(input: $input)
        }`,
        { input },
      );
      return { dates: result.generateRecurringDates, count: result.generateRecurringDates.length };
    },
    formatResult: (result) => {
      const r = result as { dates: string[]; count: number };
      return `Generated ${r.count} dates: ${r.dates.slice(0, 5).join(', ')}${r.count > 5 ? ` ... and ${r.count - 5} more` : ''}`;
    },
  }),
  buildCapability({
    name: 'event_list_cohost_requests',
    category: 'event',
    displayName: 'event cohost requests',
    description: 'List co-host requests/invitations for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'state', type: 'string', description: 'Filter by state', required: false,
        enum: ['DECLINED', 'ACCEPTED', 'PENDING'] },
    ],
    whenToUse: 'when user wants to see pending cohost requests',
    searchHint: 'cohost requests pending collaboration host',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventCohostRequests',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { event: args.event_id };
      if (args.state) input.state = args.state;

      const result = await graphqlRequest<{ getEventCohostRequests: unknown }>(
        `query($input: GetEventCohostRequestsInput!) {
          getEventCohostRequests(input: $input) {
            _id from to to_email state event_role stamp
          }
        }`,
        { input },
      );
      return result.getEventCohostRequests;
    },
  }),
  buildCapability({
    name: 'event_add_cohost',
    category: 'event',
    displayName: 'event add cohost',
    description: 'Add a co-host, gatekeeper, or representative to an event by email or user ID.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'email', type: 'string', description: 'Target email', required: false },
      { name: 'user_id', type: 'string', description: 'Target user ObjectId', required: false },
      { name: 'role', type: 'string', description: 'Role to assign', required: false,
        enum: ['cohost', 'gatekeeper', 'representative'] },
    ],
    whenToUse: 'when user wants to add a cohost to an event',
    searchHint: 'add cohost collaborator host partner',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'manageEventCohostRequests',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        decision: true,
      };
      if (args.email) input.to_email = args.email;
      if (args.user_id) input.to = args.user_id;
      if (args.role) input.event_role = args.role;

      const result = await graphqlRequest<{ manageEventCohostRequests: boolean }>(
        `mutation($input: ManageEventCohostRequestsInput!) {
          manageEventCohostRequests(input: $input)
        }`,
        { input },
      );
      return result.manageEventCohostRequests;
    },
  }),
  buildCapability({
    name: 'event_remove_cohost',
    category: 'event',
    displayName: 'event remove cohost',
    description: 'Remove a co-host from an event by email or user ID.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'email', type: 'string', description: 'Target email', required: false },
      { name: 'user_id', type: 'string', description: 'Target user ObjectId', required: false },
    ],
    whenToUse: 'when user wants to remove a cohost from an event',
    searchHint: 'remove cohost revoke collaborator host',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'manageEventCohostRequests',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        decision: false,
      };
      if (args.email) input.to_email = args.email;
      if (args.user_id) input.to = args.user_id;

      const result = await graphqlRequest<{ manageEventCohostRequests: boolean }>(
        `mutation($input: ManageEventCohostRequestsInput!) {
          manageEventCohostRequests(input: $input)
        }`,
        { input },
      );
      return result.manageEventCohostRequests;
    },
  }),
  buildCapability({
    name: 'event_broadcast_create',
    category: 'event',
    displayName: 'event broadcast create',
    description: 'Create a broadcast/livestream for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'provider', type: 'string', description: 'Broadcast provider', required: true,
        enum: ['embed', 'local', 'twitch', 'video', 'youtube', 'zoom'] },
      { name: 'provider_id', type: 'string', description: 'Provider-specific stream ID', required: true },
      { name: 'title', type: 'string', description: 'Broadcast title', required: true },
      { name: 'scheduled_start_time', type: 'string', description: 'ISO 8601 scheduled start', required: false },
      { name: 'scheduled_end_time', type: 'string', description: 'ISO 8601 scheduled end', required: false },
      { name: 'description', type: 'string', description: 'Broadcast description', required: false },
      { name: 'position', type: 'number', description: 'Display order', required: false },
    ],
    whenToUse: 'when user wants to send a broadcast message to guests',
    searchHint: 'broadcast message announce notify guests',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createEventBroadcast',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        provider: args.provider,
        provider_id: args.provider_id,
        title: args.title,
      };
      if (args.scheduled_start_time) input.scheduled_start_time = args.scheduled_start_time;
      if (args.scheduled_end_time) input.scheduled_end_time = args.scheduled_end_time;
      if (args.description) input.description = args.description;
      if (args.position !== undefined) input.position = args.position;

      const result = await graphqlRequest<{ createEventBroadcast: boolean }>(
        `mutation($event: MongoID!, $input: CreateEventBroadcastInput!) {
          createEventBroadcast(event: $event, input: $input)
        }`,
        { event: args.event_id, input },
      );
      return result.createEventBroadcast;
    },
  }),
  buildCapability({
    name: 'event_broadcast_update',
    category: 'event',
    displayName: 'event broadcast update',
    description: "Update a broadcast's settings.",
    params: [
      { name: 'broadcast_id', type: 'string', description: 'Broadcast ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'description', type: 'string', description: 'New description', required: false },
      { name: 'position', type: 'number', description: 'New display order', required: false },
    ],
    whenToUse: 'when user wants to edit a broadcast message',
    searchHint: 'update edit broadcast message modify',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateEventBroadcast',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.description) input.description = args.description;
      if (args.position !== undefined) input.position = args.position;

      const result = await graphqlRequest<{ updateEventBroadcast: boolean }>(
        `mutation($_id: MongoID!, $event: MongoID!, $input: UpdateEventBroadcastInput!) {
          updateEventBroadcast(_id: $_id, event: $event, input: $input)
        }`,
        { _id: args.broadcast_id, event: args.event_id, input },
      );
      return result.updateEventBroadcast;
    },
  }),
  buildCapability({
    name: 'event_broadcast_delete',
    category: 'event',
    displayName: 'event broadcast delete',
    description: 'Delete a broadcast from an event.',
    params: [
      { name: 'broadcast_id', type: 'string', description: 'Broadcast ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    whenToUse: 'when user wants to delete a broadcast message',
    searchHint: 'delete remove broadcast message cancel',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventBroadcast',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteEventBroadcast: boolean }>(
        `mutation($_id: MongoID!, $event: MongoID!) {
          deleteEventBroadcast(_id: $_id, event: $event)
        }`,
        { _id: args.broadcast_id, event: args.event_id },
      );
      return result.deleteEventBroadcast;
    },
  }),
  buildCapability({
    name: 'event_emails_list',
    category: 'event',
    displayName: 'event emails list',
    description: 'List email settings/workflows configured for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'system', type: 'boolean', description: 'Include system email templates', required: false },
      { name: 'scheduled', type: 'boolean', description: 'Filter by scheduled emails', required: false },
      { name: 'sent', type: 'boolean', description: 'Filter by sent emails', required: false },
    ],
    whenToUse: 'when user wants to see automated event emails',
    searchHint: 'emails list automated notifications triggers',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listEventEmailSettings',
    requiresSpace: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { event: args.event_id };
      if (args.system !== undefined) vars.system = args.system;
      if (args.scheduled !== undefined) vars.scheduled = args.scheduled;
      if (args.sent !== undefined) vars.sent = args.sent;

      const result = await graphqlRequest<{ listEventEmailSettings: unknown }>(
        `query($event: MongoID!, $system: Boolean, $scheduled: Boolean, $sent: Boolean) {
          listEventEmailSettings(event: $event, system: $system, scheduled: $scheduled, sent: $sent) {
            _id type is_system_email subject_preview body_preview disabled scheduled_at
          }
        }`,
        vars,
      );
      return result.listEventEmailSettings;
    },
  }),
  buildCapability({
    name: 'event_email_create',
    category: 'event',
    displayName: 'event email create',
    description: 'Create a custom email setting for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'type', type: 'string', description: 'EmailTemplateType enum value', required: true },
      { name: 'custom_subject_html', type: 'string', description: 'Custom email subject', required: false },
      { name: 'custom_body_html', type: 'string', description: 'Custom email body HTML', required: false },
      { name: 'scheduled_at', type: 'string', description: 'ISO 8601 scheduled send time', required: false },
      { name: 'disabled', type: 'boolean', description: 'Start disabled', required: false },
    ],
    whenToUse: 'when user wants to create an automated event email',
    searchHint: 'create email automated trigger notification',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createEventEmailSetting',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        type: args.type,
      };
      if (args.custom_subject_html) input.custom_subject_html = args.custom_subject_html;
      if (args.custom_body_html) input.custom_body_html = args.custom_body_html;
      if (args.scheduled_at) input.scheduled_at = args.scheduled_at;
      if (args.disabled !== undefined) input.disabled = args.disabled;

      const result = await graphqlRequest<{ createEventEmailSetting: unknown }>(
        `mutation($input: CreateEventEmailSettingInput!) {
          createEventEmailSetting(input: $input) {
            _id type is_system_email subject_preview disabled
          }
        }`,
        { input },
      );
      return result.createEventEmailSetting;
    },
  }),
  buildCapability({
    name: 'event_email_update',
    category: 'event',
    displayName: 'event email update',
    description: 'Update an existing email setting.',
    params: [
      { name: 'email_setting_id', type: 'string', description: 'Email setting ObjectId', required: true },
      { name: 'custom_subject_html', type: 'string', description: 'Updated subject HTML', required: false },
      { name: 'custom_body_html', type: 'string', description: 'Updated body HTML', required: false },
      { name: 'disabled', type: 'boolean', description: 'Enable/disable', required: false },
    ],
    whenToUse: 'when user wants to edit an automated event email',
    searchHint: 'update edit email automated notification',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateEventEmailSetting',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { _id: args.email_setting_id };
      if (args.custom_subject_html) input.custom_subject_html = args.custom_subject_html;
      if (args.custom_body_html) input.custom_body_html = args.custom_body_html;
      if (args.disabled !== undefined) input.disabled = args.disabled;

      const result = await graphqlRequest<{ updateEventEmailSetting: unknown }>(
        `mutation($input: UpdateEventEmailSettingInput!) {
          updateEventEmailSetting(input: $input) {
            _id type disabled subject_preview
          }
        }`,
        { input },
      );
      return result.updateEventEmailSetting;
    },
  }),
  buildCapability({
    name: 'event_email_delete',
    category: 'event',
    displayName: 'event email delete',
    description: 'Delete an email setting.',
    params: [
      { name: 'email_setting_id', type: 'string', description: 'Email setting ObjectId', required: true },
    ],
    whenToUse: 'when user wants to delete an automated event email',
    searchHint: 'delete remove email automated notification',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventEmailSetting',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteEventEmailSetting: boolean }>(
        `mutation($_id: MongoID!) {
          deleteEventEmailSetting(_id: $_id)
        }`,
        { _id: args.email_setting_id },
      );
      return result.deleteEventEmailSetting;
    },
  }),
  buildCapability({
    name: 'event_email_toggle',
    category: 'event',
    displayName: 'event email toggle',
    description: 'Enable or disable multiple email settings at once.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'email_setting_ids', type: 'string[]', description: 'Array of email setting ObjectIds', required: true },
      { name: 'disabled', type: 'boolean', description: 'true to disable, false to enable', required: true },
    ],
    whenToUse: 'when user wants to enable or disable an event email',
    searchHint: 'toggle enable disable email notification',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'toggleEventEmailSettings',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ toggleEventEmailSettings: boolean }>(
        `mutation($event: MongoID!, $ids: [MongoID!]!, $disabled: Boolean!) {
          toggleEventEmailSettings(event: $event, ids: $ids, disabled: $disabled)
        }`,
        { event: args.event_id, ids: args.email_setting_ids, disabled: args.disabled },
      );
      return result.toggleEventEmailSettings;
    },
  }),
  buildCapability({
    name: 'event_email_test',
    category: 'event',
    displayName: 'event email test',
    description: 'Send test emails for a specific email template type.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: false },
      { name: 'type', type: 'string', description: 'EmailTemplateType enum value', required: false },
      { name: 'test_recipients', type: 'string[]', description: 'Email addresses to send test to', required: true },
      { name: 'email_setting_id', type: 'string', description: 'Existing setting ID to test', required: false },
      { name: 'custom_subject_html', type: 'string', description: 'Override subject for test', required: false },
      { name: 'custom_body_html', type: 'string', description: 'Override body for test', required: false },
    ],
    whenToUse: 'when user wants to test send an event email',
    searchHint: 'test send preview email notification',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'sendEventEmailSettingTestEmails',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        test_recipients: args.test_recipients,
      };
      if (args.event_id) input.event = args.event_id;
      if (args.type) input.type = args.type;
      if (args.email_setting_id) input._id = args.email_setting_id;
      if (args.custom_subject_html) input.custom_subject_html = args.custom_subject_html;
      if (args.custom_body_html) input.custom_body_html = args.custom_body_html;

      const result = await graphqlRequest<{ sendEventEmailSettingTestEmails: boolean }>(
        `mutation($input: SendEventEmailSettingTestEmailsInput!) {
          sendEventEmailSettingTestEmails(input: $input)
        }`,
        { input },
      );
      return result.sendEventEmailSettingTestEmails;
    },
  }),
  buildCapability({
    name: 'event_ticket_statistics',
    category: 'event',
    displayName: 'event ticket statistics',
    description: 'Get ticket statistics for an event (all, checked in, cancelled, per ticket type).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    whenToUse: 'when user wants detailed ticket type statistics',
    searchHint: 'ticket statistics breakdown types sold',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getTicketStatistics',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getTicketStatistics: unknown }>(
        `query($id: MongoID!) {
          getTicketStatistics(id: $id) {
            all checked_in not_checked_in invited issued cancelled
            applicants { state count }
            ticket_types { ticket_type ticket_type_title count }
          }
        }`,
        { id: args.event_id },
      );
      return result.getTicketStatistics;
    },
  }),
  buildCapability({
    name: 'event_export_guests',
    category: 'event',
    displayName: 'event export guests',
    description: 'Export attendee/ticket data for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'checked_in', type: 'boolean', description: 'Filter by check-in status', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false },
    ],
    whenToUse: 'when user wants to export guest list as CSV',
    searchHint: 'export download guests csv spreadsheet',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'exportEventTickets',
    requiresSpace: false,
    surfaces: ['aiTool', 'slashCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ exportEventTickets: unknown }>(
        `query($_id: MongoID!, $search_text: String, $checked_in: Boolean, $pagination: PaginationInput) {
          exportEventTickets(_id: $_id, search_text: $search_text, checked_in: $checked_in, pagination: $pagination) {
            count
            tickets { _id shortid buyer_name buyer_email ticket_type quantity payment_amount currency purchase_date checkin_date active }
          }
        }`,
        {
          _id: args.event_id,
          search_text: args.search as string | undefined,
          checked_in: args.checked_in as boolean | undefined,
          pagination: args.limit ? { limit: args.limit as number, skip: 0 } : undefined,
        },
      );
      return result.exportEventTickets;
    },
    formatResult: (result) => {
      const r = result as { count: number; tickets: Array<{ buyer_name?: string; buyer_email?: string; ticket_type?: string; checkin_date?: string }> };
      if (r.count === 0) return 'No guest data found.';
      return `${r.count} guests exported. Use /export to save as CSV.`;
    },
  }),
  buildCapability({
    name: 'event_guest_detail',
    category: 'event',
    displayName: 'event guest detail',
    description: 'Get detailed info about a specific guest (ticket, payment, join request, application).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'user_id', type: 'string', description: 'Guest user ObjectId', required: false },
      { name: 'email', type: 'string', description: 'Guest email', required: false },
    ],
    whenToUse: 'when user wants details about a specific guest',
    searchHint: 'guest detail profile info attendee specific',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventGuestDetail',
    requiresSpace: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { event: args.event_id };
      if (args.user_id) vars.user = args.user_id;
      if (args.email) vars.email = args.email;

      const result = await graphqlRequest<{ getEventGuestDetail: unknown }>(
        `query($event: MongoID!, $user: MongoID, $email: String) {
          getEventGuestDetail(event: $event, user: $user, email: $email) {
            user { _id name email image_avatar }
            ticket { _id type }
            payment { _id amount currency }
            join_request { _id state }
            application { question answer }
          }
        }`,
        vars,
      );
      return result.getEventGuestDetail;
    },
  }),
  buildCapability({
    name: 'event_guests_statistics',
    category: 'event',
    displayName: 'event guests statistics',
    description: 'Get detailed guest statistics (going, pending, declined, checked in, per ticket type).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    whenToUse: 'when user wants guest registration statistics over time',
    searchHint: 'guests statistics registration growth trends',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventGuestsStatistics',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventGuestsStatistics: unknown }>(
        `query($event: MongoID!) {
          getEventGuestsStatistics(event: $event) {
            going pending_approval pending_invite declined checked_in
            ticket_types { ticket_type ticket_type_title guests_count }
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventGuestsStatistics;
    },
  }),
  buildCapability({
    name: 'event_guests_list',
    category: 'event',
    displayName: 'event guests list',
    description: 'List event guests with filters and pagination.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'search', type: 'string', description: 'Search by name/email', required: false },
      { name: 'ticket_types', type: 'string[]', description: 'Filter by ticket type IDs', required: false },
      { name: 'going', type: 'boolean', description: 'Filter going guests', required: false },
      { name: 'pending_approval', type: 'boolean', description: 'Filter pending approval', required: false },
      { name: 'pending_invite', type: 'boolean', description: 'Filter pending invites', required: false },
      { name: 'declined', type: 'boolean', description: 'Filter declined', required: false },
      { name: 'checked_in', type: 'boolean', description: 'Filter checked-in', required: false },
      { name: 'sort_by', type: 'string', description: 'Sort field', required: false,
        enum: ['name', 'email', 'approval_status', 'register_time'] },
      { name: 'sort_order', type: 'string', description: 'Sort direction', required: false,
        enum: ['asc', 'desc'] },
      { name: 'limit', type: 'number', description: 'Pagination limit', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'when user wants paginated guest list with filters',
    searchHint: 'guests list paginated filter search attendees',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listEventGuests',
    requiresSpace: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { event: args.event_id };
      if (args.search) vars.search = args.search;
      if (args.ticket_types) vars.ticket_types = args.ticket_types;
      if (args.going !== undefined) vars.going = args.going;
      if (args.pending_approval !== undefined) vars.pending_approval = args.pending_approval;
      if (args.pending_invite !== undefined) vars.pending_invite = args.pending_invite;
      if (args.declined !== undefined) vars.declined = args.declined;
      if (args.checked_in !== undefined) vars.checked_in = args.checked_in;
      if (args.sort_by) vars.sort_by = args.sort_by;
      if (args.sort_order) vars.sort_order = args.sort_order;
      if (args.limit !== undefined) vars.limit = args.limit;
      if (args.skip !== undefined) vars.skip = args.skip;

      const result = await graphqlRequest<{ listEventGuests: unknown }>(
        `query($event: MongoID!, $search: String, $ticket_types: [MongoID!], $going: Boolean, $pending_approval: Boolean, $pending_invite: Boolean, $declined: Boolean, $checked_in: Boolean, $sort_by: ListEventGuestsSortBy, $sort_order: SortOrder, $limit: Int, $skip: Int) {
          listEventGuests(event: $event, search: $search, ticket_types: $ticket_types, going: $going, pending_approval: $pending_approval, pending_invite: $pending_invite, declined: $declined, checked_in: $checked_in, sort_by: $sort_by, sort_order: $sort_order, limit: $limit, skip: $skip) {
            total
            items { user { _id name email } ticket { _id type } join_request { state } }
          }
        }`,
        vars,
      );
      return result.listEventGuests;
    },
  }),
  buildCapability({
    name: 'event_invitation_stats',
    category: 'event',
    displayName: 'event invitation stats',
    description: 'Get invitation tracking statistics for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'limit', type: 'number', description: 'Max guest results', required: false },
    ],
    whenToUse: 'when user wants invitation delivery statistics',
    searchHint: 'invitation stats sent opened accepted delivery',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventInvitedStatistics',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventInvitedStatistics: unknown }>(
        `query($_id: MongoID!, $limit: Int) {
          getEventInvitedStatistics(_id: $_id, limit: $limit) {
            total total_joined total_declined emails_opened
          }
        }`,
        { _id: args.event_id, limit: (args.limit as number) || undefined },
      );
      return result.getEventInvitedStatistics;
    },
    formatResult: (result) => {
      const r = result as { total: number; total_joined: number; total_declined: number; emails_opened: number };
      return `Invitations: ${r.total} sent, ${r.total_joined} joined, ${r.total_declined} declined, ${r.emails_opened} emails opened.`;
    },
  }),
  buildCapability({
    name: 'event_cancel_invitations',
    category: 'event',
    displayName: 'event cancel invitations',
    description: 'Cancel sent invitations for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'invitation_ids', type: 'string[]', description: 'Array of invitation IDs to cancel', required: true },
    ],
    whenToUse: 'when user wants to cancel pending invitations',
    searchHint: 'cancel revoke invitations pending unsend',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'cancelEventInvitations',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ cancelEventInvitations: boolean }>(
        `mutation($input: CancelEventInvitationsInput!) {
          cancelEventInvitations(input: $input)
        }`,
        { input: { event: args.event_id, invitations: args.invitation_ids } },
      );
      return { cancelled: result.cancelEventInvitations };
    },
    formatResult: (result) => {
      const r = result as { cancelled: boolean };
      return r.cancelled ? 'Invitations cancelled.' : 'Failed to cancel invitations.';
    },
  }),
  buildCapability({
    name: 'event_sales_chart',
    category: 'event',
    displayName: 'event sales chart',
    description: 'Get ticket sales data over a time range for charting.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'start', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end', type: 'string', description: 'End date ISO 8601', required: true },
      { name: 'ticket_type_ids', type: 'string[]', description: 'Filter by ticket type IDs', required: false },
    ],
    whenToUse: 'when user wants ticket sales chart data',
    searchHint: 'sales chart graph revenue timeline trend',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventTicketSoldChartData',
    requiresSpace: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = {
        event: args.event_id,
        start: args.start,
        end: args.end,
      };
      if (args.ticket_type_ids) vars.types = args.ticket_type_ids;

      const result = await graphqlRequest<{ getEventTicketSoldChartData: unknown }>(
        `query($event: MongoID!, $start: DateTime!, $end: DateTime!, $types: [MongoID!]) {
          getEventTicketSoldChartData(event: $event, start: $start, end: $end, types: $types) {
            items { created_at type }
          }
        }`,
        vars,
      );
      return result.getEventTicketSoldChartData;
    },
  }),
  buildCapability({
    name: 'event_checkin_chart',
    category: 'event',
    displayName: 'event checkin chart',
    description: 'Get check-in data over a time range for charting.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'start', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end', type: 'string', description: 'End date ISO 8601', required: true },
    ],
    whenToUse: 'when user wants check-in timeline chart data',
    searchHint: 'checkin chart timeline arrivals graph trend',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventCheckinChartData',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventCheckinChartData: unknown }>(
        `query($event: MongoID!, $start: DateTime!, $end: DateTime!) {
          getEventCheckinChartData(event: $event, start: $start, end: $end) {
            items { created_at }
          }
        }`,
        { event: args.event_id, start: args.start, end: args.end },
      );
      return result.getEventCheckinChartData;
    },
  }),
  buildCapability({
    name: 'event_views_chart',
    category: 'event',
    displayName: 'event views chart',
    description: 'Get page view data over a time range for charting.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'start', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end', type: 'string', description: 'End date ISO 8601', required: true },
    ],
    whenToUse: 'when user wants event views chart data',
    searchHint: 'views chart pageviews traffic timeline graph',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventViewChartData',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventViewChartData: unknown }>(
        `query($event: MongoID!, $start: DateTime!, $end: DateTime!) {
          getEventViewChartData(event: $event, start: $start, end: $end) {
            items { date }
          }
        }`,
        { event: args.event_id, start: args.start, end: args.end },
      );
      return result.getEventViewChartData;
    },
  }),
  buildCapability({
    name: 'event_view_stats',
    category: 'event',
    displayName: 'event view stats',
    description: 'Get view counts for multiple date ranges (for comparison).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'ranges', type: 'object[]', description: 'Array of { start, end } date ranges', required: true },
    ],
    whenToUse: 'when user wants aggregate event view statistics',
    searchHint: 'view stats unique total pageviews aggregate',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventViewStats',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventViewStats: unknown }>(
        `query($event: MongoID!, $ranges: [DateRangeInput!]!) {
          getEventViewStats(event: $event, ranges: $ranges) {
            counts
          }
        }`,
        { event: args.event_id, ranges: args.ranges },
      );
      return result.getEventViewStats;
    },
  }),
  buildCapability({
    name: 'event_top_views',
    category: 'event',
    displayName: 'event top views',
    description: 'Get top traffic sources and cities for an event, plus total views.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'city_limit', type: 'number', description: 'Max cities to return', required: true },
      { name: 'source_limit', type: 'number', description: 'Max sources to return', required: true },
    ],
    whenToUse: 'when user wants top referrer sources for views',
    searchHint: 'top views referrers sources traffic utm',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventTopViews',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventTopViews: unknown }>(
        `query($event: MongoID!, $city_limit: Int!, $source_limit: Int!) {
          getEventTopViews(event: $event, city_limit: $city_limit, source_limit: $source_limit) {
            total
            by_city { geoip_city geoip_region geoip_country count }
            by_source { utm_source count }
          }
        }`,
        { event: args.event_id, city_limit: args.city_limit, source_limit: args.source_limit },
      );
      return result.getEventTopViews;
    },
  }),
  buildCapability({
    name: 'event_top_inviters',
    category: 'event',
    displayName: 'event top inviters',
    description: 'Get top inviters ranked by successful invitations.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'limit', type: 'number', description: 'Pagination limit', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'when user wants to see who invited the most guests',
    searchHint: 'top inviters leaderboard ambassadors referrals',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventTopInviters',
    requiresSpace: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { event: args.event_id };
      if (args.limit !== undefined) vars.limit = args.limit;
      if (args.skip !== undefined) vars.skip = args.skip;

      const result = await graphqlRequest<{ getEventTopInviters: unknown }>(
        `query($event: MongoID!, $limit: Int, $skip: Int) {
          getEventTopInviters(event: $event, limit: $limit, skip: $skip) {
            total
            items { inviter { _id name image_avatar } count }
          }
        }`,
        vars,
      );
      return result.getEventTopInviters;
    },
  }),
  buildCapability({
    name: 'event_token_gates_list',
    category: 'event',
    displayName: 'event token gates list',
    description: 'List token gates for an event with optional filters.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'networks', type: 'string[]', description: 'Filter by blockchain networks', required: false },
      { name: 'ticket_types', type: 'string[]', description: 'Filter by gated ticket type IDs', required: false },
      { name: 'search', type: 'string', description: 'Search by name', required: false },
    ],
    whenToUse: 'when user wants to see token gate rules',
    searchHint: 'token gates list nft blockchain access',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listEventTokenGates',
    requiresSpace: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { event: args.event_id };
      if (args.networks) vars.networks = args.networks;
      if (args.ticket_types) vars.ticket_types = args.ticket_types;
      if (args.search) vars.search = args.search;

      const result = await graphqlRequest<{ listEventTokenGates: unknown }>(
        `query($event: MongoID!, $networks: [String!], $ticket_types: [MongoID!], $search: String) {
          listEventTokenGates(event: $event, networks: $networks, ticket_types: $ticket_types, search: $search) {
            _id name token_address network decimals min_value max_value is_nft event gated_ticket_types
          }
        }`,
        vars,
      );
      return result.listEventTokenGates;
    },
  }),
  buildCapability({
    name: 'event_token_gate_create',
    category: 'event',
    displayName: 'event token gate create',
    description: 'Create a token gate for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'name', type: 'string', description: 'Display name of the token', required: true },
      { name: 'token_address', type: 'string', description: 'Token contract address', required: true },
      { name: 'network', type: 'string', description: 'Blockchain network', required: true },
      { name: 'decimals', type: 'number', description: 'Token decimals (default 0)', required: false },
      { name: 'min_value', type: 'string', description: 'Minimum token balance required', required: false },
      { name: 'max_value', type: 'string', description: 'Maximum token balance', required: false },
      { name: 'is_nft', type: 'boolean', description: 'ERC721 if true, else ERC20', required: false },
      { name: 'gated_ticket_types', type: 'string[]', description: 'Ticket type IDs this gate applies to', required: false },
    ],
    whenToUse: 'when user wants to add a token gate requirement',
    searchHint: 'create token gate nft blockchain requirement',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createEventTokenGate',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        name: args.name,
        token_address: args.token_address,
        network: args.network,
      };
      if (args.decimals !== undefined) input.decimals = args.decimals;
      if (args.min_value) input.min_value = args.min_value;
      if (args.max_value) input.max_value = args.max_value;
      if (args.is_nft !== undefined) input.is_nft = args.is_nft;
      if (args.gated_ticket_types) input.gated_ticket_types = args.gated_ticket_types;

      const result = await graphqlRequest<{ createEventTokenGate: unknown }>(
        `mutation($input: EventTokenGateInput!) {
          createEventTokenGate(input: $input) {
            _id name token_address network event gated_ticket_types
          }
        }`,
        { input },
      );
      return result.createEventTokenGate;
    },
  }),
  buildCapability({
    name: 'event_token_gate_update',
    category: 'event',
    displayName: 'event token gate update',
    description: 'Update an existing token gate.',
    params: [
      { name: 'token_gate_id', type: 'string', description: 'Token gate ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'name', type: 'string', description: 'Display name', required: false },
      { name: 'min_value', type: 'string', description: 'Minimum token balance', required: false },
      { name: 'max_value', type: 'string', description: 'Maximum token balance', required: false },
      { name: 'gated_ticket_types', type: 'string[]', description: 'Ticket type IDs', required: false },
    ],
    whenToUse: 'when user wants to modify a token gate rule',
    searchHint: 'update edit token gate nft rule modify',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateEventTokenGate',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        _id: args.token_gate_id,
        event: args.event_id,
      };
      if (args.name) input.name = args.name;
      if (args.min_value) input.min_value = args.min_value;
      if (args.max_value) input.max_value = args.max_value;
      if (args.gated_ticket_types) input.gated_ticket_types = args.gated_ticket_types;

      const result = await graphqlRequest<{ updateEventTokenGate: unknown }>(
        `mutation($input: EventTokenGateInput!) {
          updateEventTokenGate(input: $input) {
            _id name token_address network gated_ticket_types
          }
        }`,
        { input },
      );
      return result.updateEventTokenGate;
    },
  }),
  buildCapability({
    name: 'event_token_gate_delete',
    category: 'event',
    displayName: 'event token gate delete',
    description: 'Delete a token gate from an event.',
    params: [
      { name: 'token_gate_id', type: 'string', description: 'Token gate ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    whenToUse: 'when user wants to remove a token gate rule',
    searchHint: 'delete remove token gate nft rule',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventTokenGate',
    requiresSpace: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($_id: MongoID!, $event: MongoID!) {
          deleteEventTokenGate(_id: $_id, event: $event)
        }`,
        { _id: args.token_gate_id, event: args.event_id },
      );
      return { deleted: true, token_gate_id: args.token_gate_id };
    },
  }),
  buildCapability({
    name: 'event_poap_list',
    category: 'event',
    displayName: 'event poap list',
    description: 'List POAP drops for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    whenToUse: 'when user wants to see event POAPs',
    searchHint: 'poap list nft attendance proof badge',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listPoapDrops',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ listPoapDrops: unknown }>(
        `query($event: MongoID!) {
          listPoapDrops(event: $event) {
            _id name description amount image_url minting_network claim_count status
          }
        }`,
        { event: args.event_id },
      );
      return result.listPoapDrops;
    },
  }),
  buildCapability({
    name: 'event_poap_create',
    category: 'event',
    displayName: 'event poap create',
    description: 'Create a new POAP drop for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'name', type: 'string', description: 'POAP name', required: true },
      { name: 'description', type: 'string', description: 'POAP description', required: true },
      { name: 'amount', type: 'number', description: 'Number of POAPs to mint', required: true },
      { name: 'image', type: 'string', description: 'File ObjectId (uploaded image)', required: true },
      { name: 'claim_mode', type: 'string', description: 'Claim mode', required: true,
        enum: ['check_in', 'registration'] },
      { name: 'ticket_types', type: 'string[]', description: 'Ticket type IDs for registration claim mode', required: false },
      { name: 'private', type: 'boolean', description: 'Whether POAP is private', required: false },
      { name: 'minting_network', type: 'string', description: 'Chain ID for minting network', required: false },
    ],
    whenToUse: 'when user wants to create an event POAP',
    searchHint: 'create poap nft attendance badge mint',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createPoapDrop',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        name: args.name,
        description: args.description,
        amount: args.amount,
        image: args.image,
        claim_mode: args.claim_mode,
      };
      if (args.ticket_types) input.ticket_types = args.ticket_types;
      if (args.private !== undefined) input.private = args.private;
      if (args.minting_network) input.minting_network = args.minting_network;

      const result = await graphqlRequest<{ createPoapDrop: unknown }>(
        `mutation($input: CreatePoapInput!) {
          createPoapDrop(input: $input) {
            _id name description amount status minting_network
          }
        }`,
        { input },
      );
      return result.createPoapDrop;
    },
  }),
  buildCapability({
    name: 'event_poap_update',
    category: 'event',
    displayName: 'event poap update',
    description: 'Update an existing POAP drop.',
    params: [
      { name: 'drop_id', type: 'string', description: 'PoapDrop ObjectId', required: true },
      { name: 'name', type: 'string', description: 'POAP name', required: false },
      { name: 'description', type: 'string', description: 'POAP description', required: false },
      { name: 'amount', type: 'number', description: 'New total amount (must be >= current)', required: false },
      { name: 'claim_mode', type: 'string', description: 'Claim mode', required: false,
        enum: ['check_in', 'registration'] },
      { name: 'ticket_types', type: 'string[]', description: 'Ticket type IDs', required: false },
      { name: 'minting_network', type: 'string', description: 'Chain ID', required: false },
    ],
    whenToUse: 'when user wants to update an event POAP',
    searchHint: 'update edit poap nft badge modify',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updatePoapDrop',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.name) input.name = args.name;
      if (args.description) input.description = args.description;
      if (args.amount !== undefined) input.amount = args.amount;
      if (args.claim_mode) input.claim_mode = args.claim_mode;
      if (args.ticket_types) input.ticket_types = args.ticket_types;
      if (args.minting_network) input.minting_network = args.minting_network;

      const result = await graphqlRequest<{ updatePoapDrop: unknown }>(
        `mutation($drop: MongoID!, $input: UpdatePoapInput!) {
          updatePoapDrop(drop: $drop, input: $input) {
            _id name description amount status minting_network
          }
        }`,
        { drop: args.drop_id, input },
      );
      return result.updatePoapDrop;
    },
  }),
  buildCapability({
    name: 'event_poap_import',
    category: 'event',
    displayName: 'event poap import',
    description: 'Import an existing POAP drop from the POAP platform by external ID and edit code.',
    params: [
      { name: 'poap_id', type: 'number', description: 'External POAP drop ID', required: true },
      { name: 'code', type: 'string', description: 'POAP edit code', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'amount', type: 'number', description: 'Number of codes to have', required: true },
      { name: 'claim_mode', type: 'string', description: 'Claim mode', required: true,
        enum: ['check_in', 'registration'] },
      { name: 'ticket_types', type: 'string[]', description: 'Ticket type IDs', required: false },
    ],
    whenToUse: 'when user wants to import POAP claim codes',
    searchHint: 'import poap codes claims batch upload',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'importPoapDrop',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        amount: args.amount,
        claim_mode: args.claim_mode,
      };
      if (args.ticket_types) input.ticket_types = args.ticket_types;

      const result = await graphqlRequest<{ importPoapDrop: unknown }>(
        `mutation($id: Int!, $code: String!, $input: ImportPoapInput!) {
          importPoapDrop(id: $id, code: $code, input: $input) {
            _id name description amount status
          }
        }`,
        { id: args.poap_id, code: args.code, input },
      );
      return result.importPoapDrop;
    },
  }),
  buildCapability({
    name: 'event_ticket_categories_list',
    category: 'event',
    displayName: 'event ticket categories list',
    description: 'List ticket categories for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    whenToUse: 'when user wants to see ticket category groupings',
    searchHint: 'ticket categories groups tiers sections list',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventTicketCategories',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventTicketCategories: unknown }>(
        `query($event: MongoID!) {
          getEventTicketCategories(event: $event) {
            _id event title description position
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventTicketCategories;
    },
  }),
  buildCapability({
    name: 'event_ticket_category_create',
    category: 'event',
    displayName: 'event ticket category create',
    description: 'Create a ticket category for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'title', type: 'string', description: 'Category title', required: true },
      { name: 'description', type: 'string', description: 'Category description', required: false },
      { name: 'position', type: 'number', description: 'Display order', required: false },
      { name: 'ticket_types', type: 'string[]', description: 'Ticket type IDs to assign', required: false },
    ],
    whenToUse: 'when user wants to create a ticket category',
    searchHint: 'create ticket category group tier section',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createEventTicketCategory',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        title: args.title,
      };
      if (args.description) input.description = args.description;
      if (args.position !== undefined) input.position = args.position;
      if (args.ticket_types) input.ticket_types = args.ticket_types;

      const result = await graphqlRequest<{ createEventTicketCategory: unknown }>(
        `mutation($input: CreateEventTicketCategoryInput!) {
          createEventTicketCategory(input: $input) {
            _id event title description position
          }
        }`,
        { input },
      );
      return result.createEventTicketCategory;
    },
  }),
  buildCapability({
    name: 'event_ticket_category_update',
    category: 'event',
    displayName: 'event ticket category update',
    description: 'Update a ticket category.',
    params: [
      { name: 'category_id', type: 'string', description: 'Category ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'title', type: 'string', description: 'Category title', required: false },
      { name: 'description', type: 'string', description: 'Category description', required: false },
      { name: 'position', type: 'number', description: 'Display order', required: false },
      { name: 'ticket_types', type: 'string[]', description: 'New set of ticket type IDs', required: false },
    ],
    whenToUse: 'when user wants to update a ticket category',
    searchHint: 'update edit ticket category group tier',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateEventTicketCategory',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        _id: args.category_id,
        event: args.event_id,
      };
      if (args.title) input.title = args.title;
      if (args.description) input.description = args.description;
      if (args.position !== undefined) input.position = args.position;
      if (args.ticket_types) input.ticket_types = args.ticket_types;

      await graphqlRequest(
        `mutation($input: UpdateTicketTypeCategoryInput!) {
          updateEventTicketCategory(input: $input)
        }`,
        { input },
      );
      return { updated: true, category_id: args.category_id };
    },
  }),
  buildCapability({
    name: 'event_ticket_category_delete',
    category: 'event',
    displayName: 'event ticket category delete',
    description: 'Delete one or more ticket categories from an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'category_ids', type: 'string[]', description: 'Array of category ObjectIds', required: true },
    ],
    whenToUse: 'when user wants to delete a ticket category',
    searchHint: 'delete remove ticket category group tier',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventTicketCategory',
    requiresSpace: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($event: MongoID!, $categories: [MongoID!]!) {
          deleteEventTicketCategory(event: $event, categories: $categories)
        }`,
        { event: args.event_id, categories: args.category_ids },
      );
      return { deleted: true, category_ids: args.category_ids };
    },
  }),
  buildCapability({
    name: 'event_ticket_category_reorder',
    category: 'event',
    displayName: 'event ticket category reorder',
    description: 'Reorder ticket categories for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'categories', type: 'object[]', description: 'Array of { _id: string, position: number }', required: true },
    ],
    whenToUse: 'when user wants to reorder ticket categories',
    searchHint: 'reorder sort ticket categories position arrange',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'reorderTicketTypeCategories',
    requiresSpace: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($event: MongoID!, $categories: [ReorderTicketTypeCategoryInput!]!) {
          reorderTicketTypeCategories(event: $event, categories: $categories)
        }`,
        { event: args.event_id, categories: args.categories },
      );
      return { reordered: true };
    },
  }),
  buildCapability({
    name: 'event_question_create',
    category: 'event',
    displayName: 'event question create',
    description: 'Post a question in an event Q&A session.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'question', type: 'string', description: 'Question text', required: true },
      { name: 'session', type: 'string', description: 'Session ObjectId (if multiple sessions)', required: false },
    ],
    whenToUse: 'when user wants to add a live Q&A question',
    searchHint: 'create question ask qa live session',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createEventQuestion',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        question: args.question,
      };
      if (args.session) input.session = args.session;

      const result = await graphqlRequest<{ createEventQuestion: unknown }>(
        `mutation($input: CreateEventQuestionsInput!) {
          createEventQuestion(input: $input) {
            _id event user question stamp likes
          }
        }`,
        { input },
      );
      return result.createEventQuestion;
    },
  }),
  buildCapability({
    name: 'event_question_delete',
    category: 'event',
    displayName: 'event question delete',
    description: 'Delete a question (soft delete).',
    params: [
      { name: 'question_id', type: 'string', description: 'Question ObjectId', required: true },
    ],
    whenToUse: 'when user wants to delete a Q&A question',
    searchHint: 'delete remove question qa moderate',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventQuestion',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($_id: MongoID!) {
          deleteEventQuestion(_id: $_id)
        }`,
        { _id: args.question_id },
      );
      return { deleted: true, question_id: args.question_id };
    },
  }),
  buildCapability({
    name: 'event_question_like',
    category: 'event',
    displayName: 'event question like',
    description: 'Toggle like on a question.',
    params: [
      { name: 'question_id', type: 'string', description: 'Question ObjectId', required: true },
    ],
    whenToUse: 'when user wants to upvote a Q&A question',
    searchHint: 'like upvote question qa vote',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'toggleEventQuestionLike',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($_id: MongoID!) {
          toggleEventQuestionLike(_id: $_id)
        }`,
        { _id: args.question_id },
      );
      return { toggled: true, question_id: args.question_id };
    },
  }),
  buildCapability({
    name: 'event_questions_list',
    category: 'event',
    displayName: 'event questions list',
    description: 'List questions for an event with sorting and cursor-based pagination.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'sort', type: 'string', description: 'Sort field', required: false,
        enum: ['_id', 'likes'] },
      { name: 'limit', type: 'number', description: 'Max results (default 20)', required: false },
      { name: 'id_lt', type: 'string', description: 'Cursor: return questions with _id less than this', required: false },
      { name: 'session', type: 'string', description: 'Session ObjectId filter', required: false },
    ],
    whenToUse: 'when user wants to see Q&A questions',
    searchHint: 'questions list qa session audience poll',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventQuestions',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        limit: (args.limit as number) || 20,
        sort: (args.sort as string) || '_id',
      };
      if (args.id_lt) input.id_lt = args.id_lt;
      if (args.session) input.session = args.session;

      const result = await graphqlRequest<{ getEventQuestions: unknown }>(
        `query($input: GetEventQuestionsInput!) {
          getEventQuestions(input: $input) {
            _id event user question stamp likes liked user_expanded { _id name image_avatar }
          }
        }`,
        { input },
      );
      return result.getEventQuestions;
    },
  }),
  buildCapability({
    name: 'event_join_requests',
    category: 'event',
    displayName: 'event join requests',
    description: 'List pending join requests for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'state', type: 'string', description: 'Filter by state', required: false, enum: ['PENDING', 'APPROVED', 'DECLINED'] },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'when user wants to manage join requests for private events',
    searchHint: 'join requests approve reject pending private',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventJoinRequests',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventJoinRequests: unknown }>(
        `query($event: MongoID!, $state: EventJoinRequestState, $search: String, $limit: Int, $skip: Int) {
          getEventJoinRequests(event: $event, state: $state, search: $search, limit: $limit, skip: $skip) {
            total
            records { _id user email state ticket_issued created_at user_expanded { _id name email } }
          }
        }`,
        {
          event: args.event_id,
          state: args.state || undefined,
          search: args.search as string | undefined,
          limit: (args.limit as number) || 20,
          skip: (args.skip as number) || 0,
        },
      );
      return result.getEventJoinRequests;
    },
  }),
  buildCapability({
    name: 'event_checkin',
    category: 'event',
    displayName: 'event checkin',
    description: 'Manually check in an attendee to an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'user_id', type: 'string', description: 'User ID to check in', required: true },
    ],
    whenToUse: 'when user wants to check in a guest at an event',
    searchHint: 'checkin check in guest arrive scan',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'checkinUser',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ checkinUser: { state: string; messages?: { primary: string; secondary?: string } } }>(
        `mutation($event: MongoID!, $user: MongoID!) {
          checkinUser(event: $event, user: $user) {
            state
            messages { primary secondary }
          }
        }`,
        { event: args.event_id, user: args.user_id },
      );
      return result.checkinUser;
    },
    formatResult: (result) => {
      const r = result as { state: string; messages?: { primary: string } };
      return `Check-in: ${r.state}${r.messages?.primary ? ` — ${r.messages.primary}` : ''}`;
    },
  }),
  buildCapability({
    name: 'event_ticket_delete',
    category: 'event',
    displayName: 'event ticket delete',
    description: 'Delete a ticket type from an event.',
    params: [
      { name: 'ticket_type_id', type: 'string', description: 'Ticket type ID to delete', required: true },
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants to delete a ticket type',
    searchHint: 'delete remove ticket type disable',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventTicketType',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteEventTicketType: boolean }>(
        `mutation($_id: MongoID!, $event: MongoID!) {
          deleteEventTicketType(_id: $_id, event: $event)
        }`,
        { _id: args.ticket_type_id, event: args.event_id },
      );
      return { deleted: result.deleteEventTicketType };
    },
    formatResult: (result) => {
      const r = result as { deleted: boolean };
      return r.deleted ? 'Ticket type deleted.' : 'Failed to delete ticket type.';
    },
  }),
  buildCapability({
    name: 'event_ticket_reorder',
    category: 'event',
    displayName: 'event ticket reorder',
    description: 'Reorder ticket types for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'ticket_type_ids', type: 'string[]', description: 'Ticket type IDs in desired order', required: true },
    ],
    whenToUse: 'when user wants to reorder ticket types',
    searchHint: 'reorder sort ticket types position arrange',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'reorderTicketTypes',
    requiresSpace: false,
    execute: async (args) => {
      const ids = args.ticket_type_ids as string[];
      const types = ids.map((id, i) => ({ _id: id, position: i }));
      const result = await graphqlRequest<{ reorderTicketTypes: boolean }>(
        `mutation($event: MongoID!, $types: [ReorderTicketTypeInput!]!) {
          reorderTicketTypes(event: $event, types: $types)
        }`,
        { event: args.event_id, types },
      );
      return { reordered: result.reorderTicketTypes };
    },
    formatResult: (result) => {
      const r = result as { reordered: boolean };
      return r.reordered ? 'Ticket types reordered.' : 'Failed to reorder.';
    },
  }),
  buildCapability({
    name: 'event_discount_update',
    category: 'event',
    displayName: 'event discount update',
    description: 'Update a ticket discount code settings (use limits, ticket limits).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'code', type: 'string', description: 'Discount code to update', required: false },
      { name: 'use_limit', type: 'number', description: 'Total uses allowed', required: false },
      { name: 'use_limit_per', type: 'number', description: 'Uses per user', required: false },
      { name: 'ticket_limit', type: 'number', description: 'Total tickets discountable', required: false },
      { name: 'ticket_limit_per', type: 'number', description: 'Tickets per user', required: false },
    ],
    whenToUse: 'when user wants to update a discount code',
    searchHint: 'update edit discount code promo coupon',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateEventTicketDiscount',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.code) input.code = args.code;
      if (args.use_limit !== undefined) input.use_limit = args.use_limit;
      if (args.use_limit_per !== undefined) input.use_limit_per = args.use_limit_per;
      if (args.ticket_limit !== undefined) input.ticket_limit = args.ticket_limit;
      if (args.ticket_limit_per !== undefined) input.ticket_limit_per = args.ticket_limit_per;
      const result = await graphqlRequest<{ updateEventTicketDiscount: unknown }>(
        `mutation($event: String!, $input: UpdateEventTicketDiscountInput!) {
          updateEventTicketDiscount(event: $event, input: $input) {
            _id title payment_ticket_discounts { code ratio use_limit use_limit_per ticket_limit ticket_limit_per active }
          }
        }`,
        { event: args.event_id, input },
      );
      return result.updateEventTicketDiscount;
    },
    formatResult: (result) => {
      const r = result as { title?: string };
      return `Discount updated for "${r.title || 'event'}".`;
    },
  }),
  buildCapability({
    name: 'event_discount_delete',
    category: 'event',
    displayName: 'event discount delete',
    description: 'Delete ticket discount codes from an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'discount_codes', type: 'string[]', description: 'Discount codes to delete', required: true },
    ],
    whenToUse: 'when user wants to delete a discount code',
    searchHint: 'delete remove discount code promo coupon',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventTicketDiscounts',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteEventTicketDiscounts: unknown }>(
        `mutation($event: String!, $discounts: [String!]!) {
          deleteEventTicketDiscounts(event: $event, discounts: $discounts) {
            _id title payment_ticket_discounts { code active use_count }
          }
        }`,
        { event: args.event_id, discounts: args.discount_codes },
      );
      return result.deleteEventTicketDiscounts;
    },
    formatResult: (result) => {
      const r = result as { title?: string };
      return `Discount(s) deleted from "${r.title || 'event'}".`;
    },
  }),
  buildCapability({
    name: 'event_ticket_categories',
    category: 'event',
    displayName: 'event ticket categories',
    description: 'List ticket categories for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants to view ticket categories for an event',
    searchHint: 'ticket categories list groups tiers view',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventTicketCategories',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventTicketCategories: Array<{ _id: string; title: string; description?: string; position?: number }> }>(
        `query($event: String!) {
          getEventTicketCategories(event: $event) {
            _id title description position
          }
        }`,
        { event: args.event_id },
      );
      return { categories: result.getEventTicketCategories, count: result.getEventTicketCategories.length };
    },
    formatResult: (result) => {
      const r = result as { categories: Array<{ title: string; position?: number }>; count: number };
      if (r.count === 0) return 'No ticket categories found.';
      return r.categories.map((c, i) => `${i + 1}. ${c.title}`).join('\n');
    },
  }),
  buildCapability({
    name: 'event_application_export',
    category: 'event',
    displayName: 'event application export',
    description: 'Export event application/form responses. Returns applicant data with questions and answers.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants to export application form data',
    searchHint: 'export application form data csv download',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'exportEventApplications',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ exportEventApplications: Array<{ user?: { _id: string; email: string; name?: string }; non_login_user?: { _id: string; email: string; name?: string }; questions: string[]; answers: Array<{ _id: string; answer?: string }> }> }>(
        `query($event: String!) {
          exportEventApplications(event: $event) {
            user { _id email name }
            non_login_user { _id email name }
            questions
            answers { _id answer }
          }
        }`,
        { event: args.event_id },
      );
      return { applications: result.exportEventApplications, count: result.exportEventApplications.length };
    },
  }),
  buildCapability({
    name: 'event_latest_views',
    category: 'event',
    displayName: 'event latest views',
    description: 'Get the most recent individual page views for an event with geographic and device data.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
    ],
    whenToUse: 'when user wants recent event page view activity',
    searchHint: 'latest recent views activity visitors traffic',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventLatestViews',
    requiresSpace: false,
    execute: async (args) => {
      let limit = 20;
      if (args.limit !== undefined) {
        const n = Number(args.limit);
        if (!isNaN(n)) limit = Math.floor(Math.max(1, n));
      }
      const result = await graphqlRequest<{ getEventLatestViews: unknown }>(
        `query($event: MongoID!, $limit: Int!) {
          getEventLatestViews(event: $event, limit: $limit) {
            views { date geoip_country geoip_region geoip_city user_agent }
          }
        }`,
        { event: args.event_id, limit },
      );
      return result.getEventLatestViews;
    },
    formatResult: (result) => {
      const r = result as { views: Array<{ date: string; geoip_country: string; geoip_region: string; geoip_city: string; user_agent: string }> };
      if (!r || !Array.isArray(r.views)) return JSON.stringify(result);
      if (!r.views.length) return 'No views found for this event.';
      const lines = r.views.map((v) => {
        const location = [v.geoip_city, v.geoip_region, v.geoip_country].filter(Boolean).join(', ');
        return `- ${v.date} | ${location} | ${v.user_agent || 'unknown agent'}`;
      });
      return `${r.views.length} view(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'event_set_photos',
    category: 'event',
    displayName: 'event set photos',
    description:
      'Set event photos from file IDs (from file_upload). WARNING: This REPLACES all existing photos. The first photo becomes the event cover automatically. Recommended: 800x800 pixels for best display.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'file_ids', type: 'string', description: 'Comma-separated file IDs', required: true },
    ],
    whenToUse: 'when user wants to set event cover photos',
    searchHint: 'set photos images cover event upload',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'updateEvent',
    requiresSpace: false,
    execute: async (args) => {
      const eventId = args.event_id as string;
      const fileIds = (args.file_ids as string)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (fileIds.length === 0) throw new Error('At least one file ID is required.');

      const result = await graphqlRequest<{ updateEvent: unknown }>(
        `mutation($input: EventInput!, $_id: MongoID!) {
          updateEvent(input: $input, _id: $_id) {
            _id title cover
          }
        }`,
        { _id: eventId, input: { new_new_photos: fileIds } },
      );
      return result.updateEvent;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; title: string };
      return `Photos set for event "${r.title}" (${r._id}). The first photo is used as the event cover.`;
    },
  }),
];
