<!-- Auto-generated from capability registry. Do not edit manually. -->

# Event Tools

73 tools in this category.

### accept event (`accept_event`)

Accept an event invitation.

- **Backend:** graphql → `aiAcceptEvent` (mutation)
- **Surfaces:** aiTool, cliCommand
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### decline event (`decline_event`)

Decline an event invitation.

- **Backend:** graphql → `aiDeclineEvent` (mutation)
- **Surfaces:** aiTool, cliCommand
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event add cohost (`event_add_cohost`)

Add a co-host, gatekeeper, or representative to an event by email or user ID.

- **Backend:** graphql → `manageEventCohostRequests` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `email` (string, optional) — Target email
  - `user_id` (string, optional) — Target user ObjectId
  - `role` (string, optional) — Role to assign

---

### event applications (`event_application_answers`)

Get application answers for an event.

- **Backend:** graphql → `aiGetEventApplicationAnswers` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event application export (`event_application_export`)

Export event application/form responses. Returns applicant data with questions and answers.

- **Backend:** graphql → `exportEventApplications` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event approvals (`event_approvals`)

Approve or decline event join requests.

- **Backend:** graphql → `aiDecideEventJoinRequests` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `decision` (string, required) — Decision: approved or declined
  - `request_ids` (string[], optional) — Specific request IDs (optional)

---

### event broadcast create (`event_broadcast_create`)

Create a broadcast/livestream for an event.

- **Backend:** graphql → `createEventBroadcast` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `provider` (string, required) — Broadcast provider
  - `provider_id` (string, required) — Provider-specific stream ID
  - `title` (string, required) — Broadcast title
  - `scheduled_start_time` (string, optional) — ISO 8601 scheduled start
  - `scheduled_end_time` (string, optional) — ISO 8601 scheduled end
  - `description` (string, optional) — Broadcast description
  - `position` (number, optional) — Display order

---

### event broadcast delete (`event_broadcast_delete`)

Delete a broadcast from an event.

- **Backend:** graphql → `deleteEventBroadcast` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `broadcast_id` (string, required) — Broadcast ObjectId
  - `event_id` (string, required) — Event ObjectId

---

### event broadcast update (`event_broadcast_update`)

Update a broadcast's settings.

- **Backend:** graphql → `updateEventBroadcast` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `broadcast_id` (string, required) — Broadcast ObjectId
  - `event_id` (string, required) — Event ObjectId
  - `description` (string, optional) — New description
  - `position` (number, optional) — New display order

---

### event cancel (`event_cancel`)

Cancel an event. This action cannot be undone.

- **Backend:** graphql → `aiCancelEvent` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event cancel invitations (`event_cancel_invitations`)

Cancel sent invitations for an event.

- **Backend:** graphql → `cancelEventInvitations` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `invitation_ids` (string[], required) — Array of invitation IDs to cancel

---

### event checkin (`event_checkin`)

Manually check in an attendee to an event.

- **Backend:** graphql → `checkinUser` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `user_id` (string, required) — User ID to check in

---

### event checkin chart (`event_checkin_chart`)

Get check-in data over a time range for charting.

- **Backend:** graphql → `getEventCheckinChartData` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `start` (string, required) — Start date ISO 8601
  - `end` (string, required) — End date ISO 8601

---

### event checkins (`event_checkins`)

List check-in history for an event.

- **Backend:** graphql → `aiGetEventCheckins` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### event clone (`event_clone`)

Clone an event to one or more new dates. Returns array of new event IDs.

- **Backend:** graphql → `cloneEvent` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID to clone
  - `dates` (string[], required) — Array of ISO 8601 dates for the cloned events

---

### event create (`event_create`)

Create a new event with full configuration options. Returns the event ID, title, and status.

