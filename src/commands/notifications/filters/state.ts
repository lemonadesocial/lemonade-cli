/**
 * Pure reducer for the `lemonade notifications filters` Ink TUI.
 *
 * Split out of `FilterTui.tsx` so the state machine (list, add, edit,
 * delete-confirm, done) can be unit-tested without rendering Ink (IMPL
 * Phase 3 § Anti-patterns #1/#2: no process.exit inside components, no
 * IO inside the reducer).
 *
 * Covers PRD user stories US-4a.* / US-4b.* / US-4c.* / US-4d.* —
 * US-4e.* (non-TTY) lives in `filters/index.ts`, not in this reducer.
 */
import type {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_FILTER_MODES,
  NOTIFICATION_REF_TYPES,
  NOTIFICATION_TYPES,
} from '../../../chat/tools/domains/notifications.js';

export type FilterMode = (typeof NOTIFICATION_FILTER_MODES)[number];
export type FilterCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export type FilterType = (typeof NOTIFICATION_TYPES)[number];
export type FilterRefType = (typeof NOTIFICATION_REF_TYPES)[number];

export interface NotificationFilter {
  _id: string;
  user?: string | null;
  mode: FilterMode;
  notification_type?: string | null;
  notification_category?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  space_scoped?: string | null;
}

/**
 * Form draft used while walking the add/edit multi-step flow. All fields
 * start optional (except `mode`, which is required by the backend — set
 * at the mode step). Empty strings are treated as "not set" so the final
 * payload omits them (mirrors `notification_filters_set` capability at
 * `src/chat/tools/domains/notifications.ts:260-280`).
 */
export interface FilterDraft {
  mode?: FilterMode;
  notification_category?: FilterCategory;
  notification_type?: FilterType;
  ref_type?: FilterRefType;
  ref_id?: string;
  space_scoped?: string;
}

export type FilterField = keyof FilterDraft;

/**
 * Input to `setNotificationFilter` — the draft resolved to what we
 * actually send to the backend. `mode` is required; all other fields are
 * optional. `_id` is present on update (edit flow), absent on create.
 */
export interface FilterInput {
  _id?: string;
  mode: FilterMode;
  notification_category?: FilterCategory;
  notification_type?: FilterType;
  ref_type?: FilterRefType;
  ref_id?: string;
  space_scoped?: string;
}

/**
 * Number of steps in the add/edit flow. 7 steps total
 * (mode → category → type → ref_type → ref_id → space_scoped → confirm).
 * Step index is 0-based; CONFIRM_STEP is the index of the final confirm
 * screen.
 */
export const ADD_EDIT_STEPS = ['mode', 'category', 'type', 'ref_type', 'ref_id', 'space_scoped', 'confirm'] as const;
export const CONFIRM_STEP = ADD_EDIT_STEPS.length - 1;

export type PendingMutation =
  | { type: 'upsert'; input: FilterInput }
  | { type: 'delete'; filterId: string };

export type FilterState =
  | {
      kind: 'list';
      filters: NotificationFilter[];
      cursor: number;
      status: 'idle' | 'loading' | 'error';
      error?: string;
      info?: string;
      pendingMutation?: null;
    }
  | {
      kind: 'add';
      step: number;
      draft: FilterDraft;
      baseFilters: NotificationFilter[];
      cursor: number;
      error?: string;
      pendingMutation?: PendingMutation | null;
    }
  | {
      kind: 'edit';
      step: number;
      draft: FilterDraft;
      original: FilterDraft;
      editingId: string;
      baseFilters: NotificationFilter[];
      cursor: number;
      error?: string;
      pendingMutation?: PendingMutation | null;
    }
  | {
      kind: 'delete-confirm';
      filters: NotificationFilter[];
      targetId: string;
      cursor: number;
      error?: string;
      pendingMutation?: PendingMutation | null;
    }
  | { kind: 'done'; exitCode: number };

export type FilterAction =
  | { type: 'load-success'; filters: NotificationFilter[] }
  | { type: 'load-error'; error: string }
  | { type: 'navigate'; direction: 'up' | 'down' }
  | { type: 'begin-add' }
  | { type: 'begin-edit' }
  | { type: 'begin-delete' }
  | { type: 'back-to-list'; info?: string }
  | { type: 'set-step'; step: number }
  | { type: 'set-field'; field: FilterField; value: string | undefined }
  | { type: 'submit' }
  | { type: 'submit-success'; filters: NotificationFilter[]; focusId?: string }
  | { type: 'submit-error'; error: string; statusCode?: number }
  | { type: 'confirm-delete' }
  | { type: 'cancel-delete' }
  | { type: 'delete-success'; filters: NotificationFilter[] }
  | { type: 'quit' };

export const initialState: FilterState = {
  kind: 'list',
  filters: [],
  cursor: 0,
  status: 'loading',
};

/**
 * Coerce an optional string to `undefined` when empty so the draft never
 * ships empty-string fields to the backend (matches capability behaviour
 * at `src/chat/tools/domains/notifications.ts:265-279`).
 */
function coerceOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Build the final `FilterInput` from a draft. Caller must have already
 * validated `draft.mode` — this function throws if `mode` is missing so
 * the reducer never silently ships a malformed payload.
 */
