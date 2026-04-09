import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const NOTIFICATION_CATEGORIES = ['event', 'social', 'messaging', 'payment', 'space', 'store', 'system'] as const;
export const NOTIFICATION_FILTER_MODES = ['mute', 'hide', 'only'] as const;
export const NOTIFICATION_REF_TYPES = ['Event', 'Space', 'User', 'StoreOrder'] as const;

/**
 * NOTIFICATION_TYPES mirrors the backend `NotificationType` enum in
 * lemonade-backend/src/app/models/notification.ts. Keep in sync if the
 * backend enum changes — this drives the schema-level enum constraint
 * exposed to the LLM for `notification_type` params.
 */
export const NOTIFICATION_TYPES = [
  // event
  'event_announce',
  'event_invite',
  'event_approve',
  'event_cohost_added',
  'event_request_created',
  'event_invite_attending',
  'event_declined',
  'event_cancellation',
  'event_chat_announce',
  'event_donation',
  'event_attestation_sync_completed',
  'event_invite_verify_accept_request',
  'event_invite_verify_request',
  'event_request_approved',
  'event_request_declined',
  'event_unlock_verify_accept_request',
  'event_unlock_verify_request',
  'event_update',
  'event_reminder',
  // social
  'user_discovery_match',
  'user_friendship_request',
  'user_friendship_request_accept',
  'user_contact_signup',
  'user_follow',
  // messaging
  'chat_message',
  'xmtp_message',
  // payment
  'payment_authorized',
  'payment_failed',
  'payment_refunded',
  'payment_succeeded',
  'payments_captured_summary',
  'payments_wired_summary',
  'ticket_assigned',
  'ticket_cancelled',
  // space
  'space_verification_approved',
  'space_verification_rejected',
  'space_member_added',
  'space_event_pin_request',
  'space_event_submission_approved',
  'space_admin_added',
  // store
  'store_order_accepted',
  'store_order_awaiting_pickup',
  'store_order_cancelled',
  'store_order_declined',
  'store_order_delivered',
  'store_order_delivery_confirmed',
  'store_order_in_transit',
  'store_order_pending',
  'store_order_preparing',
  // system
  'stripe_connected',
  'email_send_failed',
  'admin_payment_verification',
  'safe_vault_init_failed',
  'safe_vault_init_success',
] as const;

interface NotificationFilterRecord {
  _id: string;
  mode: string;
  notification_type?: string | null;
  notification_category?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  space_scoped?: string | null;
}

interface NotificationChannelPreferenceRecord {
  _id: string;
  enabled_channels: string[];
  notification_type?: string | null;
  notification_category?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  space_scoped?: string | null;
}

function describeScope(r: { notification_type?: string | null; notification_category?: string | null; ref_type?: string | null; ref_id?: string | null; space_scoped?: string | null }): string {
  const parts: string[] = [];
  if (r.notification_category) parts.push(`category=${r.notification_category}`);
  if (r.notification_type) parts.push(`type=${r.notification_type}`);
  if (r.ref_type) parts.push(`ref=${r.ref_type}${r.ref_id ? `:${r.ref_id}` : ''}`);
  if (r.space_scoped) parts.push(`space=${r.space_scoped}`);
  return parts.length ? parts.join(' ') : 'global';
}

