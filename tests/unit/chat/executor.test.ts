import { describe, it, expect, vi } from 'vitest';
import { executeToolCalls } from '../../../src/chat/tools/executor';
import { ToolDef } from '../../../src/chat/providers/interface';
import { createSessionState } from '../../../src/chat/session/state';

function mockTool(overrides: Partial<ToolDef> = {}): ToolDef {
  return {
    name: 'test_tool',
    displayName: 'test tool',
    description: 'A test tool',
    params: [
      { name: 'id', type: 'string', description: 'ID', required: true },
    ],
    destructive: false,
    execute: vi.fn().mockResolvedValue({ _id: '123', title: 'Result' }),
    ...overrides,
  };
}

describe('executeToolCalls', () => {
  const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });

  it('executes a valid tool call', async () => {
    const tool = mockTool();
    const registry = { test_tool: tool };

    const { results, fatal } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { id: 'abc' } }],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(false);
    expect(results).toHaveLength(1);
    expect(results[0].tool_use_id).toBe('tc1');
    expect(results[0].is_error).toBeUndefined();
    expect(JSON.parse(results[0].content)).toEqual({ _id: '123', title: 'Result' });
    expect(tool.execute).toHaveBeenCalledWith({ id: 'abc' });
  });

  it('returns error for unknown tool', async () => {
    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'nonexistent', arguments: {} }],
      {},
      session,
      null,
      false,
    );

    expect(results[0].is_error).toBe(true);
    expect(results[0].content).toContain('Unknown tool');
  });

  it('returns error for invalid params', async () => {
    const tool = mockTool();
    const registry = { test_tool: tool };

    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { unknown_param: 'x' } }],
      registry,
      session,
      null,
      false,
    );

    expect(results[0].is_error).toBe(true);
  });

  it('auto-declines destructive tools in non-TTY mode', async () => {
    const tool = mockTool({ destructive: true });
    const registry = { test_tool: tool };

    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { id: 'abc' } }],
      registry,
      session,
      null,
      false,
    );

    expect(results[0].content).toContain('declined');
    expect(tool.execute).not.toHaveBeenCalled();
  });

  it('handles tool execution errors gracefully', async () => {
    const tool = mockTool({
      execute: vi.fn().mockRejectedValue(new Error('Something went wrong')),
    });
    const registry = { test_tool: tool };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { results, fatal } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { id: 'abc' } }],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(false);
    expect(results[0].is_error).toBe(true);
    expect(results[0].content).toContain('Something went wrong');

    consoleSpy.mockRestore();
  });

  it('executes multiple tool calls sequentially', async () => {
    const callOrder: string[] = [];
    const tool1 = mockTool({
      name: 'tool_a',
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('a');
        return { result: 'a' };
      }),
    });
    const tool2 = mockTool({
      name: 'tool_b',
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('b');
        return { result: 'b' };
      }),
    });
    const registry = { tool_a: tool1, tool_b: tool2 };

    const { results } = await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_a', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_b', arguments: { id: '2' } },
      ],
      registry,
      session,
      null,
      false,
    );

    expect(results).toHaveLength(2);
    expect(callOrder).toEqual(['a', 'b']);
  });
});
