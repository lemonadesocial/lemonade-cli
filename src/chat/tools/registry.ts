import { ToolDef } from '../providers/interface';
import { graphqlRequest } from '../../api/graphql';
import { atlasRequest } from '../../api/atlas';
import { registrySearch } from '../../api/registry';
import { getDefaultSpace } from '../../auth/store';

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
      const result = await graphqlRequest<{ aiGetMe: unknown }>(
        'query { aiGetMe { _id name email first_name last_name } }',
      );
      return result.aiGetMe;
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
