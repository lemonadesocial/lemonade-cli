import { describe, it, expect } from 'vitest';
import { buildToolRegistry } from '../../../src/chat/tools/registry';
import { buildJsonSchema } from '../../../src/chat/tools/schema';

describe('Tool Registry', () => {
  const registry = buildToolRegistry();
  const tools = Object.values(registry);

  it('registers at least 78 tools', () => {
    expect(tools.length).toBeGreaterThanOrEqual(78);
  });

  it('each tool has required fields', () => {
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.displayName).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(typeof tool.destructive).toBe('boolean');
      expect(typeof tool.execute).toBe('function');
      expect(Array.isArray(tool.params)).toBe(true);
    }
  });

  it('tool names are unique', () => {
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('tool names use snake_case', () => {
    for (const tool of tools) {
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('generates valid JSON schemas for all tools', () => {
    for (const tool of tools) {
      const schema = buildJsonSchema(tool.params);
      expect(schema.type).toBe('object');
      if (tool.params.some((p) => p.required)) {
        expect(schema.required).toBeDefined();
        expect(schema.required!.length).toBeGreaterThan(0);
      }
    }
  });

  it('marks destructive tools correctly', () => {
    const destructiveTools = tools.filter((t) => t.destructive);
    const destructiveNames = destructiveTools.map((t) => t.name);

    expect(destructiveNames).toContain('event_cancel');
    expect(destructiveNames).toContain('tickets_buy');
    expect(destructiveNames).toContain('event_approvals');

    expect(destructiveNames).not.toContain('event_create');
    expect(destructiveNames).not.toContain('event_get');
    expect(destructiveNames).not.toContain('space_list');
  });

  it('includes event CRUD tools', () => {
    expect(registry.event_create).toBeDefined();
    expect(registry.event_list).toBeDefined();
    expect(registry.event_get).toBeDefined();
    expect(registry.event_update).toBeDefined();
    expect(registry.event_publish).toBeDefined();
    expect(registry.event_cancel).toBeDefined();
  });

  it('includes ticket tools', () => {
    expect(registry.tickets_list_types).toBeDefined();
    expect(registry.tickets_create_type).toBeDefined();
    expect(registry.tickets_update_type).toBeDefined();
    expect(registry.tickets_buy).toBeDefined();
    expect(registry.tickets_price).toBeDefined();
    expect(registry.tickets_receipt).toBeDefined();
  });

  it('includes space tools', () => {
    expect(registry.space_create).toBeDefined();
    expect(registry.space_list).toBeDefined();
    expect(registry.space_update).toBeDefined();
    expect(registry.space_stats).toBeDefined();
    expect(registry.space_members).toBeDefined();
  });

  it('includes rewards tools', () => {
    expect(registry.rewards_balance).toBeDefined();
    expect(registry.rewards_history).toBeDefined();
    expect(registry.rewards_payouts).toBeDefined();
    expect(registry.rewards_referral).toBeDefined();
    expect(registry.rewards_settings).toBeDefined();
  });

  it('includes analytics tools', () => {
    expect(registry.event_ticket_sold_insight).toBeDefined();
    expect(registry.event_view_insight).toBeDefined();
    expect(registry.event_guest_stats).toBeDefined();
  });

  it('includes site tools', () => {
    expect(registry.site_generate).toBeDefined();
    expect(registry.site_deploy).toBeDefined();
    expect(registry.site_templates).toBeDefined();
  });

  it('includes notification tools', () => {
    expect(registry.notifications_list).toBeDefined();
    expect(registry.notifications_read).toBeDefined();
  });

  it('includes system tools', () => {
    expect(registry.get_backend_version).toBeDefined();
    expect(registry.list_chains).toBeDefined();
  });

  it('event_create has required title and start params', () => {
    const tool = registry.event_create;
    const requiredParams = tool.params.filter((p) => p.required).map((p) => p.name);
    expect(requiredParams).toContain('title');
    expect(requiredParams).toContain('start');
  });

  it('tickets_buy has string[] params for attendee names/emails', () => {
    const tool = registry.tickets_buy;
    const namesParam = tool.params.find((p) => p.name === 'attendee_names');
    const emailsParam = tool.params.find((p) => p.name === 'attendee_emails');
    expect(namesParam?.type).toBe('string[]');
    expect(emailsParam?.type).toBe('string[]');
    expect(namesParam?.required).toBe(true);
    expect(emailsParam?.required).toBe(true);
  });

  it('event_search has enum for sort param', () => {
    const tool = registry.event_search;
    const sortParam = tool.params.find((p) => p.name === 'sort');
    expect(sortParam?.enum).toContain('relevance');
    expect(sortParam?.enum).toContain('date_asc');
    expect(sortParam?.enum).toContain('distance');
  });

  // --- NT-1 through NT-35: New tools batch 1 ---

  it('includes event cloning tools (NT-1, NT-2)', () => {
    expect(registry.event_clone).toBeDefined();
    expect(registry.event_clone.params.find((p) => p.name === 'event_id')?.required).toBe(true);
    expect(registry.event_clone.params.find((p) => p.name === 'dates')?.type).toBe('string[]');
    expect(registry.event_clone.destructive).toBe(false);

    expect(registry.event_generate_recurring_dates).toBeDefined();
    expect(registry.event_generate_recurring_dates.params.find((p) => p.name === 'repeat')?.enum).toContain('weekly');
    expect(registry.event_generate_recurring_dates.params.find((p) => p.name === 'day_of_weeks')?.type).toBe('number[]');
  });

  it('includes co-host management tools (NT-3, NT-4, NT-5)', () => {
    expect(registry.event_list_cohost_requests).toBeDefined();
    expect(registry.event_list_cohost_requests.destructive).toBe(false);

    expect(registry.event_add_cohost).toBeDefined();
    expect(registry.event_add_cohost.params.find((p) => p.name === 'role')?.enum).toContain('gatekeeper');
    expect(registry.event_add_cohost.destructive).toBe(false);

    expect(registry.event_remove_cohost).toBeDefined();
    expect(registry.event_remove_cohost.destructive).toBe(true);
  });

  it('includes broadcasting tools (NT-6, NT-7, NT-8)', () => {
    expect(registry.event_broadcast_create).toBeDefined();
    expect(registry.event_broadcast_create.params.find((p) => p.name === 'provider')?.enum).toContain('youtube');
    expect(registry.event_broadcast_create.destructive).toBe(false);

    expect(registry.event_broadcast_update).toBeDefined();
    expect(registry.event_broadcast_update.destructive).toBe(false);

    expect(registry.event_broadcast_delete).toBeDefined();
    expect(registry.event_broadcast_delete.destructive).toBe(true);
  });

  it('includes email workflow tools (NT-9 through NT-14)', () => {
    expect(registry.event_emails_list).toBeDefined();
    expect(registry.event_emails_list.destructive).toBe(false);

    expect(registry.event_email_create).toBeDefined();
    expect(registry.event_email_create.params.find((p) => p.name === 'type')?.required).toBe(true);

    expect(registry.event_email_update).toBeDefined();

    expect(registry.event_email_delete).toBeDefined();
    expect(registry.event_email_delete.destructive).toBe(true);

    expect(registry.event_email_toggle).toBeDefined();
    expect(registry.event_email_toggle.params.find((p) => p.name === 'email_setting_ids')?.type).toBe('string[]');

    expect(registry.event_email_test).toBeDefined();
    expect(registry.event_email_test.params.find((p) => p.name === 'test_recipients')?.required).toBe(true);
  });

  it('includes guest management tools (NT-15 through NT-19)', () => {
    expect(registry.event_ticket_statistics).toBeDefined();
    expect(registry.event_export_guests).toBeDefined();
    expect(registry.event_guest_detail).toBeDefined();
    expect(registry.event_guests_statistics).toBeDefined();
    expect(registry.event_guests_list).toBeDefined();
    expect(registry.event_guests_list.params.find((p) => p.name === 'sort_by')?.enum).toContain('register_time');
  });

  it('includes invitation tools (NT-20, NT-21)', () => {
    expect(registry.event_invite_stats).toBeDefined();
    expect(registry.event_invite_stats.destructive).toBe(false);

    expect(registry.event_cancel_invitations).toBeDefined();
    expect(registry.event_cancel_invitations.destructive).toBe(true);
  });

  it('includes analytics chart tools (NT-22 through NT-27)', () => {
    expect(registry.event_sales_chart).toBeDefined();
    expect(registry.event_checkin_chart).toBeDefined();
    expect(registry.event_views_chart).toBeDefined();
    expect(registry.event_view_stats).toBeDefined();
    expect(registry.event_view_stats.params.find((p) => p.name === 'ranges')?.type).toBe('object[]');
    expect(registry.event_top_views).toBeDefined();
    expect(registry.event_top_views.params.find((p) => p.name === 'city_limit')?.required).toBe(true);
    expect(registry.event_top_inviters).toBeDefined();
  });

  it('includes page configuration tools (NT-29 through NT-33)', () => {
    expect(registry.page_archive).toBeDefined();
    expect(registry.page_archive.destructive).toBe(true);

    expect(registry.page_save_version).toBeDefined();
    expect(registry.page_restore_version).toBeDefined();
    expect(registry.page_list_versions).toBeDefined();
    expect(registry.page_section_catalog).toBeDefined();
    expect(registry.page_section_catalog.params).toHaveLength(0);
  });

  it('includes template tools (NT-34, NT-35)', () => {
    expect(registry.template_list).toBeDefined();
    expect(registry.template_list.destructive).toBe(false);

    expect(registry.template_clone_to_config).toBeDefined();
    expect(registry.template_clone_to_config.params.find((p) => p.name === 'owner_type')?.enum).toContain('event');
  });

  it('marks new destructive tools correctly', () => {
    const destructiveTools = tools.filter((t) => t.destructive);
    const destructiveNames = destructiveTools.map((t) => t.name);

    expect(destructiveNames).toContain('event_remove_cohost');
    expect(destructiveNames).toContain('event_broadcast_delete');
    expect(destructiveNames).toContain('event_email_delete');
    expect(destructiveNames).toContain('event_cancel_invitations');
    expect(destructiveNames).toContain('page_archive');

    expect(destructiveNames).not.toContain('event_clone');
    expect(destructiveNames).not.toContain('event_broadcast_create');
    expect(destructiveNames).not.toContain('event_emails_list');
    expect(destructiveNames).not.toContain('template_list');
  });
});
