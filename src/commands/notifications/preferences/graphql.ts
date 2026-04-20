/**
 * Typed GraphQL wrappers for the `lemonade notifications preferences` TUI.
 *
 * Thin calls to the existing `graphqlRequest()` transport at
 * `src/api/graphql.ts:42-106` — no new transport layer introduced.
 *
 * Backend contracts (per IMPL Phase 4 § Interface contracts):
 *   - `getNotificationChannelPreferences` → `NotificationChannelPreference[]`,
 *     401 via GraphQLError
 *     (`lemonade-backend/src/graphql/resolvers/notification.ts:258-268`).
 *   - `setNotificationChannelPreference(input: NotificationChannelPreferenceInput!)`
 *     → persisted preference. 422 on empty `enabled_channels`
 *     (`…notification.ts:281-285`); 404 on stale `_id` (`…notification.ts:306`).
 *   - `deleteNotificationChannelPreference(preferenceId: MongoID!)` →
 *     idempotent Boolean
 *     (`…notification.ts:324-337`).
 *
 * The input type name `NotificationChannelPreferenceInput` matches the
 * capability wrapper at `src/chat/tools/domains/notifications.ts:409` and
 * the backend partial at
 * `lemonade-backend/src/models/partials/notification-channel-preference.ts:11`.
 */
import { graphqlRequest } from '../../../api/graphql.js';
import type { NotificationChannelPreference, PreferenceInput } from './state.js';

const GET_PREFERENCES_QUERY = `
  query GetNotificationChannelPreferences {
    getNotificationChannelPreferences {
      _id
      enabled_channels
      notification_type
      notification_category
      ref_type
      ref_id
      space_scoped
    }
  }
`;

const SET_PREFERENCE_MUTATION = `
  mutation SetNotificationChannelPreference($input: NotificationChannelPreferenceInput!) {
    setNotificationChannelPreference(input: $input) {
      _id
      enabled_channels
      notification_type
      notification_category
      ref_type
      ref_id
      space_scoped
    }
  }
`;

const DELETE_PREFERENCE_MUTATION = `
  mutation DeleteNotificationChannelPreference($preferenceId: MongoID!) {
    deleteNotificationChannelPreference(preferenceId: $preferenceId)
  }
`;

export async function fetchPreferences(): Promise<NotificationChannelPreference[]> {
  const result = await graphqlRequest<{ getNotificationChannelPreferences: NotificationChannelPreference[] }>(
    GET_PREFERENCES_QUERY,
  );
  return result.getNotificationChannelPreferences ?? [];
}

export async function upsertPreference(
  input: PreferenceInput,
): Promise<NotificationChannelPreference> {
  const result = await graphqlRequest<{ setNotificationChannelPreference: NotificationChannelPreference }>(
    SET_PREFERENCE_MUTATION,
    { input },
  );
  return result.setNotificationChannelPreference;
}

export async function deletePreference(preferenceId: string): Promise<boolean> {
  const result = await graphqlRequest<{ deleteNotificationChannelPreference: boolean }>(
    DELETE_PREFERENCE_MUTATION,
    { preferenceId },
  );
  return result.deleteNotificationChannelPreference;
}
