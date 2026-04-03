import { describe, it, expect } from 'vitest';
import {
  SPINNER_FRAMES,
  TIPS,
  randomTip,
  randomThinkingWord,
} from '../../../../src/chat/ui/MessageComponents.js';

describe('MessageComponents helpers', () => {
  it('SPINNER_FRAMES has 10 frames', () => {
    expect(SPINNER_FRAMES).toHaveLength(10);
  });

  it('TIPS is non-empty', () => {
    expect(TIPS.length).toBeGreaterThan(0);
  });

  it('randomTip returns a string from TIPS', () => {
    const tip = randomTip();
    expect(TIPS).toContain(tip);
  });

  it('randomThinkingWord returns a string', () => {
    const word = randomThinkingWord();
    expect(typeof word).toBe('string');
    expect(word.length).toBeGreaterThan(0);
  });
});
