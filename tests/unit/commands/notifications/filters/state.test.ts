import { describe, it, expect } from 'vitest';
import {
  filterReducer,
  initialState,
  buildInput,
  filterToDraft,
  clampCursor,
  CONFIRM_STEP,
  type FilterState,
  type NotificationFilter,
} from '../../../../../src/commands/notifications/filters/state.js';

const makeFilter = (overrides: Partial<NotificationFilter> = {}): NotificationFilter => ({
  _id: 'f1',
  mode: 'mute',
  ...overrides,
});

const listState = (filters: NotificationFilter[], cursor = 0, overrides: Partial<Extract<FilterState, { kind: 'list' }>> = {}): FilterState => ({
  kind: 'list',
  filters,
  cursor,
  status: 'idle',
  ...overrides,
});

describe('filterReducer — helpers', () => {
  it('buildInput — throws when mode is missing', () => {
    expect(() => buildInput({})).toThrow(/mode is required/);
  });

  it('buildInput — omits empty-string ref_id / space_scoped', () => {
    const input = buildInput({ mode: 'mute', ref_id: '   ', space_scoped: '' });
    expect(input).toEqual({ mode: 'mute' });
  });

  it('buildInput — passes _id through when editing', () => {
    const input = buildInput({ mode: 'only', notification_category: 'event' }, 'filter-1');
    expect(input).toEqual({ _id: 'filter-1', mode: 'only', notification_category: 'event' });
  });

  it('filterToDraft — maps optional fields and preserves mode', () => {
    const draft = filterToDraft(
      makeFilter({ _id: 'abc', mode: 'hide', notification_category: 'space', ref_type: 'Space', ref_id: 'S1' }),
    );
    expect(draft).toEqual({
      mode: 'hide',
      notification_category: 'space',
      notification_type: undefined,
      ref_type: 'Space',
      ref_id: 'S1',
      space_scoped: undefined,
    });
  });

  it('clampCursor — empty list returns 0', () => {
    expect(clampCursor([], 3)).toBe(0);
  });

  it('clampCursor — caps at last index', () => {
    expect(clampCursor([makeFilter({ _id: 'a' }), makeFilter({ _id: 'b' })], 5)).toBe(1);
  });

  it('clampCursor — floors negatives to 0', () => {
    expect(clampCursor([makeFilter({ _id: 'a' })], -2)).toBe(0);
  });
});

describe('filterReducer — initial + load', () => {
  it('initialState — list kind, loading status, empty filters', () => {
    expect(initialState).toEqual({ kind: 'list', filters: [], cursor: 0, status: 'loading' });
  });

  it('load-success — preserves prior cursor when filters are non-empty', () => {
    const prior: FilterState = { kind: 'list', filters: [], cursor: 2, status: 'loading' };
    const next = filterReducer(prior, {
      type: 'load-success',
      filters: [makeFilter({ _id: 'a' }), makeFilter({ _id: 'b' }), makeFilter({ _id: 'c' })],
    });
    expect(next.kind).toBe('list');
    if (next.kind === 'list') {
      expect(next.cursor).toBe(2);
      expect(next.status).toBe('idle');
    }
  });

  it('load-success — clamps cursor when fewer filters returned', () => {
    const prior: FilterState = { kind: 'list', filters: [], cursor: 5, status: 'loading' };
    const next = filterReducer(prior, {
      type: 'load-success',
      filters: [makeFilter({ _id: 'a' })],
    });
    if (next.kind === 'list') expect(next.cursor).toBe(0);
  });

  it('load-error — preserves cursor and surfaces message', () => {
    const prior: FilterState = { kind: 'list', filters: [], cursor: 1, status: 'loading' };
    const next = filterReducer(prior, { type: 'load-error', error: 'boom' });
    if (next.kind === 'list') {
      expect(next.status).toBe('error');
      expect(next.error).toBe('boom');
      expect(next.cursor).toBe(1);
    }
  });

  it('load-success — ignored when state is not list', () => {
    // Move to add mode first, then attempt a load-success — reducer
    // ignores load transitions while the user is inside the add flow.
    const added: FilterState = { kind: 'add', step: 0, draft: {}, baseFilters: [], cursor: 0 };
    const next = filterReducer(added, {
      type: 'load-success',
      filters: [makeFilter({ _id: 'x' })],
    });
    expect(next).toBe(added);
  });
});

