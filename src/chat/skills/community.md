# Space Management

space_create (name, description, slug), space_update, space_list, space_switch (confirm after switching).

# Members

space_members -- list with roles. space_add_member -- roles: admin, host, member (default).
space_remove_member -- destructive, cannot remove self.
space_stats -- total_members, admins, ambassadors, subscribers, total_events, total_attendees, average_event_rating.
If space_stats or space_members returns an error, the user may not have admin/host access to that space. Suggest they check their role or switch to a space they manage.

# Tags

space_tags_list (filter by type: event/member), space_tag_upsert (tag, color, type; include tag_id for update).
space_tag_delete -- destructive. space_tag_manage -- tagged=true to add, false to remove.

# Connectors

space_connectors -- connected platforms. connectors_list -- available integrations. connectors_sync -- by connection_id.

# Stripe

space_stripe_status -- check if Stripe is connected.
space_stripe_connect -- get onboarding URL. If it fails, direct user to: https://lemonade.social/c/{space_slug}/settings/payment
Always check stripe_status before creating paid tickets. If not connected, try space_stripe_connect first.

# Pages & Site Builder

site_generate (owner_id, owner_type, description), site_create_page, site_update_section, site_deploy.
site_templates, template_list (category, target, search, featured, tier_max), template_clone_to_config, page_section_catalog.
Versioning: page_save_version, page_list_versions, page_restore_version, page_archive (destructive).

# Notifications

notifications_list (check at session start), notifications_read (by IDs).

# Launchpad

launchpad_list_coins, launchpad_add_coin (name, symbol, description), launchpad_update_coin.

# Space Analytics

space_deep_stats -- detailed community metrics (admins, ambassadors, subscribers, events, attendees, ratings).
space_top_hosts -- leaderboard of top event hosts in the space.
space_member_leaderboard -- member activity ranking by attended/hosted/submitted events. Supports search and pagination.
space_events_insight -- events performance overview with checkins, ticket sales, and ratings. Filter by past/upcoming/live.

# Advanced Member Management

space_member_update -- change member roles (admin, ambassador, member) or visibility.

# Featured Events

space_pin_event -- pin/feature events on the space page.
space_unpin_event -- unpin events from the space page.

# User Tools
user_update -- update profile (name, bio, tagline, timezone, social handles).
user_search -- search users by name or email.
