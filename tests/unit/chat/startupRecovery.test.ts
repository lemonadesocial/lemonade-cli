import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/auth/store', () => ({
  getDefaultSpace: vi.fn(),
}));

vi.mock('../../../src/chat/aiMode', () => ({
  setAiModeConfig: vi.fn(),
}));

vi.mock('../../../src/chat/onboarding', () => ({
  detectApiKey: vi.fn(),
  detectProvider: vi.fn(() => 'anthropic'),
}));

vi.mock('../../../src/chat/spaceSelection', () => ({
  getCreditsSpaceId: vi.fn(),
  selectCreditsSpace: vi.fn(),
}));

vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => ({ close: vi.fn() })),
  },
}));

describe('resolveCreditsStartupMode', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('uses configured credits space when available', async () => {
    const { getCreditsSpaceId } = await import('../../../src/chat/spaceSelection');
    vi.mocked(getCreditsSpaceId).mockReturnValue('space-123');

    const { resolveCreditsStartupMode } = await import('../../../src/chat/startupRecovery');
    await expect(resolveCreditsStartupMode(true)).resolves.toEqual({
      mode: 'credits',
      spaceId: 'space-123',
    });
  });

  it('prompts for space selection in tty credits mode when none is configured', async () => {
    const { getCreditsSpaceId, selectCreditsSpace } = await import('../../../src/chat/spaceSelection');
    const { getDefaultSpace } = await import('../../../src/auth/store');
    vi.mocked(getCreditsSpaceId).mockReturnValue(undefined);
    vi.mocked(getDefaultSpace).mockReturnValue(undefined);
    vi.mocked(selectCreditsSpace).mockResolvedValue('space-picked');

    const { resolveCreditsStartupMode } = await import('../../../src/chat/startupRecovery');
    await expect(resolveCreditsStartupMode(true)).resolves.toEqual({
      mode: 'credits',
      spaceId: 'space-picked',
    });
  });

  it('falls back to own_key when no credits space is selected but an API key exists', async () => {
    const { getCreditsSpaceId, selectCreditsSpace } = await import('../../../src/chat/spaceSelection');
    const { getDefaultSpace } = await import('../../../src/auth/store');
    const { detectApiKey, detectProvider } = await import('../../../src/chat/onboarding');
    const { setAiModeConfig } = await import('../../../src/chat/aiMode');
    vi.mocked(getCreditsSpaceId).mockReturnValue(undefined);
    vi.mocked(getDefaultSpace).mockReturnValue(undefined);
    vi.mocked(selectCreditsSpace).mockResolvedValue(null);
    vi.mocked(detectProvider).mockReturnValue('anthropic');
    vi.mocked(detectApiKey).mockReturnValue('sk-live');

    const { resolveCreditsStartupMode } = await import('../../../src/chat/startupRecovery');
    const result = await resolveCreditsStartupMode(true);

    expect(result.mode).toBe('own_key');
    expect(result.message).toContain('Starting in BYOK mode');
    expect(setAiModeConfig).toHaveBeenCalledWith('own_key');
  });

  it('returns a blocking message when no space or api key is available (non-interactive)', async () => {
    const { getCreditsSpaceId } = await import('../../../src/chat/spaceSelection');
    const { getDefaultSpace } = await import('../../../src/auth/store');
    const { detectApiKey } = await import('../../../src/chat/onboarding');
    vi.mocked(getCreditsSpaceId).mockReturnValue(undefined);
    vi.mocked(getDefaultSpace).mockReturnValue(undefined);
    vi.mocked(detectApiKey).mockReturnValue(null);

    const { resolveCreditsStartupMode } = await import('../../../src/chat/startupRecovery');
    const result = await resolveCreditsStartupMode(false);

    expect(result.mode).toBe('credits');
    expect(result.failed).toBe(true);
    expect(result.message).toContain('No credits space configured');
  });

  it('uses getDefaultSpace as fallback when no ai_credits_space is configured', async () => {
    const { getCreditsSpaceId } = await import('../../../src/chat/spaceSelection');
    const { getDefaultSpace } = await import('../../../src/auth/store');
    vi.mocked(getCreditsSpaceId).mockReturnValue(undefined);
    vi.mocked(getDefaultSpace).mockReturnValue('default-space-456');

    const { resolveCreditsStartupMode } = await import('../../../src/chat/startupRecovery');
    await expect(resolveCreditsStartupMode(true)).resolves.toEqual({
      mode: 'credits',
      spaceId: 'default-space-456',
    });
  });

  it('returns failed when interactive space selection returns null and no API key exists', async () => {
    const { getCreditsSpaceId, selectCreditsSpace } = await import('../../../src/chat/spaceSelection');
    const { getDefaultSpace } = await import('../../../src/auth/store');
    const { detectApiKey } = await import('../../../src/chat/onboarding');
    vi.mocked(getCreditsSpaceId).mockReturnValue(undefined);
    vi.mocked(getDefaultSpace).mockReturnValue(undefined);
    vi.mocked(selectCreditsSpace).mockResolvedValue(null);
    vi.mocked(detectApiKey).mockReturnValue(null);

    const { resolveCreditsStartupMode } = await import('../../../src/chat/startupRecovery');
    const result = await resolveCreditsStartupMode(true);

    expect(result.mode).toBe('credits');
    expect(result.failed).toBe(true);
    expect(result.message).toContain('No credits space configured');
  });
});
