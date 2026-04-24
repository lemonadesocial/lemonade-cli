import { graphqlRequestDocument } from './graphql.js';
import {
  GetEventCheckinsDocument,
  GetTicketsByIdsDocument,
  type GetEventCheckinsQuery,
  type GetTicketsByIdsQuery,
} from '../graphql/generated/backend/graphql.js';

export const EVENT_CHECKINS_LIMIT_CAP = 100;

export interface EventCheckinListItem {
  _id: string;
  name: string;
  email: string;
  ticket: string;
  ticket_type_title: string;
  checked_in_at: string;
}

export interface EventCheckinsPage {
  items: EventCheckinListItem[];
  skip: number;
  limit: number;
  next_cursor?: string | null;
}

type EventCheckinNode = GetEventCheckinsQuery['getEventCheckins'][number];
type TicketNode = GetTicketsByIdsQuery['getTickets'][number];

function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return 20;
  return Math.min(Math.max(1, Math.trunc(limit as number)), EVENT_CHECKINS_LIMIT_CAP);
}

function normalizeSkip(skip?: number): number {
  if (!Number.isFinite(skip)) return 0;
  return Math.max(0, Math.trunc(skip as number));
}

function getCheckinName(checkin: EventCheckinNode): string {
  return String(checkin.login_user?.name || checkin.non_login_user?.name || '');
}

function getCheckinEmail(checkin: EventCheckinNode): string {
  return String(checkin.login_user?.email || checkin.non_login_user?.email || checkin.email || '');
}

function buildTicketTypeTitleMap(tickets: TicketNode[]): Map<string, string> {
  return new Map(
    tickets.map((ticket) => [
      String(ticket._id),
      String(ticket.type_expanded?.title || ''),
    ]),
  );
}

async function loadTicketTypeTitleMap(ticketIds: string[]): Promise<Map<string, string>> {
  const uniqueTicketIds = [...new Set(ticketIds.filter(Boolean))];
  if (uniqueTicketIds.length === 0) return new Map();

  const result = await graphqlRequestDocument(
    GetTicketsByIdsDocument,
    { ids: uniqueTicketIds },
  );
  return buildTicketTypeTitleMap(result.getTickets);
}

function normalizeCheckin(
  checkin: EventCheckinNode,
  ticketTypeTitles: Map<string, string>,
): EventCheckinListItem {
  const ticketId = String(checkin.ticket);
  return {
    _id: String(checkin._id),
    name: getCheckinName(checkin),
    email: getCheckinEmail(checkin),
    ticket: ticketId,
    ticket_type_title: ticketTypeTitles.get(ticketId) || '',
    checked_in_at: String(checkin.created_at || ''),
  };
}

export async function fetchEventCheckinsPage(
  eventId: string,
  options: { limit?: number; skip?: number } = {},
): Promise<EventCheckinsPage> {
  const limit = normalizeLimit(options.limit);
  const skip = normalizeSkip(options.skip);

  const result = await graphqlRequestDocument(
    GetEventCheckinsDocument,
    { input: { event: eventId }, skip, limit },
  );

  const ticketTypeTitles = await loadTicketTypeTitleMap(result.getEventCheckins.map((checkin) => String(checkin.ticket)));
  const items = result.getEventCheckins.map((checkin) => normalizeCheckin(checkin, ticketTypeTitles));
  const nextCursor = items.length === limit
    ? String(skip + items.length)
    : null;

  return {
    items,
    skip,
    limit,
    next_cursor: nextCursor,
  };
}
