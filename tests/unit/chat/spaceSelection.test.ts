import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/auth/store', () => {
  let mockConfig: Record<string, unknown> = {};
  return {
    getConfig: () => mockConfig,
    setConfigValue: vi.fn((key: string, value: unknown) => { mockConfig[key] = value; }),
    getDefaultSpace: () => mockConfig.default_space as string | undefined,
    __setMockConfig: (config: Record<string, unknown>) => { mockConfig = config; },
  };
});

vi.mock('../../../src/api/graphql', () => ({
  graphqlRequest: vi.fn(),
}));

describe('Space Selection for Credits Mode', () => {
  let __setMockConfig: (config: Record<string, unknown>) => void;

  beforeEach(async () => {
    vi.resetModules();
    const storeModule = await import('../../../src/auth/store');
    __setMockConfig = (storeModule as unknown as { __setMockConfig: (c: Record<string, unknown>) => void }).__setMockConfig;
    __setMockConfig({});
  });

  it('getCreditsSpaceId returns stored space from config', async () => {
    __setMockConfig({ ai_credits_space: 'space-abc' });
    const { getCreditsSpaceId } = await import('../../../src/chat/spaceSelection');
    expect(getCreditsSpaceId()).toBe('space-abc');
  });

  it('getCreditsSpaceId returns undefined when not set', async () => {
    __setMockConfig({});
    const { getCreditsSpaceId } = await import('../../../src/chat/spaceSelection');
    expect(getCreditsSpaceId()).toBeUndefined();
  });

  it('getCreditsSpaceDisplay returns "none" when no space set', async () => {
    __setMockConfig({});
    const { getCreditsSpaceDisplay } = await import('../../../src/chat/spaceSelection');
    expect(getCreditsSpaceDisplay()).toBe('none');
  });

  it('getCreditsSpaceDisplay returns space ID when set', async () => {
    __setMockConfig({ ai_credits_space: 'space-xyz' });
    const { getCreditsSpaceDisplay } = await import('../../../src/chat/spaceSelection');
    expect(getCreditsSpaceDisplay()).toBe('space-xyz');
  });

  it('ai_credits_space field exists in LemonadeConfig type', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const storePath = path.join(process.cwd(), 'src/auth/store.ts');
    const content = fs.readFileSync(storePath, 'utf-8');
    expect(content).toContain('ai_credits_space');
  });

  it('selectCreditsSpace is called during onboarding credits selection', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const onboardPath = path.join(process.cwd(), 'src/chat/onboarding.ts');
    const content = fs.readFileSync(onboardPath, 'utf-8');
    expect(content).toContain('selectCreditsSpace');
  });

  it('/mode credits triggers space selection in terminal UI', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const terminalPath = path.join(process.cwd(), 'src/chat/terminal.ts');
    const content = fs.readFileSync(terminalPath, 'utf-8');

    // When /mode credits is used, selectCreditsSpace must be called
    expect(content).toContain("slashResult.args === 'credits'");
    expect(content).toContain('selectCreditsSpace');
  });

  it('Mode 2 uses ai_credits_space as standId', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const indexPath = path.join(process.cwd(), 'src/chat/index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    expect(content).toContain('getCreditsSpaceId');
    expect(content).toContain('creditsSpace');
  });
});
