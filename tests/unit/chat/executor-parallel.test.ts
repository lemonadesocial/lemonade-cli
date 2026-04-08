import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeToolCalls } from '../../../src/chat/tools/executor';
import { ToolDef } from '../../../src/chat/providers/interface';
import { createSessionState, SessionState } from '../../../src/chat/session/state';

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
    backendType: 'query',
    ...overrides,
  } as ToolDef;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('parallel tool execution', () => {
  let session: SessionState;

  beforeEach(() => {
    session = createSessionState({ _id: 'u1', name: 'Test', email: 'test@test.com' });
  });

  it('two query tools execute concurrently', async () => {
    const startTimes: Record<string, number> = {};
    const endTimes: Record<string, number> = {};

    const toolA = mockTool({
      name: 'tool_a',
      execute: vi.fn().mockImplementation(async () => {
        startTimes['a'] = Date.now();
        await delay(50);
        endTimes['a'] = Date.now();
        return { result: 'a' };
      }),
    });
    const toolB = mockTool({
      name: 'tool_b',
      execute: vi.fn().mockImplementation(async () => {
        startTimes['b'] = Date.now();
        await delay(50);
        endTimes['b'] = Date.now();
        return { result: 'b' };
      }),
    });

    const registry = { tool_a: toolA, tool_b: toolB };

    const { results, fatal } = await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_a', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_b', arguments: { id: '2' } },
      ],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(false);
    expect(results).toHaveLength(2);

    // Both should start before either finishes (concurrent execution)
    expect(startTimes['b']).toBeLessThanOrEqual(endTimes['a']);
    expect(startTimes['a']).toBeLessThanOrEqual(endTimes['b']);
  });

  it('a mutation tool forces sequential execution', async () => {
    const callOrder: string[] = [];

    const toolA = mockTool({
      name: 'tool_a',
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('a_start');
        await delay(10);
        callOrder.push('a_end');
        return { result: 'a' };
      }),
    });
    const toolMut = mockTool({
      name: 'tool_mut',
      backendType: 'mutation',
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('mut_start');
        await delay(10);
        callOrder.push('mut_end');
        return { result: 'mut' };
      }),
    });
    const toolB = mockTool({
      name: 'tool_b',
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('b_start');
        await delay(10);
        callOrder.push('b_end');
        return { result: 'b' };
      }),
    });

    const registry = { tool_a: toolA, tool_mut: toolMut, tool_b: toolB };

    const { results } = await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_a', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_mut', arguments: { id: '2' } },
        { id: 'tc3', name: 'tool_b', arguments: { id: '3' } },
      ],
      registry,
      session,
      null,
      false,
    );

    expect(results).toHaveLength(3);
    // tool_a runs first (parallel batch of 1), then mut sequential, then tool_b sequential
    // Mutation must start after tool_a ends
    expect(callOrder.indexOf('mut_start')).toBeGreaterThan(callOrder.indexOf('a_end'));
    // tool_b must start after mutation ends
    expect(callOrder.indexOf('b_start')).toBeGreaterThan(callOrder.indexOf('mut_end'));
  });

  it('a destructive tool runs alone', async () => {
    const callOrder: string[] = [];

    const toolA = mockTool({
      name: 'tool_a',
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('a');
        return { result: 'a' };
      }),
    });
    const toolDestructive = mockTool({
      name: 'tool_d',
      destructive: true,
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('d');
        return { result: 'd' };
      }),
    });
    const toolB = mockTool({
      name: 'tool_b',
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('b');
        return { result: 'b' };
      }),
    });

    const registry = { tool_a: toolA, tool_d: toolDestructive, tool_b: toolB };

    // Non-TTY mode: destructive tool will be auto-declined
    const { results } = await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_a', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_d', arguments: { id: '2' } },
        { id: 'tc3', name: 'tool_b', arguments: { id: '3' } },
      ],
      registry,
      session,
      null,
      false,
    );

    expect(results).toHaveLength(3);
    // Destructive tool should be declined (non-TTY)
    expect(results[1].content).toContain('declined');
    // tool_a and tool_b still execute
    expect(callOrder).toContain('a');
    expect(callOrder).toContain('b');
    expect(callOrder).not.toContain('d');
  });

  it('mixed batch: [query, query, mutation, query] executes correctly', async () => {
    const startTimes: Record<string, number> = {};
    const endTimes: Record<string, number> = {};

    function timedTool(id: string, overrides: Partial<ToolDef> = {}): ToolDef {
      return mockTool({
        name: `tool_${id}`,
        execute: vi.fn().mockImplementation(async () => {
          startTimes[id] = Date.now();
          await delay(30);
          endTimes[id] = Date.now();
          return { result: id };
        }),
        ...overrides,
      });
    }

    const q1 = timedTool('q1');
    const q2 = timedTool('q2');
    const m1 = timedTool('m1', { backendType: 'mutation' });
    const q3 = timedTool('q3');

    const registry = { tool_q1: q1, tool_q2: q2, tool_m1: m1, tool_q3: q3 };

    const { results } = await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_q1', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_q2', arguments: { id: '2' } },
        { id: 'tc3', name: 'tool_m1', arguments: { id: '3' } },
        { id: 'tc4', name: 'tool_q3', arguments: { id: '4' } },
      ],
      registry,
      session,
      null,
      false,
    );

    expect(results).toHaveLength(4);

    // q1 and q2 should run in parallel (both start before either finishes)
    expect(startTimes['q2']).toBeLessThanOrEqual(endTimes['q1']);
    expect(startTimes['q1']).toBeLessThanOrEqual(endTimes['q2']);

    // m1 must start after the parallel batch completes
    expect(startTimes['m1']).toBeGreaterThanOrEqual(endTimes['q1']);
    expect(startTimes['m1']).toBeGreaterThanOrEqual(endTimes['q2']);

    // q3 must start after m1 completes (it's alone after a sequential break)
    expect(startTimes['q3']).toBeGreaterThanOrEqual(endTimes['m1']);
  });

  it('session updates apply in original call order after parallel batch', async () => {
    const updateOrder: string[] = [];

    // Spy on updateSession to track call order
    const { updateSession: realUpdate } = await import('../../../src/chat/session/state');
    const updateSpy = vi.spyOn(
      await import('../../../src/chat/session/state'),
      'updateSession',
    ).mockImplementation((s, name, result) => {
      updateOrder.push(name);
    });

    const toolA = mockTool({
      name: 'tool_a',
      execute: vi.fn().mockImplementation(async () => {
        // tool_a takes longer — without ordering, it would finish second
        await delay(40);
        return { result: 'a' };
      }),
    });
    const toolB = mockTool({
      name: 'tool_b',
      execute: vi.fn().mockImplementation(async () => {
        await delay(10);
        return { result: 'b' };
      }),
    });

    const registry = { tool_a: toolA, tool_b: toolB };

    await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_a', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_b', arguments: { id: '2' } },
      ],
      registry,
      session,
      null,
      false,
    );

    // Even though tool_b finishes first, session updates are in original order
    expect(updateOrder).toEqual(['tool_a', 'tool_b']);

    updateSpy.mockRestore();
  });

  it('a failing tool in a parallel batch does not prevent others from completing', async () => {
    const toolA = mockTool({
      name: 'tool_a',
      execute: vi.fn().mockRejectedValue(new Error('tool_a failed')),
    });
    const toolB = mockTool({
      name: 'tool_b',
      execute: vi.fn().mockResolvedValue({ result: 'b' }),
    });

    const registry = { tool_a: toolA, tool_b: toolB };

    const { results, fatal } = await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_a', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_b', arguments: { id: '2' } },
      ],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(false);
    expect(results).toHaveLength(2);

    // tool_a should have errored
    expect(results[0].is_error).toBe(true);
    expect(results[0].content).toContain('tool_a failed');

    // tool_b should have succeeded
    expect(results[1].is_error).toBeUndefined();
    expect(JSON.parse(results[1].content)).toEqual({ result: 'b' });
  });

  it('fatal error in batch stops further execution', async () => {
    const toolA = mockTool({
      name: 'tool_a',
      execute: vi.fn().mockRejectedValue(
        Object.assign(new TypeError('fetch failed'), {}),
      ),
    });
    const toolB = mockTool({
      name: 'tool_b',
      execute: vi.fn().mockResolvedValue({ result: 'b' }),
    });
    const toolC = mockTool({
      name: 'tool_c',
      backendType: 'mutation',
      execute: vi.fn().mockResolvedValue({ result: 'c' }),
    });

    const registry = { tool_a: toolA, tool_b: toolB, tool_c: toolC };

    const { results, fatal } = await executeToolCalls(
      [
        { id: 'tc1', name: 'tool_a', arguments: { id: '1' } },
        { id: 'tc2', name: 'tool_b', arguments: { id: '2' } },
        { id: 'tc3', name: 'tool_c', arguments: { id: '3' } },
      ],
      registry,
      session,
      null,
      false,
    );

    expect(fatal).toBe(true);
    // tool_a and tool_b were in the same parallel batch, both complete
    // but tool_c should NOT have executed (fatal stops further batches)
    expect(results.length).toBeLessThanOrEqual(2);
    expect(toolC.execute).not.toHaveBeenCalled();
  });
});