export const notificationsTools: CanonicalCapability[] = [
  buildCapability({
    name: 'notifications_list',
    category: 'notifications',
    displayName: 'notifications list',
    description: 'Get recent notifications, optionally filtered by category.',
    params: [
      { name: 'category', type: 'string', description: 'Filter by category: event, social, messaging, payment, space, store, or system', required: false, enum: [...NOTIFICATION_CATEGORIES] },
      { name: 'limit', type: 'number', description: 'Max results (default 25, cap 1000)', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset (default 0)', required: false },
    ],
    whenToUse: 'to fetch recent alerts, messages, and activity notifications (optionally filtered by category)',
    searchHint: 'notifications alerts messages inbox updates category filter',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getNotifications',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const limit = Math.min((args.limit as number) ?? 25, 1000);
      const variables: Record<string, unknown> = {
        skip: (args.skip as number) ?? 0,
        limit,
      };
      if (args.category !== undefined && args.category !== null && args.category !== '') {
        variables.category = args.category;
      }
      const result = await graphqlRequest<{
        getNotifications: Array<{
          _id: string;
          type: string;
          title?: string | null;
          message?: string | null;
          created_at: string;
          is_seen?: boolean | null;
          from_expanded?: { _id: string; name?: string | null } | null;
          ref_event_expanded?: { _id: string; title?: string | null } | null;
          ref_space_expanded?: { _id: string; title?: string | null } | null;
        }>;
      }>(
        `query GetNotifications($skip: Int, $limit: Int, $category: NotificationCategory) {
          getNotifications(skip: $skip, limit: $limit, category: $category) {
            _id type title message created_at is_seen
            from_expanded { _id name }
            ref_event_expanded { _id title }
            ref_space_expanded { _id title }
          }
        }`,
        variables,
      );
      return {
        items: result.getNotifications.map((n) => ({
          _id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          created_at: n.created_at,
          is_seen: n.is_seen,
          from_user_name: n.from_expanded?.name ?? undefined,
          ref_event_title: n.ref_event_expanded?.title ?? undefined,
          ref_space_title: n.ref_space_expanded?.title ?? undefined,
        })),
      };
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

  // ── notification_filters_list ───────────────────────────────────────
  buildCapability({
    name: 'notification_filters_list',
    category: 'notifications',
    displayName: 'notification filters list',
    description: 'List all notification filters for the current user (mute/hide/only rules).',
    params: [],
    whenToUse: 'when user wants to review their notification filter rules (mute/hide/only)',
    searchHint: 'notification filter rules mute hide only list view',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getNotificationFilters',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async () => {
      const result = await graphqlRequest<{ getNotificationFilters: NotificationFilterRecord[] }>(
        `query GetNotificationFilters {
          getNotificationFilters {
            _id mode notification_type notification_category ref_type ref_id space_scoped
          }
        }`,
      );
      return { items: result.getNotificationFilters };
    },
    formatResult: (result) => {
      const r = result as { items?: NotificationFilterRecord[] };
      const items = r?.items;
      if (!Array.isArray(items) || items.length === 0) return 'No notification filters set.';
      const lines = items.map((f) => `- [${f._id}] ${f.mode.toUpperCase()} ${describeScope(f)}`);
      return `${items.length} filter(s):\n${lines.join('\n')}`;
    },
  }),

  // ── notification_filters_set ────────────────────────────────────────
  buildCapability({
    name: 'notification_filters_set',
    category: 'notifications',
    displayName: 'notification filters set',
    description: 'Create or update a notification filter (mute/hide/only rule). Provide filter_id to update an existing filter.',
    params: [
      { name: 'filter_id', type: 'string', description: 'Filter ID (omit to create a new filter)', required: false },
      { name: 'mode', type: 'string', description: 'Filter mode: mute (no delivery), hide (no badge), or only (whitelist)', required: true, enum: [...NOTIFICATION_FILTER_MODES] },
      { name: 'notification_type', type: 'string', description: 'Specific notification type to target (optional)', required: false, enum: [...NOTIFICATION_TYPES] },
      { name: 'notification_category', type: 'string', description: 'Notification category to target (optional)', required: false, enum: [...NOTIFICATION_CATEGORIES] },
      { name: 'ref_type', type: 'string', description: 'Scope filter to a reference type', required: false, enum: [...NOTIFICATION_REF_TYPES] },
      { name: 'ref_id', type: 'string', description: 'Specific reference ID (requires ref_type)', required: false },
      { name: 'space_scoped', type: 'string', description: 'Limit filter to a specific space ID', required: false },
    ],
    whenToUse: 'when user wants to mute, hide, or whitelist (only) specific notifications',
    searchHint: 'notification filter create update mute hide only rule set',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'setNotificationFilter',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const input: Record<string, unknown> = { mode: args.mode };
      if (args.filter_id !== undefined && args.filter_id !== null && args.filter_id !== '') {
        input._id = args.filter_id;
      }
      if (args.notification_type !== undefined && args.notification_type !== null && args.notification_type !== '') {
        input.notification_type = args.notification_type;
      }
      if (args.notification_category !== undefined && args.notification_category !== null && args.notification_category !== '') {
        input.notification_category = args.notification_category;
      }
      if (args.ref_type !== undefined && args.ref_type !== null && args.ref_type !== '') {
        input.ref_type = args.ref_type;
      }
      if (args.ref_id !== undefined && args.ref_id !== null && args.ref_id !== '') {
        input.ref_id = args.ref_id;
      }
      if (args.space_scoped !== undefined && args.space_scoped !== null && args.space_scoped !== '') {
        input.space_scoped = args.space_scoped;
      }
      const result = await graphqlRequest<{ setNotificationFilter: NotificationFilterRecord }>(
        `mutation($input: NotificationFilterInput!) {
          setNotificationFilter(input: $input) {
            _id mode notification_type notification_category ref_type ref_id space_scoped
          }
        }`,
        { input },
      );
      return result.setNotificationFilter;
    },
    formatResult: (result) => {
      const f = result as NotificationFilterRecord;
      return `Filter ${f._id} set: ${f.mode.toUpperCase()} ${describeScope(f)}`;
    },
  }),

  // ── notification_filters_delete ─────────────────────────────────────
  buildCapability({
    name: 'notification_filters_delete',
    category: 'notifications',
    displayName: 'notification filters delete',
    description: 'Delete a notification filter by ID.',
    params: [
      { name: 'filter_id', type: 'string', description: 'Filter ID to delete', required: true },
    ],
    whenToUse: 'when user wants to remove a notification filter rule',
    searchHint: 'notification filter delete remove rule',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteNotificationFilter',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteNotificationFilter: boolean }>(
        `mutation($filterId: MongoID!) {
          deleteNotificationFilter(filterId: $filterId)
        }`,
        { filterId: args.filter_id },
      );
      return { deleted: result.deleteNotificationFilter };
    },
    formatResult: (result) => {
      const r = result as { deleted?: boolean };
      return r?.deleted ? 'Filter deleted.' : 'Filter not found.';
    },
  }),

  // ── notification_channel_preferences_list ───────────────────────────
  buildCapability({
    name: 'notification_channel_preferences_list',
    category: 'notifications',
    displayName: 'notification channel preferences list',
    description: 'List all notification channel preferences (which channels deliver which notifications).',
    params: [],
    whenToUse: 'when user wants to review their notification delivery channel preferences',
    searchHint: 'notification channel preference delivery push list view',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getNotificationChannelPreferences',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async () => {
      const result = await graphqlRequest<{ getNotificationChannelPreferences: NotificationChannelPreferenceRecord[] }>(
        `query GetNotificationChannelPreferences {
          getNotificationChannelPreferences {
            _id enabled_channels notification_type notification_category ref_type ref_id space_scoped
          }
        }`,
      );
      return { items: result.getNotificationChannelPreferences };
    },
    formatResult: (result) => {
      const r = result as { items?: NotificationChannelPreferenceRecord[] };
      const items = r?.items;
      if (!Array.isArray(items) || items.length === 0) return 'No notification channel preferences set.';
      const lines = items.map((p) => `- [${p._id}] channels=[${(p.enabled_channels || []).join(',')}] ${describeScope(p)}`);
      return `${items.length} preference(s):\n${lines.join('\n')}`;
    },
  }),

  // ── notification_channel_preferences_set ────────────────────────────
  buildCapability({
    name: 'notification_channel_preferences_set',
    category: 'notifications',
    displayName: 'notification channel preferences set',
    description: 'Create or update a notification channel preference. Provide preference_id to update an existing preference.',
    params: [
      { name: 'preference_id', type: 'string', description: 'Preference ID (omit to create a new preference)', required: false },
      { name: 'enabled_channels', type: 'string[]', description: 'Enabled delivery channels (currently only "push" is supported)', required: true },
      { name: 'notification_type', type: 'string', description: 'Specific notification type to target (optional)', required: false, enum: [...NOTIFICATION_TYPES] },
      { name: 'notification_category', type: 'string', description: 'Notification category to target (optional)', required: false, enum: [...NOTIFICATION_CATEGORIES] },
      { name: 'ref_type', type: 'string', description: 'Scope preference to a reference type', required: false, enum: [...NOTIFICATION_REF_TYPES] },
      { name: 'ref_id', type: 'string', description: 'Specific reference ID (requires ref_type)', required: false },
      { name: 'space_scoped', type: 'string', description: 'Limit preference to a specific space ID', required: false },
    ],
    whenToUse: 'when user wants to enable/disable delivery channels for specific notifications',
    searchHint: 'notification channel preference delivery push enable set update',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'setNotificationChannelPreference',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const input: Record<string, unknown> = { enabled_channels: args.enabled_channels };
      if (args.preference_id !== undefined && args.preference_id !== null && args.preference_id !== '') {
        input._id = args.preference_id;
      }
      if (args.notification_type !== undefined && args.notification_type !== null && args.notification_type !== '') {
        input.notification_type = args.notification_type;
      }
      if (args.notification_category !== undefined && args.notification_category !== null && args.notification_category !== '') {
        input.notification_category = args.notification_category;
      }
      if (args.ref_type !== undefined && args.ref_type !== null && args.ref_type !== '') {
        input.ref_type = args.ref_type;
      }
      if (args.ref_id !== undefined && args.ref_id !== null && args.ref_id !== '') {
        input.ref_id = args.ref_id;
      }
      if (args.space_scoped !== undefined && args.space_scoped !== null && args.space_scoped !== '') {
        input.space_scoped = args.space_scoped;
      }
      const result = await graphqlRequest<{ setNotificationChannelPreference: NotificationChannelPreferenceRecord }>(
        `mutation($input: NotificationChannelPreferenceInput!) {
          setNotificationChannelPreference(input: $input) {
            _id enabled_channels notification_type notification_category ref_type ref_id space_scoped
          }
        }`,
        { input },
      );
      return result.setNotificationChannelPreference;
    },
    formatResult: (result) => {
      const p = result as NotificationChannelPreferenceRecord;
      return `Preference ${p._id} set: channels=[${(p.enabled_channels || []).join(',')}] ${describeScope(p)}`;
    },
  }),

  // ── notification_channel_preferences_delete ─────────────────────────
  buildCapability({
    name: 'notification_channel_preferences_delete',
    category: 'notifications',
    displayName: 'notification channel preferences delete',
    description: 'Delete a notification channel preference by ID.',
    params: [
      { name: 'preference_id', type: 'string', description: 'Preference ID to delete', required: true },
    ],
    whenToUse: 'when user wants to remove a notification channel preference',
    searchHint: 'notification channel preference delete remove',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteNotificationChannelPreference',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteNotificationChannelPreference: boolean }>(
        `mutation($preferenceId: MongoID!) {
          deleteNotificationChannelPreference(preferenceId: $preferenceId)
        }`,
        { preferenceId: args.preference_id },
      );
      return { deleted: result.deleteNotificationChannelPreference };
    },
    formatResult: (result) => {
      const r = result as { deleted?: boolean };
      return r?.deleted ? 'Preference deleted.' : 'Preference not found.';
    },
  }),
];
