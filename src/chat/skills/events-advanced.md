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

1. event_generate_recurring_dates -- start, utc_offset_minutes, repeat (daily/weekly/monthly). Optional: day_of_weeks (0-6), end, count (max 100).
2. event_clone -- clone to generated dates. Returns new event IDs.

# Join Requests

event_approvals -- decision: "approved"/"declined". Optional request_ids. Destructive.
