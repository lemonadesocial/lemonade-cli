import { describe, it, expect } from 'vitest';
import {
  preferenceReducer,
  initialState,
  buildInput,
  preferenceToDraft,
  clampCursor,
  CONFIRM_STEP,
  EMPTY_CHANNELS_ERROR,
  type PreferenceState,
  type NotificationChannelPreference,
} from '../../../../../src/commands/notifications/preferences/state.js';

const makePreference = (
  overrides: Partial<NotificationChannelPreference> = {},
): NotificationChannelPreference => ({
  _id: 'p1',
  enabled_channels: ['push'],
  ...overrides,
});

const listState = (
  preferences: NotificationChannelPreference[],
  cursor = 0,
  overrides: Partial<Extract<PreferenceState, { kind: 'list' }>> = {},
): PreferenceState => ({
  kind: 'list',
  preferences,
  cursor,
  status: 'idle',
  ...overrides,
});

describe('preferenceReducer — helpers', () => {
  it('buildInput — throws when enabled_channels is empty', () => {
    expect(() => buildInput({ enabled_channels: [] })).toThrow(/enabled_channels/);
  });

  it('buildInput — omits empty-string ref_id / space_scoped', () => {
    const input = buildInput({ enabled_channels: ['push'], ref_id: '   ', space_scoped: '' });
    expect(input).toEqual({ enabled_channels: ['push'] });
  });

  it('buildInput — passes _id through when editing', () => {
    const input = buildInput(
      { enabled_channels: ['push'], notification_category: 'event' },
      'pref-1',
    );
    expect(input).toEqual({ _id: 'pref-1', enabled_channels: ['push'], notification_category: 'event' });
  });

  it('buildInput — copies enabled_channels (does not share reference)', () => {
    const channels = ['push'];
    const input = buildInput({ enabled_channels: channels });
    expect(input.enabled_channels).not.toBe(channels);
    expect(input.enabled_channels).toEqual(['push']);
  });

  it('preferenceToDraft — maps optional fields and copies enabled_channels', () => {
    const draft = preferenceToDraft(
      makePreference({
        _id: 'abc',
        enabled_channels: ['push'],
        notification_category: 'space',
        ref_type: 'Space',
        ref_id: 'S1',
      }),
    );
    expect(draft).toEqual({
      enabled_channels: ['push'],
      notification_category: 'space',
      notification_type: undefined,
      ref_type: 'Space',
      ref_id: 'S1',
      space_scoped: undefined,
    });
  });

  it('preferenceToDraft — defaults enabled_channels to [] when missing', () => {
    const draft = preferenceToDraft({ _id: 'x' } as NotificationChannelPreference);
    expect(draft.enabled_channels).toEqual([]);
  });

  it('clampCursor — empty list returns 0', () => {
    expect(clampCursor([], 3)).toBe(0);
  });

  it('clampCursor — caps at last index', () => {
    expect(
      clampCursor(
        [makePreference({ _id: 'a' }), makePreference({ _id: 'b' })],
        5,
      ),
    ).toBe(1);
  });

  it('clampCursor — floors negatives to 0', () => {
    expect(clampCursor([makePreference({ _id: 'a' })], -2)).toBe(0);
  });
});

describe('preferenceReducer — initial + load', () => {
  it('initialState — list kind, loading status, empty preferences', () => {
    expect(initialState).toEqual({ kind: 'list', preferences: [], cursor: 0, status: 'loading' });
  });

  it('load-success — preserves prior cursor when preferences are non-empty', () => {
    const prior: PreferenceState = { kind: 'list', preferences: [], cursor: 2, status: 'loading' };
    const next = preferenceReducer(prior, {
      type: 'load-success',
      preferences: [
        makePreference({ _id: 'a' }),
        makePreference({ _id: 'b' }),
        makePreference({ _id: 'c' }),
      ],
    });
    expect(next.kind).toBe('list');
    if (next.kind === 'list') {
      expect(next.cursor).toBe(2);
      expect(next.status).toBe('idle');
    }
  });

  it('load-success — clamps cursor when fewer preferences returned', () => {
    const prior: PreferenceState = { kind: 'list', preferences: [], cursor: 5, status: 'loading' };
    const next = preferenceReducer(prior, {
      type: 'load-success',
      preferences: [makePreference({ _id: 'a' })],
    });
    if (next.kind === 'list') expect(next.cursor).toBe(0);
  });

  it('load-error — preserves cursor and surfaces message', () => {
    const prior: PreferenceState = { kind: 'list', preferences: [], cursor: 1, status: 'loading' };
    const next = preferenceReducer(prior, { type: 'load-error', error: 'boom' });
    if (next.kind === 'list') {
      expect(next.status).toBe('error');
      expect(next.error).toBe('boom');
      expect(next.cursor).toBe(1);
    }
  });

  it('load-success — ignored when state is not list', () => {
    const added: PreferenceState = {
      kind: 'add',
      step: 0,
      draft: { enabled_channels: [] },
      basePreferences: [],
      cursor: 0,
    };
    const next = preferenceReducer(added, {
      type: 'load-success',
      preferences: [makePreference({ _id: 'x' })],
    });
    expect(next).toBe(added);
  });
});

