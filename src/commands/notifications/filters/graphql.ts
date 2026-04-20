/**
 * Typed GraphQL wrappers for the `lemonade notifications filters` TUI.
 *
 * Thin calls to the existing `graphqlRequest()` transport at
 * `src/api/graphql.ts:42-106` — no new transport layer introduced.
 *
 * Backend contracts (per IMPL Phase 3 § Interface contracts):
 *   - `getNotificationFilters` → `NotificationFilter[]`, 401 via GraphQLError
 *   - `setNotificationFilter(input: NotificationFilterInput!)` → persisted
 *     filter. 422 on missing `mode`, 404 on stale `_id`.
 *   - `deleteNotificationFilter(filterId: MongoID!)` → idempotent Boolean.
 *
 * The input type name `NotificationFilterInput` matches the existing
 * capability wrapper at `src/chat/tools/domains/notifications.ts:281`.
 */
import { graphqlRequest } from '../../../api/graphql.js';
import type { FilterInput, NotificationFilter } from './state.js';

const GET_FILTERS_QUERY = `
  query GetNotificationFilters {
    getNotificationFilters {
      _id
      user
      mode
      notification_type
      notification_category
      ref_type
      ref_id
      space_scoped
    }
  }
`;

const SET_FILTER_MUTATION = `
  mutation SetNotificationFilter($input: NotificationFilterInput!) {
    setNotificationFilter(input: $input) {
      _id
      user
      mode
      notification_type
      notification_category
      ref_type
      ref_id
      space_scoped
    }
  }
`;

const DELETE_FILTER_MUTATION = `
  mutation DeleteNotificationFilter($filterId: MongoID!) {
    deleteNotificationFilter(filterId: $filterId)
  }
`;

export async function fetchFilters(): Promise<NotificationFilter[]> {
  const result = await graphqlRequest<{ getNotificationFilters: NotificationFilter[] }>(
    GET_FILTERS_QUERY,
  );
  return result.getNotificationFilters ?? [];
}

export async function upsertFilter(input: FilterInput): Promise<NotificationFilter> {
  const result = await graphqlRequest<{ setNotificationFilter: NotificationFilter }>(
    SET_FILTER_MUTATION,
    { input },
  );
  return result.setNotificationFilter;
}

export async function deleteFilter(filterId: string): Promise<boolean> {
  const result = await graphqlRequest<{ deleteNotificationFilter: boolean }>(
    DELETE_FILTER_MUTATION,
    { filterId },
  );
  return result.deleteNotificationFilter;
}
