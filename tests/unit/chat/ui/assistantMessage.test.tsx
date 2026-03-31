import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { AssistantMessage } from '../../../../src/chat/ui/AssistantMessage';

describe('AssistantMessage', () => {
  it('renders text with markdown when not streaming', () => {
    const { lastFrame } = render(<AssistantMessage text="**bold text** here" />);
    const output = lastFrame()!;
    expect(output).toContain('bold text');
    expect(output).toContain('here');
  });

  it('renders plain text when streaming', () => {
    const { lastFrame } = render(<AssistantMessage text="partial response..." streaming />);
    expect(lastFrame()!).toContain('partial response...');
  });

  it('renders markdown headings in completed mode', () => {
    const { lastFrame } = render(<AssistantMessage text="# Title" />);
    expect(lastFrame()!).toContain('Title');
  });

  it('renders code blocks in completed mode', () => {
    const { lastFrame } = render(<AssistantMessage text="```\nconst x = 1\n```" />);
    expect(lastFrame()!).toContain('const x = 1');
  });

  it('has no colored border or label', () => {
    const { lastFrame } = render(<AssistantMessage text="just a response" />);
    const output = lastFrame()!;
    expect(output).not.toContain('You');
    expect(output).toContain('just a response');
  });
});