describe('preferenceReducer — navigation', () => {
  const preferences = [
    makePreference({ _id: 'a' }),
    makePreference({ _id: 'b' }),
    makePreference({ _id: 'c' }),
  ];

  it('navigate up at cursor 0 — stays at 0', () => {
    const s = preferenceReducer(listState(preferences, 0), { type: 'navigate', direction: 'up' });
    if (s.kind === 'list') expect(s.cursor).toBe(0);
  });

  it('navigate up from 2 — decrements', () => {
    const s = preferenceReducer(listState(preferences, 2), { type: 'navigate', direction: 'up' });
    if (s.kind === 'list') expect(s.cursor).toBe(1);
  });

  it('navigate down at last index — stays at last', () => {
    const s = preferenceReducer(listState(preferences, 2), { type: 'navigate', direction: 'down' });
    if (s.kind === 'list') expect(s.cursor).toBe(2);
  });

  it('navigate down from 0 — increments', () => {
    const s = preferenceReducer(listState(preferences, 0), { type: 'navigate', direction: 'down' });
    if (s.kind === 'list') expect(s.cursor).toBe(1);
  });

  it('navigate on empty list — no-op', () => {
    const s = preferenceReducer(listState([], 0), { type: 'navigate', direction: 'down' });
    expect(s).toEqual(listState([], 0));
  });

  it('navigate outside list kind — no-op', () => {
    const added: PreferenceState = {
      kind: 'add',
      step: 0,
      draft: { enabled_channels: [] },
      basePreferences: preferences,
      cursor: 1,
    };
    const next = preferenceReducer(added, { type: 'navigate', direction: 'down' });
    expect(next).toBe(added);
  });
});

