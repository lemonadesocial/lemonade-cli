import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';

/**
 * Helper: look up a granular tool by name from the full registry and delegate execution.
 */
async function delegateToTool(
  toolName: string,
  args: Record<string, unknown>,
  context?: unknown,
): Promise<unknown> {
  const { getAllCapabilities } = await import('../registry.js');
  const caps = getAllCapabilities();
  const tool = caps.find((c) => c.name === toolName);
  if (!tool) throw new Error(`Tool not found: ${toolName}`);
  return tool.execute(args, context as Parameters<CanonicalCapability['execute']>[1]);
}

export const consolidatedTools: CanonicalCapability[] = [
  // ── manage_newsletters ──────────────────────────────────────────────
  buildCapability({
    name: 'manage_newsletters',
    category: 'newsletter',
    displayName: 'manage newsletters',
    description:
      'Manage email newsletters: list, get, create, update, delete, test send, or view stats.',
    params: [
      {
        name: 'action',
        type: 'string',
        description: 'Action to perform',
        required: true,
        enum: ['list', 'get', 'create', 'update', 'delete', 'test_send', 'stats'],
      },
      { name: 'newsletter_id', type: 'string', description: 'Newsletter ID (for get/update/delete/test_send)', required: false },
      { name: 'space_id', type: 'string', description: 'Space ID (for list/create/test_send/stats)', required: false },
      { name: 'subject', type: 'string', description: 'Email subject HTML (for create/update/test_send)', required: false },
      { name: 'body', type: 'string', description: 'Email body HTML (for create/update/test_send)', required: false },
      { name: 'cc', type: 'string', description: 'CC emails comma-separated (for create/update)', required: false },
      { name: 'scheduled_at', type: 'string', description: 'Schedule send ISO 8601 (for create/update)', required: false },
      { name: 'recipient_types', type: 'string', description: 'Comma-separated recipient types (for create/update)', required: false },
      { name: 'draft', type: 'boolean', description: 'Save as draft (for create/update)', required: false },
      { name: 'disabled', type: 'boolean', description: 'Disable newsletter (for update)', required: false },
      { name: 'sent', type: 'boolean', description: 'Filter sent only (for list)', required: false },
      { name: 'scheduled', type: 'boolean', description: 'Filter scheduled only (for list)', required: false },
      { name: 'test_recipients', type: 'string', description: 'Comma-separated test emails (for test_send)', required: false },
    ],
    alwaysLoad: true,
    shouldDefer: false,
    destructive: false,
    backendType: 'mutation',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    whenToUse: 'when user wants to manage newsletters (list, create, update, delete, test send, or stats)',
    searchHint: 'newsletter email campaign list create update delete send stats',
    execute: async (args, context) => {
      const actionMap: Record<string, string> = {
        list: 'newsletter_list',
        get: 'newsletter_get',
        create: 'newsletter_create',
        update: 'newsletter_update',
        delete: 'newsletter_delete',
        test_send: 'newsletter_test_send',
        stats: 'newsletter_stats',
      };
      const toolName = actionMap[args.action as string];
      if (!toolName) throw new Error(`Unknown action: ${args.action}`);
      const { action, ...rest } = args;
      return delegateToTool(toolName, rest, context);
    },
  }),

  // ── manage_subscription ─────────────────────────────────────────────
  buildCapability({
    name: 'manage_subscription',
    category: 'subscription',
    displayName: 'manage subscription',
    description:
      'Manage subscriptions: check status, view features, list plans, upgrade, or cancel.',
    params: [
      {
        name: 'action',
        type: 'string',
        description: 'Action to perform',
        required: true,
        enum: ['status', 'features', 'plans', 'upgrade', 'cancel'],
      },
      { name: 'space_id', type: 'string', description: 'Space ID (for status)', required: false },
      { name: 'stand_id', type: 'string', description: 'Community/stand ID (for upgrade/cancel)', required: false },
      { name: 'tier', type: 'string', description: 'Tier: pro, plus, or max (for upgrade)', required: false, enum: ['pro', 'plus', 'max'] },
      { name: 'annual', type: 'boolean', description: 'Annual billing (for upgrade)', required: false },
    ],
    alwaysLoad: true,
    shouldDefer: false,
    destructive: false,
    backendType: 'mutation',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    whenToUse: 'when user wants to manage subscription (status, features, plans, upgrade, cancel)',
    searchHint: 'subscription plan tier billing status features upgrade cancel',
    execute: async (args, context) => {
      const actionMap: Record<string, string> = {
        status: 'subscription_status',
        features: 'subscription_features',
        plans: 'subscription_plans',
        upgrade: 'subscription_upgrade',
        cancel: 'subscription_cancel',
      };
      const toolName = actionMap[args.action as string];
      if (!toolName) throw new Error(`Unknown action: ${args.action}`);
      const { action, ...rest } = args;
      return delegateToTool(toolName, rest, context);
    },
  }),

  // ── manage_rewards ──────────────────────────────────────────────────
  buildCapability({
    name: 'manage_rewards',
    category: 'rewards',
    displayName: 'manage rewards',
    description:
      'Manage rewards: check balance, view history, see payouts, manage referrals, or update settings.',
    params: [
      {
        name: 'action',
        type: 'string',
        description: 'Action to perform',
        required: true,
        enum: ['balance', 'history', 'payouts', 'referral', 'settings'],
      },
      { name: 'space_id', type: 'string', description: 'Space ID (for balance/history)', required: false },
      { name: 'limit', type: 'number', description: 'Max results (for history/payouts)', required: false },
      { name: 'offset', type: 'number', description: 'Skip results (for history/payouts)', required: false },
      { name: 'referral_action', type: 'string', description: 'Referral sub-action: generate, apply, view (for referral)', required: false, enum: ['generate', 'apply', 'view'] },
      { name: 'code', type: 'string', description: 'Referral code (for referral apply)', required: false },
      { name: 'wallet_address', type: 'string', description: 'Payout wallet address (for settings)', required: false },
      { name: 'wallet_chain', type: 'string', description: 'Payout chain (for settings)', required: false },
      { name: 'preferred_method', type: 'string', description: 'Preferred payout method (for settings)', required: false, enum: ['stripe', 'crypto'] },
    ],
    alwaysLoad: true,
    shouldDefer: false,
    destructive: false,
    backendType: 'mutation',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    whenToUse: 'when user wants to manage rewards (balance, history, payouts, referral, settings)',
    searchHint: 'rewards balance history payouts referral settings earnings',
    execute: async (args, context) => {
      const actionMap: Record<string, string> = {
        balance: 'rewards_balance',
        history: 'rewards_history',
        payouts: 'rewards_payouts',
        referral: 'rewards_referral',
        settings: 'rewards_settings',
      };
      const toolName = actionMap[args.action as string];
      if (!toolName) throw new Error(`Unknown action: ${args.action}`);
      const { action, ...rest } = args;
      // For referral, map referral_action -> action (the underlying tool uses 'action' param)
      if (toolName === 'rewards_referral' && rest.referral_action) {
        rest.action = rest.referral_action;
        delete rest.referral_action;
      }
      return delegateToTool(toolName, rest, context);
    },
  }),

  // ── manage_event_sessions ───────────────────────────────────────────
  buildCapability({
    name: 'manage_event_sessions',
    category: 'session',
    displayName: 'manage event sessions',
    description:
      'Manage event session reservations: list, get summary, reserve, or unreserve.',
    params: [
      {
        name: 'action',
        type: 'string',
        description: 'Action to perform',
        required: true,
        enum: ['list_reservations', 'reservation_summary', 'reserve', 'unreserve'],
      },
      { name: 'event_id', type: 'string', description: 'Event ID', required: false },
      { name: 'session_id', type: 'string', description: 'Session ID (for reserve/unreserve/reservation_summary)', required: false },
    ],
    alwaysLoad: true,
    shouldDefer: false,
    destructive: false,
    backendType: 'mutation',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    whenToUse: 'when user wants to manage event session reservations',
    searchHint: 'session reservations reserve unreserve bookings schedule',
    execute: async (args, context) => {
      const actionMap: Record<string, string> = {
        list_reservations: 'event_session_reservations',
        reservation_summary: 'event_session_reservation_summary',
        reserve: 'event_session_reserve',
        unreserve: 'event_session_unreserve',
      };
      const toolName = actionMap[args.action as string];
      if (!toolName) throw new Error(`Unknown action: ${args.action}`);
      const { action, ...rest } = args;
      return delegateToTool(toolName, rest, context);
    },
  }),

  // ── manage_page_versions ────────────────────────────────────────────
  buildCapability({
    name: 'manage_page_versions',
    category: 'page',
    displayName: 'manage page versions',
    description:
      'Manage page version lifecycle: archive, save version, restore version, list versions, or get preview link.',
    params: [
      {
        name: 'action',
        type: 'string',
        description: 'Action to perform',
        required: true,
        enum: ['archive', 'save', 'restore', 'list', 'preview'],
      },
      { name: 'page_id', type: 'string', description: 'Page config ID (for archive)', required: false },
      { name: 'config_id', type: 'string', description: 'Page config ID (for save/restore/list/preview)', required: false },
      { name: 'name', type: 'string', description: 'Version name (for save)', required: false },
      { name: 'version', type: 'number', description: 'Version number to restore (for restore)', required: false },
      { name: 'password', type: 'string', description: 'Preview link password (for preview)', required: false },
      { name: 'expires_in_hours', type: 'number', description: 'Preview link expiry hours (for preview)', required: false },
    ],
    alwaysLoad: true,
    shouldDefer: false,
    destructive: false,
    backendType: 'mutation',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    whenToUse: 'when user wants to manage page versions (archive, save, restore, list, preview)',
    searchHint: 'page version archive save restore list preview snapshot',
    execute: async (args, context) => {
      const actionMap: Record<string, string> = {
        archive: 'page_archive',
        save: 'page_save_version',
        restore: 'page_restore_version',
        list: 'page_list_versions',
        preview: 'page_preview_link',
      };
      const toolName = actionMap[args.action as string];
      if (!toolName) throw new Error(`Unknown action: ${args.action}`);
      const { action, ...rest } = args;
      return delegateToTool(toolName, rest, context);
    },
  }),

  // ── manage_page_config ──────────────────────────────────────────────
  buildCapability({
    name: 'manage_page_config',
    category: 'page',
    displayName: 'manage page config',
    description:
      'Manage page configurations: get, update, view published, create, or browse section catalog.',
    params: [
      {
        name: 'action',
        type: 'string',
        description: 'Action to perform',
        required: true,
        enum: ['get', 'update', 'published', 'create', 'catalog'],
      },
      { name: 'config_id', type: 'string', description: 'Page config ID (for get/update)', required: false },
      { name: 'owner_type', type: 'string', description: 'Owner type: event or space (for published/create)', required: false, enum: ['event', 'space'] },
      { name: 'owner_id', type: 'string', description: 'Event or space ID (for published/create)', required: false },
      { name: 'name', type: 'string', description: 'Page name (for update/create)', required: false },
      { name: 'description', type: 'string', description: 'Page description (for update/create)', required: false },
      { name: 'theme', type: 'string', description: 'Theme config JSON (for update/create)', required: false },
      { name: 'sections', type: 'string', description: 'Sections JSON array (for update/create)', required: false },
      { name: 'template_id', type: 'string', description: 'Template ID (for create)', required: false },
    ],
    alwaysLoad: true,
    shouldDefer: false,
    destructive: false,
    backendType: 'mutation',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    whenToUse: 'when user wants to manage page configs (get, update, published, create, catalog)',
    searchHint: 'page config get update published create catalog sections',
    execute: async (args, context) => {
      const actionMap: Record<string, string> = {
        get: 'page_config_get',
        update: 'page_config_update',
        published: 'page_config_published',
        create: 'page_config_create',
        catalog: 'page_section_catalog',
      };
      const toolName = actionMap[args.action as string];
      if (!toolName) throw new Error(`Unknown action: ${args.action}`);
      const { action, ...rest } = args;
      return delegateToTool(toolName, rest, context);
    },
  }),
];
