import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the graphql module so execute() calls don't hit the network.
vi.mock('../../../../src/api/graphql.js', () => ({
  graphqlRequest: vi.fn(),
}));

import { graphqlRequest } from '../../../../src/api/graphql.js';
import { notificationsTools } from '../../../../src/chat/tools/domains/notifications.js';
import { consolidatedTools } from '../../../../src/chat/tools/domains/consolidated.js';
import { getAllCapabilities } from '../../../../src/chat/tools/registry.js';

const mockedRequest = graphqlRequest as unknown as ReturnType<typeof vi.fn>;

const GRANULAR_TOOL_NAMES = [
  'notification_filters_list',
  'notification_filters_set',
  'notification_filters_delete',
  'notification_channel_preferences_list',
  'notification_channel_preferences_set',
  'notification_channel_preferences_delete',
];

const CONSOLIDATED_TOOL_NAMES = [
  'manage_notification_filters',
  'manage_notification_channel_preferences',
];

describe('notification preference granular tools', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  for (const name of GRANULAR_TOOL_NAMES) {
    it(`exports ${name} from notificationsTools`, () => {
      const found = notificationsTools.find((t) => t.name === name);
      expect(found, `${name} not found in notificationsTools export`).toBeDefined();
    });

    it(`registers ${name} in the capability registry`, () => {
      const caps = getAllCapabilities();
      const found = caps.find((c) => c.name === name);
      expect(found, `${name} not found in registry`).toBeDefined();
      expect(found!.category).toBe('notifications');
      expect(found!.requiresSpace).toBe(false);
      expect(found!.requiresEvent).toBe(false);
      expect(found!.shouldDefer).toBe(true);
    });
  }

  it('notification_filters_delete is destructive', () => {
    const tool = notificationsTools.find((t) => t.name === 'notification_filters_delete')!;
    expect(tool.destructive).toBe(true);
  });

  it('notification_channel_preferences_delete is destructive', () => {
    const tool = notificationsTools.find((t) => t.name === 'notification_channel_preferences_delete')!;
    expect(tool.destructive).toBe(true);
  });

  it('notification_filters_list returns { items }', async () => {
    mockedRequest.mockResolvedValueOnce({
      getNotificationFilters: [
        { _id: 'f1', mode: 'mute', notification_category: 'event' },
      ],
    });
    const tool = notificationsTools.find((t) => t.name === 'notification_filters_list')!;
    const result = await tool.execute({});
    expect(result).toEqual({ items: [{ _id: 'f1', mode: 'mute', notification_category: 'event' }] });
  });

  it('notification_filters_set builds input conditionally (only provided fields, plus mode)', async () => {
    mockedRequest.mockResolvedValueOnce({
      setNotificationFilter: { _id: 'new1', mode: 'mute', notification_category: 'event' },
    });
    const tool = notificationsTools.find((t) => t.name === 'notification_filters_set')!;
    await tool.execute({ mode: 'mute', notification_category: 'event' });

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(variables).toEqual({
      input: { mode: 'mute', notification_category: 'event' },
    });
    const input = (variables.input as Record<string, unknown>);
    expect(input).not.toHaveProperty('_id');
    expect(input).not.toHaveProperty('notification_type');
    expect(input).not.toHaveProperty('ref_type');
    expect(input).not.toHaveProperty('ref_id');
    expect(input).not.toHaveProperty('space_scoped');
  });

  it('notification_filters_set includes _id when filter_id is provided', async () => {
    mockedRequest.mockResolvedValueOnce({
      setNotificationFilter: { _id: 'abc', mode: 'hide' },
    });
    const tool = notificationsTools.find((t) => t.name === 'notification_filters_set')!;
    await tool.execute({ filter_id: 'abc', mode: 'hide' });

    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    const input = variables.input as Record<string, unknown>;
    expect(input._id).toBe('abc');
    expect(input.mode).toBe('hide');
  });

  it('notification_filters_set omits empty-string fields', async () => {
    mockedRequest.mockResolvedValueOnce({
      setNotificationFilter: { _id: 'x', mode: 'only' },
    });
    const tool = notificationsTools.find((t) => t.name === 'notification_filters_set')!;
    await tool.execute({
      mode: 'only',
      filter_id: '',
      notification_type: '',
      notification_category: '',
      ref_type: '',
      ref_id: '',
      space_scoped: '',
    });

    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(variables.input).toEqual({ mode: 'only' });
  });

  it('notification_filters_delete returns { deleted: boolean }', async () => {
    mockedRequest.mockResolvedValueOnce({ deleteNotificationFilter: true });
    const tool = notificationsTools.find((t) => t.name === 'notification_filters_delete')!;
    const result = await tool.execute({ filter_id: 'f123' });
    expect(result).toEqual({ deleted: true });
    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(variables).toEqual({ filterId: 'f123' });
  });

  it('notification_channel_preferences_list returns { items }', async () => {
    mockedRequest.mockResolvedValueOnce({
      getNotificationChannelPreferences: [
        { _id: 'p1', enabled_channels: ['push'], notification_category: 'social' },
      ],
    });
    const tool = notificationsTools.find((t) => t.name === 'notification_channel_preferences_list')!;
    const result = await tool.execute({});
    expect(result).toEqual({
      items: [{ _id: 'p1', enabled_channels: ['push'], notification_category: 'social' }],
    });
  });

  it('notification_channel_preferences_set builds input conditionally', async () => {
    mockedRequest.mockResolvedValueOnce({
      setNotificationChannelPreference: { _id: 'p2', enabled_channels: ['push'] },
    });
    const tool = notificationsTools.find((t) => t.name === 'notification_channel_preferences_set')!;
    await tool.execute({
      enabled_channels: ['push'],
      notification_category: 'payment',
    });

    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(variables).toEqual({
      input: { enabled_channels: ['push'], notification_category: 'payment' },
    });
    const input = variables.input as Record<string, unknown>;
    expect(input).not.toHaveProperty('_id');
    expect(input).not.toHaveProperty('notification_type');
    expect(input).not.toHaveProperty('ref_type');
    expect(input).not.toHaveProperty('ref_id');
    expect(input).not.toHaveProperty('space_scoped');
  });

  it('notification_channel_preferences_set includes _id when preference_id is provided', async () => {
    mockedRequest.mockResolvedValueOnce({
      setNotificationChannelPreference: { _id: 'pid', enabled_channels: ['push'] },
    });
    const tool = notificationsTools.find((t) => t.name === 'notification_channel_preferences_set')!;
    await tool.execute({ preference_id: 'pid', enabled_channels: ['push'], ref_type: 'Event', ref_id: 'evt1' });

    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    const input = variables.input as Record<string, unknown>;
    expect(input._id).toBe('pid');
    expect(input.enabled_channels).toEqual(['push']);
    expect(input.ref_type).toBe('Event');
    expect(input.ref_id).toBe('evt1');
  });

  it('notification_channel_preferences_delete returns { deleted: boolean }', async () => {
    mockedRequest.mockResolvedValueOnce({ deleteNotificationChannelPreference: true });
    const tool = notificationsTools.find((t) => t.name === 'notification_channel_preferences_delete')!;
    const result = await tool.execute({ preference_id: 'p99' });
    expect(result).toEqual({ deleted: true });
    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(variables).toEqual({ preferenceId: 'p99' });
  });
});