describe('preferenceReducer — add flow', () => {
  const preferences = [makePreference({ _id: 'a' }), makePreference({ _id: 'b' })];

  it('begin-add → add kind with empty draft + step 0', () => {
    const s = preferenceReducer(listState(preferences, 1), { type: 'begin-add' });
    expect(s.kind).toBe('add');
    if (s.kind === 'add') {
      expect(s.step).toBe(0);
      expect(s.draft).toEqual({ enabled_channels: [] });
      expect(s.basePreferences).toBe(preferences);
      expect(s.cursor).toBe(1);
    }
  });

  it('toggle-channel in add — appends and then removes', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, { type: 'toggle-channel', channel: 'push' });
    if (s2.kind === 'add') expect(s2.draft.enabled_channels).toEqual(['push']);

    const s3 = preferenceReducer(s2, { type: 'toggle-channel', channel: 'push' });
    if (s3.kind === 'add') expect(s3.draft.enabled_channels).toEqual([]);
  });

  it('set-field in add — populates an optional field', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, {
      type: 'set-field',
      field: 'notification_category',
      value: 'event',
    });
    if (s2.kind === 'add') expect(s2.draft.notification_category).toBe('event');
  });

  it('set-field with undefined value — clears the field', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, {
      type: 'set-field',
      field: 'notification_category',
      value: 'event',
    });
    const s3 = preferenceReducer(s2, {
      type: 'set-field',
      field: 'notification_category',
      value: undefined,
    });
    if (s3.kind === 'add') expect(s3.draft.notification_category).toBeUndefined();
  });

  it('set-step — clamps within bounds', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, { type: 'set-step', step: 99 });
    if (s2.kind === 'add') expect(s2.step).toBe(CONFIRM_STEP);
  });

  it('US-5b.2 — submit with empty enabled_channels is REJECTED: rewinds to channel-pick step with inline error', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    // Walk forward as if the user tried to skip channels and jump to
    // confirm — the reducer must still reject `submit` and rewind to
    // step 0 with the inline error.
    const s2 = preferenceReducer(s1, { type: 'set-step', step: CONFIRM_STEP });
    const s3 = preferenceReducer(s2, { type: 'submit' });
    expect(s3.kind).toBe('add');
    if (s3.kind === 'add') {
      expect(s3.step).toBe(0);
      expect(s3.error).toBe(EMPTY_CHANNELS_ERROR);
      expect(s3.pendingMutation).toBeNull();
      // Draft is preserved — channels still empty so the user can pick.
      expect(s3.draft.enabled_channels).toEqual([]);
    }
  });

  it('submit with non-empty enabled_channels — parks a pending upsert mutation', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, { type: 'toggle-channel', channel: 'push' });
    const s3 = preferenceReducer(s2, { type: 'submit' });
    if (s3.kind === 'add') {
      expect(s3.pendingMutation).toEqual({ type: 'upsert', input: { enabled_channels: ['push'] } });
    }
  });

  it('submit-success after add — returns to list, preferences refreshed, cursor focuses new row', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, { type: 'toggle-channel', channel: 'push' });
    const s3 = preferenceReducer(s2, { type: 'submit' });
    const refreshed = [...preferences, makePreference({ _id: 'c', enabled_channels: ['push'] })];
    const s4 = preferenceReducer(s3, {
      type: 'submit-success',
      preferences: refreshed,
      focusId: 'c',
    });
    expect(s4.kind).toBe('list');
    if (s4.kind === 'list') {
      expect(s4.preferences).toBe(refreshed);
      expect(s4.cursor).toBe(2);
      expect(s4.status).toBe('idle');
    }
  });

  it('submit-error non-404 (e.g. 422) — preserves draft, returns to confirm step, surfaces message', () => {
    const s1 = preferenceReducer(listState(preferences), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, { type: 'toggle-channel', channel: 'push' });
    const s3 = preferenceReducer(s2, { type: 'set-field', field: 'ref_id', value: 'bogus' });
    const s4 = preferenceReducer(s3, { type: 'submit' });
    const s5 = preferenceReducer(s4, {
      type: 'submit-error',
      error: 'ref_id must be a MongoID',
      statusCode: 422,
    });
    expect(s5.kind).toBe('add');
    if (s5.kind === 'add') {
      expect(s5.step).toBe(CONFIRM_STEP);
      expect(s5.draft.enabled_channels).toEqual(['push']);
      expect(s5.draft.ref_id).toBe('bogus');
      expect(s5.error).toBe('ref_id must be a MongoID');
      expect(s5.pendingMutation).toBeNull();
    }
  });
});

