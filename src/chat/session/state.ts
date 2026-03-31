export interface SessionState {
  user: { _id: string; name: string; email: string; first_name?: string };
  currentSpace?: { _id: string; title: string };
  currentEvent?: { _id: string; title: string };
  lastCreatedEvent?: { _id: string; title: string };
  lastCreatedTicketType?: { _id: string; title: string };
  defaultSpace?: string;
}

export function createSessionState(user: {
  _id: string;
  name: string;
  email: string;
  first_name?: string;
}, defaultSpace?: string): SessionState {
  return {
    user,
    defaultSpace,
  };
}

export function updateSession(
  session: SessionState,
  toolName: string,
  result: unknown,
): void {
  if (!result || typeof result !== 'object') return;

  const data = result as Record<string, unknown>;

  switch (toolName) {
    case 'event_create':
      session.lastCreatedEvent = { _id: String(data._id), title: String(data.title) };
      session.currentEvent = session.lastCreatedEvent;
      break;

    case 'event_clone': {
      const ids = data as unknown as string[];
      if (Array.isArray(ids) && ids.length > 0) {
        session.lastCreatedEvent = { _id: String(ids[0]), title: 'Cloned event' };
        session.currentEvent = session.lastCreatedEvent;
      }
      break;
    }

    case 'event_get':
      session.currentEvent = { _id: String(data._id), title: String(data.title) };
      break;

    case 'event_update':
      if (session.currentEvent && session.currentEvent._id === String(data._id)) {
        session.currentEvent.title = String(data.title);
      }
      break;

    case 'space_create':
      session.currentSpace = { _id: String(data._id), title: String(data.title) };
      break;

    case 'space_switch':
      session.currentSpace = { _id: String(data._id), title: String(data.title) };
      break;

    case 'space_list': {
      const items = (data as { items?: Array<Record<string, unknown>> }).items;
      if (items && items.length === 1) {
        session.currentSpace = { _id: String(items[0]._id), title: String(items[0].title) };
      }
      break;
    }

    case 'tickets_create_type':
      session.lastCreatedTicketType = { _id: String(data._id), title: String(data.title) };
      break;
  }
}

export function buildSessionBlock(session: SessionState): string {
  const lines: string[] = ['Current session:'];
  lines.push(`- User: ${session.user.name} (${session.user.email})`);

  if (session.defaultSpace) {
    lines.push(`- Default space: ${session.defaultSpace}`);
  }
  if (session.currentSpace) {
    lines.push(`- Current space: ${session.currentSpace.title} (${session.currentSpace._id})`);
  }
  if (session.currentEvent) {
    lines.push(`- Current event: ${session.currentEvent.title} (${session.currentEvent._id})`);
  }
  if (session.lastCreatedEvent) {
    lines.push(`- Last created event: ${session.lastCreatedEvent.title} (${session.lastCreatedEvent._id})`);
  }
  if (session.lastCreatedTicketType) {
    lines.push(`- Last created ticket type: ${session.lastCreatedTicketType.title} (${session.lastCreatedTicketType._id})`);
  }

  return lines.join('\n');
}
