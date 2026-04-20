/**
 * Pure reducer for the `lemonade notifications preferences` Ink TUI.
 *
 * Split out of `PreferenceTui.tsx` so the state machine (list, add, edit,
 * delete-confirm, done) can be unit-tested without rendering Ink (IMPL
 * Phase 4 § Anti-patterns: no process.exit inside components, no IO
 * inside the reducer).
 *
 * Parallel to `filters/state.ts` — the two TUIs share ~80% structure but
 * the IMPL directive is to keep them parallel for clarity; do NOT
 * prematurely abstract.
 *
 * Covers PRD user stories US-5a.* / US-5b.* / US-5c.* / US-5d.* —
 * US-5e.* (non-TTY) lives in `preferences/index.ts`, not in this reducer.
 */
import type {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_REF_TYPES,
  NOTIFICATION_TYPES,
} from '../../../chat/tools/domains/notifications.js';

export type PreferenceCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export type PreferenceType = (typeof NOTIFICATION_TYPES)[number];
export type PreferenceRefType = (typeof NOTIFICATION_REF_TYPES)[number];

/**
 * Delivery channels supported today. Backend currently only accepts
 * `push`; the UI labels it as "push (more channels coming soon)" so the
 * next channel (in-app, email, etc.) can be added without changing the
 * state machine shape.
 */
export const PREFERENCE_CHANNELS = ['push'] as const;
export type PreferenceChannel = (typeof PREFERENCE_CHANNELS)[number];

export interface NotificationChannelPreference {
  _id: string;
  enabled_channels: string[];
  notification_type?: string | null;
  notification_category?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  space_scoped?: string | null;
}

/**
 * Form draft used while walking the add/edit multi-step flow.
 * `enabled_channels` is required by the backend (422 on empty); the
 * reducer rejects any `submit` action whose draft has an empty array so
 * the UI never reaches confirm with `enabled_channels: []` (US-5b.2).
 *
 * Empty strings on optional fields are treated as "not set" so the final
 * payload omits them (mirrors capability at
 * `src/chat/tools/domains/notifications.ts:388-406`).
 */
export interface PreferenceDraft {
  enabled_channels: string[];
  notification_category?: PreferenceCategory;
  notification_type?: PreferenceType;
  ref_type?: PreferenceRefType;
  ref_id?: string;
  space_scoped?: string;
}

export type PreferenceField = Exclude<keyof PreferenceDraft, 'enabled_channels'>;

/**
 * Input to `setNotificationChannelPreference` — the draft resolved to
 * what we actually send to the backend. `enabled_channels` is required.
 * `_id` is present on update (edit flow), absent on create.
 */
export interface PreferenceInput {
  _id?: string;
  enabled_channels: string[];
  notification_category?: PreferenceCategory;
  notification_type?: PreferenceType;
  ref_type?: PreferenceRefType;
  ref_id?: string;
  space_scoped?: string;
}

/**
 * Step order for the add/edit flow. 7 steps total:
 * 0 enabled_channels → 1 category → 2 type → 3 ref_type → 4 ref_id →
 * 5 space_scoped → 6 confirm.
 *
 * Step 0 (enabled_channels) is unique to preferences — it is a
 * multi-select gated by a non-empty check (US-5b.1/5b.2).
 */
export const ADD_EDIT_STEPS = [
  'enabled_channels',
  'category',
  'type',
  'ref_type',
  'ref_id',
  'space_scoped',
  'confirm',
] as const;
export const CONFIRM_STEP = ADD_EDIT_STEPS.length - 1;

export type PendingMutation =
  | { type: 'upsert'; input: PreferenceInput }
  | { type: 'delete'; preferenceId: string };

