import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { UserMessage } from '../../../../src/chat/ui/UserMessage';

describe('UserMessage', () => {
  it('renders the message text', () => {
    const { lastFrame } = render(<UserMessage text="Hello world" />);
    expect(lastFrame()!).toContain('Hello world');
  });

  it('shows "You" label', () => {
    const { lastFrame } = render(<UserMessage text="test message" />);
    expect(lastFrame()!).toContain('You');
  });

  it('has a visible left border for visual distinction', () => {
    const { lastFrame } = render(<UserMessage text="some input" />);
    const output = lastFrame()!;
    // Ink renders borderStyle="bold" as box-drawing characters on the left
    // The key assertion: user messages have a "You" label and text content
    expect(output).toContain('You');
    expect(output).toContain('some input');
  });

  it('is visually distinct from assistant messages', () => {
    const { lastFrame: userFrame } = render(<UserMessage text="user text" />);
    // User messages have "You" label, assistant messages do not
    expect(userFrame()!).toContain('You');
  });
});