- **Backend:** graphql → `createEvent` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `title` (string, required) — Event title
  - `start` (string, required) — Start date (ISO 8601)
  - `end` (string, optional) — End date (ISO 8601)
  - `description` (string, optional) — Event description
  - `space` (string, optional) — Space ID
  - `address` (string, optional) — Venue address
  - `guest_limit` (number, optional) — Maximum number of guests
  - `guest_limit_per` (number, optional) — Maximum guests per registration
  - `ticket_limit_per` (number, optional) — Maximum tickets per user
  - `private` (boolean, optional) — Private event (requires approval to join)
  - `approval_required` (boolean, optional) — Require approval for registrations
  - `application_required` (boolean, optional) — Require application form
  - `timezone` (string, optional) — Event timezone (e.g. America/New_York)
  - `virtual` (boolean, optional) — Virtual event
  - `virtual_url` (string, optional) — Virtual event URL
  - `registration_disabled` (boolean, optional) — Disable registration
  - `currency` (string, optional) — Payment currency code (e.g. USD)
  - `tags` (string[], optional) — Event tags
  - `guest_directory_enabled` (boolean, optional) — Enable guest directory
  - `subevent_enabled` (boolean, optional) — Enable sub-events
  - `terms_text` (string, optional) — Terms and conditions text
  - `welcome_text` (string, optional) — Welcome message for attendees
  - `theme_data` (string, optional) — Theme configuration as JSON (use theme_build tool to generate)
  - `dark_theme_image` (string, optional) — File ID for dark mode background image (from file_upload)
  - `light_theme_image` (string, optional) — File ID for light mode background image (from file_upload)

---

### event discount delete (`event_discount_delete`)

Delete ticket discount codes from an event.

- **Backend:** graphql → `deleteEventTicketDiscounts` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `discount_codes` (string[], required) — Discount codes to delete

---

### event discount update (`event_discount_update`)

Update a ticket discount code settings (use limits, ticket limits).

- **Backend:** graphql → `updateEventTicketDiscount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `code` (string, optional) — Discount code to update
  - `use_limit` (number, optional) — Total uses allowed
  - `use_limit_per` (number, optional) — Uses per user
  - `ticket_limit` (number, optional) — Total tickets discountable
  - `ticket_limit_per` (number, optional) — Tickets per user

---

### event email create (`event_email_create`)

Create a custom email setting for an event.

- **Backend:** graphql → `createEventEmailSetting` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `type` (string, required) — EmailTemplateType enum value
  - `custom_subject_html` (string, optional) — Custom email subject
  - `custom_body_html` (string, optional) — Custom email body HTML
  - `scheduled_at` (string, optional) — ISO 8601 scheduled send time
  - `disabled` (boolean, optional) — Start disabled

---

### event email delete (`event_email_delete`)

Delete an email setting.

- **Backend:** graphql → `deleteEventEmailSetting` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `email_setting_id` (string, required) — Email setting ObjectId

---

### event email test (`event_email_test`)

Send test emails for a specific email template type.

- **Backend:** graphql → `sendEventEmailSettingTestEmails` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `event_id` (string, optional) — Event ObjectId
  - `type` (string, optional) — EmailTemplateType enum value
  - `test_recipients` (string[], required) — Email addresses to send test to
  - `email_setting_id` (string, optional) — Existing setting ID to test
  - `custom_subject_html` (string, optional) — Override subject for test
  - `custom_body_html` (string, optional) — Override body for test

---

### event email toggle (`event_email_toggle`)

Enable or disable multiple email settings at once.

- **Backend:** graphql → `toggleEventEmailSettings` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `email_setting_ids` (string[], required) — Array of email setting ObjectIds
  - `disabled` (boolean, required) — true to disable, false to enable

---

### event email update (`event_email_update`)

Update an existing email setting.

- **Backend:** graphql → `updateEventEmailSetting` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `email_setting_id` (string, required) — Email setting ObjectId
  - `custom_subject_html` (string, optional) — Updated subject HTML
  - `custom_body_html` (string, optional) — Updated body HTML
  - `disabled` (boolean, optional) — Enable/disable

---

### event emails list (`event_emails_list`)

List email settings/workflows configured for an event.

- **Backend:** graphql → `listEventEmailSettings` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `system` (boolean, optional) — Include system email templates
  - `scheduled` (boolean, optional) — Filter by scheduled emails
  - `sent` (boolean, optional) — Filter by sent emails

---

### event export guests (`event_export_guests`)

Export attendee/ticket data for an event.

- **Backend:** graphql → `exportEventTickets` (query)
- **Surfaces:** aiTool, slashCommand
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `search` (string, optional) — Search text
  - `checked_in` (boolean, optional) — Filter by check-in status
  - `limit` (number, optional) — Max results

---

### event feedback summary (`event_feedback_summary`)

Get feedback summary (average rating, distribution) for an event.

- **Backend:** graphql → `aiGetEventFeedbackSummary` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event feedbacks (`event_feedbacks`)

List individual feedback entries for an event.

- **Backend:** graphql → `aiListEventFeedbacks` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `rate_value` (number, optional) — Filter by rating (1-5)
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### event get (`event_get`)

Get detailed information about a specific event.

- **Backend:** graphql → `aiGetEvent` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event guest detail (`event_guest_detail`)

Get detailed info about a specific guest (ticket, payment, join request, application).

- **Backend:** graphql → `getEventGuestDetail` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `user_id` (string, optional) — Guest user ObjectId
  - `email` (string, optional) — Guest email

---

### event guest stats (`event_guest_stats`)

Get guest statistics for an event (going, pending, declined, checked in).

- **Backend:** graphql → `aiGetEventGuestStats` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event guests (`event_guests`)

List attendees for an event.

- **Backend:** graphql → `aiGetEventGuests` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `search` (string, optional) — Search guests by name or email
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### event guests list (`event_guests_list`)

List event guests with filters and pagination.

- **Backend:** graphql → `listEventGuests` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `search` (string, optional) — Search by name/email
  - `ticket_types` (string[], optional) — Filter by ticket type IDs
  - `going` (boolean, optional) — Filter going guests
  - `pending_approval` (boolean, optional) — Filter pending approval
  - `pending_invite` (boolean, optional) — Filter pending invites
  - `declined` (boolean, optional) — Filter declined
  - `checked_in` (boolean, optional) — Filter checked-in
  - `sort_by` (string, optional) — Sort field
  - `sort_order` (string, optional) — Sort direction
  - `limit` (number, optional) — Pagination limit
  - `skip` (number, optional) — Pagination offset

---

### event guests statistics (`event_guests_statistics`)

Get detailed guest statistics (going, pending, declined, checked in, per ticket type).

- **Backend:** graphql → `getEventGuestsStatistics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId

