import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { WelcomeBanner, SUGGESTED_PROMPTS } from '../../../../src/chat/ui/WelcomeBanner';

// US-T.3: WelcomeBanner renders logo, greeting, tips, suggested prompts
describe('WelcomeBanner', () => {
  it('renders the ASCII logo', () => {
    const { lastFrame } = render(
      <WelcomeBanner providerName="anthropic" modelName="claude-sonnet-4-6" firstName="Alice" agentName="Zesty" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('⣿');
    expect(output).toContain('⣀');
  });

  it('renders version and provider info', () => {
    const { lastFrame } = render(
      <WelcomeBanner providerName="anthropic" modelName="claude-sonnet-4-6" firstName="Alice" agentName="Zesty" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('make-lemonade');
    expect(output).toContain('anthropic');
    expect(output).toContain('claude-sonnet-4-6');
  });

  it('renders personalized greeting', () => {
    const { lastFrame } = render(
      <WelcomeBanner providerName="anthropic" modelName="claude-sonnet-4-6" firstName="Bob" agentName="Zesty" />,
    );
    expect(lastFrame()!).toContain('Hey Bob!');
  });

  it('renders suggested prompts', () => {
    const { lastFrame } = render(
      <WelcomeBanner providerName="anthropic" modelName="claude-sonnet-4-6" firstName="Alice" agentName="Zesty" />,
    );
    const output = lastFrame()!;
    for (const prompt of SUGGESTED_PROMPTS) {
      expect(output).toContain(prompt);
    }
  });

  it('renders hint text', () => {
    const { lastFrame } = render(
      <WelcomeBanner providerName="anthropic" modelName="claude-sonnet-4-6" firstName="Alice" agentName="Zesty" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('/help');
    expect(output).toContain('Ctrl+D');
  });

  it('renders tool data disclosure notice', () => {
    const { lastFrame } = render(
      <WelcomeBanner providerName="anthropic" modelName="claude-sonnet-4-6" firstName="Alice" agentName="Zesty" />,
    );
    expect(lastFrame()!).toContain('Tool results (including event and guest data)');
  });
});
