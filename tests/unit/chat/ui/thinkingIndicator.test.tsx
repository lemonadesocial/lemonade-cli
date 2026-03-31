import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ThinkingIndicator, THINKING_WORDS } from '../../../../src/chat/ui/ThinkingIndicator';

describe('ThinkingIndicator', () => {
  it('renders one of the thinking words followed by ...', () => {
    const { lastFrame } = render(<ThinkingIndicator />);
    const output = lastFrame()!;
    const hasWord = THINKING_WORDS.some((w) => output.includes(`${w}...`));
    expect(hasWord).toBe(true);
  });

  it('renders without crashing', () => {
    const { lastFrame } = render(<ThinkingIndicator />);
    expect(lastFrame()).toBeTruthy();
  });

  it('THINKING_WORDS contains all required words', () => {
    const required = [
      'squeezing', 'zesting', 'juicing', 'pulping', 'peeling', 'garnishing',
      'philosophizing', 'lemonizing', 'marinating', 'fermenting', 'percolating',
      'simmering', 'brewing', 'concocting', 'stirring',
      'hustling', 'scheming', 'plotting', 'manifesting',
    ];
    for (const word of required) {
      expect(THINKING_WORDS).toContain(word);
    }
  });

  it('has at least 19 words', () => {
    expect(THINKING_WORDS.length).toBeGreaterThanOrEqual(19);
  });
});
