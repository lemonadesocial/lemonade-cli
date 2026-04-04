import { Command } from 'commander';
import open from 'open';
import { graphqlRequest } from '../../api/graphql.js';
import { atlasRequest } from '../../api/atlas.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';

export function registerTicketCommands(program: Command): void {
  const tickets = program
    .command('tickets')
    .description('Manage tickets');

  tickets
    .command('types <event-id>')
    .description('List ticket types for an event')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ aiListEventTicketTypes: Array<Record<string, unknown>> }>(
          `query($event: MongoID!) {
            aiListEventTicketTypes(event: $event) {
              title active private limited description
            }
          }`,
          { event: eventId },
        );
        setFlagApiKey(undefined);

        const items = result.aiListEventTicketTypes;
        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          console.log(renderTable(
            ['Name', 'Active', 'Limited', 'Private', 'Description'],
            items.map((t) => [
              String(t.title),
              t.active ? 'Yes' : 'No',
              t.limited ? 'Yes' : 'No',
              t.private ? 'Yes' : 'No',
              String(t.description || ''),
            ]),
          ));
          console.log('\nNote: Ticket type IDs are not exposed by this query. Use "lemonade event analytics <id> --json" to get IDs from the sales breakdown.');
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  tickets
    .command('create-type <event-id>')
    .description('Create a ticket type')
    .requiredOption('--name <text>', 'Ticket type name')
    .option('--price <amount>', 'Price in dollars (e.g. 25.00)')
    .option('--currency <code>', 'Currency code', 'USD')
    .option('--limit <n>', 'Max tickets')
    .option('--description <text>', 'Description')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const input: Record<string, unknown> = {
          event: eventId,
          title: opts.name,
        };
        if (opts.price) {
          const costCents = String(Math.round(parseFloat(opts.price) * 100));
          input.prices = [{ cost: costCents, currency: opts.currency, default: true }];
        }
        if (opts.limit) input.ticket_limit = parseInt(opts.limit, 10);
        if (opts.description) input.description = opts.description;

        const result = await graphqlRequest<{ aiCreateEventTicketType: Record<string, unknown> }>(
          `mutation($input: EventTicketTypeInput!) {
            aiCreateEventTicketType(input: $input) {
              title active limited description
            }
          }`,
          { input },
        );
        setFlagApiKey(undefined);

        const tt = result.aiCreateEventTicketType;
        if (opts.json) {
          console.log(jsonSuccess({ ...tt, ...(opts.price ? { price: opts.price, currency: opts.currency } : {}) }));
        } else {
          const pairs: Array<[string, string]> = [
            ['Name', String(tt.title)],
            ['Active', tt.active ? 'Yes' : 'No'],
          ];
          if (opts.price) {
            pairs.push(['Price', `${opts.price} ${opts.currency}`]);
          }
          console.log(renderKeyValue(pairs));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  tickets
    .command('update-type <ticket-type-id>')
    .description('Update a ticket type')
    .option('--name <text>', 'New name')
    .option('--price <amount>', 'New price in dollars')
    .option('--currency <code>', 'Currency code (used with --price)')
    .option('--limit <n>', 'New ticket limit')
    .option('--active <bool>', 'Active status')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (ticketTypeId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const input: Record<string, unknown> = {};
        if (opts.name) input.title = opts.name;
        if (opts.price) {
          const costCents = String(Math.round(parseFloat(opts.price) * 100));
          input.prices = [{ cost: costCents, currency: opts.currency || 'USD', default: true }];
        }
        if (opts.limit) input.ticket_limit = parseInt(opts.limit, 10);
        if (opts.active !== undefined) input.active = opts.active === 'true';

        const result = await graphqlRequest<{ aiUpdateEventTicketType: Record<string, unknown> }>(
          `mutation($_id: MongoID!, $input: EventTicketTypeInput!) {
            aiUpdateEventTicketType(_id: $_id, input: $input) {
              title active limited description
            }
          }`,
          { _id: ticketTypeId, input },
        );
        setFlagApiKey(undefined);

        const tt = result.aiUpdateEventTicketType;
        if (opts.json) {
          console.log(jsonSuccess({ ...tt, ...(opts.price ? { price: opts.price, currency: opts.currency } : {}) }));
        } else {
          const pairs: Array<[string, string]> = [
            ['Name', String(tt.title)],
            ['Active', tt.active ? 'Yes' : 'No'],
          ];
          if (opts.price) {
            pairs.push(['Price', `${opts.price} ${opts.currency}`]);
          }
          console.log(renderKeyValue(pairs));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  tickets
    .command('buy <event-id>')
    .description('Purchase tickets')
    .requiredOption('--ticket-type <id>', 'Ticket type ID')
    .option('--quantity <n>', 'Number of tickets', '1')
    .option('--attendee-name <names...>', 'Attendee names (one per ticket)')
    .option('--attendee-email <emails...>', 'Attendee emails (one per ticket)')
    .option('--discount <code>', 'Discount code')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const quantity = parseInt(opts.quantity, 10);
        const names: string[] = opts.attendeeName || [];
        const emails: string[] = opts.attendeeEmail || [];

        if (names.length !== quantity || emails.length !== quantity) {
          throw new Error(
            `Attendee count (names: ${names.length}, emails: ${emails.length}) must match quantity (${quantity}). Provide one --attendee-name and --attendee-email per ticket.`,
          );
        }

        const attendees = names.map((name, i) => ({ name, email: emails[i] }));

        const body: Record<string, unknown> = {
          ticket_type_id: opts.ticketType,
          quantity,
          attendees,
        };
        if (opts.discount) body.discount_code = opts.discount;

        const purchaseResult = await atlasRequest<Record<string, unknown>>({
          method: 'POST',
          path: `/atlas/v1/events/${eventId}/purchase`,
          body,
          authenticated: true,
        });

        if (purchaseResult.status === 200) {
          const data = purchaseResult.data;
          if (opts.json) {
            console.log(jsonSuccess(data));
          } else {
            if (data.type === 'free_ticket_redirect') {
              console.log(`Free ticket acquired! Redirect: ${data.redirect_url}`);
            } else {
              console.log('Purchase complete.');
            }
          }
          setFlagApiKey(undefined);
          return;
        }

        if (purchaseResult.status === 402) {
          const challenge = purchaseResult.data;
          const holdId = challenge.hold_id || challenge.ticket_hold_id;

          const checkoutResult = await atlasRequest<Record<string, unknown>>({
            method: 'POST',
            path: `/atlas/v1/holds/${holdId}/checkout`,
            authenticated: true,
          });

          const checkoutUrl = checkoutResult.data.checkout_url;
          setFlagApiKey(undefined);

          if (opts.json) {
            console.log(jsonSuccess({
              phase: 'checkout',
              hold_id: holdId,
              checkout_url: checkoutUrl,
              amount: challenge.amount,
              currency: challenge.currency,
            }));
          } else {
            console.log(`Checkout URL: ${checkoutUrl}`);
            console.log(`Amount: ${challenge.amount} ${challenge.currency}`);
            console.log(`Hold ID: ${holdId} (use "lemonade tickets receipt ${holdId} --poll" to check status)`);
            await open(String(checkoutUrl));
          }
          return;
        }

        setFlagApiKey(undefined);
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  tickets
    .command('price <event-id>')
    .description('Calculate ticket price')
    .requiredOption('--ticket-type <id>', 'Ticket type ID')
    .option('--quantity <n>', 'Quantity', '1')
    .option('--discount <code>', 'Discount code')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const count = parseInt(opts.quantity, 10);
        if (!Number.isInteger(count) || count < 1) {
          throw new Error('Quantity must be a positive whole number.');
        }
        const result = await graphqlRequest<{ aiCalculateTicketPrice: Record<string, unknown> }>(
          `query($event: MongoID!, $ticket_type: MongoID!, $count: Float!, $discount_code: String) {
            aiCalculateTicketPrice(event: $event, ticket_type: $ticket_type, count: $count, discount_code: $discount_code) {
              subtotal_cents discount_cents total_cents currency
            }
          }`,
          {
            event: eventId,
            ticket_type: opts.ticketType,
            count,
            discount_code: opts.discount,
          },
        );
        setFlagApiKey(undefined);

        const price = result.aiCalculateTicketPrice;
        if (opts.json) {
          console.log(jsonSuccess(price));
        } else {
          const fmt = (cents: unknown) => { const n = Number(cents); return Number.isFinite(n) ? (n / 100).toFixed(2) : '0.00'; };
          console.log(renderKeyValue([
            ['Subtotal', `${fmt(price.subtotal_cents)} ${price.currency}`],
            ['Discount', `${fmt(price.discount_cents)} ${price.currency}`],
            ['Total', `${fmt(price.total_cents)} ${price.currency}`],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  tickets
    .command('receipt <hold-id>')
    .description('Check ticket purchase receipt')
    .option('--poll', 'Poll until complete (max 60s)')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (holdId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const maxAttempts = opts.poll ? 20 : 1;
        let receipt: Record<string, unknown> | null = null;

        for (let i = 0; i < maxAttempts; i++) {
          const result = await atlasRequest<Record<string, unknown>>({
            path: `/atlas/v1/receipts/by-hold/${holdId}`,
            authenticated: true,
          });

          receipt = result.data;
          if (!opts.poll || (receipt.status && receipt.status !== 'pending')) {
            break;
          }

          if (i < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, 3000));
          }
        }

        setFlagApiKey(undefined);

        if (opts.json) {
          console.log(jsonSuccess(receipt));
        } else if (receipt) {
          console.log(renderKeyValue([
            ['Status', String(receipt.status || 'unknown')],
            ['Hold ID', holdId],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
