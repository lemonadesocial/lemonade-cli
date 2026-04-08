import { describe, it, expect, vi } from 'vitest';
import { executeToolCalls } from '../../../src/chat/tools/executor';
import { ToolDef } from '../../../src/chat/providers/interface';
import { createSessionState } from '../../../src/chat/session/state';

function mockTool(overrides: Partial<ToolDef> = {}): ToolDef {
  return {
    name: 'test_tool',
    displayName: 'Test Tool',
    description: 'A test tool',
    params: [
      { name: 'title', type: 'string', description: 'Title', required: true },
    ],
    destructive: false,
    execute: vi.fn().mockResolvedValue({ _id: '123', title: 'Created' }),
    backendType: 'mutation',
    ...overrides,
  };
}

function mockQueryTool(overrides: Partial<ToolDef> = {}): ToolDef {
  return {
    name: 'test_query',
    displayName: 'Test Query',
    description: 'A test query tool',
    params: [
      { name: 'id', type: 'string', description: 'ID', required: true },
    ],
    destructive: false,
    execute: vi.fn().mockResolvedValue({ _id: '456', title: 'Fetched' }),
    backendType: 'query',
    ...overrides,
  };
}

describe('dry-run mode', () => {
  it('returns preview for mutation tool when dryRun is true', async () => {
    const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
    session.dryRun = true;

    const tool = mockTool();
    const registry = { test_tool: tool };

    const { results, fatal } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { title: 'My Event' } }],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(false);
    expect(results).toHaveLength(1);
    expect(tool.execute).not.toHaveBeenCalled();

    const parsed = JSON.parse(results[0].content);
    expect(parsed.dryRun).toBe(true);
    expect(parsed.tool).toBe('Test Tool');
    expect(parsed.operation).toBe('mutation');
    expect(parsed.args).toEqual({ title: 'My Event' });
    expect(parsed.message).toContain('Dry run');
    expect(results[0].is_error).toBeUndefined();
  });

  it('executes query tool normally when dryRun is true', async () => {
    const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
    session.dryRun = true;

    const tool = mockQueryTool();
    const registry = { test_query: tool };

    const { results, fatal } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_query', arguments: { id: 'abc' } }],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(false);
    expect(results).toHaveLength(1);
    expect(tool.execute).toHaveBeenCalled();

    const parsed = JSON.parse(results[0].content);
    expect(parsed._id).toBe('456');
    expect(parsed.dryRun).toBeUndefined();
  });

  it('preview contains tool name, args, and dryRun flag', async () => {
    const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
    session.dryRun = true;

    const tool = mockTool({ displayName: 'Create Event' });
    const registry = { test_tool: tool };

    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { title: 'Conference 2026' } }],
      registry,
      session,
      null,
      false,
    );

    const parsed = JSON.parse(results[0].content);
    expect(parsed.dryRun).toBe(true);
    expect(parsed.tool).toBe('Create Event');
    expect(parsed.args.title).toBe('Conference 2026');
  });

  it('executes mutation normally when dryRun is not set', async () => {
    const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
    // dryRun not set (defaults to undefined/falsy)

    const tool = mockTool();
    const registry = { test_tool: tool };

    const { results, fatal } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { title: 'My Event' } }],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(false);
    expect(results).toHaveLength(1);
    expect(tool.execute).toHaveBeenCalledWith(
      { title: 'My Event' },
      expect.objectContaining({ defaultSpace: undefined }),
    );

    const parsed = JSON.parse(results[0].content);
    expect(parsed._id).toBe('123');
    expect(parsed.dryRun).toBeUndefined();
  });
});
