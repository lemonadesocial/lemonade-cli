import { ToolDef } from '../../providers/interface.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const notificationsTools: ToolDef[] = [
  {
    name: 'notifications_list',
    category: 'notifications',
    displayName: 'notifications list',
    description: 'Get recent notifications.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetNotifications: Array<{ id: string; type: string; message: string; from_user_name?: string; ref_event_title?: string; read: boolean; created_at: string }> }>(
        'query { aiGetNotifications { id type message from_user_name ref_event_title read created_at } }',
      );
      return { items: result.aiGetNotifications };
    },
  },
  {
    name: 'notifications_read',
    category: 'notifications',
    displayName: 'notifications read',
    description: 'Mark notifications as read.',
    params: [
      { name: 'notification_ids', type: 'string[]', description: 'Notification IDs to mark as read', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const ids = args.notification_ids as string[];
      for (const id of ids) {
        await graphqlRequest<{ aiReadNotifications: boolean }>(
          'mutation($id: MongoID) { aiReadNotifications(id: $id) }',
          { id },
        );
      }
      return { read: true, count: ids.length };
    },
  },
];
