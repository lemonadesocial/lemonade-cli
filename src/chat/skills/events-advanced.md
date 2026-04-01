# Co-Hosts

event_list_cohost_requests -- filter by state: PENDING, ACCEPTED, DECLINED.
event_add_cohost -- by email/user_id. Roles: cohost, gatekeeper, representative.
event_remove_cohost -- destructive.

# Broadcasting

event_broadcast_create -- providers: embed, local, twitch, video, youtube, zoom. Requires: provider, provider_id, title.
event_broadcast_update -- change description/position. event_broadcast_delete -- destructive.
Provider IDs: YouTube=video ID, Twitch=channel, Zoom=meeting ID, embed=URL, video=file URL.

# Token Gates

event_token_gates_list -- filter by networks/ticket_types.
event_token_gate_create -- requires: event_id, name, token_address, network. Optional: decimals, min/max_value, is_nft, gated_ticket_types.
event_token_gate_update, event_token_gate_delete (destructive).
Use list_chains for supported networks.

# POAP Drops

event_poap_list, event_poap_create (requires: event_id, name, description, amount, image, claim_mode: check_in|registration).
event_poap_update (amount >= current). event_poap_import -- by external ID + edit code.

# Event Q&A

event_questions_list -- sort by _id or likes, cursor via id_lt.
event_question_create (optional session param). event_question_like -- toggle. event_question_delete -- destructive.

# Recurring Events

1. event_recurring_dates -- start, utc_offset_minutes, repeat (DAILY/WEEKLY/MONTHLY/YEARLY). Optional: day_of_weeks (0-6), end, count (max 100).
2. event_clone -- clone to generated dates. Returns new event IDs.

# Join Requests

event_approvals -- decision: "approved"/"declined". Optional request_ids. Destructive.

# Event Cloning & Recurring

event_recurring_dates -- generate dates for recurring events (daily/weekly/monthly/yearly). Required: start date, utc_offset_minutes, repeat pattern.
event_clone -- clone an existing event to new dates. Returns new event IDs.
Workflow: event_recurring_dates -> event_clone with the generated dates.

# Join Request Management

event_join_requests -- list pending/approved/declined join requests. Filter by state, search by name.
Use event_approvals (existing tool) to approve or decline requests.

# Attendee Check-in

event_checkin -- manually check in an attendee by user ID. Useful for walk-ins or registration desk.

# Guest Export

event_export_guests -- export attendee data (names, emails, ticket types, payment, check-in status). Supports search and check-in filters.

# Invitation Tracking

event_invitation_stats -- track invitation performance: total sent, joined, declined, emails opened.
event_cancel_invitations -- cancel specific invitations by ID. Destructive — requires confirmation.

# Ticket Management

event_ticket_delete -- remove a ticket type. Destructive — requires confirmation.
event_ticket_reorder -- change the display order of ticket types.

# Payment Summary

event_payment_summary -- detailed payment breakdown by currency, including transferred and pending amounts.
