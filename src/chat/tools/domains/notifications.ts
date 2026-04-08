import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const notificationsTools: CanonicalCapability[] = [
  buildCapability({
    name: 'notifications_list',
    category: 'notifications',
    displayName: 'notifications list',
    description: 'Get recent notifications.',
    params: [],
    whenToUse: 'to fetch recent alerts, messages, and activity notifications',
    searchHint: 'notifications alerts messages inbox updates',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiGetNotifications',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async () => {
      const result = await graphqlRequest<{ aiGetNotifications: Array<{ id: string; type: string; message: string; from_user_name?: string; ref_event_title?: string; read: boolean; created_at: string }> }>(
        'query { aiGetNotifications { id type message from_user_name ref_event_title read created_at } }',
      );
      return { items: result.aiGetNotifications };
    },
  }),
  buildCapability({
    name: 'notifications_read',
    category: 'notifications',
    displayName: 'notifications read',
    description: 'Mark notifications as read.',
    params: [
      { name: 'notification_ids', type: 'string[]', description: 'Notification IDs to mark as read', required: true },
    ],
    whenToUse: 'when user wants to mark notifications as read',
    searchHint: 'mark read notifications dismiss clear',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'readNotifications',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const ids = args.notification_ids as string[];
      await graphqlRequest<{ readNotifications: boolean }>(
        'mutation($ids: [MongoID!]) { readNotifications(_id: $ids) }',
        { ids },
      );
      return { read: true, count: ids.length };
    },
  }),
];
