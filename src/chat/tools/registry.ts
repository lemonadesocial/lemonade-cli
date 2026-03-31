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
  });

  // --- Event ---

  register({
    name: 'event_create',
    displayName: 'event create',
    description: 'Create a new event. Returns the event ID, title, and status.',
    params: [
      { name: 'title', type: 'string', description: 'Event title', required: true },
      { name: 'start', type: 'string', description: 'Start date (ISO 8601)', required: true },
      { name: 'end', type: 'string', description: 'End date (ISO 8601)', required: false },
      { name: 'description', type: 'string', description: 'Event description', required: false },
      { name: 'space', type: 'string', description: 'Space ID', required: false },
      { name: 'address', type: 'string', description: 'Venue address', required: false },
      { name: 'virtual', type: 'boolean', description: 'Virtual event', required: false },
      { name: 'private', type: 'boolean', description: 'Private event', required: false },
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
            virtual: args.virtual || false,
            private: args.private || false,
          },
        },
      );
      return result.aiCreateEvent;
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
      const result = await graphqlRequest<{ aiGetHostingEvents: unknown }>(
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
            total_tickets_sold total_revenue currency
            breakdown { ticket_type_name sold revenue }
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
            top_sources { source views }
            top_cities { city views }
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
            going pending declined checked_in
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventGuestStats;
    },
  });

  register({
    name: 'event_guests',
    displayName: 'event guests',
    description: 'List attendees for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'state', type: 'string', description: 'Filter: going|pending|declined|checked_in', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '50' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventGuests: unknown }>(
        `query($event: MongoID!, $state: String, $limit: Int, $skip: Int) {
          aiGetEventGuests(event: $event, state: $state, limit: $limit, skip: $skip) {
            items { name email state ticket_type_name checked_in_at }
          }
        }`,
        {
          event: args.event_id,
          state: args.state as string | undefined,
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
        `query($event: MongoID!, $rate_value: Int, $limit: Int, $skip: Int) {
          aiListEventFeedbacks(event: $event, rate_value: $rate_value, limit: $limit, skip: $skip) {
            items { user_name rate_value comment created_at }
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
            items { user_name user_email ticket_type_name checked_in_at }
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
            total_revenue currency payment_count
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventPaymentStats;
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
            items { user_name answers { question answer } }
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
            _id title default_price default_currency limit active
            prices { cost currency network }
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
    description: 'Create a ticket type for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'name', type: 'string', description: 'Ticket type name', required: true },
      { name: 'price', type: 'number', description: 'Price in dollars (e.g. 25.00)', required: true },
      { name: 'currency', type: 'string', description: 'Currency code', required: false, default: 'USD' },
      { name: 'limit', type: 'number', description: 'Max tickets available', required: false },
      { name: 'description', type: 'string', description: 'Ticket description', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const priceInCents = Math.round((args.price as number) * 100);
      const input: Record<string, unknown> = {
        event: args.event_id,
        title: args.name,
        default_price: priceInCents,
        default_currency: (args.currency as string) || 'USD',
      };
      if (args.limit !== undefined) input.limit = args.limit;
      if (args.description) input.description = args.description;

      const result = await graphqlRequest<{ aiCreateEventTicketType: unknown }>(
        `mutation($input: EventTicketTypeInput!) {
          aiCreateEventTicketType(input: $input) {
            _id title default_price default_currency limit active
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
      if (args.price !== undefined) input.default_price = Math.round((args.price as number) * 100);
      if (args.currency) input.default_currency = args.currency;
      if (args.limit !== undefined) input.limit = args.limit;
      if (args.active !== undefined) input.active = args.active;

      const result = await graphqlRequest<{ aiUpdateEventTicketType: unknown }>(
        `mutation($_id: MongoID!, $input: EventTicketTypeInput!) {
          aiUpdateEventTicketType(_id: $_id, input: $input) {
            _id title default_price default_currency limit active
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
        const challenge = purchaseResult.data;
        const holdId = challenge.hold_id || challenge.ticket_hold_id;

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
      const result = await graphqlRequest<{ aiCalculateTicketPrice: unknown }>(
        `query($event: MongoID!, $ticket_type: MongoID!, $count: Int!, $discount_code: String) {
          aiCalculateTicketPrice(event: $event, ticket_type: $ticket_type, count: $count, discount_code: $discount_code) {
            subtotal discount_amount total currency
          }
        }`,
        {
          event: args.event_id,
          ticket_type: args.ticket_type,
          count: (args.quantity as number) || 1,
          discount_code: args.discount_code as string | undefined,
        },
      );
      return result.aiCalculateTicketPrice;
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
      const input: Record<string, unknown> = {
        event: args.event_id,
        code: args.code,
        ratio: args.ratio,
      };
      if (args.ticket_type_id) input.ticket_type = args.ticket_type_id;
      if (args.limit !== undefined) input.stamp = args.limit;

      const result = await graphqlRequest<{ aiCreateEventTicketDiscount: unknown }>(
        `mutation($input: EventTicketDiscountInput!) {
          aiCreateEventTicketDiscount(input: $input) {
            _id code ratio stamp
          }
        }`,
        { input },
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
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
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
        { limit: (args.limit as number) || 20, skip: (args.skip as number) || 0 },
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
            total_members admin_count host_count
            total_events total_attendees average_rating
          }
        }`,
        { space: args.space_id },
      );
      return result.aiGetSpaceStats;
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
            items { _id name email role }
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
    ],
    destructive: false,
    execute: async (args) => {
      const returnUrl = (args.return_url as string) || 'https://lemonade.social';
      const result = await graphqlRequest<{ generateStripeAccountLink: unknown }>(
        `mutation($return_url: String!, $refresh_url: String!) {
          generateStripeAccountLink(return_url: $return_url, refresh_url: $refresh_url) {
            url expires_at
          }
        }`,
        { return_url: returnUrl, refresh_url: returnUrl },
      );
      return result.generateStripeAccountLink;
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

  // --- Notifications ---

  register({
    name: 'notifications_list',
    displayName: 'notifications list',
    description: 'Get recent notifications.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetNotifications: unknown }>(
        'query { aiGetNotifications { items { _id type message read created_at } } }',
      );
      return result.aiGetNotifications;
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
      const result = await graphqlRequest<{ aiReadNotifications: unknown }>(
        'mutation($ids: [MongoID!]!) { aiReadNotifications(ids: $ids) }',
        { ids: args.notification_ids },
      );
      return result.aiReadNotifications;
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
      const result = await graphqlRequest<{ aiGetBackendVersion: unknown }>(
        'query { aiGetBackendVersion { version } }',
      );
      return result.aiGetBackendVersion;
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
    description: 'Clone an existing event to one or more new dates. Returns array of new event IDs.',
    params: [
      { name: 'event_id', type: 'string', description: 'Source event ObjectId', required: true },
      { name: 'dates', type: 'string[]', description: 'Array of ISO 8601 start dates for cloned events', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ cloneEvent: string[] }>(
        `mutation($input: CloneEventInput!) {
          cloneEvent(input: $input)
        }`,
        { input: { event: args.event_id, dates: args.dates } },
      );
      return result.cloneEvent;
    },
  });

  register({
    name: 'event_generate_recurring_dates',
    displayName: 'event recurring dates',
    description: 'Generate a list of recurring dates based on a pattern. Use to preview dates before cloning.',
    params: [
      { name: 'start', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'utc_offset_minutes', type: 'number', description: 'UTC offset in minutes', required: true },
      { name: 'repeat', type: 'string', description: 'Repeat pattern', required: true,
        enum: ['daily', 'weekly', 'monthly'] },
      { name: 'day_of_weeks', type: 'number[]', description: 'Days of week (0-6) for weekly repeat', required: false },
      { name: 'end', type: 'string', description: 'End date ISO 8601 (max 3 years from start)', required: false },
      { name: 'count', type: 'number', description: 'Number of occurrences (max 100)', required: false },
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
      if (args.count !== undefined) input.count = args.count;

      const result = await graphqlRequest<{ generateRecurringDates: string[] }>(
        `query($input: GenerateRecurringDatesInput!) {
          generateRecurringDates(input: $input)
        }`,
        { input },
      );
      return result.generateRecurringDates;
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
    description: 'Export detailed guest/ticket list with filters.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'ticket_type_ids', type: 'string[]', description: 'Filter by ticket type IDs', required: false },
      { name: 'search_text', type: 'string', description: 'Search text', required: false },
      { name: 'checked_in', type: 'boolean', description: 'Filter by check-in status', required: false },
      { name: 'limit', type: 'number', description: 'Pagination limit', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { _id: args.event_id };
      if (args.ticket_type_ids) vars.ticket_type_ids = args.ticket_type_ids;
      if (args.search_text) vars.search_text = args.search_text;
      if (args.checked_in !== undefined) vars.checked_in = args.checked_in;
      if (args.limit !== undefined || args.skip !== undefined) {
        vars.pagination = {
          limit: args.limit as number | undefined,
          skip: args.skip as number | undefined,
        };
      }

      const result = await graphqlRequest<{ exportEventTickets: unknown }>(
        `query($_id: MongoID!, $ticket_type_ids: [MongoID!], $search_text: String, $checked_in: Boolean, $pagination: PaginationInput) {
          exportEventTickets(_id: $_id, ticket_type_ids: $ticket_type_ids, search_text: $search_text, checked_in: $checked_in, pagination: $pagination) {
            count
            tickets { _id shortid buyer_name buyer_email ticket_type quantity payment_amount currency discount_code purchase_date checkin_date active cancelled_by }
          }
        }`,
        vars,
      );
      return result.exportEventTickets;
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
    name: 'event_invite_stats',
    displayName: 'event invite stats',
    description: 'Get invitation tracking statistics with guest-level detail.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'search', type: 'string', description: 'Search invitees', required: false },
      { name: 'limit', type: 'number', description: 'Limit number of guest entries', required: false },
      { name: 'statuses', type: 'string[]', description: 'Filter by invitation response status', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { _id: args.event_id };
      if (args.search) vars.search = args.search;
      if (args.limit !== undefined) vars.limit = args.limit;
      if (args.statuses) vars.statuses = args.statuses;

      const result = await graphqlRequest<{ getEventInvitedStatistics: unknown }>(
        `query($_id: MongoID!, $search: String, $limit: Int, $statuses: [InvitationResponse!]) {
          getEventInvitedStatistics(_id: $_id, search: $search, limit: $limit, statuses: $statuses) {
            total total_joined total_declined emails_opened top_inviter
            guests { invitation invited_by joined declined pending user email }
          }
        }`,
        vars,
      );
      return result.getEventInvitedStatistics;
    },
  });

  register({
    name: 'event_cancel_invitations',
    displayName: 'event cancel invitations',
    description: 'Cancel pending invitations for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ObjectId', required: true },
      { name: 'invitation_ids', type: 'string[]', description: 'Array of invitation ObjectIds to cancel', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ cancelEventInvitations: boolean }>(
        `mutation($input: CancelEventInvitationsInput!) {
          cancelEventInvitations(input: $input)
        }`,
        { input: { event: args.event_id, invitations: args.invitation_ids } },
      );
      return result.cancelEventInvitations;
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

  // --- My Tickets ---

  register({
    name: 'my_tickets',
    displayName: 'my tickets',
    description: 'Get tickets the current user has purchased.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetMyTickets: unknown }>(
        'query { aiGetMyTickets { items { _id event_title ticket_type_name status } } }',
      );
      return result.aiGetMyTickets;
    },
  });

  return tools;
}
