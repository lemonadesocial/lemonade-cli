import type { NotificationStatus } from '../../../chat/notifications/listener.js';

/**
 * Pure state reducer for the `notifications watch` Ink feed.
 *
 * The reducer + action types are split out of `WatchFeed.tsx` so the state
 * machine can be unit-tested without rendering Ink (A-009 remediation, IMPL
 * O-5 default: no `ink-testing-library` dependency).
 *
 * Invariants:
 *   - `state.notifications` never exceeds MAX_VISIBLE entries — the reducer
 *     slices the tail on every 'notify' action.
 *   - 'notify' actions do NOT clobber `state.status` or `state.unread`.
 *   - 'status' actions do NOT clobber `state.notifications` or `state.unread`.
 *   - 'unread-update' actions do NOT clobber `state.notifications` or
 *     `state.status`; the payload is assigned verbatim (including `null` to
 *     explicitly mark the count as unknown — e.g. initial fetch failed).
 */

export const MAX_VISIBLE = 10;

export interface FeedState {
  /**
   * Pre-formatted notification lines (newest last). Capped at MAX_VISIBLE
   * so the rendered TUI never grows unbounded.
   */
  notifications: string[];
  /**
   * Latest listener status emitted via onStatusChange. Initial value is
   * `'disconnected'` to match WatchFeed.tsx pre-refactor behaviour.
   */
  status: NotificationStatus;
  /**
   * Current unread-notification count. `null` means unknown (initial fetch
   * hasn't resolved yet, or failed). Rendered as `unread: ?` in the header
   * when null, `unread: N` otherwise.
   */
  unread: number | null;
}

export type FeedAction =
  | { type: 'notify'; payload: string }
  | { type: 'status'; payload: NotificationStatus }
  | { type: 'unread-update'; payload: number | null };

export const initialState: FeedState = {
  notifications: [],
  status: 'disconnected',
  unread: null,
};

export function feedReducer(state: FeedState, action: FeedAction): FeedState {
  switch (action.type) {
    case 'notify': {
      const next = [...state.notifications, action.payload];
      const trimmed = next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      return { ...state, notifications: trimmed };
    }
    case 'status': {
      return { ...state, status: action.payload };
    }
    case 'unread-update': {
      return { ...state, unread: action.payload };
    }
    default: {
      return state;
    }
  }
}
