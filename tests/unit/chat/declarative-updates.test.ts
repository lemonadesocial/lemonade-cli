import { describe, it, expect } from 'vitest';
import { createSessionState, updateSession } from '../../../src/chat/session/state';

describe('Declarative Session Updates', () => {
  const mockUser = { _id: 'u1', name: 'Test User', email: 'test@example.com' };

  it('applies declarative sessionUpdates to session', () => {
    const session = createSessionState(mockUser);
    const updates = [
      {
        field: 'currentSpace',
        extract: (r: unknown) => {
          const d = r as Record<string, unknown>;
          return { _id: d._id, title: d.title };
        },
      },
    ];

    updateSession(session, 'space_create', { _id: 's1', title: 'My Space' }, updates);

    expect(session.currentSpace).toEqual({ _id: 's1', title: 'My Space' });
  });

  it('applies multiple sessionUpdates from a single tool result', () => {
    const session = createSessionState(mockUser);
    const updates = [
      {
        field: 'lastCreatedEvent',
        extract: (r: unknown) => {
          const d = r as Record<string, unknown>;
          return { _id: d._id, title: d.title };
        },
      },
      {
        field: 'currentEvent',
        extract: (r: unknown) => {
          const d = r as Record<string, unknown>;
          return { _id: d._id, title: d.title };
        },
      },
      {
        field: 'currentSpace',
        extract: (r: unknown) => {
          const d = r as Record<string, unknown>;
          const space = d.hosted_by as Record<string, unknown> | undefined;
          return space ? { _id: space._id, title: space.title } : undefined;
        },
      },
    ];

    updateSession(
      session,
      'event_create',
      { _id: 'e1', title: 'Party', hosted_by: { _id: 's1', title: 'Cool Space' } },
      updates,
    );

    expect(session.lastCreatedEvent).toEqual({ _id: 'e1', title: 'Party' });
    expect(session.currentEvent).toEqual({ _id: 'e1', title: 'Party' });
    expect(session.currentSpace).toEqual({ _id: 's1', title: 'Cool Space' });
  });

  it('skips update when extract returns undefined', () => {
    const session = createSessionState(mockUser);
    session.currentSpace = { _id: 'existing', title: 'Existing Space' };

    const updates = [
      {
        field: 'currentSpace',
        extract: () => undefined,
      },
    ];

    updateSession(session, 'some_tool', { _id: 'x' }, updates);

    // Should not overwrite existing value
    expect(session.currentSpace).toEqual({ _id: 'existing', title: 'Existing Space' });
  });

  it('silently skips when extract throws', () => {
    const session = createSessionState(mockUser);
    const updates = [
      {
        field: 'currentSpace',
        extract: () => {
          throw new Error('boom');
        },
      },
      {
        field: 'currentEvent',
        extract: (r: unknown) => {
          const d = r as Record<string, unknown>;
          return { _id: d._id, title: d.title };
        },
      },
    ];

    updateSession(session, 'event_create', { _id: 'e1', title: 'Party' }, updates);

    // First update threw, so currentSpace should be unset
    expect(session.currentSpace).toBeUndefined();
    // Second update should still succeed
    expect(session.currentEvent).toEqual({ _id: 'e1', title: 'Party' });
  });

  it('falls back to legacy switch when no sessionUpdates provided', () => {
    const session = createSessionState(mockUser);

    // No sessionUpdates arg — should use legacy switch
    updateSession(session, 'space_create', { _id: 's2', title: 'Legacy Space' });

    expect(session.currentSpace).toEqual({ _id: 's2', title: 'Legacy Space' });
  });

  it('declarative path takes priority over legacy switch', () => {
    const session = createSessionState(mockUser);

    // Provide sessionUpdates that set a DIFFERENT value than the switch would
    const updates = [
      {
        field: 'currentSpace',
        extract: (r: unknown) => {
          const d = r as Record<string, unknown>;
          return { _id: d._id, title: `Declarative: ${d.title}` };
        },
      },
    ];

    updateSession(session, 'space_create', { _id: 's3', title: 'Test' }, updates);

    // Should use declarative, not legacy
    expect(session.currentSpace).toEqual({ _id: 's3', title: 'Declarative: Test' });
  });

  it('handles null result gracefully with sessionUpdates', () => {
    const session = createSessionState(mockUser);
    const updates = [
      {
        field: 'currentSpace',
        extract: (r: unknown) => {
          const d = r as Record<string, unknown>;
          return { _id: d._id, title: d.title };
        },
      },
    ];

    // null result — updateSession returns early before checking sessionUpdates
    updateSession(session, 'space_create', null, updates);
    expect(session.currentSpace).toBeUndefined();
  });
});
