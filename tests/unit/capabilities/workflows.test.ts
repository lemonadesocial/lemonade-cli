import { describe, it, expect } from 'vitest';
import { WORKFLOWS, workflowsToCapabilities } from '../../../src/capabilities/workflows.js';

describe('WORKFLOWS', () => {
  it('all workflows have required fields', () => {
    for (const wf of WORKFLOWS) {
      expect(wf.name).toBeTruthy();
      expect(wf.displayName).toBeTruthy();
      expect(wf.description).toBeTruthy();
      expect(wf.category).toBeTruthy();
      expect(wf.steps.length).toBeGreaterThan(0);
    }
  });

  it('all steps have required fields', () => {
    for (const wf of WORKFLOWS) {
      for (const step of wf.steps) {
        expect(step.toolName).toBeTruthy();
        expect(step.description).toBeTruthy();
      }
    }
  });

  it('workflow names are unique', () => {
    const names = WORKFLOWS.map((w) => w.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('workflowsToCapabilities', () => {
  it('creates one capability per workflow', () => {
    const caps = workflowsToCapabilities();
    expect(caps.length).toBe(WORKFLOWS.length);
  });

  it('capabilities have correct names and category', () => {
    const caps = workflowsToCapabilities();
    for (const cap of caps) {
      expect(cap.category).toBe('workflow');
      expect(cap.backendType).toBe('none');
      expect(cap.surfaces).toContain('aiTool');
    }
  });

  it('derives params from $input references', () => {
    const caps = workflowsToCapabilities();
    const paidEvent = caps.find((c) => c.name === 'workflow_paid_event')!;
    const paramNames = paidEvent.params.map((p) => p.name);
    expect(paramNames).toContain('title');
    expect(paramNames).toContain('start');
    expect(paramNames).toContain('space');
    expect(paramNames).toContain('ticket_title');
    expect(paramNames).toContain('ticket_price');
  });

  it('does not include $steps references as params', () => {
    const caps = workflowsToCapabilities();
    for (const cap of caps) {
      for (const param of cap.params) {
        expect(param.name).not.toMatch(/^\$steps/);
      }
    }
  });

  it('deduplicates params used across multiple steps', () => {
    const caps = workflowsToCapabilities();
    const healthCheck = caps.find((c) => c.name === 'workflow_event_health_check')!;
    // event_id is used in all 3 steps but should appear only once
    const eventIdParams = healthCheck.params.filter((p) => p.name === 'event_id');
    expect(eventIdParams.length).toBe(1);
  });
});