describe('preferenceReducer — edit flow', () => {
  const preferences = [
    makePreference({ _id: 'a', enabled_channels: ['push'], notification_category: 'event' }),
    makePreference({ _id: 'b', enabled_channels: ['push'] }),
  ];

  it('US-5c.1 — begin-edit copies preference fields into draft and retains _id', () => {
    const s = preferenceReducer(listState(preferences, 0), { type: 'begin-edit' });
    expect(s.kind).toBe('edit');
    if (s.kind === 'edit') {
      expect(s.editingId).toBe('a');
      expect(s.draft.enabled_channels).toEqual(['push']);
      expect(s.draft.notification_category).toBe('event');
      expect(s.original.notification_category).toBe('event');
      expect(s.original.enabled_channels).toEqual(['push']);
    }
  });

  it('begin-edit on empty list — no-op', () => {
    const s = preferenceReducer(listState([], 0), { type: 'begin-edit' });
    expect(s.kind).toBe('list');
  });

  it('US-5c.2 — submit in edit flow: pendingMutation includes editing _id', () => {
    const s1 = preferenceReducer(listState(preferences, 1), { type: 'begin-edit' });
    const s2 = preferenceReducer(s1, {
      type: 'set-field',
      field: 'notification_category',
      value: 'space',
    });
    const s3 = preferenceReducer(s2, { type: 'submit' });
    if (s3.kind === 'edit') {
      expect(s3.pendingMutation).toEqual({
        type: 'upsert',
        input: { _id: 'b', enabled_channels: ['push'], notification_category: 'space' },
      });
    }
  });

  it('US-5b.2 (edit path) — submit with all channels toggled off is REJECTED', () => {
    const s1 = preferenceReducer(listState(preferences, 0), { type: 'begin-edit' });
    // Toggle push off, then attempt to submit — must rewind.
    const s2 = preferenceReducer(s1, { type: 'toggle-channel', channel: 'push' });
    const s3 = preferenceReducer(s2, { type: 'submit' });
    expect(s3.kind).toBe('edit');
    if (s3.kind === 'edit') {
      expect(s3.step).toBe(0);
      expect(s3.error).toBe(EMPTY_CHANNELS_ERROR);
      expect(s3.pendingMutation).toBeNull();
      expect(s3.draft.enabled_channels).toEqual([]);
    }
  });

  it('US-5c.3 — submit-error 404 returns to list with EXACT concurrent-delete wording', () => {
    const s1 = preferenceReducer(listState(preferences, 0), { type: 'begin-edit' });
    const s2 = preferenceReducer(s1, { type: 'submit' });
    const s3 = preferenceReducer(s2, {
      type: 'submit-error',
      error: 'not found',
      statusCode: 404,
    });
    expect(s3.kind).toBe('list');
    if (s3.kind === 'list') {
      // Exact wording per PRD US-5c.3 — do not paraphrase.
      expect(s3.error).toBe('Preference no longer exists — it was deleted elsewhere.');
      expect(s3.preferences).toBe(preferences);
    }
  });

  it('submit-success — cursor returns to edited row', () => {
    const s1 = preferenceReducer(listState(preferences, 1), { type: 'begin-edit' });
    const s2 = preferenceReducer(s1, { type: 'submit' });
    const refreshed = [
      preferences[0],
      { ...preferences[1], notification_category: 'space' as const },
    ];
    const s3 = preferenceReducer(s2, {
      type: 'submit-success',
      preferences: refreshed,
      focusId: 'b',
    });
    if (s3.kind === 'list') expect(s3.cursor).toBe(1);
  });
});

describe('preferenceReducer — delete flow', () => {
  const preferences = [
    makePreference({ _id: 'a' }),
    makePreference({ _id: 'b' }),
    makePreference({ _id: 'c' }),
  ];

  it('begin-delete — moves to delete-confirm with the target row id', () => {
    const s = preferenceReducer(listState(preferences, 2), { type: 'begin-delete' });
    expect(s.kind).toBe('delete-confirm');
    if (s.kind === 'delete-confirm') {
      expect(s.targetId).toBe('c');
      expect(s.cursor).toBe(2);
    }
  });

  it('begin-delete on empty list — no-op', () => {
    const s = preferenceReducer(listState([], 0), { type: 'begin-delete' });
    expect(s.kind).toBe('list');
  });

  it('cancel-delete — returns to list unchanged', () => {
    const s1 = preferenceReducer(listState(preferences, 1), { type: 'begin-delete' });
    const s2 = preferenceReducer(s1, { type: 'cancel-delete' });
    expect(s2.kind).toBe('list');
    if (s2.kind === 'list') expect(s2.preferences).toBe(preferences);
  });

  it('confirm-delete — parks pending delete mutation with preferenceId', () => {
    const s1 = preferenceReducer(listState(preferences, 0), { type: 'begin-delete' });
    const s2 = preferenceReducer(s1, { type: 'confirm-delete' });
    if (s2.kind === 'delete-confirm') {
      expect(s2.pendingMutation).toEqual({ type: 'delete', preferenceId: 'a' });
    }
  });

  it('US-5d.3 — delete-success on last row clamps cursor to new last', () => {
    const s1 = preferenceReducer(listState(preferences, 2), { type: 'begin-delete' });
    const s2 = preferenceReducer(s1, { type: 'confirm-delete' });
    const refreshed = preferences.slice(0, 2);
    const s3 = preferenceReducer(s2, { type: 'delete-success', preferences: refreshed });
    if (s3.kind === 'list') {
      expect(s3.cursor).toBe(1);
      expect(s3.preferences).toBe(refreshed);
    }
  });

  it('US-5d.3 — delete-success on only row returns cursor to 0', () => {
    const only = [makePreference({ _id: 'a' })];
    const s1 = preferenceReducer(listState(only, 0), { type: 'begin-delete' });
    const s2 = preferenceReducer(s1, { type: 'confirm-delete' });
    const s3 = preferenceReducer(s2, { type: 'delete-success', preferences: [] });
    if (s3.kind === 'list') {
      expect(s3.cursor).toBe(0);
      expect(s3.preferences).toEqual([]);
    }
  });
});

