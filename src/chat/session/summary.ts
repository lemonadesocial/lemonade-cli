import { Message } from '../providers/interface.js';
import { SessionState } from './state.js';

const MAX_SUMMARY_LENGTH = 500;

interface ExtractedAction {
  verb: string;
  name: string;
}

/**
 * Scan messages for tool results that contain IDs and notable actions.
 * Returns a list of human-readable action descriptions.
 */
function extractActions(messages: Message[]): ExtractedAction[] {
  const actions: ExtractedAction[] = [];

  for (const msg of messages) {
    if (msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;

    for (const block of msg.content) {
      const b = block as Record<string, unknown>;
      if (b.type !== 'tool_use') continue;

      const toolName = String(b.name || '');
      const args = (b.input || {}) as Record<string, unknown>;

      switch (toolName) {
        case 'event_create':
          if (args.title) actions.push({ verb: 'created event', name: String(args.title) });
          break;
        case 'event_clone':
          actions.push({ verb: 'cloned event', name: String(args.event_id || '') });
          break;
        case 'space_create':
          if (args.title) actions.push({ verb: 'created space', name: String(args.title) });
          break;
        case 'space_switch':
          if (args.space_id) actions.push({ verb: 'switched space to', name: String(args.space_id) });
          break;
        case 'tickets_create_type':
          if (args.title) actions.push({ verb: 'created ticket type', name: String(args.title) });
          break;
        case 'event_update':
          actions.push({ verb: 'updated event', name: String(args.event_id || args.title || '') });
          break;
      }
    }
  }

  // Also scan tool_result user messages for IDs in JSON responses
  for (const msg of messages) {
    if (msg.role !== 'user' || !Array.isArray(msg.content)) continue;

    for (const block of msg.content) {
      const b = block as Record<string, unknown>;
      if (!('tool_use_id' in b)) continue;

      const content = String(b.content || '');
      // Try to parse JSON tool results for notable IDs
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          if (parsed._id && parsed.title) {
            // Already captured by assistant-side scanning
          }
        }
      } catch {
        // Not JSON, skip
      }
    }
  }

  return actions;
}

/**
 * Build a compact context summary from messages that are about to be truncated.
 * Includes session state and notable actions extracted from tool calls.
 */
export function buildContextSummary(messages: Message[], session?: SessionState): string {
  const lines: string[] = [];

  // Session state
  if (session?.currentSpace) {
    lines.push(`- Current space: ${session.currentSpace.title} (${session.currentSpace._id})`);
  }
  if (session?.currentEvent) {
    lines.push(`- Current event: ${session.currentEvent.title} (${session.currentEvent._id})`);
  }
  if (session?.timezone) {
    lines.push(`- Timezone: ${session.timezone}`);
  }
  if (session?.lastCreatedEvent && session.lastCreatedEvent._id !== session.currentEvent?._id) {
    lines.push(`- Last created event: ${session.lastCreatedEvent.title} (${session.lastCreatedEvent._id})`);
  }
  if (session?.lastCreatedTicketType) {
    lines.push(`- Last ticket type: ${session.lastCreatedTicketType.title} (${session.lastCreatedTicketType._id})`);
  }

  // Extract actions from truncated messages
  const actions = extractActions(messages);
  if (actions.length > 0) {
    // Deduplicate and compact: group ticket types
    const ticketTypeCount = actions.filter(a => a.verb === 'created ticket type').length;
    const otherActions = actions.filter(a => a.verb !== 'created ticket type');

    const parts: string[] = otherActions.map(a => `${a.verb} "${a.name}"`);
    if (ticketTypeCount > 0) {
      parts.push(`created ${ticketTypeCount} ticket type${ticketTypeCount > 1 ? 's' : ''}`);
    }

    if (parts.length > 0) {
      lines.push(`- Recent actions: ${parts.join(', ')}`);
    }
  }

  if (lines.length === 0) return '';

  let summary = 'Session context preserved from truncated messages:\n' + lines.join('\n');

  // Enforce max length
  if (summary.length > MAX_SUMMARY_LENGTH) {
    summary = summary.slice(0, MAX_SUMMARY_LENGTH - 3) + '...';
  }

  return summary;
}