export function buildInput(draft: FilterDraft, editingId?: string): FilterInput {
  if (!draft.mode) {
    throw new Error('mode is required');
  }
  const input: FilterInput = { mode: draft.mode };
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
 * Build a draft pre-populated from an existing filter (edit flow,
 * US-4c.1). `mode` is already validated by the backend so we assume it
 * is a legal value of the union.
 */
export function filterToDraft(f: NotificationFilter): FilterDraft {
  return {
    mode: f.mode,
    notification_category: (f.notification_category as FilterCategory | null) ?? undefined,
    notification_type: (f.notification_type as FilterType | null) ?? undefined,
    ref_type: (f.ref_type as FilterRefType | null) ?? undefined,
    ref_id: f.ref_id ?? undefined,
    space_scoped: f.space_scoped ?? undefined,
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
 * (US-4d.4) the cursor clamps to the next row or 0 when the last row
 * was deleted. On edit-success (US-4c.5) the cursor returns to the
 * edited row; on add-success (US-4b.5) it stays on the list (caller
 * may bias to the new row via `focusId`).
 */
export function clampCursor(filters: NotificationFilter[], target: number): number {
  if (filters.length === 0) return 0;
  return clamp(target, 0, filters.length - 1);
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  if (state.kind === 'done') {
    return state;
  }

  switch (action.type) {
    case 'load-success': {
      if (state.kind !== 'list') return state;
      return {
        kind: 'list',
        filters: action.filters,
        cursor: clampCursor(action.filters, state.cursor),
        status: 'idle',
      };
    }

    case 'load-error': {
      if (state.kind !== 'list') return state;
      return { ...state, status: 'error', error: action.error };
    }

    case 'navigate': {
      if (state.kind === 'list') {
        if (state.filters.length === 0) return state;
        const nextCursor =
          action.direction === 'up'
            ? Math.max(0, state.cursor - 1)
            : Math.min(state.filters.length - 1, state.cursor + 1);
        return { ...state, cursor: nextCursor };
      }
      return state;
    }

    case 'begin-add': {
      if (state.kind !== 'list') return state;
      return {
        kind: 'add',
        step: 0,
        draft: {},
        baseFilters: state.filters,
        cursor: state.cursor,
      };
    }

    case 'begin-edit': {
      if (state.kind !== 'list') return state;
      if (state.filters.length === 0) return state;
      const target = state.filters[state.cursor];
      if (!target) return state;
      const draft = filterToDraft(target);
      return {
        kind: 'edit',
        step: 0,
        draft,
        original: draft,
        editingId: target._id,
        baseFilters: state.filters,
        cursor: state.cursor,
      };
    }

    case 'begin-delete': {
      if (state.kind !== 'list') return state;
      if (state.filters.length === 0) return state;
      const target = state.filters[state.cursor];
      if (!target) return state;
      return {
        kind: 'delete-confirm',
        filters: state.filters,
        targetId: target._id,
        cursor: state.cursor,
      };
    }

    case 'back-to-list': {
      if (state.kind === 'list') return state;
      const filters =
        state.kind === 'delete-confirm' ? state.filters : state.baseFilters;
      return {
        kind: 'list',
        filters,
        cursor: clampCursor(filters, state.cursor),
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
      const nextDraft: FilterDraft = { ...state.draft };
      if (action.value === undefined || action.value === '') {
        delete nextDraft[action.field];
      } else {
        // Explicit cast is safe: callers restrict `value` to the union for
        // mode/category/type/ref_type and to free strings for ref_id /
        // space_scoped (validated separately at the view layer).
        (nextDraft as Record<FilterField, string>)[action.field] = action.value;
      }
      return { ...state, draft: nextDraft, error: undefined };
    }

    case 'submit': {
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      if (!state.draft.mode) {
        return { ...state, error: 'mode is required' };
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
      // Cursor restoration: prefer focusId (edited row, US-4c.5) and
      // fall back to the existing cursor clamped to the new list.
      let cursor = state.cursor;
      if (action.focusId) {
        const idx = action.filters.findIndex((f) => f._id === action.focusId);
        if (idx >= 0) cursor = idx;
      } else if (state.kind === 'add' && action.filters.length > 0) {
        cursor = action.filters.length - 1;
      }
      return {
        kind: 'list',
        filters: action.filters,
        cursor: clampCursor(action.filters, cursor),
        status: 'idle',
      };
    }

    case 'submit-error': {
      if (state.kind !== 'add' && state.kind !== 'edit') return state;
      // 404 → concurrent-delete wording + return to list (US-4c.4).
      if (action.statusCode === 404) {
        return {
          kind: 'list',
          filters: state.baseFilters,
          cursor: clampCursor(state.baseFilters, state.cursor),
          status: 'idle',
          error: 'Filter no longer exists — it was deleted elsewhere.',
        };
      }
      // All other errors preserve the draft + return to the confirm step
      // so the user can retry or back out (US-4b.6).
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
        pendingMutation: { type: 'delete', filterId: state.targetId },
        error: undefined,
      };
    }

    case 'cancel-delete': {
      if (state.kind !== 'delete-confirm') return state;
      return {
        kind: 'list',
        filters: state.filters,
        cursor: clampCursor(state.filters, state.cursor),
        status: 'idle',
      };
    }

    case 'delete-success': {
      if (state.kind !== 'delete-confirm') return state;
      // Cursor clamp: if the deleted row was the last, drop to prev or 0
      // (US-4d.4).
      const cursor = clampCursor(action.filters, state.cursor);
      return {
        kind: 'list',
        filters: action.filters,
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