---

### event invitation stats (`event_invitation_stats`)

Get invitation tracking statistics for an event.

- **Backend:** graphql → `getEventInvitedStatistics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `limit` (number, optional) — Max guest results

---

### event invite (`event_invite`)

Send email invitations to an event.

- **Backend:** graphql → `aiInviteEvent` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `emails` (string[], required) — Email addresses to invite

---

### event join requests (`event_join_requests`)

List pending join requests for an event.

- **Backend:** graphql → `getEventJoinRequests` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `state` (string, optional) — Filter by state
  - `search` (string, optional) — Search text
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### event latest views (`event_latest_views`)

Get the most recent individual page views for an event with geographic and device data.

- **Backend:** graphql → `getEventLatestViews` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `limit` (number, optional) — Max results

---

### event list (`event_list`)

List your hosted events.

- **Backend:** graphql → `aiGetHostingEvents` (query)
- **Surfaces:** aiTool, slashCommand
- **Destructive:** no

**Parameters:**
  - `draft` (boolean, optional) — Show only drafts
  - `search` (string, optional) — Search text
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### event cohost requests (`event_list_cohost_requests`)

List co-host requests/invitations for an event.

- **Backend:** graphql → `getEventCohostRequests` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `state` (string, optional) — Filter by state

---

### event poap create (`event_poap_create`)

Create a new POAP drop for an event.

- **Backend:** graphql → `createPoapDrop` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `name` (string, required) — POAP name
  - `description` (string, required) — POAP description
  - `amount` (number, required) — Number of POAPs to mint
  - `image` (string, required) — File ObjectId (uploaded image)
  - `claim_mode` (string, required) — Claim mode
  - `ticket_types` (string[], optional) — Ticket type IDs for registration claim mode
  - `private` (boolean, optional) — Whether POAP is private
  - `minting_network` (string, optional) — Chain ID for minting network

---

### event poap import (`event_poap_import`)

Import an existing POAP drop from the POAP platform by external ID and edit code.

- **Backend:** graphql → `importPoapDrop` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `poap_id` (number, required) — External POAP drop ID
  - `code` (string, required) — POAP edit code
  - `event_id` (string, required) — Event ObjectId
  - `amount` (number, required) — Number of codes to have
  - `claim_mode` (string, required) — Claim mode
  - `ticket_types` (string[], optional) — Ticket type IDs

---

### event poap list (`event_poap_list`)

List POAP drops for an event.

- **Backend:** graphql → `listPoapDrops` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId

---

### event poap update (`event_poap_update`)

Update an existing POAP drop.

- **Backend:** graphql → `updatePoapDrop` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `drop_id` (string, required) — PoapDrop ObjectId
  - `name` (string, optional) — POAP name
  - `description` (string, optional) — POAP description
  - `amount` (number, optional) — New total amount (must be >= current)
  - `claim_mode` (string, optional) — Claim mode
  - `ticket_types` (string[], optional) — Ticket type IDs
  - `minting_network` (string, optional) — Chain ID

---

### event publish (`event_publish`)

Publish a draft event to make it live.

- **Backend:** graphql → `aiPublishEvent` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event question create (`event_question_create`)

Post a question in an event Q&A session.

- **Backend:** graphql → `createEventQuestion` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `question` (string, required) — Question text
  - `session` (string, optional) — Session ObjectId (if multiple sessions)

---

### event question delete (`event_question_delete`)

Delete a question (soft delete).

- **Backend:** graphql → `deleteEventQuestion` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `question_id` (string, required) — Question ObjectId

---

### event question like (`event_question_like`)

Toggle like on a question.

- **Backend:** graphql → `toggleEventQuestionLike` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `question_id` (string, required) — Question ObjectId

---

### event questions list (`event_questions_list`)

List questions for an event with sorting and cursor-based pagination.

- **Backend:** graphql → `getEventQuestions` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `sort` (string, optional) — Sort field
  - `limit` (number, optional) — Max results (default 20)
  - `id_lt` (string, optional) — Cursor: return questions with _id less than this
  - `session` (string, optional) — Session ObjectId filter

---

### event recurring dates (`event_recurring_dates`)

Generate dates for a recurring event series. Returns array of dates.

- **Backend:** graphql → `generateRecurringDates` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `start` (string, required) — Start date (ISO 8601)
  - `utc_offset_minutes` (number, required) — UTC offset in minutes (e.g., -300 for EST)
  - `repeat` (string, required) — Recurrence pattern
  - `day_of_weeks` (number[], optional) — Days of week (0=Sun, 6=Sat)
  - `end` (string, optional) — End date (ISO 8601)
  - `count` (number, optional) — Number of dates to generate (max 100)

---

### event remove cohost (`event_remove_cohost`)

Remove a co-host from an event by email or user ID.

- **Backend:** graphql → `manageEventCohostRequests` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `email` (string, optional) — Target email
  - `user_id` (string, optional) — Target user ObjectId

---

### event sales chart (`event_sales_chart`)

Get ticket sales data over a time range for charting.

- **Backend:** graphql → `getEventTicketSoldChartData` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `start` (string, required) — Start date ISO 8601
  - `end` (string, required) — End date ISO 8601
  - `ticket_type_ids` (string[], optional) — Filter by ticket type IDs

---

### event search (`event_search`)

Search events across all platforms via federated search.

- **Backend:** external (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `query` (string, required) — Search keywords
  - `lat` (number, optional) — Latitude
  - `lng` (number, optional) — Longitude
  - `radius_km` (number, optional) — Radius in km
  - `category` (string, optional) — Category filter
  - `date_from` (string, optional) — Start date (ISO 8601)
  - `date_to` (string, optional) — End date (ISO 8601)
  - `price_min` (number, optional) — Min price
  - `price_max` (number, optional) — Max price
  - `sort` (string, optional) — Sort order
  - `limit` (number, optional) — Max results

---

### event set photos (`event_set_photos`)

Set event photos from file IDs (from file_upload). WARNING: This REPLACES all existing photos. The first photo becomes the event cover automatically. Recommended: 800x800 pixels for best display.

- **Backend:** graphql → `updateEvent` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `file_ids` (string, required) — Comma-separated file IDs

---

### event ticket categories (`event_ticket_categories`)

List ticket categories for an event.

- **Backend:** graphql → `getEventTicketCategories` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event ticket categories list (`event_ticket_categories_list`)

List ticket categories for an event.

- **Backend:** graphql → `getEventTicketCategories` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId

---

### event ticket category create (`event_ticket_category_create`)

Create a ticket category for an event.

- **Backend:** graphql → `createEventTicketCategory` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `title` (string, required) — Category title
  - `description` (string, optional) — Category description
  - `position` (number, optional) — Display order
  - `ticket_types` (string[], optional) — Ticket type IDs to assign

---

### event ticket category delete (`event_ticket_category_delete`)

Delete one or more ticket categories from an event.

- **Backend:** graphql → `deleteEventTicketCategory` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `category_ids` (string[], required) — Array of category ObjectIds

---

### event ticket category reorder (`event_ticket_category_reorder`)

Reorder ticket categories for an event.

- **Backend:** graphql → `reorderTicketTypeCategories` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `categories` (object[], required) — Array of { _id: string, position: number }

---

### event ticket category update (`event_ticket_category_update`)

Update a ticket category.

- **Backend:** graphql → `updateEventTicketCategory` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `category_id` (string, required) — Category ObjectId
  - `event_id` (string, required) — Event ObjectId
  - `title` (string, optional) — Category title
  - `description` (string, optional) — Category description
  - `position` (number, optional) — Display order
  - `ticket_types` (string[], optional) — New set of ticket type IDs

---

### event ticket delete (`event_ticket_delete`)

Delete a ticket type from an event.

- **Backend:** graphql → `deleteEventTicketType` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `ticket_type_id` (string, required) — Ticket type ID to delete
  - `event_id` (string, required) — Event ID

---

### event ticket reorder (`event_ticket_reorder`)

Reorder ticket types for an event.

- **Backend:** graphql → `reorderTicketTypes` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `ticket_type_ids` (string[], required) — Ticket type IDs in desired order

---

### event ticket sales (`event_ticket_sold_insight`)

Get ticket sales data for an event.

- **Backend:** graphql → `aiGetEventTicketSoldInsight` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event ticket statistics (`event_ticket_statistics`)

Get ticket statistics for an event (all, checked in, cancelled, per ticket type).

- **Backend:** graphql → `getTicketStatistics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId

