import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const sessionTools: CanonicalCapability[] = [
  buildCapability({
    name: 'event_session_reservations',
    category: 'session',
    displayName: 'event session reservations',
    description: 'List session reservations for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventSessionReservations',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventSessionReservations: unknown }>(
        `query($input: GetEventSessionReservationsInput!) {
          getEventSessionReservations(input: $input) {
            user event session ticket_type
            user_expanded { _id name }
          }
        }`,
        { input: { event: args.event_id } },
      );
      return result.getEventSessionReservations;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const reservations = result as Array<Record<string, unknown>>;
      if (!reservations.length) return 'No reservations found.';
      const lines = reservations.map(r => {
        const user = r.user_expanded as Record<string, unknown> | undefined;
        const name = user?.name || r.user || 'unknown';
        return `- ${name} → session ${r.session}`;
      });
      return `${reservations.length} reservation(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'event_session_reservation_summary',
    category: 'session',
    displayName: 'event session reservation summary',
    description: 'Get reservation count summary per session (and optionally per ticket type).',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'session_id', type: 'string', description: 'Filter by specific session', required: false },
    ],
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventSessionReservationSummary',
    requiresSpace: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { event: args.event_id };
      if (args.session_id !== undefined) input.session = args.session_id;
      const result = await graphqlRequest<{ getEventSessionReservationSummary: unknown }>(
        `query($input: GetEventSessionReservationSummaryInput!) {
          getEventSessionReservationSummary(input: $input) {
            session ticket_type count
          }
        }`,
        { input },
      );
      return result.getEventSessionReservationSummary;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const summaries = result as Array<Record<string, unknown>>;
      if (!summaries.length) return 'No reservation data found.';
      const lines = summaries.map(s => {
        const ticketInfo = s.ticket_type ? ` (ticket type: ${s.ticket_type})` : '';
        return `- Session ${s.session}: ${s.count} reservation(s)${ticketInfo}`;
      });
      return `${summaries.length} summary record(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'event_session_reserve',
    category: 'session',
    displayName: 'event session reserve',
    description: 'Reserve a spot in an event session for the current user.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'session_id', type: 'string', description: 'Session ID', required: true },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createEventSessionReservation',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ createEventSessionReservation: boolean }>(
        `mutation($input: EventSessionReservationInput!) {
          createEventSessionReservation(input: $input)
        }`,
        { input: { event: args.event_id, session: args.session_id } },
      );
      return result.createEventSessionReservation;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      return result ? 'Session reserved successfully.' : 'Failed to reserve session.';
    },
  }),
  buildCapability({
    name: 'event_session_unreserve',
    category: 'session',
    displayName: 'event session unreserve',
    description: 'Cancel a session reservation for the current user.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'session_id', type: 'string', description: 'Session ID', required: true },
    ],
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteEventSessionReservation',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteEventSessionReservation: boolean }>(
        `mutation($input: EventSessionReservationInput!) {
          deleteEventSessionReservation(input: $input)
        }`,
        { input: { event: args.event_id, session: args.session_id } },
      );
      return result.deleteEventSessionReservation;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      return result ? 'Session reservation cancelled.' : 'Failed to cancel reservation.';
    },
  }),
];
