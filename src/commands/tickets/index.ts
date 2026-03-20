import { Command } from 'commander';
import open from 'open';
import { graphqlRequest } from '../../api/graphql';
import { atlasRequest } from '../../api/atlas';
import { jsonSuccess } from '../../output/json';
import { renderTable, renderKeyValue } from '../../output/table';
import { handleError } from '../../output/error';
import { setFlagApiKey } from '../../auth/store';

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
              _id title default_price default_currency limit active
              prices { cost currency network }
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
            ['ID', 'Name', 'Price', 'Limit', 'Active'],
            items.map((t) => [
              String(t._id),
              String(t.title),
              t.default_price ? `${Number(t.default_price) / 100} ${t.default_currency}` : 'Free',
              t.limit ? String(t.limit) : 'Unlimited',
              t.active ? 'Yes' : 'No',
            ]),
          ));
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
    .requiredOption('--price <amount>', 'Price in dollars (e.g. 25.00)')
    .option('--currency <code>', 'Currency code', 'USD')
    .option('--limit <n>', 'Max tickets')
    .option('--description <text>', 'Description')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const priceInCents = Math.round(parseFloat(opts.price) * 100);

        const input: Record<string, unknown> = {
          event: eventId,
          title: opts.name,
          default_price: priceInCents,
          default_currency: opts.currency,
        };
        if (opts.limit) input.limit = parseInt(opts.limit, 10);
        if (opts.description) input.description = opts.description;

        const result = await graphqlRequest<{ aiCreateEventTicketType: Record<string, unknown> }>(
          `mutation($input: EventTicketTypeInput!) {
            aiCreateEventTicketType(input: $input) {
              _id title default_price default_currency limit active
            }
          }`,
          { input },
        );
        setFlagApiKey(undefined);

        const tt = result.aiCreateEventTicketType;
        if (opts.json) {
          console.log(jsonSuccess(tt));
        } else {
          console.log(renderKeyValue([
            ['ID', String(tt._id)],
            ['Name', String(tt.title)],
            ['Price', `${Number(tt.default_price) / 100} ${tt.default_currency}`],
          ]));
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
    .option('--currency <code>', 'New currency')
    .option('--limit <n>', 'New limit')
    .option('--active <bool>', 'Active status')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (ticketTypeId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const input: Record<string, unknown> = {};
        if (opts.name) input.title = opts.name;
        if (opts.price) input.default_price = Math.round(parseFloat(opts.price) * 100);
        if (opts.currency) input.default_currency = opts.currency;
        if (opts.limit) input.limit = parseInt(opts.limit, 10);
        if (opts.active !== undefined) input.active = opts.active === 'true';

        const result = await graphqlRequest<{ aiUpdateEventTicketType: Record<string, unknown> }>(
          `mutation($_id: MongoID!, $input: EventTicketTypeInput!) {
            aiUpdateEventTicketType(_id: $_id, input: $input) {
              _id title default_price default_currency limit active
            }
          }`,
          { _id: ticketTypeId, input },
        );
        setFlagApiKey(undefined);

        const tt = result.aiUpdateEventTicketType;
        if (opts.json) {
          console.log(jsonSuccess(tt));
        } else {
          console.log(renderKeyValue([
            ['ID', String(tt._id)],
            ['Name', String(tt.title)],
            ['Price', `${Number(tt.default_price) / 100} ${tt.default_currency}`],
            ['Active', tt.active ? 'Yes' : 'No'],
          ]));
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
        const result = await graphqlRequest<{ aiCalculateTicketPrice: Record<string, unknown> }>(
          `query($event: MongoID!, $ticket_type: MongoID!, $count: Int!, $discount_code: String) {
            aiCalculateTicketPrice(event: $event, ticket_type: $ticket_type, count: $count, discount_code: $discount_code) {
              subtotal discount_amount total currency
            }
          }`,
          {
            event: eventId,
            ticket_type: opts.ticketType,
            count: parseInt(opts.quantity, 10),
            discount_code: opts.discount,
          },
        );
        setFlagApiKey(undefined);

        const price = result.aiCalculateTicketPrice;
        if (opts.json) {
          console.log(jsonSuccess(price));
        } else {
          console.log(renderKeyValue([
            ['Subtotal', `${price.subtotal} ${price.currency}`],
            ['Discount', `${price.discount_amount} ${price.currency}`],
            ['Total', `${price.total} ${price.currency}`],
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
