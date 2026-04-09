import { describe, it, expect } from 'vitest';

describe('subscriptions module', () => {
  it('exports LemonadeNotification type and createNotificationSubscription', async () => {
    const mod = await import('../../../src/api/subscriptions.js');
    expect(mod.createNotificationSubscription).toBeTypeOf('function');
  });
});
