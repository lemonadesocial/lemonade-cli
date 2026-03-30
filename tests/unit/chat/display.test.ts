import { describe, it, expect } from 'vitest';
import { stripAnsi } from '../../../src/chat/stream/display';

describe('stripAnsi', () => {
  it('strips basic ANSI escape codes', () => {
    const input = '\u001b[31mRed text\u001b[0m';
    expect(stripAnsi(input)).toBe('Red text');
  });

  it('strips multiple ANSI codes', () => {
    const input = '\u001b[1m\u001b[32mBold green\u001b[0m normal';
    expect(stripAnsi(input)).toBe('Bold green normal');
  });

  it('returns clean string unchanged', () => {
    const input = 'No ANSI here';
    expect(stripAnsi(input)).toBe('No ANSI here');
  });

  it('handles empty string', () => {
    expect(stripAnsi('')).toBe('');
  });

  it('strips cursor movement codes', () => {
    const input = '\u001b[2Amoved up';
    expect(stripAnsi(input)).toBe('moved up');
  });
});