---

### event token gate create (`event_token_gate_create`)

Create a token gate for an event.

- **Backend:** graphql → `createEventTokenGate` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `name` (string, required) — Display name of the token
  - `token_address` (string, required) — Token contract address
  - `network` (string, required) — Blockchain network
  - `decimals` (number, optional) — Token decimals (default 0)
  - `min_value` (string, optional) — Minimum token balance required
  - `max_value` (string, optional) — Maximum token balance
  - `is_nft` (boolean, optional) — ERC721 if true, else ERC20
  - `gated_ticket_types` (string[], optional) — Ticket type IDs this gate applies to

---

### event token gate delete (`event_token_gate_delete`)

Delete a token gate from an event.

- **Backend:** graphql → `deleteEventTokenGate` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `token_gate_id` (string, required) — Token gate ObjectId
  - `event_id` (string, required) — Event ObjectId

---

### event token gate update (`event_token_gate_update`)

Update an existing token gate.

- **Backend:** graphql → `updateEventTokenGate` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `token_gate_id` (string, required) — Token gate ObjectId
  - `event_id` (string, required) — Event ObjectId
  - `name` (string, optional) — Display name
  - `min_value` (string, optional) — Minimum token balance
  - `max_value` (string, optional) — Maximum token balance
  - `gated_ticket_types` (string[], optional) — Ticket type IDs