export type PreferenceState =
  | {
      kind: 'list';
      preferences: NotificationChannelPreference[];
      cursor: number;
      status: 'idle' | 'loading' | 'error';
      error?: string;
      info?: string;
      pendingMutation?: null;
    }
  | {
      kind: 'add';
      step: number;
      draft: PreferenceDraft;
      basePreferences: NotificationChannelPreference[];
      cursor: number;
      error?: string;
      pendingMutation?: PendingMutation | null;
    }
  | {
      kind: 'edit';
      step: number;
      draft: PreferenceDraft;
      original: PreferenceDraft;
      editingId: string;
      basePreferences: NotificationChannelPreference[];
      cursor: number;
      error?: string;
      pendingMutation?: PendingMutation | null;
    }
  | {
      kind: 'delete-confirm';
      preferences: NotificationChannelPreference[];
      targetId: string;
      cursor: number;
      error?: string;
      pendingMutation?: PendingMutation | null;
    }
  | { kind: 'done'; exitCode: number };

export type PreferenceAction =
  | { type: 'load-success'; preferences: NotificationChannelPreference[] }
  | { type: 'load-error'; error: string }
  | { type: 'navigate'; direction: 'up' | 'down' }
  | { type: 'begin-add' }
  | { type: 'begin-edit' }
  | { type: 'begin-delete' }
  | { type: 'back-to-list'; info?: string }
  | { type: 'set-step'; step: number }
  | { type: 'set-field'; field: PreferenceField; value: string | undefined }
  | { type: 'toggle-channel'; channel: string }
  | { type: 'submit' }
  | {
      type: 'submit-success';
      preferences: NotificationChannelPreference[];
      focusId?: string;
    }
  | { type: 'submit-error'; error: string; statusCode?: number }
  | { type: 'confirm-delete' }
  | { type: 'cancel-delete' }
  | { type: 'delete-success'; preferences: NotificationChannelPreference[] }
  | { type: 'quit' };

export const initialState: PreferenceState = {
  kind: 'list',
  preferences: [],
  cursor: 0,
  status: 'loading',
};

export const EMPTY_CHANNELS_ERROR =
  'Select at least one channel — use the filters command to mute entirely.';

/**
 * Step index of the channel-pick step. Used by the reducer to rewind to
 * this step when `submit` is rejected for an empty `enabled_channels`
 * array (US-5b.2).
 */
const CHANNEL_STEP = 0;

/**
 * Coerce an optional string to `undefined` when empty so the draft never
 * ships empty-string fields to the backend (matches capability behaviour
 * at `src/chat/tools/domains/notifications.ts:393-406`).
 */
function coerceOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Build the final `PreferenceInput` from a draft. Caller must have
 * already validated a non-empty `enabled_channels` — this function
 * throws if the array is empty so the reducer never silently ships a
 * malformed payload (backend returns 422 per
 * `lemonade-backend/src/graphql/resolvers/notification.ts:281-285`).
 */
export function buildInput(draft: PreferenceDraft, editingId?: string): PreferenceInput {
  if (!draft.enabled_channels || draft.enabled_channels.length === 0) {
    throw new Error('enabled_channels must not be empty');
  }
  const input: PreferenceInput = { enabled_channels: [...draft.enabled_channels] };
  if (editingId) input._id = editingId;
  if (draft.notification_category) input.notification_category = draft.notification_category;
  if (draft.notification_type) input.notification_type = draft.notification_type;
  if (draft.ref_type) input.ref_type = draft.ref_type;
  const refId = coerceOptional(draft.ref_id);
  if (refId) input.ref_id = refId;
  const spaceScoped = coerceOptional(draft.space_scoped);
  if (spaceScoped) input.space_scoped = spaceScoped;
  return input;
}

/**
 * Build a draft pre-populated from an existing preference (edit flow,
 * US-5c.1). `enabled_channels` falls back to an empty array so the
 * channel-pick guard still applies on re-submit.
 */
