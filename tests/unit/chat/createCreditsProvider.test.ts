import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock graphqlRequest — controls what createCreditsProvider sees for balance / models
const mockGraphql = vi.fn();
vi.mock('../../../src/api/graphql', () => ({
  graphqlRequest: (...args: unknown[]) => mockGraphql(...args),
}));

import { createCreditsProvider } from '../../../src/chat/creditsProvider';

describe('createCreditsProvider', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as never);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits when credits response is null (no credits data)', async () => {
    mockGraphql.mockResolvedValueOnce({ getStandCredits: null });

    await expect(createCreditsProvider('space-1')).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('free plan with no AI credits'),
    );
  });

  it('exits when free tier with 0 credits', async () => {
    mockGraphql.mockResolvedValueOnce({
      getStandCredits: { credits: 0, subscription_tier: 'free', subscription_renewal_date: null },
    });

    await expect(createCreditsProvider('space-1')).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it('warns but continues when paid tier with 0 credits', async () => {
    mockGraphql
      // getStandCredits
      .mockResolvedValueOnce({
        getStandCredits: { credits: 0, subscription_tier: 'pro', subscription_renewal_date: '2026-05-01' },
      })
      // getAvailableModels
      .mockResolvedValueOnce({
        getAvailableModels: [{ name: 'gpt-4o', is_default: true }],
      });

    const provider = await createCreditsProvider('space-1');

    expect(exitSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('0 credits remaining'),
    );
    expect(provider.name).toBe('lemonade-ai');
    expect(provider.model).toBe('gpt-4o');
  });

  it('falls back to "Lemonade AI" model name when getAvailableModels fails', async () => {
    mockGraphql
      // getStandCredits — healthy
      .mockResolvedValueOnce({
        getStandCredits: { credits: 100, subscription_tier: 'pro' },
      })
      // getAvailableModels — network error
      .mockRejectedValueOnce(new Error('network'));

    const provider = await createCreditsProvider('space-1');

    expect(provider.model).toBe('Lemonade AI');
    expect(provider.name).toBe('lemonade-ai');
  });

  it('uses default model from backend when available', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        getStandCredits: { credits: 50, subscription_tier: 'pro' },
      })
      .mockResolvedValueOnce({
        getAvailableModels: [
          { name: 'claude-sonnet', is_default: false },
          { name: 'gpt-4o-mini', is_default: true },
        ],
      });

    const provider = await createCreditsProvider('space-1');

    expect(provider.model).toBe('gpt-4o-mini');
  });

  it('continues with fallback model name when balance check throws', async () => {
    mockGraphql
      // getStandCredits throws
      .mockRejectedValueOnce(new Error('timeout'))
      // getAvailableModels also throws
      .mockRejectedValueOnce(new Error('timeout'));

    const provider = await createCreditsProvider('space-1');

    expect(exitSpy).not.toHaveBeenCalled();
    expect(provider.model).toBe('Lemonade AI');
    expect(provider.name).toBe('lemonade-ai');
  });

  describe('liveSwitch mode', () => {
    it('throws on network failure during balance check', async () => {
      mockGraphql.mockRejectedValueOnce(new Error('network timeout'));

      await expect(
        createCreditsProvider('space-1', { liveSwitch: true }),
      ).rejects.toThrow('Could not verify credits eligibility');
    });

    it('throws when free tier has no credits', async () => {
      mockGraphql.mockResolvedValueOnce({
        getStandCredits: { credits: 0, subscription_tier: 'free' },
      });

      await expect(
        createCreditsProvider('space-1', { liveSwitch: true }),
      ).rejects.toThrow('free plan with no AI credits');
    });

    it('warns but succeeds when paid tier has 0 credits remaining', async () => {
      mockGraphql
        .mockResolvedValueOnce({
          getStandCredits: { credits: 0, subscription_tier: 'pro', subscription_renewal_date: '2026-05-01' },
        })
        .mockResolvedValueOnce({
          getAvailableModels: [{ name: 'gpt-4o', is_default: true }],
        });

      const provider = await createCreditsProvider('space-1', { liveSwitch: true });

      expect(exitSpy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('0 credits remaining'),
      );
      expect(provider.name).toBe('lemonade-ai');
    });

    it('succeeds when credits are available', async () => {
      mockGraphql
        .mockResolvedValueOnce({
          getStandCredits: { credits: 100, subscription_tier: 'pro' },
        })
        .mockResolvedValueOnce({
          getAvailableModels: [{ name: 'gpt-4o', is_default: true }],
        });

      const provider = await createCreditsProvider('space-1', { liveSwitch: true });
      expect(provider.name).toBe('lemonade-ai');
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
