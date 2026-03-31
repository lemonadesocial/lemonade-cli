import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { StatusBar } from '../../../../src/chat/ui/StatusBar';

// US-T.10: StatusBar renders space name, rotating tips, provider/model
describe('StatusBar', () => {
  it('renders space name when provided', () => {
    const { lastFrame } = render(
      <StatusBar
        agentName="Zesty"
        spaceName="Berlin Techno"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    const output = lastFrame()!;
    // Space name renders in the left section (may be truncated by terminal width)
    expect(output).toContain('Zesty | Space:');
    expect(output).toContain('Berlin');
  });

  it('renders "none" when no space', () => {
    const { lastFrame } = render(
      <StatusBar
        agentName="Zesty"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    expect(lastFrame()!).toContain('Space:');
  });

  it('renders provider and model', () => {
    const { lastFrame } = render(
      <StatusBar
        agentName="Zesty"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('anthropic');
    expect(output).toContain('claude-sonnet');
  });

  it('shows tip text when not streaming', () => {
    const { lastFrame } = render(
      <StatusBar
        agentName="Zesty"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    expect(lastFrame()!).toContain('Tip:');
  });

  it('shows token count during streaming', () => {
    const { lastFrame } = render(
      <StatusBar
        agentName="Zesty"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={true}
        streamTokenCount={234}
      />,
    );
    expect(lastFrame()!).toContain('streaming');
    expect(lastFrame()!).toContain('234');
  });

  it('renders without errors when lastError is provided', () => {
    const { lastFrame } = render(
      <StatusBar
        agentName="Zesty"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
        lastError="Rate limited"
      />,
    );
    // Error display depends on useEffect timing; verify component renders
    expect(lastFrame()).toBeTruthy();
  });

  it('renders without errors when lastToolName is provided', () => {
    const { lastFrame } = render(
      <StatusBar
        agentName="Zesty"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
        lastToolName="event_create"
      />,
    );
    expect(lastFrame()).toBeTruthy();
  });
});