export function preferenceToDraft(p: NotificationChannelPreference): PreferenceDraft {
  return {
    enabled_channels: Array.isArray(p.enabled_channels) ? [...p.enabled_channels] : [],
    notification_category: (p.notification_category as PreferenceCategory | null) ?? undefined,
    notification_type: (p.notification_type as PreferenceType | null) ?? undefined,
    ref_type: (p.ref_type as PreferenceRefType | null) ?? undefined,
    ref_id: p.ref_id ?? undefined,
    space_scoped: p.space_scoped ?? undefined,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Compute the cursor position after a mutation refresh. On delete
 * (US-5d.3) the cursor clamps to the next row or 0 when the last row
 * was deleted. On edit-success the cursor returns to the edited row; on
 * add-success it moves to the new row when `focusId` is supplied.
 */
export function clampCursor(preferences: NotificationChannelPreference[], target: number): number {
  if (preferences.length === 0) return 0;
  return clamp(target, 0, preferences.length - 1);
}

/**
 * Toggle a channel in the draft (multi-select on step 0). If the channel
 * is present, remove it; otherwise append it. Order is preserved so the
 * persisted array shape matches the order the user selected channels.
 */
function toggleChannel(channels: string[], channel: string): string[] {
  const idx = channels.indexOf(channel);
  if (idx >= 0) {
    const next = [...channels];
    next.splice(idx, 1);
    return next;
  }
  return [...channels, channel];
}

export function preferenceReducer(state: PreferenceState, action: PreferenceAction): PreferenceState {
  if (state.kind === 'done') {
    return state;
  }

  switch (action.type) {
    case 'load-success': {
      if (state.kind !== 'list') return state;
      return {
        kind: 'list',
        preferences: action.preferences,
        cursor: clampCursor(action.preferences, state.cursor),
        status: 'idle',
      };
    }

    case 'load-error': {
      if (state.kind !== 'list') return state;
      return { ...state, status: 'error', error: action.error };
    }

    case 'navigate': {
      if (state.kind === 'list') {
        if (state.preferences.length === 0) return state;
        const nextCursor =
          action.direction === 'up'
            ? Math.max(0, state.cursor - 1)
            : Math.min(state.preferences.length - 1, state.cursor + 1);
        return { ...state, cursor: nextCursor };
      }
      return state;
    }

    case 'begin-add': {
      if (state.kind !== 'list') return state;
      return {
        kind: 'add',
        step: 0,
        draft: { enabled_channels: [] },
        basePreferences: state.preferences,
        cursor: state.cursor,
      };
    }

    case 'begin-edit': {
      if (state.kind !== 'list') return state;
      if (state.preferences.length === 0) return state;
      const target = state.preferences[state.cursor];
      if (!target) return state;
      const draft = preferenceToDraft(target);
      return {
        kind: 'edit',
        step: 0,
        draft,
        original: draft,
        editingId: target._id,
        basePreferences: state.preferences,
        cursor: state.cursor,
      };
    }

    case 'begin-delete': {
      if (state.kind !== 'list') return state;
      if (state.preferences.length === 0) return state;
      const target = state.preferences[state.cursor];
      if (!target) return state;
      return {
        kind: 'delete-confirm',
        preferences: state.preferences,
        targetId: target._id,
        cursor: state.cursor,
      };
    }

    case 'back-to-list': {
      if (state.kind === 'list') return state;
      const preferences =
        state.kind === 'delete-confirm' ? state.preferences : state.basePreferences;
      return {
        kind: 'list',
        preferences,
        cursor: clampCursor(preferences, state.cursor),
        status: 'idle',
        info: action.info,
      };
    }

    case 'set-step': {
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      const step = clamp(action.step, 0, CONFIRM_STEP);
      return { ...state, step, error: undefined };
    }

    case 'set-field': {
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      const nextDraft: PreferenceDraft = { ...state.draft, enabled_channels: [...state.draft.enabled_channels] };
      if (action.value === undefined || action.value === '') {
        delete nextDraft[action.field];
      } else {
        // Explicit cast is safe: callers restrict `value` to the union for
        // category/type/ref_type and to free strings for ref_id /
        // space_scoped (validated separately at the view layer).
        (nextDraft as Record<PreferenceField, string>)[action.field] = action.value;
      }
      return { ...state, draft: nextDraft, error: undefined };
    }

    case 'toggle-channel': {
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      const nextChannels = toggleChannel(state.draft.enabled_channels, action.channel);
      return {
        ...state,
        draft: { ...state.draft, enabled_channels: nextChannels },
        error: undefined,
      };
    }

    case 'submit': {
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      // Reject empty enabled_channels — rewind to the channel-pick step
      // and surface inline error (US-5b.2). Without this guard, the
      // backend would 422 every submit.
      if (!state.draft.enabled_channels || state.draft.enabled_channels.length === 0) {
        return {
          ...state,
          step: CHANNEL_STEP,
          pendingMutation: null,
          error: EMPTY_CHANNELS_ERROR,
        };
      }
      const editingId = state.kind === 'edit' ? state.editingId : undefined;
      const input = buildInput(state.draft, editingId);
      return {
        ...state,
        pendingMutation: { type: 'upsert', input },
        error: undefined,
      };
    }

    case 'submit-success': {
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      let cursor = state.cursor;
      if (action.focusId) {
        const idx = action.preferences.findIndex((p) => p._id === action.focusId);
        if (idx >= 0) cursor = idx;
      } else if (state.kind === 'add' && action.preferences.length > 0) {
        cursor = action.preferences.length - 1;
      }
      return {
        kind: 'list',
        preferences: action.preferences,
        cursor: clampCursor(action.preferences, cursor),
        status: 'idle',
      };
    }

    case 'submit-error': {
      // Delete path (US-5d.3 / A-001): `PreferenceTui.tsx` dispatches
      // `submit-error` when the delete mutation rejects. Without this
      // branch the reducer silently drops the action and the UI hangs on
      // "Deleting…" forever. Return to the list with the error surfaced
      // and `pendingMutation` omitted (undefined) so the user can retry.
      if (state.kind === 'delete-confirm') {
        return {
          kind: 'list',
          preferences: state.preferences,
          cursor: clampCursor(state.preferences, state.cursor),
          status: 'error',
          error: action.error,
        };
      }
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      // 404 → concurrent-delete wording + return to list (US-5c.3). The
      // exact string is specified in the PRD — do not paraphrase.
      if (action.statusCode === 404) {
        return {
          kind: 'list',
          preferences: state.basePreferences,
          cursor: clampCursor(state.basePreferences, state.cursor),
          status: 'idle',
          error: 'Preference no longer exists — it was deleted elsewhere.',
        };
      }
      // All other errors preserve the draft + return to the confirm step
      // so the user can retry or back out.
      return {
        ...state,
        step: CONFIRM_STEP,
        pendingMutation: null,
        error: action.error,
      };
    }

    case 'confirm-delete': {
      if (state.kind !== 'delete-confirm') return state;
      return {
        ...state,
        pendingMutation: { type: 'delete', preferenceId: state.targetId },
        error: undefined,
      };
    }

    case 'cancel-delete': {
      if (state.kind !== 'delete-confirm') return state;
      return {
        kind: 'list',
        preferences: state.preferences,
        cursor: clampCursor(state.preferences, state.cursor),
        status: 'idle',
      };
    }

    case 'delete-success': {
      if (state.kind !== 'delete-confirm') return state;
      // Cursor clamp: if the deleted row was the last, drop to prev or 0
      // (US-5d.3).
      const cursor = clampCursor(action.preferences, state.cursor);
      return {
        kind: 'list',
        preferences: action.preferences,
        cursor,
        status: 'idle',
      };
    }

    case 'quit': {
      return { kind: 'done', exitCode: 0 };
    }

    default: {
      return state;
    }
  }
}