describe('notification preference consolidated tools', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  for (const name of CONSOLIDATED_TOOL_NAMES) {
    it(`exports ${name} from consolidatedTools`, () => {
      const found = consolidatedTools.find((t) => t.name === name);
      expect(found, `${name} not found in consolidatedTools export`).toBeDefined();
      expect(found!.alwaysLoad).toBe(true);
    });
  }

  it('manage_notification_filters has correct action enum', () => {
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_filters')!;
    const action = tool.params.find((p) => p.name === 'action');
    expect(action).toBeDefined();
    expect(action!.required).toBe(true);
    expect(action!.enum).toEqual(['list', 'set', 'delete']);
  });

  it('manage_notification_channel_preferences has correct action enum', () => {
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_channel_preferences')!;
    const action = tool.params.find((p) => p.name === 'action');
    expect(action).toBeDefined();
    expect(action!.required).toBe(true);
    expect(action!.enum).toEqual(['list', 'set', 'delete']);
  });

  it('manage_notification_filters throws on unknown action', async () => {
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_filters')!;
    await expect(tool.execute({ action: '__nonexistent__' })).rejects.toThrow('Unknown action');
  });

  it('manage_notification_channel_preferences throws on unknown action', async () => {
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_channel_preferences')!;
    await expect(tool.execute({ action: '__nonexistent__' })).rejects.toThrow('Unknown action');
  });

  it('manage_notification_filters delegates list → notification_filters_list', async () => {
    mockedRequest.mockResolvedValueOnce({ getNotificationFilters: [] });
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_filters')!;
    const result = await tool.execute({ action: 'list' });
    expect(result).toEqual({ items: [] });
    expect(mockedRequest).toHaveBeenCalledTimes(1);
    const [query] = mockedRequest.mock.calls[0] as [string];
    expect(query).toContain('getNotificationFilters');
  });

  it('manage_notification_filters delegates set → notification_filters_set and passes args through', async () => {
    mockedRequest.mockResolvedValueOnce({
      setNotificationFilter: { _id: 'new', mode: 'mute' },
    });
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_filters')!;
    await tool.execute({ action: 'set', mode: 'mute', notification_category: 'event' });

    const [query, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(query).toContain('setNotificationFilter');
    expect(variables).toEqual({ input: { mode: 'mute', notification_category: 'event' } });
  });

  it('manage_notification_filters delegates delete → notification_filters_delete', async () => {
    mockedRequest.mockResolvedValueOnce({ deleteNotificationFilter: true });
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_filters')!;
    const result = await tool.execute({ action: 'delete', filter_id: 'f1' });
    expect(result).toEqual({ deleted: true });
    const [query, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(query).toContain('deleteNotificationFilter');
    expect(variables).toEqual({ filterId: 'f1' });
  });

  it('manage_notification_channel_preferences delegates list → notification_channel_preferences_list', async () => {
    mockedRequest.mockResolvedValueOnce({ getNotificationChannelPreferences: [] });
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_channel_preferences')!;
    const result = await tool.execute({ action: 'list' });
    expect(result).toEqual({ items: [] });
    const [query] = mockedRequest.mock.calls[0] as [string];
    expect(query).toContain('getNotificationChannelPreferences');
  });

  it('manage_notification_channel_preferences delegates set → notification_channel_preferences_set', async () => {
    mockedRequest.mockResolvedValueOnce({
      setNotificationChannelPreference: { _id: 'p', enabled_channels: ['push'] },
    });
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_channel_preferences')!;
    await tool.execute({ action: 'set', enabled_channels: ['push'], notification_category: 'event' });

    const [query, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(query).toContain('setNotificationChannelPreference');
    expect(variables).toEqual({
      input: { enabled_channels: ['push'], notification_category: 'event' },
    });
  });

  it('manage_notification_channel_preferences delegates delete → notification_channel_preferences_delete', async () => {
    mockedRequest.mockResolvedValueOnce({ deleteNotificationChannelPreference: true });
    const tool = consolidatedTools.find((t) => t.name === 'manage_notification_channel_preferences')!;
    const result = await tool.execute({ action: 'delete', preference_id: 'p9' });
    expect(result).toEqual({ deleted: true });
    const [query, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(query).toContain('deleteNotificationChannelPreference');
    expect(variables).toEqual({ preferenceId: 'p9' });
  });
});
