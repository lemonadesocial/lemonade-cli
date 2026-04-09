import type { LemonadeNotification } from '../../api/subscriptions.js';

export function formatNotification(notification: LemonadeNotification): string {
  const time = new Date(notification.created_at).toLocaleTimeString();
  const type = notification.type.replace(/_/g, ' ');

  let text = `[${time}] ${type}`;
  if (notification.title) text += `: ${notification.title}`;
  if (notification.message) text += ` — ${notification.message}`;

  return text;
}

export function formatNotificationForMCP(
  notification: LemonadeNotification,
): string {
  return JSON.stringify({
    type: notification.type,
    title: notification.title,
    message: notification.message,
    event: notification.ref_event,
    space: notification.ref_space,
    time: notification.created_at,
  });
}
