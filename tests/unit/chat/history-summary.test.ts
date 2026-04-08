import { describe, it, expect, vi } from 'vitest';
import { truncateHistory } from '../../../src/chat/session/history';
import { Message } from '../../../src/chat/providers/interface';
import { createSessionState } from '../../../src/chat/session/state';

describe('truncateHistory context summary insertion', () => {
  it('inserts a context summary message when truncating with session state', () => {
    const session = createSessionState(
      { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
      undefined,
      'Europe/Berlin',
    );
    session.currentSpace = { _id: 's1', title: 'Berlin HQ' };
    session.currentEvent = { _id: 'e1', title: 'Techno Night' };

    const messages: Message[] = Array.from({ length: 60 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
    }));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    truncateHistory(messages, session);

    // First message should be the synthetic context summary
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('[Context from previous conversation]');
    expect(messages[0].content).toContain('Berlin HQ');
    expect(messages[0].content).toContain('Techno Night');
    expect(messages[0].content).toContain('Europe/Berlin');

    consoleSpy.mockRestore();
  });

  it('inserts context summary with tool call actions from truncated messages', () => {
    const messages: Message[] = [];

    // First 40 messages include tool calls that will be truncated
    for (let i = 0; i < 40; i++) {
      if (i === 10) {
        messages.push({
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tc1',
              name: 'event_create',
              input: { title: 'Launch Party' },
            },
          ],
        });
      } else {
        messages.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
        });
      }
    }

    // Last 20 messages are recent
    for (let i = 40; i < 60; i++) {
      messages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      });
    }

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    truncateHistory(messages);

    // First message should contain the action from the truncated tool call
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('Launch Party');

    consoleSpy.mockRestore();
  });

  it('does not insert summary when truncated messages have no useful context', () => {
    const messages: Message[] = Array.from({ length: 60 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
    }));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    truncateHistory(messages); // no session, no tool calls

    // First message should NOT be a context summary
    expect(messages[0].content).not.toContain('[Context from previous conversation]');
    expect(messages[0].content).toBe('Message 40');

    consoleSpy.mockRestore();
  });

  it('does not truncate or insert summary when under limits', () => {
    const session = createSessionState(
      { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
    );
    session.currentSpace = { _id: 's1', title: 'My Space' };

    const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
    }));

    const originalLength = messages.length;
    truncateHistory(messages, session);
    expect(messages.length).toBe(originalLength);
    // No synthetic message inserted
    expect(messages[0].content).toBe('Message 0');
  });
});
