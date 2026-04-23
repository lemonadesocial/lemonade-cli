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
import { print } from 'graphql';
import {
  DeleteNotificationFilterDocument,
  GetNotificationFiltersDocument,
  NotificationFilterInput,
  NotificationFilterMode,
  NotificationRefType,
  NotificationType,
  NotificationCategory,
  SetNotificationFilterDocument,
} from '../../../graphql/generated/backend/graphql.js';
import type { FilterInput, NotificationFilter } from './state.js';

function fromBackendFilter(filter: {
  _id?: unknown;
  mode: NotificationFilterMode;
  notification_type?: NotificationType | null;
  notification_category?: NotificationCategory | null;
  ref_type?: NotificationRefType | null;
  ref_id?: unknown;
  space_scoped?: unknown;
}): NotificationFilter {
  if (!filter._id) {
    throw new Error('Notification filter response is missing _id.');
  }

  return {
    _id: String(filter._id),
    mode: filter.mode,
    notification_type: filter.notification_type ?? undefined,
    notification_category: filter.notification_category ?? undefined,
    ref_type: filter.ref_type ?? undefined,
    ref_id: filter.ref_id ? String(filter.ref_id) : undefined,
    space_scoped: filter.space_scoped ? String(filter.space_scoped) : undefined,
  };
}

function toBackendFilterInput(input: FilterInput): NotificationFilterInput {
  return {
    _id: input._id,
    mode: input.mode as NotificationFilterMode,
    notification_category: input.notification_category as NotificationCategory | undefined,
    notification_type: input.notification_type as NotificationType | undefined,
    ref_type: input.ref_type as NotificationRefType | undefined,
    ref_id: input.ref_id,
    space_scoped: input.space_scoped,
  };
}

export async function fetchFilters(): Promise<NotificationFilter[]> {
  const result = await graphqlRequest<{
    getNotificationFilters: Array<{
      _id?: unknown;
      mode: NotificationFilterMode;
      notification_type?: NotificationType | null;
      notification_category?: NotificationCategory | null;
      ref_type?: NotificationRefType | null;
      ref_id?: unknown;
      space_scoped?: unknown;
    }>;
  }>(print(GetNotificationFiltersDocument));
  return (result.getNotificationFilters ?? []).map(fromBackendFilter);
}

export async function upsertFilter(input: FilterInput): Promise<NotificationFilter> {
  const result = await graphqlRequest<{
    setNotificationFilter: {
      _id?: unknown;
      mode: NotificationFilterMode;
      notification_type?: NotificationType | null;
      notification_category?: NotificationCategory | null;
      ref_type?: NotificationRefType | null;
      ref_id?: unknown;
      space_scoped?: unknown;
    };
  }>(
    print(SetNotificationFilterDocument),
    { input: toBackendFilterInput(input) },
  );
  return fromBackendFilter(result.setNotificationFilter);
}

export async function deleteFilter(filterId: string): Promise<boolean> {
  const result = await graphqlRequest<{ deleteNotificationFilter: boolean }>(
    print(DeleteNotificationFilterDocument),
    { filterId },
  );
  return result.deleteNotificationFilter;
}
