# Quick Status

event_guest_stats -- going/pending/declined/checked_in counts. Start here for "how's my event?"

# Ticket & Revenue

event_ticket_sold_insight -- sold count, revenue, per-type breakdown.
event_ticket_statistics -- all/checked_in/not_checked_in/invited/issued/cancelled, applicant states.
event_payment_stats -- total revenue, currency, payment count.

# Charts (all require start/end ISO 8601 dates)

event_sales_chart (optional ticket_type_ids), event_checkin_chart, event_views_chart.

# View Analytics

event_view_insight -- views, unique visitors, top sources/cities.
event_view_stats -- compare across date ranges (array of {start, end}).
event_top_views -- top traffic by city/source (city_limit, source_limit).

# Inviter Analytics

event_top_inviters -- ranked inviters. event_invite_stats -- per-guest tracking.

# Feedback

event_feedback_summary -- avg rating, distribution. event_feedbacks -- entries with rate_value (1-5), comment.

# Guest Management

event_guests_list -- filters: search, ticket_types, status booleans, sort_by/sort_order.
event_guests_statistics -- counts by status and ticket type.
event_guest_detail -- one guest deep dive. event_export_guests -- export with filters.
event_checkins -- check-in history. event_application_answers -- form responses.

# Interpretation

- 45%+ sold, 2+ weeks left = on track
- Check-in < 60% = send reminders
- View-to-registration < 5% = improve event page
- Declining views = promote or send invites
- High decline rate = refine invite list
