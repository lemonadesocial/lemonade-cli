import { describe, it, expect } from 'vitest';
import { theme, colors } from '../../../../src/chat/ui/theme';

// US-T.1: Theme colors render correctly
describe('theme', () => {
  it('exposes all brand colors', () => {
    expect(theme.lemon).toBeDefined();
    expect(theme.lemonDark).toBeDefined();
    expect(theme.violet).toBeDefined();
    expect(theme.violetLight).toBeDefined();
    expect(theme.pink).toBeDefined();
    expect(theme.pinkBold).toBeDefined();
  });

  it('exposes semantic colors', () => {
    expect(theme.success).toBeDefined();
    expect(theme.error).toBeDefined();
    expect(theme.warning).toBeDefined();
  });

  it('exposes text colors', () => {
    expect(theme.primary).toBeDefined();
    expect(theme.secondary).toBeDefined();
    expect(theme.tertiary).toBeDefined();
    expect(theme.muted).toBeDefined();
  });

  it('brand color functions produce non-empty strings', () => {
    expect(theme.lemon('test')).toContain('test');
    expect(theme.violet('test')).toContain('test');
    expect(theme.success('ok')).toContain('ok');
    expect(theme.error('fail')).toContain('fail');
  });

  it('exports raw hex color values', () => {
    expect(colors.lemon).toBe('#FDE047');
    expect(colors.violet).toBe('#8B5CF6');
    expect(colors.violetLight).toBe('#C4B5FD');
    expect(colors.success).toBe('#10B981');
    expect(colors.error).toBe('#FF637E');
  });
});
