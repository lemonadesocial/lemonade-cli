import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — capture the SubscriptionOptions passed into
// createNotificationSubscription so tests can synthetically drive the
// onSessionRevoked callback and observe listener.ts's reaction (US-6.9).
// ---------------------------------------------------------------------------

type SubscriptionOptions = Parameters<
  typeof import('../../../../src/api/subscriptions.js')['createNotificationSubscription']
>[0];

let lastSubscriptionOptions: SubscriptionOptions | null = null;
const wsDisposeMock = vi.fn();

vi.mock('../../../../src/api/subscriptions.js', () => ({
  createNotificationSubscription: (opts: SubscriptionOptions) => {
    lastSubscriptionOptions = opts;
    return { dispose: wsDisposeMock };
  },
}));

const pollerStopMock = vi.fn();
const startNotificationPollerMock = vi.fn(() => ({ stop: pollerStopMock }));

vi.mock('../../../../src/chat/notifications/poller.js', () => ({
  startNotificationPoller: (...args: unknown[]) =>
    startNotificationPollerMock(...(args as [])),
}));

vi.mock('../../../../src/chat/notifications/formatter.js', () => ({
  formatNotification: (n: { _id: string }) => `formatted:${n._id}`,
}));

// Isolate from the real ~/.lemonade/config.json — listener now hydrates
// its in-memory dedup set from the persisted cache (Phase 5). In unit
// tests we pin this to an in-memory stub so tests cannot be influenced
// by (or pollute) the user's real config.
vi.mock('../../../../src/auth/notification-dedup.js', () => ({
  getLastSeenNotificationIds: () => new Set<string>(),
  appendLastSeenNotificationId: () => {
    /* no-op in unit tests */
  },
}));

import { startNotificationListener } from '../../../../src/chat/notifications/listener.js';

describe('startNotificationListener — onSessionRevoked wiring (A-005, US-6.9)', () => {
  let stderrWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    lastSubscriptionOptions = null;
    startNotificationPollerMock.mockImplementation(() => ({ stop: pollerStopMock }));
    vi.useFakeTimers();
    stderrWriteSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('onSessionRevoked flips onStatusChange to "disconnected-revoked"', () => {
    const onStatusChange = vi.fn();

    startNotificationListener({
      onNotification: vi.fn(),
      onStatusChange,
    });

    expect(lastSubscriptionOptions).not.toBeNull();
    expect(lastSubscriptionOptions!.onSessionRevoked).toBeTypeOf('function');

    // Drive the callback synthetically.
    lastSubscriptionOptions!.onSessionRevoked!();

    expect(onStatusChange).toHaveBeenCalledWith('disconnected-revoked');
  });

  it('onSessionRevoked tears down poller and fallback timer', () => {
    const onStatusChange = vi.fn();

    startNotificationListener({
      onNotification: vi.fn(),
      onStatusChange,
    });

    // Simulate WS disconnect → starts the fallback timer and (after 5s) the poller.
    lastSubscriptionOptions!.onDisconnected!();
    vi.advanceTimersByTime(5000);

    // Poller should now be running.
    expect(startNotificationPollerMock).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith('polling');

    // Fire revocation. Listener must stop the poller we just started.
    lastSubscriptionOptions!.onSessionRevoked!();

    expect(pollerStopMock).toHaveBeenCalledTimes(1);
    // Status is now terminal.
    expect(onStatusChange).toHaveBeenLastCalledWith('disconnected-revoked');
  });

  it('onSessionRevoked clears a pending fallback timer (poller never starts)', () => {
    const onStatusChange = vi.fn();

    startNotificationListener({
      onNotification: vi.fn(),
      onStatusChange,
    });

    // Disconnect schedules a fallback timer but does NOT yet start the poller.
    lastSubscriptionOptions!.onDisconnected!();
    expect(startNotificationPollerMock).not.toHaveBeenCalled();

    // Revocation arrives before the fallback fires.
    lastSubscriptionOptions!.onSessionRevoked!();

    // Advance past the 5s fallback threshold: poller must NOT start because
    // onSessionRevoked cleared the pending timer.
    vi.advanceTimersByTime(10_000);
    expect(startNotificationPollerMock).not.toHaveBeenCalled();
    expect(onStatusChange).toHaveBeenLastCalledWith('disconnected-revoked');
  });

  it('listener.ts does NOT emit the "[lemonade-cli] session revoked code=4401" breadcrumb (US-6.9 negative assertion)', () => {
    startNotificationListener({
      onNotification: vi.fn(),
      onStatusChange: vi.fn(),
    });

    lastSubscriptionOptions!.onSessionRevoked!();

    const calls = stderrWriteSpy.mock.calls.map((c) => String(c[0]));
    const revokedBreadcrumbs = calls.filter((msg) =>
      msg.includes('[lemonade-cli] session revoked code=4401'),
    );
    // The 4401 breadcrumb must be emitted exactly once, by subscriptions.ts —
    // NOT by listener.ts. Since the WS module is mocked here, listener.ts is
    // the only code under test that could write stderr. The breadcrumb count
    // from listener.ts must be zero.
    expect(revokedBreadcrumbs).toHaveLength(0);
  });
});
