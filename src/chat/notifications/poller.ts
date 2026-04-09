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
  const seenIds = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let firstPoll = true;

  async function poll() {
    if (stopped) return;
    try {
      const result = await graphqlRequest<{
        getNotifications: LemonadeNotification[];
      }>(GET_NOTIFICATIONS, { limit: 10, skip: 0 });

      const notifications = result.getNotifications || [];

      // On first poll, seed the seen set without emitting
      if (firstPoll) {
        for (const n of notifications) seenIds.add(n._id);
        firstPoll = false;
      } else {
        // Filter to only new notifications using bounded Set
        const newNotifications = notifications.filter((n) => !seenIds.has(n._id));
        for (const n of notifications) seenIds.add(n._id);

        // Prune if over 200
        if (seenIds.size > 200) {
          const iter = seenIds.values();
          for (let i = 0; i < seenIds.size - 200; i++) {
            seenIds.delete(iter.next().value as string);
          }
        }

        // Emit new notifications oldest-first
        for (const n of newNotifications.reverse()) {
          if (!n.is_seen) {
            onNotification(n);
          }
        }
      }
    } catch (err) {
      process.stderr.write(`[notifications] Poll failed: ${err instanceof Error ? err.message : String(err)}\n`);
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
