import { describe, it, expect } from 'vitest';
import { createSessionState, updateSession, buildSessionBlock } from '../../../src/chat/session/state';

describe('Session State', () => {
  const mockUser = { _id: 'u1', name: 'Test User', email: 'test@example.com', first_name: 'Test' };

  it('creates initial session state', () => {
    const session = createSessionState(mockUser);
    expect(session.user).toEqual(mockUser);
    expect(session.currentEvent).toBeUndefined();
    expect(session.lastCreatedEvent).toBeUndefined();
    expect(session.currentSpace).toBeUndefined();
  });

  it('creates session with default space', () => {
    const session = createSessionState(mockUser, 'space123');
    expect(session.defaultSpace).toBe('space123');
  });

  it('updates session after event_create', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'event_create', { _id: 'e1', title: 'My Event' });
    expect(session.currentEvent).toEqual({ _id: 'e1', title: 'My Event' });
    expect(session.lastCreatedEvent).toEqual({ _id: 'e1', title: 'My Event' });
  });

  it('updates session after event_get', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'event_get', { _id: 'e2', title: 'Other Event' });
    expect(session.currentEvent).toEqual({ _id: 'e2', title: 'Other Event' });
  });

  it('extracts space from event_create hosted_by field', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'event_create', {
      _id: 'e3',
      title: 'Space Event',
      hosted_by: { _id: 's10', title: 'My Space' },
    });
    expect(session.currentSpace).toEqual({ _id: 's10', title: 'My Space' });
  });

  it('extracts space from event_get space field', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'event_get', {
      _id: 'e4',
      title: 'Fetched Event',
      space: { _id: 's11', title: 'Fetched Space' },
    });
    expect(session.currentSpace).toEqual({ _id: 's11', title: 'Fetched Space' });
  });

  it('updates session after space_create', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'space_create', { _id: 's1', title: 'My Space' });
    expect(session.currentSpace).toEqual({ _id: 's1', title: 'My Space' });
  });

  it('updates session after tickets_create_type', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'tickets_create_type', { _id: 'tt1', title: 'VIP' });
    expect(session.lastCreatedTicketType).toEqual({ _id: 'tt1', title: 'VIP' });
  });

  it('sets current space when space_list returns single result', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'space_list', { items: [{ _id: 's2', title: 'Only Space' }] });
    expect(session.currentSpace).toEqual({ _id: 's2', title: 'Only Space' });
  });

  it('does not set current space when space_list returns multiple results', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'space_list', {
      items: [{ _id: 's1', title: 'Space 1' }, { _id: 's2', title: 'Space 2' }],
    });
    expect(session.currentSpace).toBeUndefined();
  });

  it('updates session after space_switch', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'space_switch', { _id: 's5', title: 'Berlin Techno' });
    expect(session.currentSpace).toEqual({ _id: 's5', title: 'Berlin Techno' });
  });

  it('updates session after event_clone', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'event_clone', ['cloned1', 'cloned2']);
    expect(session.lastCreatedEvent).toEqual({ _id: 'cloned1', title: 'Cloned event' });
    expect(session.currentEvent).toEqual({ _id: 'cloned1', title: 'Cloned event' });
  });

  it('does not update session for event_clone with empty array', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'event_clone', []);
    expect(session.lastCreatedEvent).toBeUndefined();
    expect(session.currentEvent).toBeUndefined();
  });

  it('handles null/undefined result gracefully', () => {
    const session = createSessionState(mockUser);
    updateSession(session, 'event_create', null);
    updateSession(session, 'event_create', undefined);
    expect(session.currentEvent).toBeUndefined();
  });
});

describe('buildSessionBlock', () => {
  it('includes user info', () => {
    const session = createSessionState(
      { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
    );
    const block = buildSessionBlock(session);
    expect(block).toContain('Alice');
    expect(block).toContain('alice@test.com');
  });

  it('includes current event when set', () => {
    const session = createSessionState(
      { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
    );
    updateSession(session, 'event_create', { _id: 'e1', title: 'My Event' });
    const block = buildSessionBlock(session);
    expect(block).toContain('My Event');
    expect(block).toContain('e1');
  });

  it('includes default space when set', () => {
    const session = createSessionState(
      { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
      'space123',
    );
    const block = buildSessionBlock(session);
    expect(block).toContain('space123');
  });
});