---

### event token gates list (`event_token_gates_list`)

List token gates for an event with optional filters.

- **Backend:** graphql → `listEventTokenGates` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `networks` (string[], optional) — Filter by blockchain networks
  - `ticket_types` (string[], optional) — Filter by gated ticket type IDs
  - `search` (string, optional) — Search by name

---

### event top inviters (`event_top_inviters`)

Get top inviters ranked by successful invitations.

- **Backend:** graphql → `getEventTopInviters` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `limit` (number, optional) — Pagination limit
  - `skip` (number, optional) — Pagination offset

---

### event top views (`event_top_views`)

Get top traffic sources and cities for an event, plus total views.

- **Backend:** graphql → `getEventTopViews` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `city_limit` (number, required) — Max cities to return
  - `source_limit` (number, required) — Max sources to return

---

### event update (`event_update`)

Update an existing event with full configuration options.

- **Backend:** graphql → `updateEvent` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `title` (string, optional) — New title
  - `start` (string, optional) — New start date (ISO 8601)
  - `end` (string, optional) — New end date (ISO 8601)
  - `description` (string, optional) — New description
  - `address` (string, optional) — New venue address
  - `guest_limit` (number, optional) — Maximum number of guests
  - `guest_limit_per` (number, optional) — Maximum guests per registration
  - `ticket_limit_per` (number, optional) — Maximum tickets per user
  - `private` (boolean, optional) — Private event (requires approval to join)
  - `approval_required` (boolean, optional) — Require approval for registrations
  - `application_required` (boolean, optional) — Require application form
  - `timezone` (string, optional) — Event timezone (e.g. America/New_York)
  - `virtual` (boolean, optional) — Virtual event
  - `virtual_url` (string, optional) — Virtual event URL
  - `registration_disabled` (boolean, optional) — Disable registration
  - `currency` (string, optional) — Payment currency code (e.g. USD)
  - `tags` (string[], optional) — Event tags
  - `guest_directory_enabled` (boolean, optional) — Enable guest directory
  - `subevent_enabled` (boolean, optional) — Enable sub-events
  - `terms_text` (string, optional) — Terms and conditions text
  - `welcome_text` (string, optional) — Welcome message for attendees
  - `theme_data` (string, optional) — Theme configuration as JSON (use theme_build tool to generate)
  - `dark_theme_image` (string, optional) — File ID for dark mode background image (from file_upload)
  - `light_theme_image` (string, optional) — File ID for light mode background image (from file_upload)

