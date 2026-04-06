import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';
import { atlasRequest } from '../../../api/atlas.js';

export const ticketsTools: CanonicalCapability[] = [
  buildCapability({
    name: 'tickets_list_types',
    category: 'tickets',
    displayName: 'tickets types',
    description: 'List ticket types for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'to view available ticket tiers and pricing for an event',
    searchHint: 'tickets types list pricing tiers options',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiListEventTicketTypes',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
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
  }),
  buildCapability({
    name: 'tickets_create_type',
    category: 'tickets',
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
    whenToUse: 'to define a new ticket tier with name, price, and capacity',
    searchHint: 'create ticket type pricing tier add',
    alwaysLoad: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiCreateEventTicketType',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const input: Record<string, unknown> = {
        event: args.event_id,
        title: args.name,
      };
      if (args.price !== undefined && args.price !== null) {
        input.prices = [{
          cost: String(Math.round((args.price as number) * 100)),
          currency: (args.currency as string) || 'USD',
          default: true,
        }];
      }
      if (args.limit !== undefined) input.ticket_limit = args.limit;
      if (args.description) input.description = args.description;

      const result = await graphqlRequest<{ aiCreateEventTicketType: unknown }>(
        `mutation($input: EventTicketTypeInput!) {
          aiCreateEventTicketType(input: $input) {
            title active private limited description
          }
        }`,
        { input },
      );
      return result.aiCreateEventTicketType;
    },
  }),
  buildCapability({
    name: 'tickets_update_type',
    category: 'tickets',
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
    whenToUse: 'when user wants to modify a ticket type',
    searchHint: 'update edit ticket type price limit',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiUpdateEventTicketType',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
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
            title active private limited description
          }
        }`,
        { _id: args.ticket_type_id, input },
      );
      return result.aiUpdateEventTicketType;
    },
  }),
  buildCapability({
    name: 'tickets_buy',
    category: 'tickets',
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
    whenToUse: 'to purchase or reserve tickets for an event',
    searchHint: 'buy purchase tickets attend register book',
    alwaysLoad: true,
    destructive: true,
    // backendType 'mutation' = write operation (REST POST via atlas)
    backendType: 'mutation',
    backendService: 'atlas',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
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
        const { getWalletInfo } = await import('../../tempo/index.js');
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

            const { tempoExec } = await import('../../tempo/index.js');
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
  }),
  buildCapability({
    name: 'tickets_price',
    category: 'tickets',
    displayName: 'tickets price',
    description: 'Calculate ticket price with optional discount.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'ticket_type', type: 'string', description: 'Ticket type ID', required: true },
      { name: 'quantity', type: 'number', description: 'Number of tickets', required: false, default: '1' },
      { name: 'discount_code', type: 'string', description: 'Discount code', required: false },
    ],
    whenToUse: 'when user wants to calculate ticket cost',
    searchHint: 'price calculate cost ticket discount preview',
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiCalculateTicketPrice',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      // Backend schema accepts Float for count, but ticket quantities are whole numbers
      const count = Math.floor(args.quantity != null ? (args.quantity as number) : 1);
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
      const fmt = (v: number) => { const n = Number(v); return Number.isFinite(n) ? (n / 100).toFixed(2) : '0.00'; };
      const total = fmt(r.total_cents);
      const subtotal = fmt(r.subtotal_cents);
      const discount = fmt(r.discount_cents);
      if (r.discount_cents > 0) return `Price: ${r.currency} ${total} (${r.currency} ${subtotal} - ${r.currency} ${discount} discount).`;
      return `Price: ${r.currency} ${total}`;
    },
  }),
  buildCapability({
    name: 'tickets_receipt',
    category: 'tickets',
    displayName: 'tickets receipt',
    description: 'Check ticket purchase receipt status.',
    params: [
      { name: 'hold_id', type: 'string', description: 'Hold ID from purchase', required: true },
    ],
    whenToUse: 'when user wants to check a purchase receipt',
    searchHint: 'receipt status purchase confirmation hold',
    destructive: false,
    backendType: 'query',
    backendService: 'atlas',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await atlasRequest<Record<string, unknown>>({
        path: `/atlas/v1/receipts/by-hold/${args.hold_id}`,
        authenticated: true,
      });
      return result.data;
    },
  }),
  buildCapability({
    name: 'tickets_create_discount',
    category: 'tickets',
    displayName: 'tickets create-discount',
    description: 'Create a discount code for an event ticket type.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'code', type: 'string', description: 'Discount code', required: true },
      { name: 'ratio', type: 'number', description: 'Discount ratio (0.0-1.0)', required: true },
      { name: 'ticket_type_id', type: 'string', description: 'Ticket type ID', required: false },
      { name: 'limit', type: 'number', description: 'Usage limit', required: false },
    ],
    whenToUse: 'when user wants to create a promo code',
    searchHint: 'create discount promo code coupon offer',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiCreateEventTicketDiscount',
    requiresSpace: false,
    surfaces: ['aiTool'],
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
  }),
  buildCapability({
    name: 'my_tickets',
    category: 'tickets',
    displayName: 'my tickets',
    description: 'Get tickets the current user has purchased.',
    params: [],
    whenToUse: 'when user wants to see tickets they purchased',
    searchHint: 'my tickets purchased bought attending events',
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiGetMyTickets',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetMyTickets: unknown }>(
        'query { aiGetMyTickets { items { event_id event_title ticket_type_title status event_start event_end } } }',
      );
      return result.aiGetMyTickets;
    },
  }),
  buildCapability({
    name: 'tickets_create',
    category: 'tickets',
    displayName: 'tickets create',
    description: 'Create complimentary tickets (no payment). The ticket type determines the event. Assignments are by email.',
    params: [
      { name: 'ticket_type', type: 'string', description: 'Ticket type ID', required: true },
      { name: 'assignments', type: 'string', description: 'JSON array of assignments: [{email, count}]', required: true },
    ],
    whenToUse: 'when user wants to issue complimentary tickets',
    searchHint: 'create comp tickets free assign issue',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'createTickets',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      let ticketAssignments: unknown[];
      try {
        const parsed = JSON.parse(args.assignments as string);
        if (!Array.isArray(parsed)) throw new Error('assignments must be a JSON array');
        ticketAssignments = parsed;
      } catch (e) {
        throw e instanceof SyntaxError
          ? new Error('Invalid JSON in assignments parameter. Expected: [{email, count}]')
          : e;
      }
      const result = await graphqlRequest<{ createTickets: unknown }>(
        `mutation($ticket_type: MongoID!, $ticket_assignments: [TicketAssignment!]!) {
          createTickets(ticket_type: $ticket_type, ticket_assignments: $ticket_assignments) {
            _id type accepted
          }
        }`,
        { ticket_type: args.ticket_type, ticket_assignments: ticketAssignments },
      );
      return result.createTickets;
    },
    formatResult: (result) => {
      const tickets = result as Array<{ _id: string; type: string; accepted: boolean }>;
      if (Array.isArray(tickets)) {
        return `Created ${tickets.length} ticket(s). IDs: ${tickets.map(t => t._id).join(', ')}`;
      }
      return JSON.stringify(result);
    },
  }),
  buildCapability({
    name: 'tickets_cancel',
    category: 'tickets',
    displayName: 'tickets cancel',
    description: 'Cancel specific tickets for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'ticket_ids', type: 'string', description: 'Comma-separated ticket IDs to cancel', required: true },
    ],
    whenToUse: 'when user wants to cancel specific tickets',
    searchHint: 'cancel tickets revoke void refund',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'cancelTickets',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ cancelTickets: unknown }>(
        `mutation($input: CancelTicketsInput!) {
          cancelTickets(input: $input)
        }`,
        { input: { event: args.event_id, tickets: (args.ticket_ids as string).split(',').map(s => s.trim()).filter(s => s.length > 0) } },
      );
      return result.cancelTickets;
    },
    formatResult: (result) => {
      return result ? 'Tickets cancelled successfully.' : 'Cancellation failed.';
    },
  }),
  buildCapability({
    name: 'tickets_assign',
    category: 'tickets',
    displayName: 'tickets assign',
    description: 'Assign tickets to users by email or user ID.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'assignments', type: 'string', description: 'JSON array of assignments: [{ticket, email}] or [{ticket, user}]', required: true },
    ],
    whenToUse: 'when user wants to assign tickets to people',
    searchHint: 'assign tickets transfer give delegate',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'assignTickets',
    requiresSpace: false,
    execute: async (args) => {
      let assignees: unknown[];
      try {
        const parsed = JSON.parse(args.assignments as string);
        if (!Array.isArray(parsed)) throw new Error('assignments must be a JSON array');
        assignees = parsed;
      } catch (e) {
        throw e instanceof SyntaxError
          ? new Error('Invalid JSON in assignments parameter. Expected: [{ticket, email}] or [{ticket, user}]')
          : e;
      }
      const result = await graphqlRequest<{ assignTickets: unknown }>(
        `mutation($input: AssignTicketsInput!) {
          assignTickets(input: $input)
        }`,
        { input: { event: args.event_id, assignees } },
      );
      return result.assignTickets;
    },
    formatResult: (result) => {
      return result ? 'Tickets assigned successfully.' : 'Assignment failed.';
    },
  }),
  buildCapability({
    name: 'tickets_upgrade',
    category: 'tickets',
    displayName: 'tickets upgrade',
    description: 'Upgrade a ticket to a different ticket type.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'ticket_id', type: 'string', description: 'Ticket ID to upgrade', required: true },
      { name: 'to_type', type: 'string', description: 'Target ticket type ID', required: true },
    ],
    whenToUse: 'when user wants to upgrade a ticket type',
    searchHint: 'upgrade ticket type change tier level',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'upgradeTicket',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ upgradeTicket: unknown }>(
        `mutation($input: UpgradeTicketInput!) {
          upgradeTicket(input: $input)
        }`,
        { input: { event: args.event_id, ticket: args.ticket_id, to_type: args.to_type } },
      );
      return result.upgradeTicket;
    },
    formatResult: (result) => {
      return result ? 'Ticket upgraded successfully.' : 'Upgrade failed.';
    },
  }),
  buildCapability({
    name: 'tickets_email',
    category: 'tickets',
    displayName: 'tickets email',
    description: 'Email event tickets to specified addresses.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'emails', type: 'string', description: 'Comma-separated email addresses', required: true },
      { name: 'payment_id', type: 'string', description: 'Payment ID (optional, to email specific payment tickets)', required: false },
    ],
    whenToUse: 'when user wants to email tickets to attendees',
    searchHint: 'email send tickets attendees delivery',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'mailEventTicket',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ mailEventTicket: unknown }>(
        `mutation($event: MongoID!, $emails: [String!]!, $payment: MongoID) {
          mailEventTicket(event: $event, emails: $emails, payment: $payment)
        }`,
        {
          event: args.event_id,
          emails: (args.emails as string).split(',').map(s => s.trim()).filter(s => s.length > 0),
          payment: args.payment_id as string | undefined,
        },
      );
      return result.mailEventTicket;
    },
    formatResult: (result) => {
      return result ? 'Ticket emails sent successfully.' : 'Failed to send ticket emails.';
    },
  }),
  buildCapability({
    name: 'tickets_email_receipt',
    category: 'tickets',
    displayName: 'tickets email receipt',
    description: 'Email payment receipt for a specific ticket.',
    params: [
      { name: 'ticket_id', type: 'string', description: 'Ticket ID', required: true },
    ],
    whenToUse: 'when user wants to email a payment receipt',
    searchHint: 'email receipt payment confirmation send',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'mailTicketPaymentReceipt',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ mailTicketPaymentReceipt: unknown }>(
        `mutation($ticket: MongoID!) {
          mailTicketPaymentReceipt(ticket: $ticket)
        }`,
        { ticket: args.ticket_id },
      );
      return result.mailTicketPaymentReceipt;
    },
    formatResult: (result) => {
      return result ? 'Payment receipt sent.' : 'Failed to send receipt.';
    },
  }),
];
