import { describe, it, expect, vi } from 'vitest';
import { executeToolCalls } from '../../../src/chat/tools/executor';
import { ToolDef, ToolResultMessage } from '../../../src/chat/providers/interface';
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
    execute: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

describe('tool result message format', () => {
  const session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });

  it('every tool result content block has type: tool_result', async () => {
    const tool = mockTool();
    const registry = { test_tool: tool };

    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { id: 'abc' } }],
      registry,
      session,
      null,
      false,
    );

    for (const result of results) {
      expect(result.type).toBe('tool_result');
    }
  });

  it('error results include type: tool_result', async () => {
    const tool = mockTool({
      execute: vi.fn().mockRejectedValue(new Error('fail')),
    });
    const registry = { test_tool: tool };

    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { id: 'abc' } }],
      registry,
      session,
      null,
      false,
    );

    expect(results[0].type).toBe('tool_result');
    expect(results[0].is_error).toBe(true);
  });

  it('unknown tool results include type: tool_result', async () => {
    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'nonexistent', arguments: {} }],
      {},
      session,
      null,
      false,
    );

    expect(results[0].type).toBe('tool_result');
    expect(results[0].is_error).toBe(true);
  });

  it('destructive tool decline in non-TTY includes type: tool_result', async () => {
    const tool = mockTool({ destructive: true });
    const registry = { test_tool: tool };

    const { results } = await executeToolCalls(
      [{ id: 'tc1', name: 'test_tool', arguments: { id: 'abc' } }],
      registry,
      session,
      null,
      false,
    );

    expect(results[0].type).toBe('tool_result');
  });

  it('multiple tool results all have type: tool_result', async () => {
    const tool1 = mockTool({ name: 'tool_a' });
    const tool2 = mockTool({ name: 'tool_b' });
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

    for (const result of results) {
      expect(result.type).toBe('tool_result');
    }
  });
});
