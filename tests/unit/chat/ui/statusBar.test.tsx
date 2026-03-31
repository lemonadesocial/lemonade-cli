import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { StatusBar } from '../../../../src/chat/ui/StatusBar';

describe('StatusBar', () => {
  it('renders space name when provided', () => {
    const { lastFrame } = render(
      <StatusBar
        spaceName="Berlin Techno"
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Space:');
    expect(output).toContain('Berlin');
  });

  it('renders "none" when no space', () => {
    const { lastFrame } = render(
      <StatusBar
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    expect(lastFrame()!).toContain('Space:');
    expect(lastFrame()!).toContain('none');
  });

  it('hides provider/model when showing tips', () => {
    const { lastFrame } = render(
      <StatusBar
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Tip:');
    expect(output).not.toContain('anthropic');
  });

  it('shows provider/model during streaming', () => {
    const { lastFrame } = render(
      <StatusBar
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={true}
        streamTokenCount={234}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('streaming');
    expect(output).toContain('234');
    expect(output).toContain('anthropic');
  });

  it('shows tip text when not streaming', () => {
    const { lastFrame } = render(
      <StatusBar
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
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
        lastError="Rate limited"
      />,
    );
    expect(lastFrame()).toBeTruthy();
  });

  it('renders without errors when lastToolName is provided', () => {
    const { lastFrame } = render(
      <StatusBar
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
        lastToolName="event_create"
      />,
    );
    expect(lastFrame()).toBeTruthy();
  });

  it('uses a dimmed line separator instead of border box', () => {
    const { lastFrame } = render(
      <StatusBar
        providerName="anthropic"
        modelName="claude-sonnet-4-6"
        isStreaming={false}
        streamTokenCount={0}
      />,
    );
    // Should not contain box-drawing border characters
    const output = lastFrame()!;
    expect(output).not.toContain('┌');
    expect(output).not.toContain('└');
  });
});
