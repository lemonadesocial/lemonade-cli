# Space Management

space_create (name, description, slug), space_update, space_list, space_switch (confirm after switching).

# Members

space_members -- list with roles. space_add_member -- roles: admin, host, member (default).
space_remove_member -- destructive, cannot remove self.
space_stats -- total_members, admin_count, host_count, total_events, total_attendees, average_rating.

# Tags

space_tags_list (filter by type: event/member), space_tag_upsert (tag, color, type; include tag_id for update).
space_tag_delete -- destructive. space_tag_manage -- tagged=true to add, false to remove.

# Connectors

space_connectors -- connected platforms. connectors_list -- available integrations. connectors_sync -- by connection_id.

# Stripe

space_stripe_status -- check connection status.
space_stripe_connect -- get Stripe onboarding URL. Pass space_slug from session for fallback URL.
If stripe_connect fails, provide the direct link: https://lemonade.social/c/{space_slug}/settings/payment
Always check stripe_status before creating paid tickets.
When Stripe is not connected, provide the direct setup link using the current space's slug from session context.

# Pages & Site Builder

site_generate (owner_id, owner_type, description), site_create_page, site_update_section, site_deploy.
site_templates, template_list (category, target, search, featured, tier_max), template_clone_to_config, page_section_catalog.
Versioning: page_save_version, page_list_versions, page_restore_version, page_archive (destructive).

# Notifications

notifications_list (check at session start), notifications_read (by IDs).

# Launchpad

launchpad_list_coins, launchpad_add_coin (name, symbol, description), launchpad_update_coin.