describe('filterReducer — navigation', () => {
  const filters = [makeFilter({ _id: 'a' }), makeFilter({ _id: 'b' }), makeFilter({ _id: 'c' })];

  it('navigate up at cursor 0 — stays at 0', () => {
    const s = filterReducer(listState(filters, 0), { type: 'navigate', direction: 'up' });
    if (s.kind === 'list') expect(s.cursor).toBe(0);
  });

  it('navigate up from 2 — decrements', () => {
    const s = filterReducer(listState(filters, 2), { type: 'navigate', direction: 'up' });
    if (s.kind === 'list') expect(s.cursor).toBe(1);
  });

  it('navigate down at last index — stays at last', () => {
    const s = filterReducer(listState(filters, 2), { type: 'navigate', direction: 'down' });
    if (s.kind === 'list') expect(s.cursor).toBe(2);
  });

  it('navigate down from 0 — increments', () => {
    const s = filterReducer(listState(filters, 0), { type: 'navigate', direction: 'down' });
    if (s.kind === 'list') expect(s.cursor).toBe(1);
  });

  it('navigate on empty list — no-op', () => {
    const s = filterReducer(listState([], 0), { type: 'navigate', direction: 'down' });
    expect(s).toEqual(listState([], 0));
  });

  it('navigate outside list kind — no-op', () => {
    const added: FilterState = {
      kind: 'add',
      step: 0,
      draft: {},
      baseFilters: filters,
      cursor: 1,
    };
    const next = filterReducer(added, { type: 'navigate', direction: 'down' });
    expect(next).toBe(added);
  });
});

describe('filterReducer — add flow', () => {
  const filters = [makeFilter({ _id: 'a' }), makeFilter({ _id: 'b' })];

  it('begin-add → add kind with empty draft + step 0', () => {
    const s = filterReducer(listState(filters, 1), { type: 'begin-add' });
    expect(s.kind).toBe('add');
    if (s.kind === 'add') {
      expect(s.step).toBe(0);
      expect(s.draft).toEqual({});
      expect(s.baseFilters).toBe(filters);
      expect(s.cursor).toBe(1);
    }
  });

  it('set-field in add — populates the draft', () => {
    const s1 = filterReducer(listState(filters), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'set-field', field: 'mode', value: 'mute' });
    if (s2.kind === 'add') expect(s2.draft.mode).toBe('mute');
  });

  it('set-field with undefined value — clears the field', () => {
    const s1 = filterReducer(listState(filters), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'set-field', field: 'mode', value: 'mute' });
    const s3 = filterReducer(s2, { type: 'set-field', field: 'mode', value: undefined });
    if (s3.kind === 'add') expect(s3.draft.mode).toBeUndefined();
  });

  it('set-step — clamps within bounds', () => {
    const s1 = filterReducer(listState(filters), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'set-step', step: 99 });
    if (s2.kind === 'add') expect(s2.step).toBe(CONFIRM_STEP);
  });

  it('submit without mode — sets error, no pending mutation', () => {
    const s1 = filterReducer(listState(filters), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'submit' });
    if (s2.kind === 'add') {
      expect(s2.error).toBe('mode is required');
      expect(s2.pendingMutation).toBeUndefined();
    }
  });

  it('submit with mode — parks a pending upsert mutation', () => {
    const s1 = filterReducer(listState(filters), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'set-field', field: 'mode', value: 'mute' });
    const s3 = filterReducer(s2, { type: 'submit' });
    if (s3.kind === 'add') {
      expect(s3.pendingMutation).toEqual({ type: 'upsert', input: { mode: 'mute' } });
    }
  });

  it('submit-success after add — returns to list, filters refreshed, cursor focuses new row', () => {
    const s1 = filterReducer(listState(filters), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'set-field', field: 'mode', value: 'mute' });
    const s3 = filterReducer(s2, { type: 'submit' });
    const refreshed = [...filters, makeFilter({ _id: 'c', mode: 'mute' })];
    const s4 = filterReducer(s3, { type: 'submit-success', filters: refreshed, focusId: 'c' });
    expect(s4.kind).toBe('list');
    if (s4.kind === 'list') {
      expect(s4.filters).toBe(refreshed);
      expect(s4.cursor).toBe(2);
      expect(s4.status).toBe('idle');
    }
  });

  it('submit-error non-404 — preserves draft, returns to confirm step, surfaces message (US-4b.6)', () => {
    const s1 = filterReducer(listState(filters), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'set-field', field: 'mode', value: 'mute' });
    const s3 = filterReducer(s2, { type: 'set-field', field: 'ref_id', value: 'bogus' });
    const s4 = filterReducer(s3, { type: 'submit' });
    const s5 = filterReducer(s4, { type: 'submit-error', error: 'ref_id must be a MongoID', statusCode: 422 });
    expect(s5.kind).toBe('add');
    if (s5.kind === 'add') {
      expect(s5.step).toBe(CONFIRM_STEP);
      expect(s5.draft.mode).toBe('mute');
      expect(s5.draft.ref_id).toBe('bogus');
      expect(s5.error).toBe('ref_id must be a MongoID');
      expect(s5.pendingMutation).toBeNull();
    }
  });
});

