import { describe, it, expect } from 'vitest';
import { buildToolRegistry } from '../../../src/chat/tools/registry';
import { buildJsonSchema } from '../../../src/chat/tools/schema';

describe('Tool Registry', () => {
  const registry = buildToolRegistry();
  const tools = Object.values(registry);

  it('registers at least 44 tools', () => {
    expect(tools.length).toBeGreaterThanOrEqual(44);
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
});
