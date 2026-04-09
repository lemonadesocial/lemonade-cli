import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/api/graphql.js', () => ({
  graphqlRequest: vi.fn(),
}));

import { graphqlRequest } from '../../../../src/api/graphql.js';
import { notificationsTools } from '../../../../src/chat/tools/domains/notifications.js';

const mockedRequest = graphqlRequest as unknown as ReturnType<typeof vi.fn>;

describe('notifications_list category filter', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  const tool = notificationsTools.find((t) => t.name === 'notifications_list')!;

  it('exposes an optional category param with the expected enum values', () => {
    const param = tool.params.find((p) => p.name === 'category');
    expect(param).toBeDefined();
    expect(param!.required).toBe(false);
    expect(param!.enum).toEqual([
      'event', 'social', 'messaging', 'payment', 'space', 'store', 'system',
    ]);
  });

  it('uses the getNotifications resolver', () => {
    expect(tool.backendResolver).toBe('getNotifications');
  });

  it('passes category through to the GraphQL query when provided', async () => {
    mockedRequest.mockResolvedValueOnce({ getNotifications: [] });
    await tool.execute({ category: 'event' });

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    const [query, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(query).toContain('getNotifications');
    expect(query).toContain('$category: NotificationCategory');
    expect(variables).toEqual({ skip: 0, limit: 25, category: 'event' });
  });

  it('requests expanded fields (from_expanded, ref_event_expanded, ref_space_expanded)', async () => {
    mockedRequest.mockResolvedValueOnce({ getNotifications: [] });
    await tool.execute({});

    const [query] = mockedRequest.mock.calls[0] as [string];
    expect(query).toContain('from_expanded');
    expect(query).toContain('ref_event_expanded');
    expect(query).toContain('ref_space_expanded');
  });

  it('omits category from variables when not provided', async () => {
    mockedRequest.mockResolvedValueOnce({ getNotifications: [] });
    await tool.execute({});

    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(variables).toEqual({ skip: 0, limit: 25 });
    expect(variables).not.toHaveProperty('category');
  });

  it('passes limit and skip through', async () => {
    mockedRequest.mockResolvedValueOnce({ getNotifications: [] });
    await tool.execute({ limit: 10, skip: 5 });

    const [, variables] = mockedRequest.mock.calls[0] as [string, Record<string, unknown>];
    expect(variables).toEqual({ skip: 5, limit: 10 });
  });

  it('wraps the result as { items: [...] } and surfaces expanded names', async () => {
    mockedRequest.mockResolvedValueOnce({
      getNotifications: [
        {
          _id: '1',
          type: 'event_published',
          title: 'Welcome',
          message: 'msg',
          created_at: '2026-01-01',
          is_seen: false,
          from_expanded: { _id: 'u1', name: 'Alice' },
          ref_event_expanded: { _id: 'e1', title: 'Pizza Party' },
          ref_space_expanded: { _id: 's1', title: 'Foodies' },
        },
      ],
    });
    const result = await tool.execute({});
    expect(result).toEqual({
      items: [
        {
          _id: '1',
          type: 'event_published',
          title: 'Welcome',
          message: 'msg',
          created_at: '2026-01-01',
          is_seen: false,
          from_user_name: 'Alice',
          ref_event_title: 'Pizza Party',
          ref_space_title: 'Foodies',
        },
      ],
    });
  });

  it('handles missing expanded fields gracefully', async () => {
    mockedRequest.mockResolvedValueOnce({
      getNotifications: [
        {
          _id: '2',
          type: 'system',
          created_at: '2026-01-02',
        },
      ],
    });
    const result = (await tool.execute({})) as { items: Array<Record<string, unknown>> };
    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    // Fields present on the source payload should pass through.
    expect(item._id).toBe('2');
    expect(item.type).toBe('system');
    expect(item.created_at).toBe('2026-01-02');
    // Missing expanded sub-objects should resolve to undefined name/title fields
    // (rather than crashing on null deref).
    expect(item.from_user_name).toBeUndefined();
    expect(item.ref_event_title).toBeUndefined();
    expect(item.ref_space_title).toBeUndefined();
  });
});