describe('filterReducer — edit flow', () => {
  const filters = [
    makeFilter({ _id: 'a', mode: 'mute', notification_category: 'event' }),
    makeFilter({ _id: 'b', mode: 'hide' }),
  ];

  it('begin-edit — copies filter fields into draft and retains _id', () => {
    const s = filterReducer(listState(filters, 0), { type: 'begin-edit' });
    expect(s.kind).toBe('edit');
    if (s.kind === 'edit') {
      expect(s.editingId).toBe('a');
      expect(s.draft.mode).toBe('mute');
      expect(s.draft.notification_category).toBe('event');
      expect(s.original.notification_category).toBe('event');
    }
  });

  it('begin-edit on empty list — no-op', () => {
    const s = filterReducer(listState([], 0), { type: 'begin-edit' });
    expect(s.kind).toBe('list');
  });

  it('submit in edit flow — pendingMutation includes editing _id (US-4c.3)', () => {
    const s1 = filterReducer(listState(filters, 1), { type: 'begin-edit' });
    const s2 = filterReducer(s1, { type: 'set-field', field: 'mode', value: 'only' });
    const s3 = filterReducer(s2, { type: 'submit' });
    if (s3.kind === 'edit') {
      expect(s3.pendingMutation).toEqual({ type: 'upsert', input: { _id: 'b', mode: 'only' } });
    }
  });

  it('submit-error 404 — returns to list with concurrent-delete wording (US-4c.4)', () => {
    const s1 = filterReducer(listState(filters, 0), { type: 'begin-edit' });
    const s2 = filterReducer(s1, { type: 'submit' });
    const s3 = filterReducer(s2, { type: 'submit-error', error: 'not found', statusCode: 404 });
    expect(s3.kind).toBe('list');
    if (s3.kind === 'list') {
      expect(s3.error).toBe('Filter no longer exists — it was deleted elsewhere.');
      expect(s3.filters).toBe(filters);
    }
  });

  it('submit-success — cursor returns to edited row (US-4c.5)', () => {
    const s1 = filterReducer(listState(filters, 1), { type: 'begin-edit' });
    const s2 = filterReducer(s1, { type: 'submit' });
    const refreshed = [filters[0], { ...filters[1], mode: 'only' as const }];
    const s3 = filterReducer(s2, { type: 'submit-success', filters: refreshed, focusId: 'b' });
    if (s3.kind === 'list') expect(s3.cursor).toBe(1);
  });
});

