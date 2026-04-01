import { describe, it, expect, vi } from 'vitest';
import { truncateHistory } from '../../../src/chat/session/history';
import { Message } from '../../../src/chat/providers/interface';

describe('truncateHistory', () => {
  it('does nothing when under 50 messages', () => {
    const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    const originalLength = messages.length;
    truncateHistory(messages);
    expect(messages.length).toBe(originalLength);
  });

  it('truncates when over 50 messages', () => {
    const messages: Message[] = Array.from({ length: 60 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    truncateHistory(messages);

    // 19 because trailing assistant message is stripped (API requires ending with user)
    expect(messages.length).toBe(19);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Context trimmed'),
    );

    consoleSpy.mockRestore();
  });

  it('keeps the most recent messages', () => {
    const messages: Message[] = Array.from({ length: 60 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    truncateHistory(messages);

    // The last message should be the most recent user message (assistant trailing stripped)
    expect((messages[messages.length - 1].content as string)).toBe('Message 58');
    // The first message should be from the kept recent set
    expect((messages[0].content as string)).toBe('Message 40');
  });

  it('truncates based on estimated token count', () => {
    // Create messages that are large (each ~5000 tokens = ~20000 chars)
    const messages: Message[] = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x'.repeat(15000), // ~3750 tokens each, 30 * 3750 = 112,500 tokens
    }));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    truncateHistory(messages);

    // 19 because trailing assistant message is stripped (API requires ending with user)
    expect(messages.length).toBe(19);
    consoleSpy.mockRestore();
  });

  it('skips tool_result messages at the cut boundary', () => {
    // Build 60 messages where position 40 is a tool_result
    const messages: Message[] = Array.from({ length: 60 }, (_, i) => {
      if (i === 40) {
        return {
          role: 'user' as const,
          content: [{ tool_use_id: 'tc1', content: '{"ok":true}' }],
        };
      }
      return {
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`,
      };
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    truncateHistory(messages);

    // The first remaining message should NOT be a tool_result
    const firstContent = messages[0].content;
    if (Array.isArray(firstContent)) {
      const blocks = firstContent as Array<Record<string, unknown>>;
      expect('tool_use_id' in blocks[0]).toBe(false);
    }

    consoleSpy.mockRestore();
  });

  it('does not truncate when token count is under limit', () => {
    const messages: Message[] = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'short message',
    }));

    const originalLength = messages.length;
    truncateHistory(messages);
    expect(messages.length).toBe(originalLength);
  });
});