describe('preferenceReducer — back-to-list + quit', () => {
  const preferences = [makePreference({ _id: 'a' }), makePreference({ _id: 'b' })];

  it('back-to-list from add — restores basePreferences', () => {
    const s1 = preferenceReducer(listState(preferences, 0), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, { type: 'back-to-list' });
    if (s2.kind === 'list') {
      expect(s2.preferences).toBe(preferences);
      expect(s2.cursor).toBe(0);
    }
  });

  it('back-to-list from edit — restores basePreferences', () => {
    const s1 = preferenceReducer(listState(preferences, 1), { type: 'begin-edit' });
    const s2 = preferenceReducer(s1, { type: 'back-to-list' });
    if (s2.kind === 'list') {
      expect(s2.preferences).toBe(preferences);
      expect(s2.cursor).toBe(1);
    }
  });

  it('back-to-list from delete-confirm — restores preferences', () => {
    const s1 = preferenceReducer(listState(preferences, 0), { type: 'begin-delete' });
    const s2 = preferenceReducer(s1, { type: 'back-to-list' });
    if (s2.kind === 'list') expect(s2.preferences).toBe(preferences);
  });

  it('back-to-list with info message — surfaces the info', () => {
    const s1 = preferenceReducer(listState(preferences, 0), { type: 'begin-add' });
    const s2 = preferenceReducer(s1, { type: 'back-to-list', info: 'Cancelled.' });
    if (s2.kind === 'list') expect(s2.info).toBe('Cancelled.');
  });

  it('quit — transitions to done with exit 0', () => {
    const s = preferenceReducer(listState(preferences, 0), { type: 'quit' });
    expect(s).toEqual({ kind: 'done', exitCode: 0 });
  });

  it('done is terminal — further actions are no-ops', () => {
    const done = preferenceReducer(listState(preferences, 0), { type: 'quit' });
    const next = preferenceReducer(done, { type: 'navigate', direction: 'down' });
    expect(next).toBe(done);
  });
});

describe('preferenceReducer — full add happy-path walk', () => {
  it('begin-add → toggle-channel → set-step → set-field → submit → submit-success returns to list', () => {
    const basePreferences = [makePreference({ _id: 'a' })];
    let s: PreferenceState = listState(basePreferences, 0);
    s = preferenceReducer(s, { type: 'begin-add' });
    s = preferenceReducer(s, { type: 'toggle-channel', channel: 'push' });
    s = preferenceReducer(s, { type: 'set-step', step: 1 });
    s = preferenceReducer(s, {
      type: 'set-field',
      field: 'notification_category',
      value: 'event',
    });
    s = preferenceReducer(s, { type: 'set-step', step: CONFIRM_STEP });
    s = preferenceReducer(s, { type: 'submit' });
    expect(s.kind).toBe('add');
    if (s.kind === 'add') {
      expect(s.pendingMutation).toEqual({
        type: 'upsert',
        input: { enabled_channels: ['push'], notification_category: 'event' },
      });
    }
    const refreshed = [
      ...basePreferences,
      makePreference({ _id: 'new', enabled_channels: ['push'], notification_category: 'event' }),
    ];
    s = preferenceReducer(s, {
      type: 'submit-success',
      preferences: refreshed,
      focusId: 'new',
    });
    expect(s.kind).toBe('list');
    if (s.kind === 'list') {
      expect(s.preferences).toBe(refreshed);
      expect(s.cursor).toBe(1);
    }
  });
});
