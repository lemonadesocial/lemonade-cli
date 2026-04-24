import { Command } from 'commander';
import { fetchEventCheckinsPage, EVENT_CHECKINS_LIMIT_CAP } from '../../api/event-checkins.js';
import { graphqlRequest } from '../../api/graphql.js';
import { registrySearch } from '../../api/registry.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey, getDefaultSpace } from '../../auth/store.js';

export function registerEventCommands(program: Command): void {
  const event = program
    .command('event')
    .description('Manage events');

  event
    .command('create')
    .description('Create a new event')
    .requiredOption('--title <title>', 'Event title')
    .requiredOption('--start <datetime>', 'Start date (ISO 8601)')
    .option('--end <datetime>', 'End date (ISO 8601)')
    .option('--description <text>', 'Event description')
    .option('--space <id>', 'Space ID')
    .option('--address <text>', 'Venue address')
    .option('--virtual', 'Virtual event')
    .option('--no-virtual', 'Explicitly not virtual')
    .option('--private', 'Private event')
    .option('--no-private', 'Explicitly not private')
    .option('--guest-limit <n>', 'Maximum number of guests')
    .option('--guest-limit-per <n>', 'Maximum guests per registration')
    .option('--ticket-limit-per <n>', 'Maximum tickets per user')
    .option('--timezone <tz>', 'Event timezone')
    .option('--virtual-url <url>', 'Virtual event URL')
    .option('--approval-required', 'Require approval for registrations')
    .option('--no-approval-required', 'No approval required')
    .option('--application-required', 'Require application form')
    .option('--no-application-required', 'No application required')
    .option('--guest-directory', 'Enable guest directory')
    .option('--no-guest-directory', 'Disable guest directory')
    .option('--subevent', 'Enable sub-events')
    .option('--no-subevent', 'Disable sub-events')
    .option('--currency <code>', 'Payment currency code')
    .option('--tags <tags...>', 'Event tags (space-separated)')
    .option('--registration-disabled', 'Disable registration')
    .option('--no-registration-disabled', 'Enable registration')
    .option('--terms-text <text>', 'Terms and conditions text')
    .option('--welcome-text <text>', 'Welcome message for attendees')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        // Uses getDefaultSpace() directly (manual command, not capability-routed)
        const spaceId = opts.space || getDefaultSpace();

        const input: Record<string, unknown> = {
          title: opts.title,
          start: new Date(opts.start).toISOString(),
          space: spaceId,
        };
        if (opts.end !== undefined) input.end = new Date(opts.end).toISOString();
        if (opts.description !== undefined) input.description = opts.description;
        if (opts.address !== undefined) input.address = { title: opts.address };
        if (opts.virtual !== undefined) input.virtual = opts.virtual;
        if (opts.private !== undefined) input.private = opts.private;
        if (opts.guestLimit !== undefined) {
          const n = parseInt(opts.guestLimit, 10);
          if (!isNaN(n)) input.guest_limit = n;
        }
        if (opts.guestLimitPer !== undefined) {
          const n = parseInt(opts.guestLimitPer, 10);
          if (!isNaN(n)) input.guest_limit_per = n;
        }
        if (opts.ticketLimitPer !== undefined) {
          const n = parseInt(opts.ticketLimitPer, 10);
          if (!isNaN(n)) input.ticket_limit_per = n;
        }
        if (opts.timezone !== undefined) input.timezone = opts.timezone;
        if (opts.virtualUrl !== undefined) input.virtual_url = opts.virtualUrl;
        if (opts.approvalRequired !== undefined) input.approval_required = opts.approvalRequired;
        if (opts.applicationRequired !== undefined) input.application_required = opts.applicationRequired;
        if (opts.currency !== undefined) input.currency = opts.currency;
        if (opts.tags !== undefined) input.tags = opts.tags;
        if (opts.registrationDisabled !== undefined) input.registration_disabled = opts.registrationDisabled;
        if (opts.guestDirectory !== undefined) input.guest_directory_enabled = opts.guestDirectory;
        if (opts.subevent !== undefined) input.subevent_enabled = opts.subevent;
        if (opts.termsText !== undefined) input.terms_text = opts.termsText;
        if (opts.welcomeText !== undefined) input.welcome_text = opts.welcomeText;

        const result = await graphqlRequest<{ createEvent: Record<string, unknown> }>(
          `mutation($input: EventInput!) {
            createEvent(input: $input) {
              _id title shortid start end published description
              virtual virtual_url private guest_limit guest_limit_per timezone approval_required
              address { title city country latitude longitude }
            }
          }`,
          { input },
        );
        setFlagApiKey(undefined);

        const ev = result.createEvent;
        if (opts.json) {
          console.log(jsonSuccess(ev));
        } else {
          console.log(renderKeyValue([
            ['ID', String(ev._id)],
            ['Title', String(ev.title)],
            ['Start', String(ev.start)],
            ['Status', 'Draft (unpublished)'],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('list')
    .description('List your events')
    .option('--space <id>', 'Space ID')
    .option('--draft', 'Show only drafts')
    .option('--limit <n>', 'Max results', '20')
    .option('--cursor <str>', 'Pagination cursor (skip)')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = parseInt(opts.limit, 10);
        const skip = opts.cursor ? parseInt(opts.cursor, 10) : 0;

        const result = await graphqlRequest<{ getHostingEvents: Array<Record<string, unknown>> }>(
          `query($draft: Boolean, $limit: Int!, $skip: Int!) {
            getHostingEvents(draft: $draft, limit: $limit, skip: $skip) {
              _id title shortid start end published
            }
          }`,
          {
            draft: opts.draft || undefined,
            limit,
            skip,
          },
        );
        setFlagApiKey(undefined);

        const items = result.getHostingEvents;
        if (opts.json) {
          const nextCursor = items.length === limit ? String(skip + limit) : null;
          console.log(jsonSuccess(items, { cursor: nextCursor }));
        } else {
          console.log(renderTable(
            ['ID', 'Title', 'Start', 'Published'],
            items.map((e) => [
              String(e._id),
              String(e.title),
              String(e.start || ''),
              e.published ? 'Yes' : 'Draft',
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('search <query>')
    .description('Search events (federated)')
    .option('--lat <num>', 'Latitude')
    .option('--lng <num>', 'Longitude')
    .option('--radius <km>', 'Radius in km', '25')
    .option('--category <cat>', 'Category filter')
    .option('--date-from <iso>', 'Start date filter')
    .option('--date-to <iso>', 'End date filter')
    .option('--price-min <num>', 'Min price')
    .option('--price-max <num>', 'Max price')
    .option('--sort <mode>', 'Sort: relevance|price_asc|price_desc|date_asc|date_desc|distance')
    .option('--limit <n>', 'Max results', '10')
    .option('--cursor <str>', 'Pagination cursor')
    .option('--json', 'Output as JSON')
    .action(async (query: string, opts) => {
      try {
        const result = await registrySearch({
          q: query,
          lat: opts.lat ? parseFloat(opts.lat) : undefined,
          lng: opts.lng ? parseFloat(opts.lng) : undefined,
          radius_km: opts.radius ? parseFloat(opts.radius) : undefined,
          category: opts.category,
          start_after: opts.dateFrom,
          start_before: opts.dateTo,
          price_min: opts.priceMin ? parseFloat(opts.priceMin) : undefined,
          price_max: opts.priceMax ? parseFloat(opts.priceMax) : undefined,
          sort: opts.sort,
          limit: parseInt(opts.limit, 10),
          cursor: opts.cursor,
        });

        if (opts.json) {
          console.log(jsonSuccess({
            items: result.items,
            cursor: result.cursor,
            total: result.total,
            sources: result.sources,
          }));
        } else {
          console.log(renderTable(
            ['Title', 'Date', 'Location', 'Price', 'Availability', 'Source'],
            result.items.map((item) => [
              item.title,
              item.start,
              item.location.city || item.location.name,
              item.price ? item.price.display : 'Free',
              item.availability,
              item.source.platform,
            ]),
          ));
          if (result.total > 0) {
            console.log(`\n${result.total} results from ${result.sources.map((s) => `${s.platform} (${s.count})`).join(', ')}`);
          }
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  event
    .command('get <event-id>')
    .description('Get event details')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ getEvent: Record<string, unknown> }>(
          `query($_id: MongoID) {
            getEvent(_id: $_id) {
              _id title shortid start end published description
              virtual virtual_url private guest_limit guest_limit_per ticket_limit_per
              timezone approval_required application_required registration_disabled
              currency tags guest_directory_enabled subevent_enabled terms_text welcome_text
              address { title city country latitude longitude }
            }
          }`,
          { _id: eventId },
        );
        setFlagApiKey(undefined);

        if (!result.getEvent) {
          throw new Error('Event not found');
        }
        const ev = result.getEvent;
        const addr = ev.address as Record<string, unknown> | null;
        if (opts.json) {
          console.log(jsonSuccess(ev));
        } else {
          const pairs: Array<[string, string]> = [
            ['ID', String(ev._id)],
            ['Title', String(ev.title)],
            ['Start', String(ev.start || '')],
            ['End', String(ev.end || '-')],
            ['Published', ev.published ? 'Yes' : 'Draft'],
          ];
          if (addr) {
            pairs.push(['Location', String(addr.title || '')]);
            if (addr.city) pairs.push(['City', String(addr.city)]);
          }
          if (ev.description) {
            pairs.push(['Description', String(ev.description)]);
          }
          if (ev.virtual) pairs.push(['Virtual', 'Yes']);
          if (ev.virtual_url) pairs.push(['Virtual URL', String(ev.virtual_url)]);
          if (ev.private) pairs.push(['Private', 'Yes']);
          if (ev.guest_limit != null) pairs.push(['Guest Limit', String(ev.guest_limit)]);
          if (ev.guest_limit_per != null) pairs.push(['Guest Limit Per', String(ev.guest_limit_per)]);
          if (ev.ticket_limit_per != null) pairs.push(['Ticket Limit Per', String(ev.ticket_limit_per)]);
          if (ev.timezone) pairs.push(['Timezone', String(ev.timezone)]);
          if (ev.approval_required) pairs.push(['Approval Required', 'Yes']);
          if (ev.application_required) pairs.push(['Application Required', 'Yes']);
          if (ev.registration_disabled) pairs.push(['Registration Disabled', 'Yes']);
          if (ev.currency) pairs.push(['Currency', String(ev.currency)]);
          if (ev.tags && (ev.tags as string[]).length > 0) pairs.push(['Tags', (ev.tags as string[]).join(', ')]);
          if (ev.guest_directory_enabled) pairs.push(['Guest Directory', 'Enabled']);
          if (ev.subevent_enabled) pairs.push(['Sub-events', 'Enabled']);
          if (ev.terms_text) pairs.push(['Terms', String(ev.terms_text)]);
          if (ev.welcome_text) pairs.push(['Welcome Text', String(ev.welcome_text)]);
          console.log(renderKeyValue(pairs));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('update <event-id>')
    .description('Update an event')
    .option('--title <text>', 'New title')
    .option('--start <iso>', 'New start date')
    .option('--end <iso>', 'New end date')
    .option('--description <text>', 'New description')
    .option('--address <text>', 'New address')
    .option('--virtual', 'Set as virtual')
    .option('--no-virtual', 'Unset virtual')
    .option('--private', 'Set as private')
    .option('--no-private', 'Set as public')
    .option('--guest-limit <n>', 'Maximum number of guests')
    .option('--guest-limit-per <n>', 'Maximum guests per registration')
    .option('--ticket-limit-per <n>', 'Maximum tickets per user')
    .option('--timezone <tz>', 'Event timezone')
    .option('--virtual-url <url>', 'Virtual event URL')
    .option('--approval-required', 'Require approval for registrations')
    .option('--no-approval-required', 'Remove approval requirement')
    .option('--application-required', 'Require application form')
    .option('--no-application-required', 'Remove application requirement')
    .option('--guest-directory', 'Enable guest directory')
    .option('--no-guest-directory', 'Disable guest directory')
    .option('--subevent', 'Enable sub-events')
    .option('--no-subevent', 'Disable sub-events')
    .option('--currency <code>', 'Payment currency code')
    .option('--tags <tags...>', 'Event tags (space-separated)')
    .option('--registration-disabled', 'Disable registration')
    .option('--no-registration-disabled', 'Enable registration')
    .option('--terms-text <text>', 'Terms and conditions text')
    .option('--welcome-text <text>', 'Welcome message for attendees')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const input: Record<string, unknown> = {};
        if (opts.title !== undefined) input.title = opts.title;
        if (opts.start !== undefined) input.start = new Date(opts.start).toISOString();
        if (opts.end !== undefined) input.end = new Date(opts.end).toISOString();
        if (opts.description !== undefined) input.description = opts.description;
        if (opts.address !== undefined) input.address = { title: opts.address };
        if (opts.virtual !== undefined) input.virtual = opts.virtual;
        if (opts.private !== undefined) input.private = opts.private;
        if (opts.guestLimit !== undefined) {
          const n = parseInt(opts.guestLimit, 10);
          if (!isNaN(n)) input.guest_limit = n;
        }
        if (opts.guestLimitPer !== undefined) {
          const n = parseInt(opts.guestLimitPer, 10);
          if (!isNaN(n)) input.guest_limit_per = n;
        }
        if (opts.ticketLimitPer !== undefined) {
          const n = parseInt(opts.ticketLimitPer, 10);
          if (!isNaN(n)) input.ticket_limit_per = n;
        }
        if (opts.timezone !== undefined) input.timezone = opts.timezone;
        if (opts.virtualUrl !== undefined) input.virtual_url = opts.virtualUrl;
        if (opts.approvalRequired !== undefined) input.approval_required = opts.approvalRequired;
        if (opts.applicationRequired !== undefined) input.application_required = opts.applicationRequired;
        if (opts.currency !== undefined) input.currency = opts.currency;
        if (opts.tags !== undefined) input.tags = opts.tags;
        if (opts.registrationDisabled !== undefined) input.registration_disabled = opts.registrationDisabled;
        if (opts.guestDirectory !== undefined) input.guest_directory_enabled = opts.guestDirectory;
        if (opts.subevent !== undefined) input.subevent_enabled = opts.subevent;
        if (opts.termsText !== undefined) input.terms_text = opts.termsText;
        if (opts.welcomeText !== undefined) input.welcome_text = opts.welcomeText;

        const result = await graphqlRequest<{ updateEvent: Record<string, unknown> }>(
          `mutation($id: MongoID!, $input: EventInput!) {
            updateEvent(_id: $id, input: $input) {
              _id title shortid start end published description
              virtual virtual_url private guest_limit guest_limit_per timezone approval_required
            }
          }`,
          { id: eventId, input },
        );
        setFlagApiKey(undefined);

        const ev = result.updateEvent;
        if (opts.json) {
          console.log(jsonSuccess(ev));
        } else {
          console.log(renderKeyValue([
            ['ID', String(ev._id)],
            ['Title', String(ev.title)],
            ['Start', String(ev.start)],
            ['Status', ev.published ? 'Published' : 'Draft'],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('publish <event-id>')
    .description('Publish an event')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ aiPublishEvent: Record<string, unknown> }>(
          `mutation($id: MongoID!) {
            aiPublishEvent(id: $id) { _id title published shortid }
          }`,
          { id: eventId },
        );
        setFlagApiKey(undefined);

        const ev = result.aiPublishEvent;
        if (opts.json) {
          console.log(jsonSuccess(ev));
        } else {
          console.log(`Event published: ${ev.title}`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('cancel <event-id>')
    .description('Cancel an event')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        await graphqlRequest(
          `mutation($_id: MongoID!) {
            cancelEvent(_id: $_id) { _id }
          }`,
          { _id: eventId },
        );
        setFlagApiKey(undefined);

        if (opts.json) {
          console.log(jsonSuccess({ cancelled: true }));
        } else {
          console.log(`Event cancelled: ${eventId}`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('analytics <event-id>')
    .description('View event analytics (ticket sales + page views + guest stats). Defaults the chart window to the last 30 days.')
    .option('--start <iso>', 'Start of the analytics window (ISO 8601). Defaults to 30 days ago.')
    .option('--end <iso>', 'End of the analytics window (ISO 8601). Defaults to now.')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const now = new Date();
        const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const start = opts.start ? new Date(opts.start).toISOString() : defaultStart.toISOString();
        const end = opts.end ? new Date(opts.end).toISOString() : now.toISOString();

        const [salesResult, viewsResult, guestsResult] = await Promise.all([
          graphqlRequest<{ getEventTicketSoldChartData: { items: Array<Record<string, unknown>> } }>(
            `query($event: MongoID!, $start: DateTimeISO!, $end: DateTimeISO!) {
              getEventTicketSoldChartData(event: $event, start: $start, end: $end) {
                items { created_at type }
              }
            }`,
            { event: eventId, start, end },
          ),
          graphqlRequest<{ getEventViewChartData: { items: Array<Record<string, unknown>> } }>(
            `query($event: MongoID!, $start: DateTimeISO!, $end: DateTimeISO!) {
              getEventViewChartData(event: $event, start: $start, end: $end) {
                items { date }
              }
            }`,
            { event: eventId, start, end },
          ),
          graphqlRequest<{ getEventGuestsStatistics: Record<string, unknown> }>(
            `query($event: MongoID!) {
              getEventGuestsStatistics(event: $event) {
                going pending_approval pending_invite declined checked_in
                ticket_types { ticket_type ticket_type_title guests_count }
              }
            }`,
            { event: eventId },
          ),
        ]);
        setFlagApiKey(undefined);

        const sales = salesResult.getEventTicketSoldChartData;
        const views = viewsResult.getEventViewChartData;
        const guests = guestsResult.getEventGuestsStatistics;

        if (opts.json) {
          console.log(jsonSuccess({ sales, views, guests, window: { start, end } }));
        } else {
          console.log(renderKeyValue([
            ['Window Start', start],
            ['Window End', end],
            ['Tickets Sold (in window)', String(sales.items.length)],
            ['Page Views (in window)', String(views.items.length)],
            ['Going', String(guests.going)],
            ['Pending Approval', String(guests.pending_approval)],
            ['Pending Invite', String(guests.pending_invite)],
            ['Declined', String(guests.declined)],
            ['Checked In', String(guests.checked_in)],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('guests <event-id>')
    .description('List event guests')
    .option('--search <text>', 'Search guests by name or email')
    .option('--limit <n>', 'Max results', '50')
    .option('--cursor <str>', 'Pagination cursor (skip)')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = parseInt(opts.limit, 10);
        const skip = opts.cursor ? parseInt(opts.cursor, 10) : 0;

        const result = await graphqlRequest<{ listEventGuests: { total: number; items: Array<Record<string, unknown>> } }>(
          `query($event: MongoID!, $search: String, $limit: Int, $skip: Int) {
            listEventGuests(event: $event, search: $search, limit: $limit, skip: $skip) {
              total
              items {
                user { _id name display_name email }
                ticket { _id type_expanded { _id title } checkin { _id } }
                join_request { _id state }
              }
            }
          }`,
          { event: eventId, search: opts.search, limit, skip },
        );
        setFlagApiKey(undefined);

        const items = result.listEventGuests.items;
        const total = result.listEventGuests.total;
        if (opts.json) {
          const nextCursor = items.length === limit ? String(skip + limit) : null;
          console.log(jsonSuccess(items, { cursor: nextCursor, total }));
        } else {
          console.log(renderTable(
            ['Name', 'Email', 'Ticket Type', 'State', 'Checked In'],
            items.map((g) => {
              const user = (g.user || {}) as Record<string, unknown>;
              const ticket = (g.ticket || {}) as Record<string, unknown>;
              const typeExp = (ticket.type_expanded || {}) as Record<string, unknown>;
              const jr = (g.join_request || {}) as Record<string, unknown>;
              return [
                String(user.display_name || user.name || ''),
                String(user.email || ''),
                String(typeExp.title || ''),
                String(jr.state || ''),
                ticket.checkin ? 'Yes' : 'No',
              ];
            }),
          ));
          console.log(`\n${items.length} of ${total} guests`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('invite <event-id>')
    .description('Invite people to an event')
    .requiredOption('--email <emails...>', 'Email addresses to invite')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        await graphqlRequest(
          `mutation($input: InviteEventInput!) {
            inviteEvent(input: $input) { _id }
          }`,
          { input: { event: eventId, emails: opts.email } },
        );
        setFlagApiKey(undefined);

        if (opts.json) {
          console.log(jsonSuccess({ sent: true }));
        } else {
          console.log(`Invitations sent to ${opts.email.length} recipients`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('approvals <event-id>')
    .description('Approve or decline specific join requests. Request IDs are required — the backend no longer supports a "decide all pending" shortcut.')
    .option('--approve', 'Approve the listed requests')
    .option('--decline', 'Decline the listed requests')
    .requiredOption('--request-id <ids...>', 'Join request IDs to decide')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        if (!opts.approve && !opts.decline) {
          throw new Error('Provide --approve or --decline');
        }
        if (opts.approve && opts.decline) {
          throw new Error('Cannot use both --approve and --decline');
        }

        const decision = opts.approve ? 'approved' : 'declined';
        const result = await graphqlRequest<{ decideUserJoinRequests: Array<{ _id: string; processed: boolean }> }>(
          `mutation($input: DecideUserJoinRequestsInput!) {
            decideUserJoinRequests(input: $input) { _id processed }
          }`,
          {
            input: {
              event: eventId,
              requests: opts.requestId,
              decision,
            },
          },
        );
        setFlagApiKey(undefined);

        const r = result.decideUserJoinRequests;
        if (opts.json) {
          console.log(jsonSuccess(r));
        } else {
          const processed = r.filter((x) => x.processed).length;
          console.log(`Decided ${r.length} requests (${processed} processed, ${r.length - processed} skipped, decision=${decision})`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('feedback <event-id>')
    .description('View event feedback')
    .option('--rating <n>', 'Filter by rating (1-5)')
    .option('--limit <n>', 'Max results', '20')
    .option('--offset <n>', 'Skip results', '0')
    .option('--summary', 'Show summary only')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = parseInt(opts.limit, 10);
        const offset = parseInt(opts.offset, 10);

        const summaryResult = await graphqlRequest<{ getEventFeedbackSummary: { rates: Array<{ rate_value: number; count: number }> } }>(
          `query($event: MongoID!) {
            getEventFeedbackSummary(event: $event) {
              rates { rate_value count }
            }
          }`,
          { event: eventId },
        );

        let feedbacks: Array<Record<string, unknown>> = [];
        if (!opts.summary) {
          const feedbackResult = await graphqlRequest<{ listEventFeedBacks: Array<Record<string, unknown>> }>(
            `query($event: MongoID!, $rate_value: Float, $limit: Int!, $skip: Int!) {
              listEventFeedBacks(event: $event, rate_value: $rate_value, limit: $limit, skip: $skip) {
                user email rate_value comment created_at
                user_info { _id name image_avatar }
              }
            }`,
            {
              event: eventId,
              rate_value: opts.rating ? parseFloat(opts.rating) : undefined,
              limit,
              skip: offset,
            },
          );
          feedbacks = feedbackResult.listEventFeedBacks;
        }
        setFlagApiKey(undefined);

        const rates = summaryResult.getEventFeedbackSummary.rates;
        const totalCount = rates.reduce((s, r) => s + r.count, 0);
        const weightedSum = rates.reduce((s, r) => s + r.rate_value * r.count, 0);
        const avgRating = totalCount > 0 ? (weightedSum / totalCount).toFixed(2) : 'n/a';

        if (opts.json) {
          console.log(jsonSuccess({ summary: { rates, total: totalCount, average: avgRating }, feedbacks }));
        } else {
          console.log(renderKeyValue([
            ['Average Rating', String(avgRating)],
            ['Total Reviews', String(totalCount)],
          ]));
          if (rates.length > 0) {
            console.log('\n' + renderTable(
              ['Rate', 'Count'],
              rates.map((r) => [String(r.rate_value), String(r.count)]),
            ));
          }
          if (feedbacks.length > 0) {
            console.log('\n' + renderTable(
              ['User', 'Rating', 'Comment', 'Date'],
              feedbacks.map((f) => {
                const ui = (f.user_info || {}) as Record<string, unknown>;
                return [
                  String(ui.name || f.email || ''),
                  String(f.rate_value ?? ''),
                  String(f.comment || ''),
                  String(f.created_at || ''),
                ];
              }),
            ));
          }
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  event
    .command('checkins <event-id>')
    .description('View event check-ins')
    .option('--limit <n>', 'Max results', '20')
    .option('--offset <n>', 'Skip results', '0')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = Math.min(parseInt(opts.limit, 10), EVENT_CHECKINS_LIMIT_CAP);
        const offset = parseInt(opts.offset, 10);

        const page = await fetchEventCheckinsPage(
          eventId,
          { limit, skip: offset },
        );
        setFlagApiKey(undefined);

        if (opts.json) {
          console.log(jsonSuccess(page.items, { cursor: page.next_cursor }));
        } else {
          console.log(renderTable(
            ['Name', 'Email', 'Ticket Type', 'Checked In At'],
            page.items.map((c) => [
              c.name,
              c.email,
              c.ticket_type_title,
              c.checked_in_at,
            ]),
          ));
          console.log(`\n${page.items.length} check-ins`);
          if (page.next_cursor) {
            process.stderr.write(`More results may be available. Use --offset ${page.next_cursor} to fetch the next page.\n`);
          }
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
