import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ToolCallGroup } from '../../../../src/chat/ui/ToolCallGroup';

describe('ToolCallGroup', () => {
  it('renders without crashing for empty calls', () => {
    const { lastFrame } = render(<ToolCallGroup calls={[]} />);
    // Empty box renders as empty string in ink-testing-library
    expect(lastFrame()).toBeDefined();
  });

  it('renders summary with done count', () => {
    const { lastFrame } = render(
      <ToolCallGroup
        calls={[
          { id: 'tc1', name: 'event_create', status: 'success' },
          { id: 'tc2', name: 'event_get', status: 'running' },
        ]}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('1/2 done');
    expect(output).toContain('1 running');
  });

  it('renders each tool call by name', () => {
    const { lastFrame } = render(
      <ToolCallGroup
        calls={[
          { id: 'tc1', name: 'event_create', status: 'success' },
          { id: 'tc2', name: 'ticket_list', status: 'failure', error: 'timeout' },
        ]}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('event_create');
    expect(output).toContain('ticket_list');
    expect(output).toContain('2/2 done');
  });
});
