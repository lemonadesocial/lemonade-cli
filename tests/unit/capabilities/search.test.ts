import { describe, it, expect } from 'vitest';
import { scoreToolMatch, searchCapabilities } from '../../../src/capabilities/search.js';

const makeCap = (overrides: Partial<{
  name: string;
  description: string;
  searchHint: string;
  whenToUse: string;
  category: string;
  displayName: string;
}> = {}) => ({
  name: overrides.name ?? 'test_tool',
  description: overrides.description ?? 'A test tool',
  searchHint: overrides.searchHint,
  whenToUse: overrides.whenToUse,
  category: overrides.category ?? 'system',
  displayName: overrides.displayName ?? 'Test Tool',
});

describe('scoreToolMatch', () => {
  it('returns highest score for exact name match', () => {
    const cap = makeCap({ name: 'event_create' });
    const score = scoreToolMatch('event_create', cap);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('returns 0 for no match', () => {
    const cap = makeCap({ name: 'event_create', description: 'Create an event' });
    const score = scoreToolMatch('zzzznothing', cap);
    expect(score).toBe(0);
  });

  it('scores name-contains higher than description-only match', () => {
    const cap = makeCap({ name: 'event_create', description: 'Create an event' });
    const nameContains = scoreToolMatch('event', cap);
    const descOnly = makeCap({ name: 'make_thing', description: 'event creator' });
    const descScore = scoreToolMatch('event', descOnly);
    expect(nameContains).toBeGreaterThan(descScore);
  });

  it('matches category', () => {
    const cap = makeCap({ category: 'payment' });
    const score = scoreToolMatch('payment', cap);
    expect(score).toBeGreaterThanOrEqual(30);
  });

  it('is case-insensitive', () => {
    const cap = makeCap({ name: 'Event_Create' });
    const score = scoreToolMatch('EVENT_CREATE', cap);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('scores searchHint words', () => {
    const cap = makeCap({ name: 'foo_bar', searchHint: 'ticket refund cancel' });
    const score = scoreToolMatch('refund', cap);
    expect(score).toBeGreaterThan(0);
  });

  it('scores whenToUse words', () => {
    const cap = makeCap({ name: 'foo_bar', whenToUse: 'when user wants to refund' });
    const score = scoreToolMatch('refund', cap);
    expect(score).toBeGreaterThan(0);
  });
});

describe('searchCapabilities', () => {
  const caps = [
    makeCap({ name: 'event_create', description: 'Create event', category: 'event' }),
    makeCap({ name: 'event_update', description: 'Update event', category: 'event' }),
    makeCap({ name: 'ticket_assign', description: 'Assign ticket', category: 'tickets' }),
    makeCap({ name: 'payment_refund', description: 'Refund payment', category: 'payment' }),
    makeCap({ name: 'space_create', description: 'Create space', category: 'space' }),
  ];

  it('returns results sorted by relevance', () => {
    const results = searchCapabilities('event', caps);
    expect(results.length).toBeGreaterThan(0);
    // event_create and event_update should be top results
    expect(results[0].name).toMatch(/^event_/);
  });

  it('limits results to maxResults', () => {
    const results = searchCapabilities('event', caps, 1);
    expect(results.length).toBe(1);
  });

  it('returns empty array for no matches', () => {
    const results = searchCapabilities('xyznothing', caps);
    expect(results.length).toBe(0);
  });

  it('defaults maxResults to 10', () => {
    // Create 15 similar caps
    const manyCaps = Array.from({ length: 15 }, (_, i) =>
      makeCap({ name: `event_tool_${i}`, description: 'Event tool', category: 'event' }),
    );
    const results = searchCapabilities('event', manyCaps);
    expect(results.length).toBe(10);
  });
});
