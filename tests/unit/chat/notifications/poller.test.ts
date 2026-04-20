import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../src/api/graphql.js', () => ({
  graphqlRequest: vi.fn(),
}));

// Isolate from the real ~/.lemonade/config.json — the poller now reads &
// writes the persistent dedup cache via notification-dedup (Phase 5). In
// unit tests we pin this to an in-memory stub so tests cannot pollute (or
// be influenced by) the user's real config.
vi.mock('../../../../src/auth/notification-dedup.js', () => ({
  getLastSeenNotificationIds: () => new Set<string>(),
  appendLastSeenNotificationId: () => {
    /* no-op in unit tests */
  },
}));

import { startNotificationPoller } from '../../../../src/chat/notifications/poller.js';
import { graphqlRequest } from '../../../../src/api/graphql.js';

const mockGraphql = vi.mocked(graphqlRequest);

describe('startNotificationPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGraphql.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls graphqlRequest on initial poll', async () => {
    mockGraphql.mockResolvedValue({ getNotifications: [] });
    const onNotification = vi.fn();

    const { stop } = startNotificationPoller(onNotification, 5000);

    // Wait for the initial async poll to resolve
    await vi.advanceTimersByTimeAsync(1);

    expect(mockGraphql).toHaveBeenCalledTimes(1);
    stop();
  });

  it('filters already-seen notifications', async () => {
    const notifications = [
      { _id: 'b', created_at: '2025-01-15T10:31:00Z', type: 'test', is_seen: false },
      { _id: 'a', created_at: '2025-01-15T10:30:00Z', type: 'test', is_seen: false },
    ];

    mockGraphql.mockResolvedValueOnce({ getNotifications: notifications });
    const onNotification = vi.fn();

    const { stop } = startNotificationPoller(onNotification, 5000);
    await vi.advanceTimersByTimeAsync(1);

    expect(onNotification).not.toHaveBeenCalled();

    mockGraphql.mockResolvedValueOnce({
      getNotifications: [
        { _id: 'c', created_at: '2025-01-15T10:32:00Z', type: 'new', is_seen: false },
        ...notifications,
      ],
    });

    await vi.advanceTimersByTimeAsync(5000);

    expect(onNotification).toHaveBeenCalledTimes(1);
    expect(onNotification).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'c' }),
    );

    stop();
  });

  it('cleans up timer on stop', async () => {
    mockGraphql.mockResolvedValue({ getNotifications: [] });
    const onNotification = vi.fn();

    const { stop } = startNotificationPoller(onNotification, 5000);
    await vi.advanceTimersByTimeAsync(1);

    expect(mockGraphql).toHaveBeenCalledTimes(1);
    stop();

    mockGraphql.mockClear();
    await vi.advanceTimersByTimeAsync(10000);

    expect(mockGraphql).not.toHaveBeenCalled();
  });

  it('skips seen notifications', async () => {
    const notifications = [
      { _id: 'a', created_at: '2025-01-15T10:30:00Z', type: 'test', is_seen: false },
    ];
    mockGraphql.mockResolvedValueOnce({ getNotifications: notifications });
    const onNotification = vi.fn();

    const { stop } = startNotificationPoller(onNotification, 5000);
    await vi.advanceTimersByTimeAsync(1);

    mockGraphql.mockResolvedValueOnce({
      getNotifications: [
        { _id: 'b', created_at: '2025-01-15T10:31:00Z', type: 'test', is_seen: true },
        ...notifications,
      ],
    });
    await vi.advanceTimersByTimeAsync(5000);

    expect(onNotification).not.toHaveBeenCalled();
    stop();
  });
});
