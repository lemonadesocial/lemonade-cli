import { describe, it, expect } from 'vitest';
import { formatUserMessage, formatAssistantMessage } from '../../../../src/chat/ui/writeMessage';

describe('formatUserMessage', () => {
  it('includes "You" prefix', () => {
    const output = formatUserMessage('hello');
    // Strip ANSI for content check
    const plain = output.replace(/\u001b\[[0-9;]*m/g, '');
    expect(plain).toContain('You');
  });

  it('includes the message text', () => {
    const output = formatUserMessage('test input');
    const plain = output.replace(/\u001b\[[0-9;]*m/g, '');
    expect(plain).toContain('test input');
  });

  it('produces blank lines for visual spacing', () => {
    const output = formatUserMessage('msg');
    // Should start and end with newlines for breathing room
    expect(output.startsWith('\n')).toBe(true);
    expect(output.endsWith('\n')).toBe(true);
  });

  it('handles multiline messages', () => {
    const output = formatUserMessage('line one\nline two');
    const plain = output.replace(/\u001b\[[0-9;]*m/g, '');
    expect(plain).toContain('line one');
    expect(plain).toContain('line two');
  });
});

describe('formatAssistantMessage', () => {
  it('includes the response text', () => {
    const output = formatAssistantMessage('Here is the answer.');
    const plain = output.replace(/\u001b\[[0-9;]*m/g, '');
    expect(plain).toContain('Here is the answer.');
  });

  it('produces blank lines for visual spacing', () => {
    const output = formatAssistantMessage('response');
    expect(output.startsWith('\n')).toBe(true);
    expect(output.endsWith('\n')).toBe(true);
  });

  it('does not include "You" prefix', () => {
    const output = formatAssistantMessage('AI response');
    const plain = output.replace(/\u001b\[[0-9;]*m/g, '');
    expect(plain).not.toContain('You');
  });
});
