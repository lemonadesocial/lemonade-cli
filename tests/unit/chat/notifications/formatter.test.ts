import { describe, it, expect } from 'vitest';
import {
  formatNotification,
  formatNotificationForMCP,
} from '../../../../src/chat/notifications/formatter.js';

describe('formatNotification', () => {
  it('formats a notification with all fields', () => {
    const result = formatNotification({
      _id: '1',
      created_at: '2025-01-15T10:30:00Z',
      type: 'event_reminder',
      title: 'Event starting soon',
      message: 'Your event begins in 30 minutes',
    });
    expect(result).toContain('event reminder');
    expect(result).toContain('Event starting soon');
    expect(result).toContain('Your event begins in 30 minutes');
  });

  it('formats a notification with only type', () => {
    const result = formatNotification({
      _id: '2',
      created_at: '2025-01-15T10:30:00Z',
      type: 'new_follower',
    });
    expect(result).toContain('new follower');
    expect(result).not.toContain('undefined');
  });

  it('replaces underscores with spaces in type', () => {
    const result = formatNotification({
      _id: '3',
      created_at: '2025-01-15T10:30:00Z',
      type: 'ticket_purchase_confirmed',
    });
    expect(result).toContain('ticket purchase confirmed');
  });
});

describe('formatNotificationForMCP', () => {
  it('returns valid JSON', () => {
    const result = formatNotificationForMCP({
      _id: '1',
      created_at: '2025-01-15T10:30:00Z',
      type: 'event_reminder',
      title: 'Test',
      message: 'Hello',
      ref_event: 'evt123',
      ref_space: 'sp456',
    });
    const parsed = JSON.parse(result);
    expect(parsed.type).toBe('event_reminder');
    expect(parsed.title).toBe('Test');
    expect(parsed.message).toBe('Hello');
    expect(parsed.event).toBe('evt123');
    expect(parsed.space).toBe('sp456');
    expect(parsed.time).toBe('2025-01-15T10:30:00Z');
  });

  it('handles missing optional fields', () => {
    const result = formatNotificationForMCP({
      _id: '2',
      created_at: '2025-01-15T10:30:00Z',
      type: 'ping',
    });
    const parsed = JSON.parse(result);
    expect(parsed.type).toBe('ping');
    expect(parsed.title).toBeUndefined();
  });
});
