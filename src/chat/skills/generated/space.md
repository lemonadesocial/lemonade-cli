<!-- Auto-generated from capability registry. Do not edit manually. -->

# Space Tools

36 tools in this category.

### space add-member (`space_add_member`)

Add a member to a space.

- **Backend:** graphql → `aiAddSpaceMember` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `user_id` (string, required) — User ID to add
  - `role` (string, optional) — Role: admin|host|member

---

### space connectors (`space_connectors`)

List connected platforms for a space.

- **Backend:** graphql → `spaceConnections` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### space create (`space_create`)

Create a new space (community).

- **Backend:** graphql → `createSpace` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `title` (string, required) — Space title
  - `description` (string, optional) — Space description
  - `slug` (string, optional) — Space URL slug (e.g. my-community)
  - `private` (boolean, optional) — Make space private
  - `handle_twitter` (string, optional) — Twitter/X handle
  - `handle_instagram` (string, optional) — Instagram handle
  - `handle_linkedin` (string, optional) — LinkedIn handle
  - `handle_youtube` (string, optional) — YouTube handle
  - `handle_tiktok` (string, optional) — TikTok handle
  - `website` (string, optional) — Community website URL
  - `tint_color` (string, optional) — Brand color (hex, e.g. #FF5500)
  - `address` (string, optional) — Community location
  - `theme_data` (string, optional) — Theme configuration as JSON (use theme_build tool to generate)
  - `theme_name` (string, optional) — Theme preset name
  - `dark_theme_image` (string, optional) — File ID for dark mode background image (from file_upload)
  - `light_theme_image` (string, optional) — File ID for light mode background image (from file_upload)

---

### space deep analytics (`space_deep_stats`)

Get detailed community statistics including admins, ambassadors, subscribers, events, attendees, and ratings.

- **Backend:** graphql → `getSpaceStatistics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### space delete (`space_delete`)

Delete a space permanently. This cannot be undone.

- **Backend:** graphql → `deleteSpace` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID to delete

---

### space event requests (`space_event_requests`)

List event requests submitted to a space for moderation.

- **Backend:** graphql → `getSpaceEventRequests` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `state` (string, optional) — Filter by state
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### space event requests decide (`space_event_requests_decide`)

Approve or decline event requests submitted to a space.

- **Backend:** graphql → `decideSpaceEventRequests` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `request_ids` (string, required) — Comma-separated request IDs
  - `decision` (string, required) — Decision

---

### space event summary (`space_event_summary`)

Get aggregate event counts for a space (total, virtual, IRL, live, upcoming, past). For per-event performance, use space_events_insight.

- **Backend:** graphql → `getSpaceEventSummary` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### space events insight (`space_events_insight`)

Get events performance overview for a space — checkins, ticket sales, ratings.

- **Backend:** graphql → `getSpaceEventsInsight` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset
  - `search` (string, optional) — Search events
  - `event_tense` (string, optional) — Filter by timing

---

### space list (`space_list`)

List your spaces.

- **Backend:** graphql → `aiListMySpaces` (query)
- **Surfaces:** aiTool, slashCommand
- **Destructive:** no

**Parameters:**
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### space location leaderboard (`space_location_leaderboard`)

Get geographic distribution of events in a space.

- **Backend:** graphql → `getSpaceEventLocationsLeaderboard` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `by_city` (boolean, optional) — Group by city instead of country
  - `limit` (number, optional) — Max results

---

### space member growth (`space_member_growth`)

Get member growth time series for a space by role over a date range.

- **Backend:** graphql → `getSpaceMemberAmountByDate` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `role` (string, required) — Role to track
  - `start` (string, required) — Start date (ISO 8601)
  - `end` (string, required) — End date (ISO 8601)

---

### space member leaderboard (`space_member_leaderboard`)

Get member activity leaderboard — attended events, hosted events, submitted events.

- **Backend:** graphql → `getSpaceMembersLeaderboard` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset
  - `search` (string, optional) — Search by name

---

### space member update (`space_member_update`)

Update a space member role or visibility.

- **Backend:** graphql → `updateSpaceMember` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `member_id` (string, required) — Space member ID
  - `role` (string, optional) — New role
  - `visible` (boolean, optional) — Member visibility

---

### space members (`space_members`)

List members of a space.

- **Backend:** graphql → `aiGetSpaceMembers` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### space my event requests (`space_my_event_requests`)

List your own event requests submitted to a space.

- **Backend:** graphql → `getMySpaceEventRequests` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `state` (string, optional) — Filter by state
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### space pin event (`space_pin_event`)

Pin/feature events on a space page.

- **Backend:** graphql → `pinEventsToSpace` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `event_ids` (string[], required) — Event IDs to pin

---

### space remove-member (`space_remove_member`)

Remove a member from a space.

- **Backend:** graphql → `aiRemoveSpaceMember` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `user_id` (string, required) — User ID to remove

---

### space reward stats (`space_reward_stats`)

Get token reward program statistics for a space.

- **Backend:** graphql → `getSpaceRewardStatistics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### space role features (`space_role_features`)

List features/permissions enabled for a specific role in a space.

- **Backend:** graphql → `listSpaceRoleFeatures` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `role` (string, required) — Space role

---

### space role features update (`space_role_features_update`)

Set the complete list of features/permissions for a role in a space. This REPLACES all current features — include every feature code the role should have. Available codes: AI, EventInvitation, DataDashboard, CSVGuestList, GuestListDashboard, EventSettings, TicketingSettings, EmailManager, PromotionCodes, CollectibleData, Checkin, Poap, Ticket, ViewSpace, ManageSpace, SpaceStatistic, ViewSpaceMembership, ManageSpaceMembership, ViewSpaceEvent, ManageSpaceEvent, ManageSpaceEventRequest, ViewSpaceTag, ManageSpaceTag, ManageSpaceTokenGate, ViewSpaceNewsletter, ManageSpaceNewsletter, ManageSubscription

- **Backend:** graphql → `updateSpaceRoleFeatures` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `role` (string, required) — Space role
  - `codes` (string, required) — Comma-separated feature codes to enable for this role

---

### space sending quota (`space_sending_quota`)

Check newsletter/email sending quota for a space.

- **Backend:** graphql → `getSpaceSendingQuota` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### space set avatar (`space_set_avatar`)

Set a space profile photo from a local file or existing file ID. Recommended: 800x800 pixels for best display.

- **Backend:** graphql → `updateSpace` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `file_id` (string, optional) — Existing file ID from file_upload (provide this OR file_path, not both)
  - `file_path` (string, optional) — Local file path to upload (provide this OR file_id, not both)

---

### space set cover (`space_set_cover`)

Set a space cover image from a local file or existing file ID. Recommended: 800x800 pixels for best display.

- **Backend:** graphql → `updateSpace` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `file_id` (string, optional) — Existing file ID from file_upload (provide this OR file_path, not both)
  - `file_path` (string, optional) — Local file path to upload (provide this OR file_id, not both)

---

### space analytics (`space_stats`)

Get space analytics (members, events, ratings).

- **Backend:** graphql → `aiGetSpaceStats` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### space stripe-connect (`space_stripe_connect`)

Get a Stripe Connect onboarding URL.

- **Backend:** graphql → `generateStripeAccountLink` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `return_url` (string, optional) — URL to return to after onboarding
  - `space_slug` (string, optional) — Space slug for fallback URL (from session)

---

### space stripe-status (`space_stripe_status`)

Check Stripe account connection status.

- **Backend:** graphql → `getMe` (query)
- **Surfaces:** aiTool
- **Destructive:** no

---

### space switch (`space_switch`)

Switch the active space for this session. All subsequent space-scoped commands will use this space.

- **Backend:** graphql → `aiListMySpaces` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `space_id` (string, required) — The space ID to switch to

---

### space tag delete (`space_tag_delete`)

Delete a space tag.

- **Backend:** graphql → `deleteSpaceTag` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ObjectId
  - `tag_id` (string, required) — Tag ObjectId

---

### space tag manage (`space_tag_manage`)

Add or remove a target (event or member) from a space tag.

- **Backend:** graphql → `manageSpaceTag` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ObjectId
  - `tag_id` (string, required) — Tag ObjectId
  - `target` (string, required) — Target ID (event or user ObjectId/email)
  - `tagged` (boolean, required) — true to add, false to remove

---

### space tag upsert (`space_tag_upsert`)

Create or update a space tag.

- **Backend:** graphql → `insertSpaceTag` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ObjectId
  - `tag` (string, required) — Tag label
  - `color` (string, required) — Tag color
  - `type` (string, required) — Tag type
  - `tag_id` (string, optional) — Existing tag ObjectId (for update)

---

### space tags list (`space_tags_list`)

List tags for a space with optional type filter.

- **Backend:** graphql → `listSpaceTags` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ObjectId
  - `type` (string, optional) — Tag type filter

---

### space top attendees (`space_top_attendees`)

Get top event attendees leaderboard for a space.

- **Backend:** graphql → `getTopSpaceEventAttendees` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `limit` (number, optional) — Max results

---

### space top hosts (`space_top_hosts`)

Get leaderboard of top event hosts in a space.

- **Backend:** graphql → `getTopSpaceHosts` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `limit` (number, optional) — Max results

---

### space unpin event (`space_unpin_event`)

Unpin/unfeature events from a space page.

- **Backend:** graphql → `unpinEventsFromSpace` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `event_ids` (string[], required) — Event IDs to unpin

---

### space update (`space_update`)

Update a space.

- **Backend:** graphql → `updateSpace` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `title` (string, optional) — New title
  - `description` (string, optional) — New description
  - `slug` (string, optional) — New slug
  - `private` (boolean, optional) — Make space private
  - `handle_twitter` (string, optional) — Twitter/X handle
  - `handle_instagram` (string, optional) — Instagram handle
  - `handle_linkedin` (string, optional) — LinkedIn handle
  - `handle_youtube` (string, optional) — YouTube handle
  - `handle_tiktok` (string, optional) — TikTok handle
  - `website` (string, optional) — Community website URL
  - `tint_color` (string, optional) — Brand color (hex, e.g. #FF5500)
  - `address` (string, optional) — Community location
  - `state` (string, optional) — Space state (active or archived)
  - `theme_data` (string, optional) — Theme configuration as JSON (use theme_build tool to generate)
  - `theme_name` (string, optional) — Theme preset name
  - `dark_theme_image` (string, optional) — File ID for dark mode background image (from file_upload)
  - `light_theme_image` (string, optional) — File ID for light mode background image (from file_upload)

---

## Related Tools

`space_add_member`, `space_connectors`, `space_create`, `space_deep_stats`, `space_delete`, `space_event_requests`, `space_event_requests_decide`, `space_event_summary`, `space_events_insight`, `space_list`, `space_location_leaderboard`, `space_member_growth`, `space_member_leaderboard`, `space_member_update`, `space_members`, `space_my_event_requests`, `space_pin_event`, `space_remove_member`, `space_reward_stats`, `space_role_features`, `space_role_features_update`, `space_sending_quota`, `space_set_avatar`, `space_set_cover`, `space_stats`, `space_stripe_connect`, `space_stripe_status`, `space_switch`, `space_tag_delete`, `space_tag_manage`, `space_tag_upsert`, `space_tags_list`, `space_top_attendees`, `space_top_hosts`, `space_unpin_event`, `space_update`
