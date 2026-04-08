import { describe, it, expect, vi } from 'vitest';
import { getAllCapabilities } from '../../../../src/chat/tools/registry.js';

const CONSOLIDATED_TOOLS = [
  {
    name: 'manage_newsletters',
    actions: ['list', 'get', 'create', 'update', 'delete', 'test_send', 'stats'],
    delegates: [
      'newsletter_list', 'newsletter_get', 'newsletter_create',
      'newsletter_update', 'newsletter_delete', 'newsletter_test_send', 'newsletter_stats',
    ],
  },
  {
    name: 'manage_subscription',
    actions: ['status', 'features', 'plans', 'upgrade', 'cancel'],
    delegates: [
      'subscription_status', 'subscription_features', 'subscription_plans',
      'subscription_upgrade', 'subscription_cancel',
    ],
  },
  {
    name: 'manage_rewards',
    actions: ['balance', 'history', 'payouts', 'referral', 'settings'],
    delegates: [
      'rewards_balance', 'rewards_history', 'rewards_payouts',
      'rewards_referral', 'rewards_settings',
    ],
  },
  {
    name: 'manage_event_sessions',
    actions: ['list_reservations', 'reservation_summary', 'reserve', 'unreserve'],
    delegates: [
      'event_session_reservations', 'event_session_reservation_summary',
      'event_session_reserve', 'event_session_unreserve',
    ],
  },
  {
    name: 'manage_page_versions',
    actions: ['archive', 'save', 'restore', 'list', 'preview'],
    delegates: [
      'page_archive', 'page_save_version', 'page_restore_version',
      'page_list_versions', 'page_preview_link',
    ],
  },
  {
    name: 'manage_page_config',
    actions: ['get', 'update', 'published', 'create', 'catalog'],
    delegates: [
      'page_config_get', 'page_config_update', 'page_config_published',
      'page_config_create', 'page_section_catalog',
    ],
  },
];

describe('consolidated tools', () => {
  const caps = getAllCapabilities();

  for (const tool of CONSOLIDATED_TOOLS) {
    describe(tool.name, () => {
      it('exists in the registry', () => {
        const found = caps.find((c) => c.name === tool.name);
        expect(found).toBeDefined();
      });

      it('has alwaysLoad: true', () => {
        const found = caps.find((c) => c.name === tool.name)!;
        expect(found.alwaysLoad).toBe(true);
      });

      it('has action param with correct enum values', () => {
        const found = caps.find((c) => c.name === tool.name)!;
        const actionParam = found.params.find((p) => p.name === 'action');
        expect(actionParam).toBeDefined();
        expect(actionParam!.required).toBe(true);
        expect(actionParam!.enum).toEqual(tool.actions);
      });

      it('throws on unknown action', async () => {
        const found = caps.find((c) => c.name === tool.name)!;
        await expect(found.execute({ action: '__nonexistent__' })).rejects.toThrow('Unknown action');
      });

      it('has all delegate tools in the registry', () => {
        for (const delegateName of tool.delegates) {
          const delegate = caps.find((c) => c.name === delegateName);
          expect(delegate, `delegate tool ${delegateName} not found`).toBeDefined();
        }
      });

      it('delegate tools are deferred', () => {
        for (const delegateName of tool.delegates) {
          const delegate = caps.find((c) => c.name === delegateName)!;
          expect(delegate.shouldDefer, `${delegateName} should be deferred`).toBe(true);
        }
      });
    });
  }
});
