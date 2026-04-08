import { describe, it, expect, vi } from 'vitest';
import { resolveArgs, executeWorkflow } from '../../../src/capabilities/workflow-runner.js';
import type { CanonicalCapability } from '../../../src/capabilities/types.js';
import type { Workflow } from '../../../src/capabilities/workflows.js';

// ── resolveArgs ───────────────────────────────────────────────────────

describe('resolveArgs', () => {
  it('resolves $input references', () => {
    const result = resolveArgs(
      { title: '$input.myTitle', count: 5 },
      { myTitle: 'Hello' },
      [],
    );
    expect(result).toEqual({ title: 'Hello', count: 5 });
  });

  it('resolves $steps references', () => {
    const stepResults = [
      { stepIndex: 0, toolName: 'tool_a', description: 'step a', success: true, result: { _id: 'abc123' } },
    ];
    const result = resolveArgs(
      { event_id: '$steps.0.result._id' },
      {},
      stepResults,
    );
    expect(result).toEqual({ event_id: 'abc123' });
  });

  it('returns undefined for $steps reference to failed step', () => {
    const stepResults = [
      { stepIndex: 0, toolName: 'tool_a', description: 'step a', success: false, error: 'fail' },
    ];
    const result = resolveArgs(
      { event_id: '$steps.0.result._id' },
      {},
      stepResults,
    );
    expect(result.event_id).toBeUndefined();
  });

  it('passes through literal values', () => {
    const result = resolveArgs(
      { flag: true, num: 42, str: 'literal' },
      {},
      [],
    );
    expect(result).toEqual({ flag: true, num: 42, str: 'literal' });
  });

  it('returns empty object for undefined mapping', () => {
    const result = resolveArgs(undefined, { x: 1 }, []);
    expect(result).toEqual({});
  });

  it('handles nested $steps path', () => {
    const stepResults = [
      { stepIndex: 0, toolName: 'tool_a', description: 'd', success: true, result: { data: { nested: { id: 'deep' } } } },
    ];
    const result = resolveArgs(
      { val: '$steps.0.result.data.nested.id' },
      {},
      stepResults,
    );
    expect(result.val).toBe('deep');
  });
});

// ── executeWorkflow ───────────────────────────────────────────────────

function makeCap(name: string, fn: (args: Record<string, unknown>) => Promise<unknown>): CanonicalCapability {
  return {
    name,
    displayName: name,
    description: name,
    category: 'system',
    params: [],
    destructive: false,
    execute: fn,
    backendType: 'none',
    backendService: 'local',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
  };
}

function makeWorkflow(overrides?: Partial<Workflow>): Workflow {
  return {
    name: 'test_workflow',
    displayName: 'Test Workflow',
    description: 'A test workflow',
    category: 'workflow',
    steps: [
      { toolName: 'step_a', description: 'Step A', argMapping: { x: '$input.x' } },
      { toolName: 'step_b', description: 'Step B', argMapping: { prev: '$steps.0.result.id' } },
    ],
    ...overrides,
  };
}

describe('executeWorkflow', () => {
  it('runs all steps in order', async () => {
    const order: string[] = [];
    const caps = [
      makeCap('step_a', async (args) => { order.push('a'); return { id: 'res_a' }; }),
      makeCap('step_b', async (args) => { order.push('b'); return { id: 'res_b' }; }),
    ];

    const result = await executeWorkflow(makeWorkflow(), { x: 'hello' }, caps);

    expect(result.success).toBe(true);
    expect(result.steps.length).toBe(2);
    expect(order).toEqual(['a', 'b']);
    expect(result.steps[1].result).toEqual({ id: 'res_b' });
  });

  it('passes resolved args between steps', async () => {
    const receivedArgs: Record<string, unknown>[] = [];
    const caps = [
      makeCap('step_a', async (args) => { receivedArgs.push(args); return { id: 'ID_FROM_A' }; }),
      makeCap('step_b', async (args) => { receivedArgs.push(args); return { done: true }; }),
    ];

    await executeWorkflow(makeWorkflow(), { x: 'val' }, caps);

    expect(receivedArgs[0]).toEqual({ x: 'val' });
    expect(receivedArgs[1]).toEqual({ prev: 'ID_FROM_A' });
  });

  it('stops on non-optional step failure', async () => {
    const caps = [
      makeCap('step_a', async () => { throw new Error('boom'); }),
      makeCap('step_b', async () => ({ ok: true })),
    ];

    const result = await executeWorkflow(makeWorkflow(), { x: '1' }, caps);

    expect(result.success).toBe(false);
    expect(result.steps.length).toBe(1);
    expect(result.steps[0].success).toBe(false);
    expect(result.steps[0].error).toBe('boom');
  });

  it('continues past optional step failure', async () => {
    const wf = makeWorkflow({
      steps: [
        { toolName: 'step_a', description: 'Optional step', argMapping: {}, optional: true },
        { toolName: 'step_b', description: 'Required step', argMapping: {} },
      ],
    });
    const caps = [
      makeCap('step_a', async () => { throw new Error('optional fail'); }),
      makeCap('step_b', async () => ({ done: true })),
    ];

    const result = await executeWorkflow(wf, {}, caps);

    // step_a failed but optional, step_b succeeded
    expect(result.steps.length).toBe(2);
    expect(result.steps[0].success).toBe(false);
    expect(result.steps[1].success).toBe(true);
    // Overall fails because not all steps succeeded
    expect(result.success).toBe(false);
  });

  it('returns partial result on failure', async () => {
    const wf = makeWorkflow({
      steps: [
        { toolName: 'step_a', description: 'Good', argMapping: {} },
        { toolName: 'step_b', description: 'Bad', argMapping: {} },
        { toolName: 'step_c', description: 'Never reached', argMapping: {} },
      ],
    });
    const caps = [
      makeCap('step_a', async () => ({ ok: true })),
      makeCap('step_b', async () => { throw new Error('fail'); }),
      makeCap('step_c', async () => ({ ok: true })),
    ];

    const result = await executeWorkflow(wf, {}, caps);

    expect(result.success).toBe(false);
    expect(result.steps.length).toBe(2); // step_c never ran
    expect(result.steps[0].success).toBe(true);
    expect(result.steps[1].success).toBe(false);
    expect(result.summary).toContain('failed');
    expect(result.summary).toContain('1/3');
  });

  it('handles missing capability', async () => {
    const wf = makeWorkflow({
      steps: [{ toolName: 'nonexistent', description: 'Missing tool', argMapping: {} }],
    });

    const result = await executeWorkflow(wf, {}, []);

    expect(result.success).toBe(false);
    expect(result.steps[0].error).toContain('not found');
  });

  it('generates success summary', async () => {
    const wf = makeWorkflow({ steps: [{ toolName: 'step_a', description: 'Only step', argMapping: {} }] });
    const caps = [makeCap('step_a', async () => ({ ok: true }))];

    const result = await executeWorkflow(wf, {}, caps);

    expect(result.summary).toContain('completed successfully');
    expect(result.summary).toContain('1/1');
  });
});
