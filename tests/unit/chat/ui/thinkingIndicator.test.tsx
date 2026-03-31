import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ThinkingIndicator } from '../../../../src/chat/ui/ThinkingIndicator';

describe('ThinkingIndicator', () => {
  it('renders "Thinking..." text', () => {
    const { lastFrame } = render(<ThinkingIndicator />);
    expect(lastFrame()!).toContain('Thinking...');
  });

  it('renders without crashing', () => {
    const { lastFrame } = render(<ThinkingIndicator />);
    expect(lastFrame()).toBeTruthy();
  });
});
