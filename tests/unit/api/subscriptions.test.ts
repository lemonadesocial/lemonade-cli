import { describe, it, expect, vi } from 'vitest';

vi.mock('graphql-ws', () => ({
  createClient: () => ({
    subscribe: () => () => {},
    dispose: () => {},
  }),
}));

vi.mock('ws', () => ({ default: class {} }));

vi.mock('../../../src/auth/store.js', () => ({
  getApiUrl: () => 'http://localhost:4000',
  ensureAuthHeader: async () => 'Bearer test-token',
}));

describe('subscriptions module', () => {
  it('exports LemonadeNotification type and createNotificationSubscription', async () => {
    const mod = await import('../../../src/api/subscriptions.js');
    expect(mod.createNotificationSubscription).toBeTypeOf('function');
  });

  it('dispose() can be called immediately without error', async () => {
    const mod = await import('../../../src/api/subscriptions.js');
    const sub = mod.createNotificationSubscription({
      onNotification: () => {},
    });
    expect(() => sub.dispose()).not.toThrow();
  });

  it('LemonadeNotification type is properly exported', async () => {
    const mod = await import('../../../src/api/subscriptions.js');
    // Verify the module exports the expected interface by checking the subscription factory
    const sub = mod.createNotificationSubscription({
      onNotification: (_n: import('../../../src/api/subscriptions.js').LemonadeNotification) => {},
      onError: (_e: Error) => {},
      onConnected: () => {},
      onDisconnected: () => {},
    });
    sub.dispose();
  });
});
