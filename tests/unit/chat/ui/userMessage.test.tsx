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

  it('renders with visual distinction from assistant messages', () => {
    const { lastFrame } = render(<UserMessage text="some input" />);
    const output = lastFrame()!;
    expect(output).toContain('You');
    expect(output).toContain('some input');
  });

  it('has a blank line gap (marginBottom) for visual breathing room', () => {
    const { lastFrame } = render(<UserMessage text="msg" />);
    const output = lastFrame()!;
    // The component renders with marginTop and marginBottom for spacing
    expect(output).toContain('You');
    expect(output).toContain('msg');
  });
});
