import { ToolDef } from '../providers/interface.js';
import { graphqlRequest } from '../../api/graphql.js';
import { atlasRequest } from '../../api/atlas.js';
import { registrySearch } from '../../api/registry.js';
import { getDefaultSpace } from '../../auth/store.js';

export function buildToolRegistry(): Record<string, ToolDef> {
  const tools: Record<string, ToolDef> = {};

  function register(t: ToolDef): void {
    tools[t.name] = t;
  }

  // --- Auth ---

  register({
    name: 'get_me',
    displayName: 'auth whoami',
    description: 'Get the current authenticated user profile.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetMe: { user: unknown } }>(
        'query { aiGetMe { user { _id name email first_name last_name } } }',
      );
      return result.aiGetMe.user;
    },
    formatResult: (result) => {
      const r = result as { _id: string; name: string; email: string };
      return `Logged in as ${r.name} (${r.email})`;
    },
  });

  // --- Event ---

  register({
    name: 'event_create',
    displayName: 'event create',
    description: 'Create a new event. Returns the event ID, title, and status. Virtual and private settings can be changed via the web app after creation.',
    params: [
      { name: 'title', type: 'string', description: 'Event title', required: true },
      { name: 'start', type: 'string', description: 'Start date (ISO 8601)', required: true },
      { name: 'end', type: 'string', description: 'End date (ISO 8601)', required: false },
      { name: 'description', type: 'string', description: 'Event description', required: false },
      { name: 'space', type: 'string', description: 'Space ID', required: false },
      { name: 'address', type: 'string', description: 'Venue address', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const spaceId = (args.space as string) || getDefaultSpace();
      const result = await graphqlRequest<{ aiCreateEvent: unknown }>(
        `mutation($input: AICreateEventInput!) {
          aiCreateEvent(input: $input) {
            _id title shortid start end published description
            address { title city country latitude longitude }
          }
        }`,
        {
          input: {
            title: args.title,
            start: new Date(args.start as string).toISOString(),
            end: args.end ? new Date(args.end as string).toISOString() : undefined,
            description: args.description,
            space: spaceId,
            address: args.address ? { title: args.address } : undefined,
          },
        },
      );
      return result.aiCreateEvent;
    },
    formatResult: (result) => {
      const r = result as { _id: string; title: string; published: boolean };
      return `Event created: "${r.title}" (${r.published ? 'published' : 'draft'}). Add tickets with /plan tickets_create_type.`;
    },
  });

  register({
    name: 'event_list',
    displayName: 'event list',
    description: 'List your hosted events.',
    params: [
      { name: 'draft', type: 'boolean', description: 'Show only drafts', required: false },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetHostingEvents: { items: Array<Record<string, unknown>> } }>(
        `query($draft: Boolean, $search: String, $limit: Int, $skip: Int) {
          aiGetHostingEvents(draft: $draft, search: $search, limit: $limit, skip: $skip) {
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
      return result.aiGetHostingEvents;
    },
  });

  register({
    name: 'event_search',
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
    destructive: false,
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
  });

  register({
    name: 'event_get',
    displayName: 'event get',
    description: 'Get detailed information about a specific event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEvent: unknown }>(
        `query($id: MongoID!) {
          aiGetEvent(id: $id) {
            _id title shortid start end published description
            address { title city country latitude longitude }
          }
        }`,
        { id: args.event_id },
      );
      return result.aiGetEvent;
    },
  });

  register({
    name: 'event_update',
    displayName: 'event update',
    description: 'Update an existing event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'title', type: 'string', description: 'New title', required: false },
      { name: 'start', type: 'string', description: 'New start date (ISO 8601)', required: false },
      { name: 'end', type: 'string', description: 'New end date (ISO 8601)', required: false },
      { name: 'description', type: 'string', description: 'New description', required: false },
      { name: 'address', type: 'string', description: 'New venue address', required: false },
      { name: 'virtual', type: 'boolean', description: 'Set as virtual', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.title) input.title = args.title;
      if (args.start) input.start = new Date(args.start as string).toISOString();
      if (args.end) input.end = new Date(args.end as string).toISOString();
      if (args.description) input.description = args.description;
      if (args.address) input.address = { title: args.address };
      if (args.virtual !== undefined) input.virtual = args.virtual;

      const result = await graphqlRequest<{ aiUpdateEvent: unknown }>(
        `mutation($id: MongoID!, $input: AIUpdateEventInput!) {
          aiUpdateEvent(id: $id, input: $input) {
            _id title shortid start end published
          }
        }`,
        { id: args.event_id, input },
      );
      return result.aiUpdateEvent;
    },
    formatResult: (result) => {
      const r = result as { _id: string; title: string };
      return `"${r.title}" updated.`;
    },
  });

  register({
    name: 'event_publish',
    displayName: 'event publish',
    description: 'Publish a draft event to make it live.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_cancel',
    displayName: 'event cancel',
    description: 'Cancel an event. This action cannot be undone.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      await graphqlRequest(
        'mutation($id: MongoID!) { aiCancelEvent(id: $id) }',
        { id: args.event_id },
      );
      return { cancelled: true, event_id: args.event_id };
    },
  });

  register({
    name: 'event_ticket_sold_insight',
    displayName: 'event ticket sales',
    description: 'Get ticket sales data for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventTicketSoldInsight: unknown }>(
        `query($event: MongoID!) {
          aiGetEventTicketSoldInsight(event: $event) {
            total_sold total_revenue_cents currency
            by_type { ticket_type_id title sold revenue_cents }
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventTicketSoldInsight;
    },
  });

  register({
    name: 'event_view_insight',
    displayName: 'event view stats',
    description: 'Get page view statistics for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventViewInsight: unknown }>(
        `query($event: MongoID!) {
          aiGetEventViewInsight(event: $event) {
            total_views unique_visitors
            top_sources { source count }
            top_cities { city count }
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventViewInsight;
    },
  });

  register({
    name: 'event_guest_stats',
    displayName: 'event guest stats',
    description: 'Get guest statistics for an event (going, pending, declined, checked in).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventGuestStats: unknown }>(
        `query($event: MongoID!) {
          aiGetEventGuestStats(event: $event) {
            going pending_approval pending_invite declined checked_in total
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventGuestStats;
    },
    formatResult: (result) => {
      const r = result as { going: number; pending_approval: number; pending_invite: number; declined: number; checked_in: number; total: number };
      return `Guests: ${r.going} going, ${r.pending_approval} pending approval, ${r.pending_invite} pending invite, ${r.declined} declined, ${r.checked_in} checked in (${r.total} total).`;
    },
  });

  register({
    name: 'event_guests',
    displayName: 'event guests',
    description: 'List attendees for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'search', type: 'string', description: 'Search guests by name or email', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '50' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventGuests: unknown }>(
        `query($event: MongoID!, $search: String, $limit: Int, $skip: Int) {
          aiGetEventGuests(event: $event, search: $search, limit: $limit, skip: $skip) {
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
      return result.aiGetEventGuests;
    },
  });

  register({
    name: 'event_invite',
    displayName: 'event invite',
    description: 'Send email invitations to an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'emails', type: 'string[]', description: 'Email addresses to invite', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      await graphqlRequest(
        'mutation($input: InviteEventInput!) { aiInviteEvent(input: $input) }',
        { input: { event: args.event_id, emails: args.emails } },
      );
      return { sent: true, count: (args.emails as string[]).length };
    },
  });

  register({
    name: 'event_approvals',
    displayName: 'event approvals',
    description: 'Approve or decline event join requests.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'decision', type: 'string', description: 'Decision: approved or declined', required: true,
        enum: ['approved', 'declined'] },
      { name: 'request_ids', type: 'string[]', description: 'Specific request IDs (optional)', required: false },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiDecideEventJoinRequests: unknown }>(
        `mutation($event: MongoID!, $decision: String!, $request_ids: [MongoID!]) {
          aiDecideEventJoinRequests(event: $event, decision: $decision, request_ids: $request_ids) {
            processed_count decision
          }
        }`,
        {
          event: args.event_id,
          decision: args.decision,
          request_ids: args.request_ids as string[] | undefined,
        },
      );
      return result.aiDecideEventJoinRequests;
    },
  });

  register({
    name: 'event_feedback_summary',
    displayName: 'event feedback summary',
    description: 'Get feedback summary (average rating, distribution) for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventFeedbackSummary: unknown }>(
        `query($event: MongoID!) {
          aiGetEventFeedbackSummary(event: $event) {
            average_rating total_reviews
            rating_distribution { rating count }
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventFeedbackSummary;
    },
    formatResult: (result) => {
      const r = result as { average_rating: number; total_reviews: number };
      return `Feedback: ${r.average_rating}/5 average from ${r.total_reviews} reviews.`;
    },
  });

  register({
    name: 'event_feedbacks',
    displayName: 'event feedbacks',
    description: 'List individual feedback entries for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'rate_value', type: 'number', description: 'Filter by rating (1-5)', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiListEventFeedbacks: unknown }>(
        `query($event: MongoID!, $rate_value: Float, $limit: Int, $skip: Int) {
          aiListEventFeedbacks(event: $event, rate_value: $rate_value, limit: $limit, skip: $skip) {
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
      return result.aiListEventFeedbacks;
    },
  });

  register({
    name: 'event_checkins',
    displayName: 'event checkins',
    description: 'List check-in history for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventCheckins: unknown }>(
        `query($event: MongoID!, $limit: Int, $skip: Int) {
          aiGetEventCheckins(event: $event, limit: $limit, skip: $skip) {
            items { name email ticket_type_title checked_in_at }
          }
        }`,
        {
          event: args.event_id,
          limit: (args.limit as number) || 20,
          skip: (args.skip as number) || 0,
        },
      );
      return result.aiGetEventCheckins;
    },
  });

  register({
    name: 'event_payment_stats',
    displayName: 'event payment stats',
    description: 'Get payment statistics for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventPaymentStats: unknown }>(
        `query($event: MongoID!) {
          aiGetEventPaymentStats(event: $event) {
            total_payments
            total_revenue { currency amount_cents }
            by_provider { provider count amount_cents }
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventPaymentStats;
    },
    formatResult: (result) => {
      const r = result as { total_payments?: number; total_revenue?: Array<{ currency: string; amount_cents: number }>; by_provider?: Array<{ provider: string; count: number; amount_cents: number }> };
      const payments = r.total_payments ?? 0;
      const revenue = r.total_revenue ?? [];
      const revSummary = revenue.length > 0
        ? revenue.map((e) => `${e.currency} ${(e.amount_cents / 100).toFixed(2)}`).join(', ')
        : 'none';
      return `${payments} payments. Revenue: ${revSummary}.`;
    },
  });

  register({
    name: 'event_application_answers',
    displayName: 'event applications',
    description: 'Get application answers for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventApplicationAnswers: unknown }>(
        `query($event: MongoID!) {
          aiGetEventApplicationAnswers(event: $event) {
            user_name email answers { question answer } submitted_at
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventApplicationAnswers;
    },
  });

  register({
    name: 'accept_event',
    displayName: 'accept event',
    description: 'Accept an event invitation.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiAcceptEvent: unknown }>(
        'mutation($id: MongoID!) { aiAcceptEvent(id: $id) }',
        { id: args.event_id },
      );
      return result.aiAcceptEvent;
    },
  });

  register({
    name: 'decline_event',
    displayName: 'decline event',
    description: 'Decline an event invitation.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiDeclineEvent: unknown }>(
        'mutation($id: MongoID!) { aiDeclineEvent(id: $id) }',
        { id: args.event_id },
      );
      return result.aiDeclineEvent;
    },
  });

  // --- Tickets ---

  register({
    name: 'tickets_list_types',
    displayName: 'tickets types',
    description: 'List ticket types for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiListEventTicketTypes: unknown }>(
        `query($event: MongoID!) {
          aiListEventTicketTypes(event: $event) {
            title active private limited description
          }
        }`,
        { event: args.event_id },
      );
      return result.aiListEventTicketTypes;
    },
  });

  register({
    name: 'tickets_create_type',
    displayName: 'tickets create-type',
    description: 'Create a ticket type for an event. Omit price for a free ticket.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'name', type: 'string', description: 'Ticket type name', required: true },
      { name: 'price', type: 'number', description: 'Price in dollars (e.g. 25.00, omit for free)', required: false },
      { name: 'currency', type: 'string', description: 'Currency code', required: false, default: 'USD' },
      { name: 'limit', type: 'number', description: 'Max tickets available', required: false },
      { name: 'description', type: 'string', description: 'Ticket description', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        title: args.name,
        prices: args.price ? [{
          cost: String(Math.round((args.price as number) * 100)),
          currency: (args.currency as string) || 'USD',
          default: true,
        }] : [],
      };
      if (args.limit !== undefined) input.ticket_limit = args.limit;
      if (args.description) input.description = args.description;

      const result = await graphqlRequest<{ aiCreateEventTicketType: unknown }>(
        `mutation($input: EventTicketTypeInput!) {
          aiCreateEventTicketType(input: $input) {
            title active limited description
          }
        }`,
        { input },
      );
      return result.aiCreateEventTicketType;
    },
  });

  register({
    name: 'tickets_update_type',
    displayName: 'tickets update-type',
    description: 'Update an existing ticket type.',
    params: [
      { name: 'ticket_type_id', type: 'string', description: 'Ticket type ID', required: true },
      { name: 'name', type: 'string', description: 'New name', required: false },
      { name: 'price', type: 'number', description: 'New price in dollars', required: false },
      { name: 'currency', type: 'string', description: 'New currency code', required: false },
      { name: 'limit', type: 'number', description: 'New max tickets', required: false },
      { name: 'active', type: 'boolean', description: 'Active status', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.name) input.title = args.name;
      if (args.price !== undefined) {
        const costCents = String(Math.round((args.price as number) * 100));
        input.prices = [{ cost: costCents, currency: (args.currency as string) || 'USD', default: true }];
      }
      if (args.limit !== undefined) input.ticket_limit = args.limit;
      if (args.active !== undefined) input.active = args.active;

      const result = await graphqlRequest<{ aiUpdateEventTicketType: unknown }>(
        `mutation($_id: MongoID!, $input: EventTicketTypeInput!) {
          aiUpdateEventTicketType(_id: $_id, input: $input) {
            title active limited description
          }
        }`,
        { _id: args.ticket_type_id, input },
      );
      return result.aiUpdateEventTicketType;
    },
  });

  register({
    name: 'tickets_buy',
    displayName: 'tickets buy',
    description: 'Purchase tickets for an event. Requires attendee info for each ticket.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'ticket_type', type: 'string', description: 'Ticket type ID', required: true },
      { name: 'quantity', type: 'number', description: 'Number of tickets', required: true },
      { name: 'attendee_names', type: 'string[]', description: 'Attendee names, one per ticket', required: true },
      { name: 'attendee_emails', type: 'string[]', description: 'Attendee emails, one per ticket', required: true },
      { name: 'discount_code', type: 'string', description: 'Discount code', required: false },
    ],
    destructive: true,
    execute: async (args) => {
      const quantity = args.quantity as number;
      const names = args.attendee_names as string[];
      const emails = args.attendee_emails as string[];

      if (names.length !== quantity || emails.length !== quantity) {
        throw new Error(
          `Attendee count mismatch: expected ${quantity} names and ${quantity} emails, got ${names.length} names and ${emails.length} emails.`,
        );
      }

      const attendees = names.map((name, i) => ({ name, email: emails[i] }));

      const body: Record<string, unknown> = {
        ticket_type_id: args.ticket_type,
        quantity,
        attendees,
      };
      if (args.discount_code) body.discount_code = args.discount_code;

      const purchaseResult = await atlasRequest<Record<string, unknown>>({
        method: 'POST',
        path: `/atlas/v1/events/${args.event_id}/purchase`,
        body,
        authenticated: true,
      });

      if (purchaseResult.status === 200) {
        return purchaseResult.data;
      }

      if (purchaseResult.status === 402) {
        const challenge = purchaseResult.data['atlas:challenge'] as Record<string, unknown> || purchaseResult.data;
        const holdId = (challenge.hold_id || challenge.ticket_hold_id) as string;

        // Check if Tempo wallet is available for auto-pay
        const { getWalletInfo } = await import('../tempo/index.js');
        const walletInfo = getWalletInfo();

        if (walletInfo.loggedIn && walletInfo.address && walletInfo.ready) {
          const paymentMethods = (challenge.payment_methods || []) as Record<string, unknown>[];
          const tempoMethod = paymentMethods.find((m) =>
            m.type === 'tempo_usdc' || m.method === 'tempo_usdc',
          );

          if (tempoMethod) {
            const amount = String(tempoMethod.amount || (challenge.pricing as Record<string, unknown>)?.total_price);
            const recipient = tempoMethod.recipient_address as string;
            const memo = (tempoMethod.memo as string) || holdId || '';

            const { tempoExec } = await import('../tempo/index.js');
            try {
              const transferArgs = ['wallet', 'transfer', amount, 'USDC', recipient];
              if (memo) transferArgs.push('--memo', memo);
              const transferOutput = tempoExec(transferArgs);

              const txHashMatch = transferOutput.match(/0x[a-fA-F0-9]{64}/);
              const txHash = txHashMatch ? txHashMatch[0] : '';

              if (txHash) {
                const proofResult = await atlasRequest<Record<string, unknown>>({
                  method: 'POST',
                  path: `/atlas/v1/events/${args.event_id}/purchase`,
                  body: {
                    challenge_id: challenge.challenge_id,
                    ticket_hold_id: holdId,
                    payment_proof: {
                      type: 'tempo_usdc',
                      transaction_hash: txHash,
                      network: 'tempo',
                      amount,
                      currency: 'USDC',
                      payer_address: walletInfo.address,
                      status: 'confirmed',
                    },
                  },
                  authenticated: true,
                });

                if (proofResult.status === 200) {
                  return {
                    success: true,
                    payment_method: 'tempo_usdc',
                    transaction_hash: txHash,
                    receipt: proofResult.data['atlas:receipt'] || proofResult.data,
                  };
                }
              }
            } catch {
              // Tempo payment failed — fall through to Stripe checkout
            }
          }
        }

        // Fall through: return checkout URL for Stripe
        const checkoutResult = await atlasRequest<Record<string, unknown>>({
          method: 'POST',
          path: `/atlas/v1/holds/${holdId}/checkout`,
          authenticated: true,
        });

        return {
          phase: 'checkout',
          hold_id: holdId,
          checkout_url: checkoutResult.data.checkout_url,
          amount: challenge.amount,
          currency: challenge.currency,
        };
      }

      return purchaseResult.data;
    },
  });

  register({
    name: 'tickets_price',
    displayName: 'tickets price',
    description: 'Calculate ticket price with optional discount.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'ticket_type', type: 'string', description: 'Ticket type ID', required: true },
      { name: 'quantity', type: 'number', description: 'Number of tickets', required: false, default: '1' },
      { name: 'discount_code', type: 'string', description: 'Discount code', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      // Backend schema accepts Float for count, but ticket quantities are whole numbers
      const count = Math.floor((args.quantity as number) || 1);
      if (count < 1) throw new Error('Quantity must be a positive whole number.');
      const result = await graphqlRequest<{ aiCalculateTicketPrice: unknown }>(
        `query($event: MongoID!, $ticket_type: MongoID!, $count: Float!, $discount_code: String) {
          aiCalculateTicketPrice(event: $event, ticket_type: $ticket_type, count: $count, discount_code: $discount_code) {
            subtotal_cents discount_cents total_cents currency
          }
        }`,
        {
          event: args.event_id,
          ticket_type: args.ticket_type,
          count,
          discount_code: args.discount_code as string | undefined,
        },
      );
      return result.aiCalculateTicketPrice;
    },
    formatResult: (result) => {
      const r = result as { subtotal_cents: number; discount_cents: number; total_cents: number; currency: string };
      const total = (r.total_cents / 100).toFixed(2);
      const subtotal = (r.subtotal_cents / 100).toFixed(2);
      const discount = (r.discount_cents / 100).toFixed(2);
      if (r.discount_cents > 0) return `Price: ${r.currency} ${total} (${r.currency} ${subtotal} - ${r.currency} ${discount} discount).`;
      return `Price: ${r.currency} ${total}`;
    },
  });

  register({
    name: 'tickets_receipt',
    displayName: 'tickets receipt',
    description: 'Check ticket purchase receipt status.',
    params: [
      { name: 'hold_id', type: 'string', description: 'Hold ID from purchase', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await atlasRequest<Record<string, unknown>>({
        path: `/atlas/v1/receipts/by-hold/${args.hold_id}`,
        authenticated: true,
      });
      return result.data;
    },
  });

  register({
    name: 'tickets_create_discount',
    displayName: 'tickets create-discount',
    description: 'Create a discount code for an event ticket type.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'code', type: 'string', description: 'Discount code', required: true },
      { name: 'ratio', type: 'number', description: 'Discount ratio (0.0-1.0)', required: true },
      { name: 'ticket_type_id', type: 'string', description: 'Ticket type ID', required: false },
      { name: 'limit', type: 'number', description: 'Usage limit', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiCreateEventTicketDiscount: unknown }>(
        `mutation($event: MongoID!, $code: String!, $ratio: Float!, $limit: Int) {
          aiCreateEventTicketDiscount(event: $event, code: $code, ratio: $ratio, limit: $limit) {
            code discount_type value limit created_at
          }
        }`,
        {
          event: args.event_id,
          code: args.code,
          ratio: args.ratio,
          limit: args.limit || undefined,
        },
      );
      return result.aiCreateEventTicketDiscount;
    },
  });

  // --- Space ---

  register({
    name: 'space_create',
    displayName: 'space create',
    description: 'Create a new space (community).',
    params: [
      { name: 'title', type: 'string', description: 'Space title', required: true },
      { name: 'description', type: 'string', description: 'Space description', required: false },
      { name: 'slug', type: 'string', description: 'Space URL slug', required: false },
      { name: 'private', type: 'boolean', description: 'Make space private', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiCreateSpace: unknown }>(
        `mutation($input: AISpaceInput!) {
          aiCreateSpace(input: $input) { _id title slug description }
        }`,
        {
          input: {
            title: args.title,
            description: args.description,
            slug: args.slug,
            private: args.private || false,
          },
        },
      );
      return result.aiCreateSpace;
    },
  });

  register({
    name: 'space_list',
    displayName: 'space list',
    description: 'List your spaces.',
    params: [
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '100' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_switch',
    displayName: 'space switch',
    description:
      'Switch the active space for this session. All subsequent space-scoped commands will use this space.',
    params: [
      { name: 'space_id', type: 'string', description: 'The space ID to switch to', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_update',
    displayName: 'space update',
    description: 'Update a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'title', type: 'string', description: 'New title', required: false },
      { name: 'description', type: 'string', description: 'New description', required: false },
      { name: 'slug', type: 'string', description: 'New slug', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.title) input.title = args.title;
      if (args.description) input.description = args.description;
      if (args.slug) input.slug = args.slug;

      const result = await graphqlRequest<{ aiUpdateSpace: unknown }>(
        `mutation($id: MongoID!, $input: AISpaceInput!) {
          aiUpdateSpace(id: $id, input: $input) { _id title slug }
        }`,
        { id: args.space_id, input },
      );
      return result.aiUpdateSpace;
    },
  });

  register({
    name: 'space_stats',
    displayName: 'space analytics',
    description: 'Get space analytics (members, events, ratings).',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_members',
    displayName: 'space members',
    description: 'List members of a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_add_member',
    displayName: 'space add-member',
    description: 'Add a member to a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'user_id', type: 'string', description: 'User ID to add', required: true },
      { name: 'role', type: 'string', description: 'Role: admin|host|member', required: false, default: 'member' },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiAddSpaceMember: unknown }>(
        `mutation($space: MongoID!, $user: MongoID!, $role: String) {
          aiAddSpaceMember(space: $space, user: $user, role: $role)
        }`,
        { space: args.space_id, user: args.user_id, role: args.role || 'member' },
      );
      return result.aiAddSpaceMember;
    },
  });

  register({
    name: 'space_remove_member',
    displayName: 'space remove-member',
    description: 'Remove a member from a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'user_id', type: 'string', description: 'User ID to remove', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiRemoveSpaceMember: unknown }>(
        `mutation($space: MongoID!, $user: MongoID!) {
          aiRemoveSpaceMember(space: $space, user: $user)
        }`,
        { space: args.space_id, user: args.user_id },
      );
      return result.aiRemoveSpaceMember;
    },
  });

  register({
    name: 'space_connectors',
    displayName: 'space connectors',
    description: 'List connected platforms for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_stripe_connect',
    displayName: 'space stripe-connect',
    description: 'Get a Stripe Connect onboarding URL.',
    params: [
      { name: 'return_url', type: 'string', description: 'URL to return to after onboarding', required: false,
        default: 'https://lemonade.social' },
      { name: 'space_slug', type: 'string', description: 'Space slug for fallback URL (from session)', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_stripe_status',
    displayName: 'space stripe-status',
    description: 'Check Stripe account connection status.',
    params: [],
    destructive: false,
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
  });

  register({
    name: 'space_delete',
    displayName: 'space delete',
    description: 'Delete a space permanently. This cannot be undone.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID to delete', required: true },
    ],
    destructive: true,
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
  });

  register({
    name: 'space_deep_stats',
    displayName: 'space deep analytics',
    description: 'Get detailed community statistics including admins, ambassadors, subscribers, events, attendees, and ratings.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_top_hosts',
    displayName: 'space top hosts',
    description: 'Get leaderboard of top event hosts in a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_member_leaderboard',
    displayName: 'space member leaderboard',
    description: 'Get member activity leaderboard — attended events, hosted events, submitted events.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
      { name: 'search', type: 'string', description: 'Search by name', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_events_insight',
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
  });

  register({
    name: 'space_member_update',
    displayName: 'space member update',
    description: 'Update a space member role or visibility.',
    params: [
      { name: 'member_id', type: 'string', description: 'Space member ID', required: true },
      { name: 'role', type: 'string', description: 'New role', required: false, enum: ['admin', 'ambassador', 'member'] },
      { name: 'visible', type: 'boolean', description: 'Member visibility', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_pin_event',
    displayName: 'space pin event',
    description: 'Pin/feature events on a space page.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'event_ids', type: 'string[]', description: 'Event IDs to pin', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_unpin_event',
    displayName: 'space unpin event',
    description: 'Unpin/unfeature events from a space page.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'event_ids', type: 'string[]', description: 'Event IDs to unpin', required: true },
    ],
    destructive: false,
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
  });

  // --- Rewards ---

  register({
    name: 'rewards_balance',
    displayName: 'rewards balance',
    description: 'View reward balance for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ atlasRewardSummary: unknown }>(
        `query($space: String!) {
          atlasRewardSummary(space: $space) {
            organizer_accrued_usdc organizer_pending_usdc organizer_paid_out_usdc
            attendee_accrued_usdc attendee_pending_usdc attendee_paid_out_usdc
            volume_tier monthly_gmv_usdc next_tier_threshold_usdc
            next_payout_date is_self_verified verification_cta_extra_usdc
          }
        }`,
        { space: args.space_id },
      );
      return result.atlasRewardSummary;
    },
  });

  register({
    name: 'rewards_history',
    displayName: 'rewards history',
    description: 'View reward transaction history for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'offset', type: 'number', description: 'Skip results', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ atlasRewardHistory: unknown }>(
        `query($space: String!, $limit: Int, $offset: Int) {
          atlasRewardHistory(space: $space, limit: $limit, offset: $offset) {
            _id event_id gross_amount_usdc
            organizer_cashback_usdc attendee_cashback_usdc
            organizer_volume_bonus_usdc attendee_discovery_bonus_usdc
            payment_method status created_at
          }
        }`,
        {
          space: args.space_id,
          limit: (args.limit as number) || 20,
          offset: (args.offset as number) || 0,
        },
      );
      return result.atlasRewardHistory;
    },
  });

  register({
    name: 'rewards_payouts',
    displayName: 'rewards payouts',
    description: 'View payout history.',
    params: [
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'offset', type: 'number', description: 'Skip results', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ atlasPayoutHistory: unknown }>(
        `query($limit: Int, $offset: Int) {
          atlasPayoutHistory(limit: $limit, offset: $offset) {
            amount_usdc payout_method tx_hash stripe_transfer_id status processed_at
          }
        }`,
        { limit: (args.limit as number) || 20, offset: (args.offset as number) || 0 },
      );
      return result.atlasPayoutHistory;
    },
  });

  register({
    name: 'rewards_referral',
    displayName: 'rewards referral',
    description: 'Generate, apply, or view referral codes.',
    params: [
      { name: 'action', type: 'string', description: 'Action: generate, apply, or view', required: true,
        enum: ['generate', 'apply', 'view'] },
      { name: 'code', type: 'string', description: 'Referral code (for apply action)', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const action = args.action as string;

      if (action === 'generate') {
        const result = await graphqlRequest<{ atlasGenerateReferralCode: unknown }>(
          'mutation { atlasGenerateReferralCode { code } }',
        );
        return result.atlasGenerateReferralCode;
      }

      if (action === 'apply') {
        if (!args.code) throw new Error('Referral code is required for apply action.');
        await graphqlRequest(
          'mutation($code: String!) { atlasApplyReferralCode(code: $code) }',
          { code: args.code },
        );
        return { applied: true };
      }

      const result = await graphqlRequest<{ atlasReferralSummary: unknown }>(
        'query { atlasReferralSummary { code total_referrals total_reward_usdc } }',
      );
      return result.atlasReferralSummary;
    },
  });

  register({
    name: 'rewards_settings',
    displayName: 'rewards settings',
    description: 'View or update payout settings.',
    params: [
      { name: 'wallet_address', type: 'string', description: 'Payout wallet address (0x...)', required: false },
      { name: 'wallet_chain', type: 'string', description: 'Payout chain', required: false },
      { name: 'preferred_method', type: 'string', description: 'Preferred method: stripe|crypto', required: false,
        enum: ['stripe', 'crypto'] },
    ],
    destructive: false,
    execute: async (args) => {
      const hasWrite = args.wallet_address || args.wallet_chain || args.preferred_method;

      if (hasWrite) {
        const input: Record<string, unknown> = {};
        if (args.wallet_address) input.wallet_address = args.wallet_address;
        if (args.wallet_chain) input.wallet_chain = args.wallet_chain;
        if (args.preferred_method) input.preferred_method = args.preferred_method;

        const result = await graphqlRequest<{ atlasUpdatePayoutSettings: unknown }>(
          `mutation($input: AtlasPayoutSettingsInput!) {
            atlasUpdatePayoutSettings(input: $input) {
              wallet_address wallet_chain stripe_connect_account_id preferred_method
            }
          }`,
          { input },
        );
        return result.atlasUpdatePayoutSettings;
      }

      const result = await graphqlRequest<{ atlasGetPayoutSettings: unknown }>(
        `query {
          atlasGetPayoutSettings {
            wallet_address wallet_chain stripe_connect_account_id preferred_method
          }
        }`,
      );
      return result.atlasGetPayoutSettings;
    },
  });

  // --- Site ---

  register({
    name: 'site_generate',
    displayName: 'site generate',
    description: 'AI-generate a page from a text description.',
    params: [
      { name: 'owner_id', type: 'string', description: 'Owner ID (event or space)', required: true },
      { name: 'owner_type', type: 'string', description: 'Owner type: event|space', required: true,
        enum: ['event', 'space'] },
      { name: 'description', type: 'string', description: 'Page description', required: true },
      { name: 'style', type: 'string', description: 'Style hints', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        owner_id: args.owner_id,
        owner_type: args.owner_type,
        description: args.description,
      };
      if (args.style) input.style = args.style;

      const result = await graphqlRequest<{ aiGeneratePageFromDescription: unknown }>(
        `mutation($input: AiGeneratePageInput!) {
          aiGeneratePageFromDescription(input: $input) {
            _id name status version
            sections { id type order hidden }
            theme { type mode colors { text_primary accent background } }
          }
        }`,
        { input },
      );
      return result.aiGeneratePageFromDescription;
    },
  });

  register({
    name: 'site_create_page',
    displayName: 'site create-page',
    description: 'Create a page configuration.',
    params: [
      { name: 'owner_id', type: 'string', description: 'Owner ID', required: true },
      { name: 'owner_type', type: 'string', description: 'Owner type: event|space', required: true,
        enum: ['event', 'space'] },
      { name: 'name', type: 'string', description: 'Page name', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiCreatePageConfig: unknown }>(
        `mutation($input: CreatePageConfigInput!) {
          aiCreatePageConfig(input: $input) {
            _id name status version
          }
        }`,
        { input: { owner_id: args.owner_id, owner_type: args.owner_type, name: args.name } },
      );
      return result.aiCreatePageConfig;
    },
  });

  register({
    name: 'site_update_section',
    displayName: 'site update-section',
    description: 'Update a section in a page configuration.',
    params: [
      { name: 'page_id', type: 'string', description: 'Page config ID', required: true },
      { name: 'section_id', type: 'string', description: 'Section ID', required: true },
      { name: 'hidden', type: 'boolean', description: 'Hide/show section', required: false },
      { name: 'order', type: 'number', description: 'Display order', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        page_id: args.page_id,
        section_id: args.section_id,
      };
      if (args.hidden !== undefined) input.hidden = args.hidden;
      if (args.order !== undefined) input.order = args.order;

      const result = await graphqlRequest<{ aiUpdatePageConfigSection: unknown }>(
        `mutation($input: UpdatePageConfigSectionInput!) {
          aiUpdatePageConfigSection(input: $input) {
            _id name status
          }
        }`,
        { input },
      );
      return result.aiUpdatePageConfigSection;
    },
  });

  register({
    name: 'site_deploy',
    displayName: 'site deploy',
    description: 'Publish a page.',
    params: [
      { name: 'page_id', type: 'string', description: 'Page ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ publishPageConfig: unknown }>(
        `mutation($id: MongoID!) {
          publishPageConfig(id: $id) { _id status published_version }
        }`,
        { id: args.page_id },
      );
      return result.publishPageConfig;
    },
  });

  register({
    name: 'site_templates',
    displayName: 'site templates',
    description: 'List available page section templates.',
    params: [
      { name: 'owner_type', type: 'string', description: 'Owner type: event|space', required: false, default: 'event',
        enum: ['event', 'space'] },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiSuggestSections: unknown }>(
        `query($ownerType: String!) {
          aiSuggestSections(ownerType: $ownerType) {
            id name description preview_url
          }
        }`,
        { ownerType: (args.owner_type as string) || 'event' },
      );
      return result.aiSuggestSections;
    },
  });

  // --- Connectors ---

  register({
    name: 'connectors_list',
    displayName: 'connectors list',
    description: 'List available platform integrations.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ availableConnectors: unknown }>(
        'query { availableConnectors { id name category authType capabilities } }',
      );
      return result.availableConnectors;
    },
  });

  register({
    name: 'connectors_sync',
    displayName: 'connectors sync',
    description: 'Trigger a connector sync.',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'action', type: 'string', description: 'Action to execute', required: false, default: 'sync-events' },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ executeConnectorAction: unknown }>(
        `mutation($input: ExecuteConnectorActionInput!) {
          executeConnectorAction(input: $input) {
            success data message error recordsProcessed recordsFailed
          }
        }`,
        { input: { connectionId: args.connection_id, actionId: args.action || 'sync-events' } },
      );
      return result.executeConnectorAction;
    },
  });

  register({
    name: 'connector_connect',
    displayName: 'connector connect',
    description: 'Initiate connecting a new integration to a space. Returns OAuth URL for OAuth connectors or requiresApiKey for API key connectors.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'connector_type', type: 'string', description: 'Connector type (e.g., google-sheets, luma, eventbrite, airtable, meetup, dice)', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ connectPlatform: { connectionId: string; authUrl?: string; requiresApiKey: boolean } }>(
        `mutation($input: ConnectPlatformInput!) {
          connectPlatform(input: $input) { connectionId authUrl requiresApiKey }
        }`,
        { input: { spaceId: args.space_id, connectorType: args.connector_type } },
      );
      return result.connectPlatform;
    },
  });

  register({
    name: 'connector_submit_api_key',
    displayName: 'connector submit API key',
    description: 'Submit an API key for an API-key-based connector (Luma, Dice, etc.).',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID from connector_connect', required: true },
      { name: 'api_key', type: 'string', description: 'API key', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ submitApiKey: unknown }>(
        `mutation($input: SubmitApiKeyInput!) {
          submitApiKey(input: $input) { id connectorType status enabled errorMessage }
        }`,
        { input: { connectionId: args.connection_id, apiKey: args.api_key } },
      );
      return result.submitApiKey;
    },
    formatResult: (result) => {
      const r = result as { connectorType: string; status: string };
      return `API key submitted. ${r.connectorType} is now ${r.status}.`;
    },
  });

  register({
    name: 'connector_configure',
    displayName: 'connector configure',
    description: 'Configure a connected integration (set organization, calendar, sync schedule, etc.).',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'config', type: 'string', description: 'Configuration as JSON string', required: true },
      { name: 'sync_schedule', type: 'string', description: 'Cron schedule (e.g., "0 * * * *" for hourly)', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      let config: Record<string, unknown>;
      try {
        config = typeof args.config === 'string' ? JSON.parse(args.config as string) : args.config as Record<string, unknown>;
      } catch {
        throw new Error('Invalid config JSON');
      }
      const input: Record<string, unknown> = { connectionId: args.connection_id, config };
      if (args.sync_schedule) input.syncSchedule = args.sync_schedule;
      const result = await graphqlRequest<{ configureConnection: unknown }>(
        `mutation($input: ConfigureConnectionInput!) {
          configureConnection(input: $input) { id connectorType status config enabled errorMessage }
        }`,
        { input },
      );
      return result.configureConnection;
    },
    formatResult: (result) => {
      const r = result as { connectorType: string; status: string };
      return `${r.connectorType} configured. Status: ${r.status}.`;
    },
  });

  register({
    name: 'connector_config_options',
    displayName: 'connector config options',
    description: 'Fetch dropdown options for connector configuration (e.g., list of Airtable bases).',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'option_key', type: 'string', description: 'Config option key to fetch (e.g., baseId, tableId)', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ fetchConnectionConfigOptions: Array<{ value: string; label: string }> }>(
        `query($connectionId: String!, $optionKey: String!) {
          fetchConnectionConfigOptions(connectionId: $connectionId, optionKey: $optionKey) { value label }
        }`,
        { connectionId: args.connection_id, optionKey: args.option_key },
      );
      return { options: result.fetchConnectionConfigOptions };
    },
  });

  register({
    name: 'connector_logs',
    displayName: 'connector logs',
    description: 'View sync activity logs for a connection.',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ connectionLogs: Array<Record<string, unknown>> }>(
        `query($connectionId: String!, $limit: Int) {
          connectionLogs(connectionId: $connectionId, limit: $limit) {
            _id actionId triggerType triggeredBy status recordsProcessed recordsFailed duration errorMessage createdAt
          }
        }`,
        { connectionId: args.connection_id, limit: (args.limit as number) || 10 },
      );
      return { logs: result.connectionLogs, count: result.connectionLogs.length };
    },
  });

  register({
    name: 'connector_disconnect',
    displayName: 'connector disconnect',
    description: 'Disconnect an integration from a space. This revokes access and removes all credentials.',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ disconnectPlatform: boolean }>(
        `mutation($connectionId: String!) {
          disconnectPlatform(connectionId: $connectionId)
        }`,
        { connectionId: args.connection_id },
      );
      return { disconnected: result.disconnectPlatform };
    },
    formatResult: (result) => {
      const r = result as { disconnected: boolean };
      return r.disconnected ? 'Connector disconnected.' : 'Failed to disconnect.';
    },
  });

  register({
    name: 'connector_slot_info',
    displayName: 'connector slot info',
    description: 'Check how many connector slots a space has used vs allowed.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ connectorSlotInfo: { used: number; max: number; canAddMore: boolean; currentTier: string } }>(
        `query($spaceId: String!) {
          connectorSlotInfo(spaceId: $spaceId) { used max canAddMore currentTier }
        }`,
        { spaceId: args.space_id },
      );
      return result.connectorSlotInfo;
    },
    formatResult: (result) => {
      const r = result as { used: number; max: number; canAddMore: boolean; currentTier: string };
      return `Connectors: ${r.used}/${r.max} used (${r.currentTier} tier). ${r.canAddMore ? 'Can add more.' : 'At limit.'}`;
    },
  });

  // --- Notifications ---

  register({
    name: 'notifications_list',
    displayName: 'notifications list',
    description: 'Get recent notifications.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetNotifications: Array<{ id: string; type: string; message: string; from_user_name?: string; ref_event_title?: string; read: boolean; created_at: string }> }>(
        'query { aiGetNotifications { id type message from_user_name ref_event_title read created_at } }',
      );
      return { items: result.aiGetNotifications };
    },
  });

  register({
    name: 'notifications_read',
    displayName: 'notifications read',
    description: 'Mark notifications as read.',
    params: [
      { name: 'notification_ids', type: 'string[]', description: 'Notification IDs to mark as read', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const ids = args.notification_ids as string[];
      for (const id of ids) {
        await graphqlRequest<{ aiReadNotifications: boolean }>(
          'mutation($id: MongoID) { aiReadNotifications(id: $id) }',
          { id },
        );
      }
      return { read: true, count: ids.length };
    },
  });

  // --- System ---

  register({
    name: 'get_backend_version',
    displayName: 'backend version',
    description: 'Get the backend API version.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetBackendVersion: string }>(
        'query { aiGetBackendVersion }',
      );
      return { version: result.aiGetBackendVersion };
    },
    formatResult: (result) => {
      const r = result as { version: string };
      return `Backend version: ${r.version}`;
    },
  });

  register({
    name: 'cli_version',
    displayName: 'CLI version',
    description: 'Check the current CLI version and whether an update is available from npm.',
    params: [],
    destructive: false,
    execute: async () => {
      const { VERSION } = await import('../version.js');
      try {
        const response = await fetch('https://registry.npmjs.org/@lemonade-social/cli/latest');
        const data = await response.json() as { version: string };
        const latest = data.version;
        if (VERSION === latest) {
          return { current: VERSION, latest, up_to_date: true };
        }
        return {
          current: VERSION,
          latest,
          up_to_date: false,
          update_command: 'npm install -g @lemonade-social/cli',
          hint: `Update available: v${VERSION} → v${latest}. Run /version to update.`,
        };
      } catch {
        return { current: VERSION, latest: 'unknown', up_to_date: 'unknown', error: 'Could not check npm registry' };
      }
    },
    formatResult: (result) => {
      const r = result as { current: string; latest: string; up_to_date: boolean };
      if (r.up_to_date) return `You're on the latest CLI version (v${r.current}).`;
      return `Update available: v${r.current} \u2192 v${r.latest}. Run /version to install.`;
    },
  });

  register({
    name: 'list_chains',
    displayName: 'list chains',
    description: 'List supported blockchain networks.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiListChains: unknown }>(
        'query { aiListChains { id name symbol } }',
      );
      return result.aiListChains;
    },
  });

  // --- Launchpad ---

  register({
    name: 'launchpad_list_coins',
    displayName: 'launchpad list-coins',
    description: 'List launchpad coins.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiListLaunchpadCoins: unknown }>(
        'query { aiListLaunchpadCoins { items { _id name symbol status } } }',
      );
      return result.aiListLaunchpadCoins;
    },
  });

  register({
    name: 'launchpad_add_coin',
    displayName: 'launchpad add-coin',
    description: 'Add a new launchpad coin.',
    params: [
      { name: 'name', type: 'string', description: 'Coin name', required: true },
      { name: 'symbol', type: 'string', description: 'Coin symbol', required: true },
      { name: 'description', type: 'string', description: 'Coin description', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiAddLaunchpadCoin: unknown }>(
        `mutation($input: AddLaunchpadCoinInput!) {
          aiAddLaunchpadCoin(input: $input) { _id name symbol status }
        }`,
        { input: { name: args.name, symbol: args.symbol, description: args.description } },
      );
      return result.aiAddLaunchpadCoin;
    },
  });

  register({
    name: 'launchpad_update_coin',
    displayName: 'launchpad update-coin',
    description: 'Update a launchpad coin.',
    params: [
      { name: 'coin_id', type: 'string', description: 'Coin ID', required: true },
      { name: 'name', type: 'string', description: 'New name', required: false },
      { name: 'description', type: 'string', description: 'New description', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { _id: args.coin_id };
      if (args.name) input.name = args.name;
      if (args.description) input.description = args.description;

      const result = await graphqlRequest<{ aiUpdateLaunchpadCoin: unknown }>(
        `mutation($input: UpdateLaunchpadCoinInput!) {
          aiUpdateLaunchpadCoin(input: $input) { _id name symbol status }
        }`,
        { input },
      );
      return result.aiUpdateLaunchpadCoin;
    },
  });

  // --- Event Cloning & Recurring ---

  register({
    name: 'event_clone',
    displayName: 'event clone',
    description: 'Clone an event to one or more new dates. Returns array of new event IDs.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID to clone', required: true },
      { name: 'dates', type: 'string[]', description: 'Array of ISO 8601 dates for the cloned events', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_recurring_dates',
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
    destructive: false,
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
  });

  // --- Co-host Management ---

  register({
    name: 'event_list_cohost_requests',
    displayName: 'event cohost requests',
    description: 'List co-host requests/invitations for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'state', type: 'string', description: 'Filter by state', required: false,
        enum: ['DECLINED', 'ACCEPTED', 'PENDING'] },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_add_cohost',
    displayName: 'event add cohost',
    description: 'Add a co-host, gatekeeper, or representative to an event by email or user ID.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'email', type: 'string', description: 'Target email', required: false },
      { name: 'user_id', type: 'string', description: 'Target user ObjectId', required: false },
      { name: 'role', type: 'string', description: 'Role to assign', required: false,
        enum: ['cohost', 'gatekeeper', 'representative'] },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_remove_cohost',
    displayName: 'event remove cohost',
    description: 'Remove a co-host from an event by email or user ID.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'email', type: 'string', description: 'Target email', required: false },
      { name: 'user_id', type: 'string', description: 'Target user ObjectId', required: false },
    ],
    destructive: true,
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
  });

  // --- Broadcasting ---

  register({
    name: 'event_broadcast_create',
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
    destructive: false,
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
  });

  register({
    name: 'event_broadcast_update',
    displayName: 'event broadcast update',
    description: "Update a broadcast's settings.",
    params: [
      { name: 'broadcast_id', type: 'string', description: 'Broadcast ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'description', type: 'string', description: 'New description', required: false },
      { name: 'position', type: 'number', description: 'New display order', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_broadcast_delete',
    displayName: 'event broadcast delete',
    description: 'Delete a broadcast from an event.',
    params: [
      { name: 'broadcast_id', type: 'string', description: 'Broadcast ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteEventBroadcast: boolean }>(
        `mutation($_id: MongoID!, $event: MongoID!) {
          deleteEventBroadcast(_id: $_id, event: $event)
        }`,
        { _id: args.broadcast_id, event: args.event_id },
      );
      return result.deleteEventBroadcast;
    },
  });

  // --- Email Workflows ---

  register({
    name: 'event_emails_list',
    displayName: 'event emails list',
    description: 'List email settings/workflows configured for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'system', type: 'boolean', description: 'Include system email templates', required: false },
      { name: 'scheduled', type: 'boolean', description: 'Filter by scheduled emails', required: false },
      { name: 'sent', type: 'boolean', description: 'Filter by sent emails', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_email_create',
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
    destructive: false,
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
  });

  register({
    name: 'event_email_update',
    displayName: 'event email update',
    description: 'Update an existing email setting.',
    params: [
      { name: 'email_setting_id', type: 'string', description: 'Email setting ObjectId', required: true },
      { name: 'custom_subject_html', type: 'string', description: 'Updated subject HTML', required: false },
      { name: 'custom_body_html', type: 'string', description: 'Updated body HTML', required: false },
      { name: 'disabled', type: 'boolean', description: 'Enable/disable', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_email_delete',
    displayName: 'event email delete',
    description: 'Delete an email setting.',
    params: [
      { name: 'email_setting_id', type: 'string', description: 'Email setting ObjectId', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteEventEmailSetting: boolean }>(
        `mutation($_id: MongoID!) {
          deleteEventEmailSetting(_id: $_id)
        }`,
        { _id: args.email_setting_id },
      );
      return result.deleteEventEmailSetting;
    },
  });

  register({
    name: 'event_email_toggle',
    displayName: 'event email toggle',
    description: 'Enable or disable multiple email settings at once.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'email_setting_ids', type: 'string[]', description: 'Array of email setting ObjectIds', required: true },
      { name: 'disabled', type: 'boolean', description: 'true to disable, false to enable', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ toggleEventEmailSettings: boolean }>(
        `mutation($event: MongoID!, $ids: [MongoID!]!, $disabled: Boolean!) {
          toggleEventEmailSettings(event: $event, ids: $ids, disabled: $disabled)
        }`,
        { event: args.event_id, ids: args.email_setting_ids, disabled: args.disabled },
      );
      return result.toggleEventEmailSettings;
    },
  });

  register({
    name: 'event_email_test',
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
    destructive: false,
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
  });

  // --- Guest Management Enhanced ---

  register({
    name: 'event_ticket_statistics',
    displayName: 'event ticket statistics',
    description: 'Get ticket statistics for an event (all, checked in, cancelled, per ticket type).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_export_guests',
    displayName: 'event export guests',
    description: 'Export attendee/ticket data for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'checked_in', type: 'boolean', description: 'Filter by check-in status', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_guest_detail',
    displayName: 'event guest detail',
    description: 'Get detailed info about a specific guest (ticket, payment, join request, application).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'user_id', type: 'string', description: 'Guest user ObjectId', required: false },
      { name: 'email', type: 'string', description: 'Guest email', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_guests_statistics',
    displayName: 'event guests statistics',
    description: 'Get detailed guest statistics (going, pending, declined, checked in, per ticket type).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_guests_list',
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
    destructive: false,
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
  });

  // --- Invitation Statistics ---

  register({
    name: 'event_invitation_stats',
    displayName: 'event invitation stats',
    description: 'Get invitation tracking statistics for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'limit', type: 'number', description: 'Max guest results', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_cancel_invitations',
    displayName: 'event cancel invitations',
    description: 'Cancel sent invitations for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'invitation_ids', type: 'string[]', description: 'Array of invitation IDs to cancel', required: true },
    ],
    destructive: true,
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
  });

  // --- Analytics Charts ---

  register({
    name: 'event_sales_chart',
    displayName: 'event sales chart',
    description: 'Get ticket sales data over a time range for charting.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'start', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end', type: 'string', description: 'End date ISO 8601', required: true },
      { name: 'ticket_type_ids', type: 'string[]', description: 'Filter by ticket type IDs', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_checkin_chart',
    displayName: 'event checkin chart',
    description: 'Get check-in data over a time range for charting.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'start', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end', type: 'string', description: 'End date ISO 8601', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_views_chart',
    displayName: 'event views chart',
    description: 'Get page view data over a time range for charting.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'start', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end', type: 'string', description: 'End date ISO 8601', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_view_stats',
    displayName: 'event view stats',
    description: 'Get view counts for multiple date ranges (for comparison).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'ranges', type: 'object[]', description: 'Array of { start, end } date ranges', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_top_views',
    displayName: 'event top views',
    description: 'Get top traffic sources and cities for an event, plus total views.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'city_limit', type: 'number', description: 'Max cities to return', required: true },
      { name: 'source_limit', type: 'number', description: 'Max sources to return', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_top_inviters',
    displayName: 'event top inviters',
    description: 'Get top inviters ranked by successful invitations.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'limit', type: 'number', description: 'Pagination limit', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
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
  });

  // --- Page Configuration ---

  register({
    name: 'page_archive',
    displayName: 'page archive',
    description: 'Archive a page configuration.',
    params: [
      { name: 'page_id', type: 'string', description: 'PageConfig ObjectId', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ archivePageConfig: unknown }>(
        `mutation($id: MongoID!) {
          archivePageConfig(id: $id) { _id name status }
        }`,
        { id: args.page_id },
      );
      return result.archivePageConfig;
    },
  });

  register({
    name: 'page_save_version',
    displayName: 'page save version',
    description: 'Save a named version snapshot of a page configuration.',
    params: [
      { name: 'config_id', type: 'string', description: 'PageConfig ObjectId', required: true },
      { name: 'name', type: 'string', description: 'Version name', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { config_id: args.config_id };
      if (args.name) vars.name = args.name;

      const result = await graphqlRequest<{ saveConfigVersion: unknown }>(
        `mutation($config_id: MongoID!, $name: String) {
          saveConfigVersion(config_id: $config_id, name: $name) {
            _id config_id version name
          }
        }`,
        vars,
      );
      return result.saveConfigVersion;
    },
  });

  register({
    name: 'page_restore_version',
    displayName: 'page restore version',
    description: 'Restore a page configuration to a previous version.',
    params: [
      { name: 'config_id', type: 'string', description: 'PageConfig ObjectId', required: true },
      { name: 'version', type: 'number', description: 'Version number to restore', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ restoreConfigVersion: unknown }>(
        `mutation($config_id: MongoID!, $version: Float!) {
          restoreConfigVersion(config_id: $config_id, version: $version) {
            _id name status version
          }
        }`,
        { config_id: args.config_id, version: args.version },
      );
      return result.restoreConfigVersion;
    },
  });

  register({
    name: 'page_list_versions',
    displayName: 'page list versions',
    description: 'List saved versions of a page configuration.',
    params: [
      { name: 'config_id', type: 'string', description: 'PageConfig ObjectId', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ listConfigVersions: unknown }>(
        `query($config_id: MongoID!) {
          listConfigVersions(config_id: $config_id) {
            _id config_id version name
          }
        }`,
        { config_id: args.config_id },
      );
      return result.listConfigVersions;
    },
  });

  register({
    name: 'page_section_catalog',
    displayName: 'page section catalog',
    description: 'Get the catalog of available section types for page building.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ getSectionCatalog: unknown }>(
        `query {
          getSectionCatalog { type name description category supports_children }
        }`,
      );
      return result.getSectionCatalog;
    },
  });

  // --- Templates ---

  register({
    name: 'template_list',
    displayName: 'template list',
    description: 'List available page templates with optional filters.',
    params: [
      { name: 'category', type: 'string', description: 'Filter by category', required: false },
      { name: 'target', type: 'string', description: 'Filter by target (event, space, universal)', required: false },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'featured', type: 'boolean', description: 'Filter featured only', required: false },
      { name: 'tier_max', type: 'string', description: 'Max subscription tier', required: false },
      { name: 'creator_id', type: 'string', description: 'Filter by creator', required: false },
      { name: 'limit', type: 'number', description: 'Pagination limit', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = {};
      if (args.category) vars.category = args.category;
      if (args.target) vars.target = args.target;
      if (args.search) vars.search = args.search;
      if (args.featured !== undefined) vars.featured = args.featured;
      if (args.tier_max) vars.tier_max = args.tier_max;
      if (args.creator_id) vars.creator_id = args.creator_id;
      if (args.limit !== undefined) vars.limit = args.limit;
      if (args.skip !== undefined) vars.skip = args.skip;

      const result = await graphqlRequest<{ listTemplates: unknown }>(
        `query($category: String, $target: String, $search: String, $featured: Boolean, $tier_max: String, $creator_id: MongoID, $limit: Int, $skip: Int) {
          listTemplates(category: $category, target: $target, search: $search, featured: $featured, tier_max: $tier_max, creator_id: $creator_id, limit: $limit, skip: $skip) {
            _id name slug description category tags thumbnail_url target visibility
          }
        }`,
        vars,
      );
      return result.listTemplates;
    },
  });

  register({
    name: 'template_clone_to_config',
    displayName: 'template clone to config',
    description: 'Clone a template to create a new page configuration for an event or space.',
    params: [
      { name: 'template_id', type: 'string', description: 'Template ObjectId', required: true },
      { name: 'owner_type', type: 'string', description: 'Owner type', required: true,
        enum: ['event', 'space'] },
      { name: 'owner_id', type: 'string', description: 'Event or space ObjectId', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ cloneTemplateToConfig: unknown }>(
        `mutation($template_id: MongoID!, $owner_type: String!, $owner_id: MongoID!) {
          cloneTemplateToConfig(template_id: $template_id, owner_type: $owner_type, owner_id: $owner_id) {
            _id name status version
          }
        }`,
        { template_id: args.template_id, owner_type: args.owner_type, owner_id: args.owner_id },
      );
      return result.cloneTemplateToConfig;
    },
  });

  // --- Token Gates (NT-36 through NT-39) ---

  register({
    name: 'event_token_gates_list',
    displayName: 'event token gates list',
    description: 'List token gates for an event with optional filters.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'networks', type: 'string[]', description: 'Filter by blockchain networks', required: false },
      { name: 'ticket_types', type: 'string[]', description: 'Filter by gated ticket type IDs', required: false },
      { name: 'search', type: 'string', description: 'Search by name', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_token_gate_create',
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
    destructive: false,
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
  });

  register({
    name: 'event_token_gate_update',
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
    destructive: false,
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
  });

  register({
    name: 'event_token_gate_delete',
    displayName: 'event token gate delete',
    description: 'Delete a token gate from an event.',
    params: [
      { name: 'token_gate_id', type: 'string', description: 'Token gate ObjectId', required: true },
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($_id: MongoID!, $event: MongoID!) {
          deleteEventTokenGate(_id: $_id, event: $event)
        }`,
        { _id: args.token_gate_id, event: args.event_id },
      );
      return { deleted: true, token_gate_id: args.token_gate_id };
    },
  });

  // --- POAP Drops (NT-40 through NT-43) ---

  register({
    name: 'event_poap_list',
    displayName: 'event poap list',
    description: 'List POAP drops for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_poap_create',
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
    destructive: false,
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
  });

  register({
    name: 'event_poap_update',
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
    destructive: false,
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
  });

  register({
    name: 'event_poap_import',
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
    destructive: false,
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
  });

  // --- Ticket Categories (NT-44 through NT-48) ---

  register({
    name: 'event_ticket_categories_list',
    displayName: 'event ticket categories list',
    description: 'List ticket categories for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_ticket_category_create',
    displayName: 'event ticket category create',
    description: 'Create a ticket category for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'title', type: 'string', description: 'Category title', required: true },
      { name: 'description', type: 'string', description: 'Category description', required: false },
      { name: 'position', type: 'number', description: 'Display order', required: false },
      { name: 'ticket_types', type: 'string[]', description: 'Ticket type IDs to assign', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_ticket_category_update',
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
    destructive: false,
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
  });

  register({
    name: 'event_ticket_category_delete',
    displayName: 'event ticket category delete',
    description: 'Delete one or more ticket categories from an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'category_ids', type: 'string[]', description: 'Array of category ObjectIds', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($event: MongoID!, $categories: [MongoID!]!) {
          deleteEventTicketCategory(event: $event, categories: $categories)
        }`,
        { event: args.event_id, categories: args.category_ids },
      );
      return { deleted: true, category_ids: args.category_ids };
    },
  });

  register({
    name: 'event_ticket_category_reorder',
    displayName: 'event ticket category reorder',
    description: 'Reorder ticket categories for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'categories', type: 'object[]', description: 'Array of { _id: string, position: number }', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($event: MongoID!, $categories: [ReorderTicketTypeCategoryInput!]!) {
          reorderTicketTypeCategories(event: $event, categories: $categories)
        }`,
        { event: args.event_id, categories: args.categories },
      );
      return { reordered: true };
    },
  });

  // --- Space Tags (NT-49 through NT-52) ---

  register({
    name: 'space_tags_list',
    displayName: 'space tags list',
    description: 'List tags for a space with optional type filter.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'type', type: 'string', description: 'Tag type filter', required: false,
        enum: ['event', 'member'] },
    ],
    destructive: false,
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
  });

  register({
    name: 'space_tag_upsert',
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
  });

  register({
    name: 'space_tag_delete',
    displayName: 'space tag delete',
    description: 'Delete a space tag.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'tag_id', type: 'string', description: 'Tag ObjectId', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($space: MongoID!, $_id: MongoID!) {
          deleteSpaceTag(space: $space, _id: $_id)
        }`,
        { space: args.space_id, _id: args.tag_id },
      );
      return { deleted: true, tag_id: args.tag_id };
    },
  });

  register({
    name: 'space_tag_manage',
    displayName: 'space tag manage',
    description: 'Add or remove a target (event or member) from a space tag.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'tag_id', type: 'string', description: 'Tag ObjectId', required: true },
      { name: 'target', type: 'string', description: 'Target ID (event or user ObjectId/email)', required: true },
      { name: 'tagged', type: 'boolean', description: 'true to add, false to remove', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($space: MongoID!, $_id: MongoID!, $target: String!, $tagged: Boolean!) {
          manageSpaceTag(space: $space, _id: $_id, target: $target, tagged: $tagged)
        }`,
        { space: args.space_id, _id: args.tag_id, target: args.target, tagged: args.tagged },
      );
      return { managed: true, tag_id: args.tag_id, target: args.target, tagged: args.tagged };
    },
  });

  // --- Event Questions (NT-53 through NT-56) ---

  register({
    name: 'event_question_create',
    displayName: 'event question create',
    description: 'Post a question in an event Q&A session.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'question', type: 'string', description: 'Question text', required: true },
      { name: 'session', type: 'string', description: 'Session ObjectId (if multiple sessions)', required: false },
    ],
    destructive: false,
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
  });

  register({
    name: 'event_question_delete',
    displayName: 'event question delete',
    description: 'Delete a question (soft delete).',
    params: [
      { name: 'question_id', type: 'string', description: 'Question ObjectId', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($_id: MongoID!) {
          deleteEventQuestion(_id: $_id)
        }`,
        { _id: args.question_id },
      );
      return { deleted: true, question_id: args.question_id };
    },
  });

  register({
    name: 'event_question_like',
    displayName: 'event question like',
    description: 'Toggle like on a question.',
    params: [
      { name: 'question_id', type: 'string', description: 'Question ObjectId', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      await graphqlRequest(
        `mutation($_id: MongoID!) {
          toggleEventQuestionLike(_id: $_id)
        }`,
        { _id: args.question_id },
      );
      return { toggled: true, question_id: args.question_id };
    },
  });

  register({
    name: 'event_questions_list',
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
    destructive: false,
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
  });

  // --- AI Credits & Usage (NT-57 through NT-62) ---

  register({
    name: 'credits_balance',
    displayName: 'credits balance',
    description: 'Check AI credit balance for a community, including subscription tier, purchased credits, and renewal date.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getStandCredits: unknown }>(
        `query($stand_id: String!) {
          getStandCredits(stand_id: $stand_id) {
            credits subscription_tier subscription_credits purchased_credits subscription_renewal_date subscription_status credits_high_water_mark estimated_depletion_date
          }
        }`,
        { stand_id: args.stand_id },
      );
      return result.getStandCredits;
    },
  });

  register({
    name: 'credits_usage',
    displayName: 'credits usage',
    description: 'Get usage analytics for a community over a date range: daily usage, breakdown by model, top users, and totals.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
      { name: 'start_date', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end_date', type: 'string', description: 'End date ISO 8601', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getUsageAnalytics: unknown }>(
        `query($stand_id: String!, $start_date: DateTime!, $end_date: DateTime!) {
          getUsageAnalytics(stand_id: $stand_id, start_date: $start_date, end_date: $end_date) {
            daily_usage { date requests credits }
            by_model { model tier requests credits percentage }
            top_users { user_id requests credits percentage }
            totals { requests credits avg_credits_per_request }
          }
        }`,
        { stand_id: args.stand_id, start_date: args.start_date, end_date: args.end_date },
      );
      return result.getUsageAnalytics;
    },
  });

  register({
    name: 'credits_buy',
    displayName: 'credits buy',
    description: 'Purchase a credit top-up package. Returns a Stripe checkout URL.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
      { name: 'package', type: 'string', description: 'Credit package', required: true,
        enum: ['5', '10', '25', '50', '100'] },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ purchaseCredits: unknown }>(
        `mutation($input: PurchaseCreditInput!) {
          purchaseCredits(input: $input) {
            checkout_url session_id
          }
        }`,
        { input: { stand_id: args.stand_id, package: args.package } },
      );
      return result.purchaseCredits;
    },
  });

  register({
    name: 'available_models',
    displayName: 'available models',
    description: 'List AI models available for the current subscription tier.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId (optional for tier filtering)', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = {};
      if (args.space_id) vars.spaceId = args.space_id;

      const result = await graphqlRequest<{ getAvailableModels: unknown }>(
        `query($spaceId: String) {
          getAvailableModels(spaceId: $spaceId) {
            id provider name tier minimum_credits_per_request capabilities is_default
          }
        }`,
        vars,
      );
      return result.getAvailableModels;
    },
  });

  register({
    name: 'set_preferred_model',
    displayName: 'set preferred model',
    description: 'Set the current user preferred AI model.',
    params: [
      { name: 'model_id', type: 'string', description: 'Model ID string (from available_models)', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ setPreferredModel: unknown }>(
        `mutation($input: SetPreferredModelInput!) {
          setPreferredModel(input: $input) {
            id provider name tier minimum_credits_per_request capabilities is_default
          }
        }`,
        { input: { model_id: args.model_id } },
      );
      return result.setPreferredModel;
    },
  });

  register({
    name: 'set_space_default_model',
    displayName: 'set space default model',
    description: 'Set a community default AI model.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'model_id', type: 'string', description: 'Model ID string', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ setSpaceDefaultModel: unknown }>(
        `mutation($input: SetSpaceDefaultModelInput!) {
          setSpaceDefaultModel(input: $input) {
            id provider name tier minimum_credits_per_request capabilities is_default
          }
        }`,
        { input: { spaceId: args.space_id, modelId: args.model_id } },
      );
      return result.setSpaceDefaultModel;
    },
  });

  // --- Subscriptions (NT-63 through NT-67) ---

  register({
    name: 'subscription_status',
    displayName: 'subscription status',
    description: 'Get current subscription status for a community, including subscription record, detail items, and pending payment info.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceSubscription: unknown }>(
        `query($space: MongoID!) {
          getSpaceSubscription(space: $space) {
            subscription { _id space status current_period_start current_period_end cancel_at_period_end }
            items { _id type active }
            payment { client_secret publishable_key }
          }
        }`,
        { space: args.space_id },
      );
      return result.getSpaceSubscription;
    },
  });

  register({
    name: 'subscription_features',
    displayName: 'subscription features',
    description: 'List all subscription features and their tier-level configuration.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ listSubscriptionFeatureConfigs: unknown }>(
        `query {
          listSubscriptionFeatureConfigs {
            feature_code feature_type description display_label tiers
          }
        }`,
      );
      return result.listSubscriptionFeatureConfigs;
    },
  });

  register({
    name: 'subscription_plans',
    displayName: 'subscription plans',
    description: 'List available subscription plans with pricing and AI credit allocations.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ listSubscriptionItems: unknown }>(
        `query {
          listSubscriptionItems {
            type title pricing { price annual_price currency decimals } credits_per_month
          }
        }`,
      );
      return result.listSubscriptionItems;
    },
  });

  register({
    name: 'subscription_upgrade',
    displayName: 'subscription upgrade',
    description: 'Purchase or upgrade a community subscription tier. Returns a Stripe checkout URL.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
      { name: 'tier', type: 'string', description: 'Subscription tier', required: true,
        enum: ['pro', 'plus', 'max'] },
      { name: 'annual', type: 'boolean', description: 'Annual billing if true', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        stand_id: args.stand_id,
        tier: args.tier,
      };
      if (args.annual !== undefined) input.annual = args.annual;

      const result = await graphqlRequest<{ purchaseSubscription: unknown }>(
        `mutation($input: PurchaseSubscriptionInput!) {
          purchaseSubscription(input: $input) {
            checkout_url session_id
          }
        }`,
        { input },
      );
      return result.purchaseSubscription;
    },
  });

  register({
    name: 'subscription_cancel',
    displayName: 'subscription cancel',
    description: 'Cancel an AI credit subscription for a community.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ cancelSubscription: unknown }>(
        `mutation($input: CancelSubscriptionInput!) {
          cancelSubscription(input: $input) {
            success effective_date
          }
        }`,
        { input: { stand_id: args.stand_id } },
      );
      return result.cancelSubscription;
    },
  });

  // --- My Tickets ---

  register({
    name: 'my_tickets',
    displayName: 'my tickets',
    description: 'Get tickets the current user has purchased.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetMyTickets: unknown }>(
        'query { aiGetMyTickets { items { event_id event_title ticket_type_title status event_start event_end } } }',
      );
      return result.aiGetMyTickets;
    },
  });

  // --- Join Requests ---

  register({
    name: 'event_join_requests',
    displayName: 'event join requests',
    description: 'List pending join requests for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'state', type: 'string', description: 'Filter by state', required: false, enum: ['PENDING', 'APPROVED', 'DECLINED'] },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
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
  });

  // --- Attendee Check-in ---

  register({
    name: 'event_checkin',
    displayName: 'event checkin',
    description: 'Manually check in an attendee to an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'user_id', type: 'string', description: 'User ID to check in', required: true },
    ],
    destructive: false,
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
  });

  // --- Ticket Management ---

  register({
    name: 'event_ticket_delete',
    displayName: 'event ticket delete',
    description: 'Delete a ticket type from an event.',
    params: [
      { name: 'ticket_type_id', type: 'string', description: 'Ticket type ID to delete', required: true },
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: true,
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
  });

  register({
    name: 'event_ticket_reorder',
    displayName: 'event ticket reorder',
    description: 'Reorder ticket types for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'ticket_type_ids', type: 'string[]', description: 'Ticket type IDs in desired order', required: true },
    ],
    destructive: false,
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
  });

  // --- Payment Summary ---

  register({
    name: 'event_payment_summary',
    displayName: 'event payment summary',
    description: 'Get detailed payment breakdown for an event by currency.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventPaymentSummary: Array<{ currency: string; decimals: number; amount: string; transfer_amount: string; pending_transfer_amount: string }> }>(
        `query($event: MongoID!) {
          getEventPaymentSummary(event: $event) {
            currency decimals amount transfer_amount pending_transfer_amount
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventPaymentSummary;
    },
  });

  // --- User Tools ---

  register({
    name: 'user_update',
    displayName: 'user update',
    description: 'Update your profile (name, display name, bio, tagline, timezone, username, social handles).',
    params: [
      { name: 'name', type: 'string', description: 'Full name', required: false },
      { name: 'display_name', type: 'string', description: 'Display name', required: false },
      { name: 'description', type: 'string', description: 'Bio/description', required: false },
      { name: 'tagline', type: 'string', description: 'Short tagline', required: false },
      { name: 'timezone', type: 'string', description: 'Timezone (e.g., America/New_York)', required: false },
      { name: 'username', type: 'string', description: 'Username', required: false },
      { name: 'job_title', type: 'string', description: 'Job title', required: false },
      { name: 'company_name', type: 'string', description: 'Company name', required: false },
      { name: 'website', type: 'string', description: 'Website URL', required: false },
      { name: 'handle_twitter', type: 'string', description: 'Twitter/X handle', required: false },
      { name: 'handle_instagram', type: 'string', description: 'Instagram handle', required: false },
      { name: 'handle_linkedin', type: 'string', description: 'LinkedIn handle', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined && value !== null) input[key] = value;
      }
      const result = await graphqlRequest<{ updateUser: unknown }>(
        `mutation($input: UserInput!) {
          updateUser(input: $input) {
            _id name display_name description tagline timezone username job_title company_name website
          }
        }`,
        { input },
      );
      return result.updateUser;
    },
    formatResult: (result) => {
      const r = result as { name?: string; display_name?: string; username?: string };
      return `Profile updated: ${r.display_name || r.name || 'user'}${r.username ? ` (@${r.username})` : ''}.`;
    },
  });

  register({
    name: 'user_search',
    displayName: 'user search',
    description: 'Search users by name or email.',
    params: [
      { name: 'query', type: 'string', description: 'Search query (name or email)', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ searchUsers: Array<{ _id: string; name?: string; email?: string; username?: string; display_name?: string; verified?: boolean }> }>(
        `query($query: String!) {
          searchUsers(query: $query) {
            _id name email username display_name verified
          }
        }`,
        { query: args.query },
      );
      return { users: result.searchUsers, count: result.searchUsers.length };
    },
  });

  // --- Discount Management ---

  register({
    name: 'event_discount_update',
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
    destructive: false,
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
  });

  register({
    name: 'event_discount_delete',
    displayName: 'event discount delete',
    description: 'Delete ticket discount codes from an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'discount_codes', type: 'string[]', description: 'Discount codes to delete', required: true },
    ],
    destructive: true,
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
  });

  // --- Ticket Categories ---

  register({
    name: 'event_ticket_categories',
    displayName: 'event ticket categories',
    description: 'List ticket categories for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
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
  });

  // --- Application Export ---

  register({
    name: 'event_application_export',
    displayName: 'event application export',
    description: 'Export event application/form responses. Returns applicant data with questions and answers.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
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
  });

  // --- Tempo ---

  register({
    name: 'tempo_status',
    displayName: 'tempo status',
    description: 'Check Tempo wallet status — installation, address, balances, key readiness.',
    params: [],
    destructive: false,
    execute: async () => {
      const { getWalletInfo } = await import('../tempo/index.js');
      return getWalletInfo();
    },
    formatResult: (result) => {
      const r = result as { installed: boolean; loggedIn: boolean; address?: string; ready?: boolean; balances?: Record<string, string> };
      if (!r.installed) return 'Tempo CLI not installed. Use /tempo install.';
      if (!r.loggedIn) return 'Tempo wallet not connected. Use /tempo login.';
      const bal = r.balances ? Object.entries(r.balances).map(([k, v]) => `${v} ${k}`).join(', ') : 'checking...';
      return `Tempo wallet: ${r.address} — ${bal} — ${r.ready ? 'ready' : 'not ready'}`;
    },
  });

  register({
    name: 'tempo_transfer',
    displayName: 'tempo transfer',
    description: 'Send USDC to an address via Tempo wallet.',
    params: [
      { name: 'amount', type: 'string', description: 'Amount (e.g., "10.00")', required: true },
      { name: 'token', type: 'string', description: 'Token symbol (e.g., USDC)', required: true, default: 'USDC' },
      { name: 'to', type: 'string', description: 'Recipient 0x address', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const { tempoExec, isTempoInstalled } = await import('../tempo/index.js');
      if (!isTempoInstalled()) throw new Error('Tempo CLI not installed. Use /tempo install.');
      const output = tempoExec(['wallet', 'transfer', String(args.amount), String(args.token || 'USDC'), String(args.to)]);
      return { success: true, output };
    },
    formatResult: (result) => {
      const r = result as { success: boolean; output: string };
      return r.success ? `Transfer sent. ${r.output}` : 'Transfer failed.';
    },
  });

  register({
    name: 'tempo_setup_payouts',
    displayName: 'tempo setup payouts',
    description: 'Configure your Tempo wallet as the reward payout destination. Auto-detects wallet address.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const { getWalletInfo } = await import('../tempo/index.js');
      const info = getWalletInfo();
      if (!info.loggedIn || !info.address) {
        throw new Error('Tempo wallet not connected. Use /tempo login first.');
      }
      const spaceId = (args.space_id as string) || getDefaultSpace();
      if (!spaceId) throw new Error('No space specified. Use /spaces to select one.');

      const result = await graphqlRequest<{ atlasUpdatePayoutSettings: unknown }>(
        `mutation($input: AtlasPayoutSettingsInput!) {
          atlasUpdatePayoutSettings(input: $input) { wallet_address wallet_chain preferred_method }
        }`,
        { input: { wallet_address: info.address, wallet_chain: 'tempo', preferred_method: 'tempo_usdc' } },
      );
      return result.atlasUpdatePayoutSettings;
    },
    formatResult: (result) => {
      const r = result as { wallet_address: string; preferred_method: string };
      return `Payouts configured: ${r.wallet_address} via Tempo USDC.`;
    },
  });

  register({
    name: 'tempo_services',
    displayName: 'tempo services',
    description: 'Discover MPP-registered services that accept Tempo payments.',
    params: [
      { name: 'search', type: 'string', description: 'Search query', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const { tempoExec, isTempoInstalled } = await import('../tempo/index.js');
      if (!isTempoInstalled()) throw new Error('Tempo CLI not installed. Use /tempo install.');
      const serviceArgs = ['wallet', 'services'];
      if (args.search) serviceArgs.push('--search', String(args.search));
      const output = tempoExec(serviceArgs);
      return { output };
    },
  });

  return tools;
}
