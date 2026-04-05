import { Command } from 'commander';
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
    .option('--search <text>', 'Search text')
    .option('--limit <n>', 'Max results', '20')
    .option('--cursor <str>', 'Pagination cursor (skip)')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = parseInt(opts.limit, 10);
        const skip = opts.cursor ? parseInt(opts.cursor, 10) : 0;

        const result = await graphqlRequest<{ aiGetHostingEvents: { items: Array<Record<string, unknown>> } }>(
          `query($draft: Boolean, $search: String, $limit: Int, $skip: Int) {
            aiGetHostingEvents(draft: $draft, search: $search, limit: $limit, skip: $skip) {
              items { _id title shortid start end published }
            }
          }`,
          {
            draft: opts.draft || undefined,
            search: opts.search,
            limit,
            skip,
          },
        );
        setFlagApiKey(undefined);

        const items = result.aiGetHostingEvents.items;
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
        const result = await graphqlRequest<{ aiGetEvent: Record<string, unknown> }>(
          `query($id: MongoID!) {
            aiGetEvent(id: $id) {
              _id title shortid start end published description
              virtual virtual_url private guest_limit guest_limit_per ticket_limit_per
              timezone approval_required application_required registration_disabled
              currency tags guest_directory_enabled subevent_enabled terms_text welcome_text
              address { title city country latitude longitude }
            }
          }`,
          { id: eventId },
        );
        setFlagApiKey(undefined);

        const ev = result.aiGetEvent;
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
          `mutation($id: MongoID!) {
            aiCancelEvent(id: $id)
          }`,
          { id: eventId },
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
    .description('View event analytics')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (eventId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const [salesResult, viewsResult, guestsResult] = await Promise.all([
          graphqlRequest<{ aiGetEventTicketSoldInsight: Record<string, unknown> }>(
            `query($event: MongoID!) {
              aiGetEventTicketSoldInsight(event: $event) {
                total_sold total_revenue_cents currency
                by_type { ticket_type_id title sold revenue_cents }
              }
            }`,
            { event: eventId },
          ),
          graphqlRequest<{ aiGetEventViewInsight: Record<string, unknown> }>(
            `query($event: MongoID!) {
              aiGetEventViewInsight(event: $event) {
                total_views unique_visitors
                top_sources { source count }
                top_cities { city count }
              }
            }`,
            { event: eventId },
          ),
          graphqlRequest<{ aiGetEventGuestStats: Record<string, unknown> }>(
            `query($event: MongoID!) {
              aiGetEventGuestStats(event: $event) {
                going pending_approval pending_invite declined checked_in total
              }
            }`,
            { event: eventId },
          ),
        ]);
        setFlagApiKey(undefined);

        const sales = salesResult.aiGetEventTicketSoldInsight;
        const views = viewsResult.aiGetEventViewInsight;
        const guests = guestsResult.aiGetEventGuestStats;

        if (opts.json) {
          console.log(jsonSuccess({ sales, views, guests }));
        } else {
          const rawRevenue = Number(sales.total_revenue_cents);
          const revenueDollars = Number.isFinite(rawRevenue) ? (rawRevenue / 100).toFixed(2) : '0.00';
          console.log(renderKeyValue([
            ['Tickets Sold', String(sales.total_sold)],
            ['Revenue', `${revenueDollars} ${sales.currency}`],
            ['Page Views', String(views.total_views)],
            ['Unique Visitors', String(views.unique_visitors)],
            ['Going', String(guests.going)],
            ['Pending Approval', String(guests.pending_approval)],
            ['Pending Invite', String(guests.pending_invite)],
            ['Declined', String(guests.declined)],
            ['Checked In', String(guests.checked_in)],
            ['Total Guests', String(guests.total)],
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

        const result = await graphqlRequest<{ aiGetEventGuests: { items: Array<Record<string, unknown>> } }>(
          `query($event: MongoID!, $search: String, $limit: Int, $skip: Int) {
            aiGetEventGuests(event: $event, search: $search, limit: $limit, skip: $skip) {
              items { name email status ticket_type_title checked_in }
            }
          }`,
          { event: eventId, search: opts.search, limit, skip },
        );
        setFlagApiKey(undefined);

        const items = result.aiGetEventGuests.items;
        if (opts.json) {
          const nextCursor = items.length === limit ? String(skip + limit) : null;
          console.log(jsonSuccess(items, { cursor: nextCursor }));
        } else {
          console.log(renderTable(
            ['Name', 'Email', 'Status', 'Ticket Type', 'Checked In'],
            items.map((g) => [
              String(g.name || ''),
              String(g.email || ''),
              String(g.status || ''),
              String(g.ticket_type_title || ''),
              g.checked_in ? 'Yes' : 'No',
            ]),
          ));
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
            aiInviteEvent(input: $input)
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
    .description('Manage event join requests')
    .option('--approve', 'Approve pending requests')
    .option('--decline', 'Decline pending requests')
    .option('--request-id <ids...>', 'Specific request IDs')
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
        const result = await graphqlRequest<{ aiDecideEventJoinRequests: { processed_count: number; decision: string } }>(
          `mutation($event: MongoID!, $decision: String!, $request_ids: [MongoID!]) {
            aiDecideEventJoinRequests(event: $event, decision: $decision, request_ids: $request_ids) {
              processed_count decision
            }
          }`,
          {
            event: eventId,
            decision,
            request_ids: opts.requestId,
          },
        );
        setFlagApiKey(undefined);

        const r = result.aiDecideEventJoinRequests;
        if (opts.json) {
          console.log(jsonSuccess(r));
        } else {
          console.log(`Processed ${r.processed_count} requests (${r.decision})`);
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

        const summaryResult = await graphqlRequest<{ aiGetEventFeedbackSummary: Record<string, unknown> }>(
          `query($event: MongoID!) {
            aiGetEventFeedbackSummary(event: $event) {
              average_rating total_reviews
              rating_distribution { rating count }
            }
          }`,
          { event: eventId },
        );

        let feedbacks: Array<Record<string, unknown>> = [];
        if (!opts.summary) {
          const feedbackResult = await graphqlRequest<{ aiListEventFeedbacks: { items: Array<Record<string, unknown>> } }>(
            `query($event: MongoID!, $rate_value: Float, $limit: Int, $skip: Int) {
              aiListEventFeedbacks(event: $event, rate_value: $rate_value, limit: $limit, skip: $skip) {
                items { user_name rating comment created_at }
              }
            }`,
            {
              event: eventId,
              rate_value: opts.rating ? parseFloat(opts.rating) : undefined,
              limit,
              skip: offset,
            },
          );
          feedbacks = feedbackResult.aiListEventFeedbacks.items;
        }
        setFlagApiKey(undefined);

        const summary = summaryResult.aiGetEventFeedbackSummary;

        if (opts.json) {
          console.log(jsonSuccess({ summary, feedbacks }));
        } else {
          console.log(renderKeyValue([
            ['Average Rating', String(summary.average_rating)],
            ['Total Reviews', String(summary.total_reviews)],
          ]));
          if (feedbacks.length > 0) {
            console.log('\n' + renderTable(
              ['User', 'Rating', 'Comment', 'Date'],
              feedbacks.map((f) => [
                String(f.user_name || ''),
                String(f.rating),
                String(f.comment || ''),
                String(f.created_at || ''),
              ]),
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
        const limit = Math.min(parseInt(opts.limit, 10), 100);
        const offset = parseInt(opts.offset, 10);

        const result = await graphqlRequest<{ aiGetEventCheckins: { items: Array<Record<string, unknown>> } }>(
          `query($event: MongoID!, $limit: Int, $skip: Int) {
            aiGetEventCheckins(event: $event, limit: $limit, skip: $skip) {
              items { name email ticket_type_title checked_in_at }
            }
          }`,
          { event: eventId, limit, skip: offset },
        );
        setFlagApiKey(undefined);

        const items = result.aiGetEventCheckins.items;
        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          console.log(renderTable(
            ['Name', 'Email', 'Ticket Type', 'Checked In At'],
            items.map((c) => [
              String(c.name || ''),
              String(c.email || ''),
              String(c.ticket_type_title || ''),
              String(c.checked_in_at || ''),
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
