import type { NotificationStatus } from '../../../chat/notifications/listener.js';

/**
 * Pure state reducer for the `notifications watch` Ink feed.
 *
 * The reducer + action types are split out of `WatchFeed.tsx` so the state
 * machine can be unit-tested without rendering Ink (A-009 remediation, IMPL
 * O-5 default: no `ink-testing-library` dependency).
 *
 * Invariant: `state.notifications` never exceeds MAX_VISIBLE entries — the
 * reducer slices the tail on every 'notify' action.
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
}

export type FeedAction =
  | { type: 'notify'; payload: string }
  | { type: 'status'; payload: NotificationStatus };

export const initialState: FeedState = {
  notifications: [],
  status: 'disconnected',
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
    default: {
      return state;
    }
  }
}