describe('filterReducer — delete flow', () => {
  const filters = [
    makeFilter({ _id: 'a' }),
    makeFilter({ _id: 'b' }),
    makeFilter({ _id: 'c' }),
  ];

  it('begin-delete — moves to delete-confirm with the target row id', () => {
    const s = filterReducer(listState(filters, 2), { type: 'begin-delete' });
    expect(s.kind).toBe('delete-confirm');
    if (s.kind === 'delete-confirm') {
      expect(s.targetId).toBe('c');
      expect(s.cursor).toBe(2);
    }
  });

  it('cancel-delete — returns to list unchanged', () => {
    const s1 = filterReducer(listState(filters, 1), { type: 'begin-delete' });
    const s2 = filterReducer(s1, { type: 'cancel-delete' });
    expect(s2.kind).toBe('list');
    if (s2.kind === 'list') expect(s2.filters).toBe(filters);
  });

  it('confirm-delete — parks pending delete mutation', () => {
    const s1 = filterReducer(listState(filters, 0), { type: 'begin-delete' });
    const s2 = filterReducer(s1, { type: 'confirm-delete' });
    if (s2.kind === 'delete-confirm') {
      expect(s2.pendingMutation).toEqual({ type: 'delete', filterId: 'a' });
    }
  });

  it('delete-success on last row — cursor clamps to new last (US-4d.4)', () => {
    const s1 = filterReducer(listState(filters, 2), { type: 'begin-delete' });
    const s2 = filterReducer(s1, { type: 'confirm-delete' });
    const refreshed = filters.slice(0, 2);
    const s3 = filterReducer(s2, { type: 'delete-success', filters: refreshed });
    if (s3.kind === 'list') {
      expect(s3.cursor).toBe(1);
      expect(s3.filters).toBe(refreshed);
    }
  });

  it('delete-success on only row — cursor returns to 0', () => {
    const only = [makeFilter({ _id: 'a' })];
    const s1 = filterReducer(listState(only, 0), { type: 'begin-delete' });
    const s2 = filterReducer(s1, { type: 'confirm-delete' });
    const s3 = filterReducer(s2, { type: 'delete-success', filters: [] });
    if (s3.kind === 'list') {
      expect(s3.cursor).toBe(0);
      expect(s3.filters).toEqual([]);
    }
  });
});

describe('filterReducer — back-to-list + quit', () => {
  const filters = [makeFilter({ _id: 'a' }), makeFilter({ _id: 'b' })];

  it('back-to-list from add — restores baseFilters', () => {
    const s1 = filterReducer(listState(filters, 0), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'back-to-list' });
    if (s2.kind === 'list') {
      expect(s2.filters).toBe(filters);
      expect(s2.cursor).toBe(0);
    }
  });

  it('back-to-list with info message — surfaces the info', () => {
    const s1 = filterReducer(listState(filters, 0), { type: 'begin-add' });
    const s2 = filterReducer(s1, { type: 'back-to-list', info: 'Cancelled.' });
    if (s2.kind === 'list') expect(s2.info).toBe('Cancelled.');
  });

  it('quit — transitions to done with exit 0', () => {
    const s = filterReducer(listState(filters, 0), { type: 'quit' });
    expect(s).toEqual({ kind: 'done', exitCode: 0 });
  });

  it('done is terminal — further actions are no-ops', () => {
    const done = filterReducer(listState(filters, 0), { type: 'quit' });
    const next = filterReducer(done, { type: 'navigate', direction: 'down' });
    expect(next).toBe(done);
  });
});

describe('filterReducer — full add happy-path walk', () => {
  it('begin-add → set-step → set-field chain → submit → submit-success returns to list', () => {
    const baseFilters = [makeFilter({ _id: 'a' })];
    let s: FilterState = listState(baseFilters, 0);
    s = filterReducer(s, { type: 'begin-add' });
    s = filterReducer(s, { type: 'set-field', field: 'mode', value: 'mute' });
    s = filterReducer(s, { type: 'set-step', step: 1 });
    s = filterReducer(s, { type: 'set-field', field: 'notification_category', value: 'event' });
    s = filterReducer(s, { type: 'set-step', step: CONFIRM_STEP });
    s = filterReducer(s, { type: 'submit' });
    expect(s.kind).toBe('add');
    if (s.kind === 'add') {
      expect(s.pendingMutation).toEqual({
        type: 'upsert',
        input: { mode: 'mute', notification_category: 'event' },
      });
    }
    const refreshed = [...baseFilters, makeFilter({ _id: 'new', mode: 'mute', notification_category: 'event' })];
    s = filterReducer(s, { type: 'submit-success', filters: refreshed, focusId: 'new' });
    expect(s.kind).toBe('list');
    if (s.kind === 'list') {
      expect(s.filters).toBe(refreshed);
      expect(s.cursor).toBe(1);
    }
  });
});
