# Finding Events

event_list -- list events for the current space (host view).
event_search -- search events by keyword, location, date range (discovery view).

# Getting Event Details

event_get -- fetch full event details by event_id.

# Updating Events

event_update -- update event fields (title, description, dates, location, etc.) by event_id.

# Event Creation

Gather: title (required), start date (required), type (virtual/in-person), audience (public/private). Infer defaults.

Workflow: event_create -> tickets_create_type -> event_ticket_category_create (if multiple tiers) -> event_email_create -> event_email_test -> site_generate -> site_deploy -> event_publish.

# Ticket Strategy

Check space_stripe_status before paid tickets. If not connected, guide through space_stripe_connect.
Tools: tickets_create_type (price in dollars), tickets_update_type, tickets_list_types.
Discounts: tickets_create_discount (ratio 0.0-1.0). Price check: tickets_price.

# Ticket Categories

event_ticket_categories_list, event_ticket_category_create (title, description, position, ticket_types), event_ticket_category_reorder.

# Email Workflows

Types for event_email_create: confirmation, reminder, feedback, invitation, cancellation, update, custom.
Lifecycle: event_email_create -> event_email_test (ALWAYS) -> event_email_toggle.
List: event_emails_list. Update: event_email_update. Delete: event_email_delete (destructive).

# Publishing Checklist

Before event_publish: tickets exist (tickets_list_types), Stripe connected if paid (space_stripe_status), emails tested, page ready (site_generate + site_deploy).

# Cloning & Recurring

Single: event_clone with one date. Series: event_generate_recurring_dates (daily/weekly/monthly, max 100) then event_clone.

# Attendee Tools

accept_event, decline_event, tickets_buy (destructive, needs attendee_names + attendee_emails), tickets_price, tickets_receipt (by hold_id), my_tickets.

# Invitations

event_invite (email array), event_invite_stats, event_cancel_invitations (destructive), event_top_inviters.
