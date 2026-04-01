import { describe, it, expect } from 'vitest';
import { buildToolRegistry } from '../../../src/chat/tools/registry';
import { buildJsonSchema } from '../../../src/chat/tools/schema';

describe('Tool Registry', () => {
  const registry = buildToolRegistry();
  const tools = Object.values(registry);

  it('registers at least 110 tools', () => {
    expect(tools.length).toBeGreaterThanOrEqual(110);
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

    expect(registry.event_recurring_dates).toBeDefined();
    expect(registry.event_recurring_dates.params.find((p) => p.name === 'repeat')?.enum).toContain('WEEKLY');
    expect(registry.event_recurring_dates.params.find((p) => p.name === 'day_of_weeks')?.type).toBe('number[]');
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
    expect(registry.event_invitation_stats).toBeDefined();
    expect(registry.event_invitation_stats.destructive).toBe(false);

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

  // --- NT-36 through NT-39: Token Gates ---

  it('includes token gate tools (NT-36 through NT-39)', () => {
    expect(registry.event_token_gates_list).toBeDefined();
    expect(registry.event_token_gates_list.destructive).toBe(false);
    expect(registry.event_token_gates_list.params.find((p) => p.name === 'event_id')?.required).toBe(true);
    expect(registry.event_token_gates_list.params.find((p) => p.name === 'networks')?.type).toBe('string[]');

    expect(registry.event_token_gate_create).toBeDefined();
    expect(registry.event_token_gate_create.destructive).toBe(false);
    expect(registry.event_token_gate_create.params.find((p) => p.name === 'name')?.required).toBe(true);
    expect(registry.event_token_gate_create.params.find((p) => p.name === 'token_address')?.required).toBe(true);
    expect(registry.event_token_gate_create.params.find((p) => p.name === 'network')?.required).toBe(true);
    expect(registry.event_token_gate_create.params.find((p) => p.name === 'gated_ticket_types')?.type).toBe('string[]');

    expect(registry.event_token_gate_update).toBeDefined();
    expect(registry.event_token_gate_update.destructive).toBe(false);
    expect(registry.event_token_gate_update.params.find((p) => p.name === 'token_gate_id')?.required).toBe(true);

    expect(registry.event_token_gate_delete).toBeDefined();
    expect(registry.event_token_gate_delete.destructive).toBe(true);
    expect(registry.event_token_gate_delete.params.find((p) => p.name === 'token_gate_id')?.required).toBe(true);
    expect(registry.event_token_gate_delete.params.find((p) => p.name === 'event_id')?.required).toBe(true);
  });

  // --- NT-40 through NT-43: POAP Drops ---

  it('includes POAP drop tools (NT-40 through NT-43)', () => {
    expect(registry.event_poap_list).toBeDefined();
    expect(registry.event_poap_list.destructive).toBe(false);
    expect(registry.event_poap_list.params.find((p) => p.name === 'event_id')?.required).toBe(true);

    expect(registry.event_poap_create).toBeDefined();
    expect(registry.event_poap_create.destructive).toBe(false);
    expect(registry.event_poap_create.params.find((p) => p.name === 'claim_mode')?.enum).toContain('check_in');
    expect(registry.event_poap_create.params.find((p) => p.name === 'claim_mode')?.enum).toContain('registration');
    expect(registry.event_poap_create.params.find((p) => p.name === 'amount')?.required).toBe(true);

    expect(registry.event_poap_update).toBeDefined();
    expect(registry.event_poap_update.destructive).toBe(false);
    expect(registry.event_poap_update.params.find((p) => p.name === 'drop_id')?.required).toBe(true);

    expect(registry.event_poap_import).toBeDefined();
    expect(registry.event_poap_import.destructive).toBe(false);
    expect(registry.event_poap_import.params.find((p) => p.name === 'poap_id')?.type).toBe('number');
    expect(registry.event_poap_import.params.find((p) => p.name === 'code')?.required).toBe(true);
  });

  // --- NT-44 through NT-48: Ticket Categories ---

  it('includes ticket category tools (NT-44 through NT-48)', () => {
    expect(registry.event_ticket_categories_list).toBeDefined();
    expect(registry.event_ticket_categories_list.destructive).toBe(false);

    expect(registry.event_ticket_category_create).toBeDefined();
    expect(registry.event_ticket_category_create.destructive).toBe(false);
    expect(registry.event_ticket_category_create.params.find((p) => p.name === 'title')?.required).toBe(true);
    expect(registry.event_ticket_category_create.params.find((p) => p.name === 'ticket_types')?.type).toBe('string[]');

    expect(registry.event_ticket_category_update).toBeDefined();
    expect(registry.event_ticket_category_update.destructive).toBe(false);
    expect(registry.event_ticket_category_update.params.find((p) => p.name === 'category_id')?.required).toBe(true);

    expect(registry.event_ticket_category_delete).toBeDefined();
    expect(registry.event_ticket_category_delete.destructive).toBe(true);
    expect(registry.event_ticket_category_delete.params.find((p) => p.name === 'category_ids')?.type).toBe('string[]');

    expect(registry.event_ticket_category_reorder).toBeDefined();
    expect(registry.event_ticket_category_reorder.destructive).toBe(false);
    expect(registry.event_ticket_category_reorder.params.find((p) => p.name === 'categories')?.type).toBe('object[]');
  });

  // --- NT-49 through NT-52: Space Tags ---

  it('includes space tag tools (NT-49 through NT-52)', () => {
    expect(registry.space_tags_list).toBeDefined();
    expect(registry.space_tags_list.destructive).toBe(false);
    expect(registry.space_tags_list.params.find((p) => p.name === 'type')?.enum).toContain('event');
    expect(registry.space_tags_list.params.find((p) => p.name === 'type')?.enum).toContain('member');

    expect(registry.space_tag_upsert).toBeDefined();
    expect(registry.space_tag_upsert.destructive).toBe(false);
    expect(registry.space_tag_upsert.params.find((p) => p.name === 'tag')?.required).toBe(true);
    expect(registry.space_tag_upsert.params.find((p) => p.name === 'color')?.required).toBe(true);
    expect(registry.space_tag_upsert.params.find((p) => p.name === 'type')?.enum).toContain('event');

    expect(registry.space_tag_delete).toBeDefined();
    expect(registry.space_tag_delete.destructive).toBe(true);
    expect(registry.space_tag_delete.params.find((p) => p.name === 'tag_id')?.required).toBe(true);

    expect(registry.space_tag_manage).toBeDefined();
    expect(registry.space_tag_manage.destructive).toBe(false);
    expect(registry.space_tag_manage.params.find((p) => p.name === 'tagged')?.type).toBe('boolean');
  });

  // --- NT-53 through NT-56: Event Questions ---

  it('includes event question tools (NT-53 through NT-56)', () => {
    expect(registry.event_question_create).toBeDefined();
    expect(registry.event_question_create.destructive).toBe(false);
    expect(registry.event_question_create.params.find((p) => p.name === 'question')?.required).toBe(true);

    expect(registry.event_question_delete).toBeDefined();
    expect(registry.event_question_delete.destructive).toBe(true);
    expect(registry.event_question_delete.params.find((p) => p.name === 'question_id')?.required).toBe(true);

    expect(registry.event_question_like).toBeDefined();
    expect(registry.event_question_like.destructive).toBe(false);

    expect(registry.event_questions_list).toBeDefined();
    expect(registry.event_questions_list.destructive).toBe(false);
    expect(registry.event_questions_list.params.find((p) => p.name === 'sort')?.enum).toContain('_id');
    expect(registry.event_questions_list.params.find((p) => p.name === 'sort')?.enum).toContain('likes');
  });

  // --- NT-57 through NT-62: AI Credits & Usage ---

  it('includes AI credits tools (NT-57 through NT-62)', () => {
    expect(registry.credits_balance).toBeDefined();
    expect(registry.credits_balance.destructive).toBe(false);
    expect(registry.credits_balance.params.find((p) => p.name === 'stand_id')?.required).toBe(true);

    expect(registry.credits_usage).toBeDefined();
    expect(registry.credits_usage.destructive).toBe(false);
    expect(registry.credits_usage.params.find((p) => p.name === 'start_date')?.required).toBe(true);
    expect(registry.credits_usage.params.find((p) => p.name === 'end_date')?.required).toBe(true);

    expect(registry.credits_buy).toBeDefined();
    expect(registry.credits_buy.destructive).toBe(false);
    expect(registry.credits_buy.params.find((p) => p.name === 'package')?.enum).toContain('5');
    expect(registry.credits_buy.params.find((p) => p.name === 'package')?.enum).toContain('100');

    expect(registry.available_models).toBeDefined();
    expect(registry.available_models.destructive).toBe(false);
    expect(registry.available_models.params.find((p) => p.name === 'space_id')?.required).toBe(false);

    expect(registry.set_preferred_model).toBeDefined();
    expect(registry.set_preferred_model.destructive).toBe(false);
    expect(registry.set_preferred_model.params.find((p) => p.name === 'model_id')?.required).toBe(true);

    expect(registry.set_space_default_model).toBeDefined();
    expect(registry.set_space_default_model.destructive).toBe(false);
    expect(registry.set_space_default_model.params.find((p) => p.name === 'space_id')?.required).toBe(true);
    expect(registry.set_space_default_model.params.find((p) => p.name === 'model_id')?.required).toBe(true);
  });

  // --- NT-63 through NT-67: Subscriptions ---

  it('includes subscription tools (NT-63 through NT-67)', () => {
    expect(registry.subscription_status).toBeDefined();
    expect(registry.subscription_status.destructive).toBe(false);
    expect(registry.subscription_status.params.find((p) => p.name === 'space_id')?.required).toBe(true);

    expect(registry.subscription_features).toBeDefined();
    expect(registry.subscription_features.destructive).toBe(false);
    expect(registry.subscription_features.params).toHaveLength(0);

    expect(registry.subscription_plans).toBeDefined();
    expect(registry.subscription_plans.destructive).toBe(false);
    expect(registry.subscription_plans.params).toHaveLength(0);

    expect(registry.subscription_upgrade).toBeDefined();
    expect(registry.subscription_upgrade.destructive).toBe(false);
    expect(registry.subscription_upgrade.params.find((p) => p.name === 'tier')?.enum).toContain('pro');
    expect(registry.subscription_upgrade.params.find((p) => p.name === 'tier')?.enum).toContain('plus');
    expect(registry.subscription_upgrade.params.find((p) => p.name === 'tier')?.enum).toContain('max');
    expect(registry.subscription_upgrade.params.find((p) => p.name === 'annual')?.required).toBe(false);

    expect(registry.subscription_cancel).toBeDefined();
    expect(registry.subscription_cancel.destructive).toBe(true);
    expect(registry.subscription_cancel.params.find((p) => p.name === 'stand_id')?.required).toBe(true);
  });

  // --- Batch 2 destructive tools verification ---

  it('marks batch 2 destructive tools correctly', () => {
    const destructiveTools = tools.filter((t) => t.destructive);
    const destructiveNames = destructiveTools.map((t) => t.name);

    // Must be destructive
    expect(destructiveNames).toContain('event_token_gate_delete');
    expect(destructiveNames).toContain('event_ticket_category_delete');
    expect(destructiveNames).toContain('space_tag_delete');
    expect(destructiveNames).toContain('event_question_delete');
    expect(destructiveNames).toContain('subscription_cancel');

    // Must NOT be destructive
    expect(destructiveNames).not.toContain('event_token_gates_list');
    expect(destructiveNames).not.toContain('event_token_gate_create');
    expect(destructiveNames).not.toContain('event_poap_list');
    expect(destructiveNames).not.toContain('event_poap_create');
    expect(destructiveNames).not.toContain('event_ticket_categories_list');
    expect(destructiveNames).not.toContain('space_tags_list');
    expect(destructiveNames).not.toContain('space_tag_upsert');
    expect(destructiveNames).not.toContain('event_question_create');
    expect(destructiveNames).not.toContain('event_questions_list');
    expect(destructiveNames).not.toContain('credits_balance');
    expect(destructiveNames).not.toContain('credits_buy');
    expect(destructiveNames).not.toContain('available_models');
    expect(destructiveNames).not.toContain('subscription_status');
    expect(destructiveNames).not.toContain('subscription_plans');
    expect(destructiveNames).not.toContain('subscription_upgrade');
  });
});
