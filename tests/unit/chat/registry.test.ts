import { describe, it, expect } from 'vitest';
import { buildToolRegistry, getAllCapabilities } from '../../../src/chat/tools/registry';
import { buildJsonSchema } from '../../../src/chat/tools/schema';

describe('Tool Registry', () => {
  const registry = buildToolRegistry();
  const tools = Object.values(registry);

  it('registers at least 210 tools', () => {
    expect(tools.length).toBeGreaterThanOrEqual(210);
  });

  it('each tool has required fields', () => {
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.category).toBeTruthy();
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
    expect(registry.site_create_page).toBeDefined();
    expect(registry.site_update_section).toBeDefined();
  });

  it('site_templates requires owner_type and owner_id', () => {
    const tool = registry.site_templates;
    const requiredParams = tool.params.filter((p) => p.required).map((p) => p.name);
    expect(requiredParams).toContain('owner_type');
    expect(requiredParams).toContain('owner_id');
    expect(tool.params.find((p) => p.name === 'context')?.required).toBe(false);
  });

  it('site_update_section requires updates as JSON string', () => {
    const tool = registry.site_update_section;
    expect(tool.params.find((p) => p.name === 'page_id')?.required).toBe(true);
    expect(tool.params.find((p) => p.name === 'section_id')?.required).toBe(true);
    expect(tool.params.find((p) => p.name === 'updates')?.required).toBe(true);
    expect(tool.params.find((p) => p.name === 'updates')?.type).toBe('string');
  });

  it('site_create_page uses correct AI input type params', () => {
    const tool = registry.site_create_page;
    expect(tool.params.find((p) => p.name === 'owner_id')?.required).toBe(true);
    expect(tool.params.find((p) => p.name === 'owner_type')?.required).toBe(true);
    expect(tool.params.find((p) => p.name === 'theme')?.required).toBe(false);
    expect(tool.params.find((p) => p.name === 'sections')?.required).toBe(false);
    expect(tool.params.find((p) => p.name === 'template_id')?.required).toBe(false);
  });

  it('includes page config management tools', () => {
    expect(registry.page_config_get).toBeDefined();
    expect(registry.page_config_get.destructive).toBe(false);
    expect(registry.page_config_get.params.find((p) => p.name === 'config_id')?.required).toBe(true);

    expect(registry.page_config_update).toBeDefined();
    expect(registry.page_config_update.destructive).toBe(true);
    expect(registry.page_config_update.params.find((p) => p.name === 'config_id')?.required).toBe(true);
    expect(registry.page_config_update.params.find((p) => p.name === 'name')?.required).toBe(false);
    expect(registry.page_config_update.params.find((p) => p.name === 'theme')?.required).toBe(false);
    expect(registry.page_config_update.params.find((p) => p.name === 'sections')?.required).toBe(false);

    expect(registry.page_config_published).toBeDefined();
    expect(registry.page_config_published.destructive).toBe(false);
    expect(registry.page_config_published.params.find((p) => p.name === 'owner_type')?.required).toBe(true);
    expect(registry.page_config_published.params.find((p) => p.name === 'owner_type')?.enum).toContain('event');
    expect(registry.page_config_published.params.find((p) => p.name === 'owner_id')?.required).toBe(true);

    expect(registry.page_preview_link).toBeDefined();
    expect(registry.page_preview_link.destructive).toBe(false);
    expect(registry.page_preview_link.params.find((p) => p.name === 'config_id')?.required).toBe(true);
    expect(registry.page_preview_link.params.find((p) => p.name === 'password')?.required).toBe(false);
    expect(registry.page_preview_link.params.find((p) => p.name === 'expires_in_hours')?.type).toBe('number');

    expect(registry.page_config_create).toBeDefined();
    expect(registry.page_config_create.destructive).toBe(false);
    expect(registry.page_config_create.params.find((p) => p.name === 'owner_type')?.required).toBe(true);
    expect(registry.page_config_create.params.find((p) => p.name === 'owner_type')?.enum).toContain('event');
    expect(registry.page_config_create.params.find((p) => p.name === 'owner_id')?.required).toBe(true);
    expect(registry.page_config_create.params.find((p) => p.name === 'template_id')?.required).toBe(false);
  });

  it('marks page_config_update as destructive and others as non-destructive', () => {
    const destructiveTools = tools.filter((t) => t.destructive);
    const destructiveNames = destructiveTools.map((t) => t.name);

    expect(destructiveNames).toContain('page_config_update');
    expect(destructiveNames).not.toContain('page_config_get');
    expect(destructiveNames).not.toContain('page_config_published');
    expect(destructiveNames).not.toContain('page_preview_link');
    expect(destructiveNames).not.toContain('page_config_create');
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
    expect(destructiveNames).toContain('event_email_delete');
    expect(destructiveNames).toContain('event_cancel_invitations');
    expect(destructiveNames).toContain('page_archive');

    expect(destructiveNames).not.toContain('event_clone');
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

  // --- File upload & image management tools ---

  it('includes file upload tools', () => {
    expect(registry.file_upload).toBeDefined();
    expect(registry.file_upload.destructive).toBe(false);
    expect(registry.file_upload.params.find((p) => p.name === 'file_path')?.required).toBe(true);
    expect(registry.file_upload.params.find((p) => p.name === 'directory')?.enum).toContain('event');
    expect(registry.file_upload.params.find((p) => p.name === 'directory')?.enum).toContain('space');
    expect(registry.file_upload.params.find((p) => p.name === 'directory')?.required).toBe(false);

    expect(registry.file_upload_url).toBeDefined();
    expect(registry.file_upload_url.destructive).toBe(false);
    expect(registry.file_upload_url.params.find((p) => p.name === 'url')?.required).toBe(true);
    expect(registry.file_upload_url.params.find((p) => p.name === 'description')?.required).toBe(false);
  });

  it('includes space image tools', () => {
    expect(registry.space_set_avatar).toBeDefined();
    expect(registry.space_set_avatar.destructive).toBe(true);
    expect(registry.space_set_avatar.params.find((p) => p.name === 'space_id')?.required).toBe(true);
    expect(registry.space_set_avatar.params.find((p) => p.name === 'file_id')?.required).toBe(false);
    expect(registry.space_set_avatar.params.find((p) => p.name === 'file_path')?.required).toBe(false);

    expect(registry.space_set_cover).toBeDefined();
    expect(registry.space_set_cover.destructive).toBe(true);
    expect(registry.space_set_cover.params.find((p) => p.name === 'space_id')?.required).toBe(true);
    expect(registry.space_set_cover.params.find((p) => p.name === 'file_id')?.required).toBe(false);
    expect(registry.space_set_cover.params.find((p) => p.name === 'file_path')?.required).toBe(false);
  });

  // --- Theme data management ---

  it('includes theme_build tool', () => {
    expect(registry.theme_build).toBeDefined();
    expect(registry.theme_build.destructive).toBe(false);
    expect(registry.theme_build.params.find((p) => p.name === 'preset')?.enum).toContain('shader');
    expect(registry.theme_build.params.find((p) => p.name === 'preset')?.enum).toContain('pattern');
    expect(registry.theme_build.params.find((p) => p.name === 'mode')?.enum).toContain('dark');
    expect(registry.theme_build.params.find((p) => p.name === 'mode')?.enum).toContain('light');
    expect(registry.theme_build.params.find((p) => p.name === 'color')?.enum).toContain('violet');
    expect(registry.theme_build.params.find((p) => p.name === 'shader')?.enum).toContain('dreamy');
    expect(registry.theme_build.params.find((p) => p.name === 'pattern')?.enum).toContain('zigzag');
    expect(registry.theme_build.params.find((p) => p.name === 'font_title')?.required).toBe(false);
    expect(registry.theme_build.params.find((p) => p.name === 'font_body')?.required).toBe(false);
  });

  it('event_create accepts theme params', () => {
    const tool = registry.event_create;
    expect(tool.params.find((p) => p.name === 'theme_data')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'theme_data')?.required).toBe(false);
    expect(tool.params.find((p) => p.name === 'dark_theme_image')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'light_theme_image')).toBeDefined();
  });

  it('event_update accepts theme params', () => {
    const tool = registry.event_update;
    expect(tool.params.find((p) => p.name === 'theme_data')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'theme_data')?.required).toBe(false);
    expect(tool.params.find((p) => p.name === 'dark_theme_image')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'light_theme_image')).toBeDefined();
  });

  it('space_create accepts theme params', () => {
    const tool = registry.space_create;
    expect(tool.params.find((p) => p.name === 'theme_data')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'theme_data')?.required).toBe(false);
    expect(tool.params.find((p) => p.name === 'theme_name')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'dark_theme_image')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'light_theme_image')).toBeDefined();
  });

  it('space_update accepts theme params', () => {
    const tool = registry.space_update;
    expect(tool.params.find((p) => p.name === 'theme_data')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'theme_data')?.required).toBe(false);
    expect(tool.params.find((p) => p.name === 'theme_name')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'dark_theme_image')).toBeDefined();
    expect(tool.params.find((p) => p.name === 'light_theme_image')).toBeDefined();
  });

  it('theme_build execute returns correct shape and validates params', async () => {
    const tool = registry.theme_build;

    // Default params
    const defaultResult = await tool.execute({});
    expect(defaultResult).toEqual({
      theme: 'default',
      config: { mode: 'dark' },
      font_title: 'default',
      font_body: 'default',
    });

    // preset=shader + shader=dreamy
    const shaderResult = (await tool.execute({ preset: 'shader', shader: 'dreamy' })) as { config: { name: string } };
    expect(shaderResult.config.name).toBe('dreamy');

    // preset=shader without shader → throws
    await expect(tool.execute({ preset: 'shader' })).rejects.toThrow(
      'shader name is required when preset is "shader"',
    );

    // preset=pattern without pattern → throws
    await expect(tool.execute({ preset: 'pattern' })).rejects.toThrow(
      'pattern name is required when preset is "pattern"',
    );

    // shader param without preset=shader → throws
    await expect(tool.execute({ shader: 'dreamy' })).rejects.toThrow(
      'shader param only applies when preset is "shader"',
    );
  });

  it('includes event photo tool', () => {
    expect(registry.event_set_photos).toBeDefined();
    expect(registry.event_set_photos.destructive).toBe(true);
    expect(registry.event_set_photos.params.find((p) => p.name === 'event_id')?.required).toBe(true);
    expect(registry.event_set_photos.params.find((p) => p.name === 'file_ids')?.required).toBe(true);
  });

  it('every tool category is in the known allowlist', () => {
    const VALID_CATEGORIES = new Set([
      'connector',
      'event',
      'file',
      'launchpad',
      'newsletter',
      'notifications',
      'page',
      'payment',
      'rewards',
      'session',
      'space',
      'subscription',
      'system',
      'template',
      'tempo',
      'theme',
      'tickets',
      'user',
      'voting',
      'workflow',
    ]);

    for (const [name, tool] of Object.entries(registry)) {
      expect(
        VALID_CATEGORIES.has(tool.category),
        `Tool "${name}" has unknown category "${tool.category}". Add it to the allowlist if intentional.`,
      ).toBe(true);
    }

    const usedCategories = new Set(tools.map((t) => t.category));
    for (const cat of VALID_CATEGORIES) {
      expect(usedCategories.has(cat), `category '${cat}' in allowlist but no tools use it`).toBe(true);
    }
  });

  describe('getAllCapabilities()', () => {
    const capabilities = getAllCapabilities();

    it('returns at least 210 capabilities', () => {
      expect(capabilities.length).toBeGreaterThanOrEqual(210);
    });

    it('every capability has backendType defined', () => {
      for (const cap of capabilities) {
        expect(cap.backendType, `${cap.name} missing backendType`).toBeDefined();
      }
    });

    it('every capability has surfaces with at least one entry', () => {
      for (const cap of capabilities) {
        expect(Array.isArray(cap.surfaces), `${cap.name} surfaces is not an array`).toBe(true);
        expect(cap.surfaces!.length, `${cap.name} has empty surfaces`).toBeGreaterThanOrEqual(1);
      }
    });

    it('every capability has backendService defined', () => {
      for (const cap of capabilities) {
        expect(cap.backendService, `${cap.name} missing backendService`).toBeDefined();
      }
    });
  });
});
