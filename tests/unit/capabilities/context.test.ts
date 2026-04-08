import { describe, it, expect } from 'vitest';
import type { ExecutionContext } from '../../../src/capabilities/types.js';
import type { SessionState } from '../../../src/chat/session/state.js';

// Reproduce buildContext logic for testing (it's a private function in executor.ts)
function buildContext(session: SessionState): ExecutionContext {
  return {
    defaultSpace: session.defaultSpace,
    currentSpace: session.currentSpace,
    currentEvent: session.currentEvent,
    timezone: session.timezone,
  };
}

describe('ExecutionContext', () => {
  it('can be constructed with all fields', () => {
    const ctx: ExecutionContext = {
      defaultSpace: 'space-123',
      currentSpace: { _id: 'space-123', title: 'My Space' },
      currentEvent: { _id: 'event-456', title: 'My Event' },
      timezone: 'America/New_York',
    };

    expect(ctx.defaultSpace).toBe('space-123');
    expect(ctx.currentSpace?._id).toBe('space-123');
    expect(ctx.currentEvent?._id).toBe('event-456');
    expect(ctx.timezone).toBe('America/New_York');
  });

  it('can be constructed with no fields (all optional)', () => {
    const ctx: ExecutionContext = {};

    expect(ctx.defaultSpace).toBeUndefined();
    expect(ctx.currentSpace).toBeUndefined();
    expect(ctx.currentEvent).toBeUndefined();
    expect(ctx.timezone).toBeUndefined();
  });
});

describe('buildContext', () => {
  it('extracts correct fields from SessionState', () => {
    const session: SessionState = {
      user: { _id: 'u1', name: 'Test', email: 'test@test.com' },
      defaultSpace: 'sp-1',
      currentSpace: { _id: 'sp-1', title: 'Space One' },
      currentEvent: { _id: 'ev-1', title: 'Event One' },
      timezone: 'UTC',
    };

    const ctx = buildContext(session);

    expect(ctx.defaultSpace).toBe('sp-1');
    expect(ctx.currentSpace).toEqual({ _id: 'sp-1', title: 'Space One' });
    expect(ctx.currentEvent).toEqual({ _id: 'ev-1', title: 'Event One' });
    expect(ctx.timezone).toBe('UTC');
  });

  it('handles session with no optional fields', () => {
    const session: SessionState = {
      user: { _id: 'u1', name: 'Test', email: 'test@test.com' },
    };

    const ctx = buildContext(session);

    expect(ctx.defaultSpace).toBeUndefined();
    expect(ctx.currentSpace).toBeUndefined();
    expect(ctx.currentEvent).toBeUndefined();
    expect(ctx.timezone).toBeUndefined();
  });
});

describe('context is optional for tool execute', () => {
  it('tools work when context is undefined', async () => {
    const { buildCapability } = await import('../../../src/capabilities/factory.js');
    const cap = buildCapability({
      name: 'test_ctx',
      displayName: 'Test Context',
      description: 'Tests context optionality',
      category: 'system',
      params: [],
      destructive: false,
      execute: async (_args, context) => {
        return { space: context?.defaultSpace ?? 'none' };
      },
      backendType: 'none',
    });

    // Call without context
    const result1 = await cap.execute({});
    expect(result1).toEqual({ space: 'none' });

    // Call with context
    const result2 = await cap.execute({}, { defaultSpace: 'sp-1' });
    expect(result2).toEqual({ space: 'sp-1' });
  });
});
