import { describe, it, expect } from 'vitest';
import { buildContextSummary } from '../../../src/chat/session/summary';
import { Message } from '../../../src/chat/providers/interface';
import { createSessionState } from '../../../src/chat/session/state';

const mockUser = { _id: 'u1', name: 'Test User', email: 'test@example.com' };

describe('buildContextSummary', () => {
  it('returns empty string for empty messages and no session', () => {
    expect(buildContextSummary([])).toBe('');
  });

  it('returns empty string for messages without tool calls and no session', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];
    expect(buildContextSummary(messages)).toBe('');
  });

  it('includes session state info', () => {
    const session = createSessionState(mockUser, undefined, 'America/New_York');
    session.currentSpace = { _id: 's1', title: 'My Space' };
    session.currentEvent = { _id: 'e1', title: 'My Event' };

    const summary = buildContextSummary([], session);
    expect(summary).toContain('Current space: My Space (s1)');
    expect(summary).toContain('Current event: My Event (e1)');
    expect(summary).toContain('Timezone: America/New_York');
  });

  it('extracts event_create actions from assistant tool_use blocks', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'tc1',
            name: 'event_create',
            input: { title: 'Launch Party' },
          },
        ],
      },
    ];

    const summary = buildContextSummary(messages);
    expect(summary).toContain('created event "Launch Party"');
  });

  it('extracts space_switch actions', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'tc2',
            name: 'space_switch',
            input: { space_id: 's99' },
          },
        ],
      },
    ];

    const summary = buildContextSummary(messages);
    expect(summary).toContain('switched space to "s99"');
  });

  it('groups multiple ticket type creations', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'tc1', name: 'tickets_create_type', input: { title: 'VIP' } },
        ],
      },
      {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'tc2', name: 'tickets_create_type', input: { title: 'GA' } },
        ],
      },
      {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'tc3', name: 'tickets_create_type', input: { title: 'Early Bird' } },
        ],
      },
    ];

    const summary = buildContextSummary(messages);
    expect(summary).toContain('created 3 ticket types');
    expect(summary).not.toContain('VIP');
  });

  it('produces summary under 500 chars', () => {
    const session = createSessionState(mockUser, undefined, 'America/New_York');
    session.currentSpace = { _id: 's1', title: 'A'.repeat(100) };
    session.currentEvent = { _id: 'e1', title: 'B'.repeat(100) };
    session.lastCreatedTicketType = { _id: 'tt1', title: 'C'.repeat(100) };

    const messages: Message[] = Array.from({ length: 20 }, (_, i) => ({
      role: 'assistant' as const,
      content: [
        {
          type: 'tool_use',
          id: `tc${i}`,
          name: 'event_create',
          input: { title: `Event ${i} ${'X'.repeat(30)}` },
        },
      ],
    }));

    const summary = buildContextSummary(messages, session);
    expect(summary.length).toBeLessThanOrEqual(500);
  });

  it('includes header line', () => {
    const session = createSessionState(mockUser);
    session.currentSpace = { _id: 's1', title: 'Test' };

    const summary = buildContextSummary([], session);
    expect(summary).toMatch(/^Session context preserved from truncated messages:/);
  });

  it('includes lastCreatedEvent when different from currentEvent', () => {
    const session = createSessionState(mockUser);
    session.currentEvent = { _id: 'e1', title: 'Current' };
    session.lastCreatedEvent = { _id: 'e2', title: 'Last Created' };

    const summary = buildContextSummary([], session);
    expect(summary).toContain('Last created event: Last Created (e2)');
  });

  it('omits lastCreatedEvent when same as currentEvent', () => {
    const session = createSessionState(mockUser);
    session.currentEvent = { _id: 'e1', title: 'Same' };
    session.lastCreatedEvent = { _id: 'e1', title: 'Same' };

    const summary = buildContextSummary([], session);
    expect(summary).not.toContain('Last created event');
  });
});
