import { graphqlRequest } from '../../api/graphql.js';
import type { LemonadeNotification } from '../../api/subscriptions.js';

const GET_NOTIFICATIONS = `
  query GetNotifications($limit: Int, $skip: Int) {
    getNotifications(limit: $limit, skip: $skip) {
      _id
      created_at
      type
      title
      message
      image_url
      from
      ref_event
      ref_space
      ref_user
      is_seen
    }
  }
`;

export function startNotificationPoller(
  onNotification: (notification: LemonadeNotification) => void,
  intervalMs: number = 60_000,
): { stop: () => void } {
  let lastSeenId: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  async function poll() {
    if (stopped) return;
    try {
      const result = await graphqlRequest<{
        getNotifications: LemonadeNotification[];
      }>(GET_NOTIFICATIONS, { limit: 10, skip: 0 });

      const notifications = result.getNotifications || [];

      // Filter to only new notifications (assumes newest first from API)
      const newNotifications = lastSeenId
        ? notifications.filter((n) => n._id > lastSeenId!)
        : [];

      if (notifications.length > 0) {
        lastSeenId = notifications[0]._id;
      }

      // Emit new notifications oldest-first
      for (const n of newNotifications.reverse()) {
        if (!n.is_seen) {
          onNotification(n);
        }
      }
    } catch {
      // Silently skip poll failures
    }

    if (!stopped) {
      timer = setTimeout(poll, intervalMs);
    }
  }

  // Initial poll
  poll();

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