---

### event view stats (`event_view_insight`)

Get page view statistics for an event.

- **Backend:** graphql → `aiGetEventViewInsight` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event view stats (`event_view_stats`)

Get view counts for multiple date ranges (for comparison).

- **Backend:** graphql → `getEventViewStats` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `ranges` (object[], required) — Array of { start, end } date ranges

---

### event views chart (`event_views_chart`)

Get page view data over a time range for charting.

- **Backend:** graphql → `getEventViewChartData` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ObjectId
  - `start` (string, required) — Start date ISO 8601
  - `end` (string, required) — End date ISO 8601

---

## Related Tools

`accept_event`, `decline_event`, `event_add_cohost`, `event_application_answers`, `event_application_export`, `event_approvals`, `event_broadcast_create`, `event_broadcast_delete`, `event_broadcast_update`, `event_cancel`, `event_cancel_invitations`, `event_checkin`, `event_checkin_chart`, `event_checkins`, `event_clone`, `event_create`, `event_discount_delete`, `event_discount_update`, `event_email_create`, `event_email_delete`, `event_email_test`, `event_email_toggle`, `event_email_update`, `event_emails_list`, `event_export_guests`, `event_feedback_summary`, `event_feedbacks`, `event_get`, `event_guest_detail`, `event_guest_stats`, `event_guests`, `event_guests_list`, `event_guests_statistics`, `event_invitation_stats`, `event_invite`, `event_join_requests`, `event_latest_views`, `event_list`, `event_list_cohost_requests`, `event_poap_create`, `event_poap_import`, `event_poap_list`, `event_poap_update`, `event_publish`, `event_question_create`, `event_question_delete`, `event_question_like`, `event_questions_list`, `event_recurring_dates`, `event_remove_cohost`, `event_sales_chart`, `event_search`, `event_set_photos`, `event_ticket_categories`, `event_ticket_categories_list`, `event_ticket_category_create`, `event_ticket_category_delete`, `event_ticket_category_reorder`, `event_ticket_category_update`, `event_ticket_delete`, `event_ticket_reorder`, `event_ticket_sold_insight`, `event_ticket_statistics`, `event_token_gate_create`, `event_token_gate_delete`, `event_token_gate_update`, `event_token_gates_list`, `event_top_inviters`, `event_top_views`, `event_update`, `event_view_insight`, `event_view_stats`, `event_views_chart`
