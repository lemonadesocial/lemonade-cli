import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Read domain and utility sources to extract GraphQL queries statically.
// This avoids importing the registry (which pulls in network modules).
const domainsDir = join(process.cwd(), 'src/chat/tools/domains');
const utilsDir = join(process.cwd(), 'src/chat/tools/utils');
const registrySource = [
  ...readdirSync(domainsDir)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => readFileSync(join(domainsDir, f), 'utf-8')),
  ...readdirSync(utilsDir)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => readFileSync(join(utilsDir, f), 'utf-8')),
].join('\n');

/**
 * Known valid field names for each GraphQL operation, at ALL nesting levels.
 * This is a flat set — nested sub-fields are included alongside top-level ones.
 *
 * HOW TO UPDATE:
 * 1. Check the backend type definition in lemonade-backend/src/graphql/types/
 * 2. Find the resolver in lemonade-backend/src/graphql/resolvers/
 * 3. Collect ALL field names the operation can return (including nested object fields)
 * 4. Update the set below
 *
 * Empty arrays mean the operation returns a scalar (String, Boolean, [ObjectId], etc.)
 * or the response structure is opaque JSON — no field validation needed.
 */
const BACKEND_SCHEMA: Record<string, string[]> = {
  // === AI Tool endpoints (lemonade-backend/src/graphql/types/ai-tool.ts) ===
  getMe: ['_id', 'name', 'email', 'first_name', 'last_name', 'stripe_connected_account', 'account_id', 'connected'],
  aiGetBackendVersion: [], // scalar String
  getHostingEvents: ['_id', 'title', 'shortid', 'start', 'end', 'published', 'description', 'address', 'cover', 'attending_count'],
  getEvent: ['_id', 'title', 'shortid', 'start', 'end', 'published', 'description', 'address', 'city', 'country', 'latitude', 'longitude', 'cover', 'attending_count', 'virtual', 'virtual_url', 'private', 'guest_limit', 'guest_limit_per', 'ticket_limit_per', 'timezone', 'approval_required', 'application_required', 'registration_disabled', 'currency', 'tags', 'guest_directory_enabled', 'subevent_enabled', 'terms_text', 'welcome_text', 'theme_data', 'dark_theme_image', 'light_theme_image'],
  createEvent: ['_id', 'title', 'shortid', 'start', 'end', 'published', 'description', 'virtual', 'virtual_url', 'private', 'guest_limit', 'guest_limit_per', 'timezone', 'approval_required', 'address', 'city', 'country', 'latitude', 'longitude', 'theme_data', 'dark_theme_image', 'light_theme_image'],
  updateEvent: ['_id', 'title', 'shortid', 'start', 'end', 'published', 'description', 'virtual', 'virtual_url', 'private', 'guest_limit', 'guest_limit_per', 'timezone', 'approval_required', 'cover', 'theme_data', 'dark_theme_image', 'light_theme_image'],
  aiPublishEvent: ['_id', 'title', 'published', 'shortid'],
  cancelEvent: ['_id'], // Returns Event!
  aiSearchEvents: ['items', '_id', 'title', 'shortid', 'start', 'end', 'published', 'description', 'address', 'cover', 'attending_count', 'city', 'country', 'latitude', 'longitude'],
  aiGetEventGuestStats: ['going', 'pending_approval', 'pending_invite', 'declined', 'checked_in', 'total'],
  aiGetEventTicketSoldInsight: ['total_sold', 'total_revenue_cents', 'currency', 'by_type', 'ticket_type_id', 'title', 'sold', 'revenue_cents'],
  aiGetEventViewInsight: ['total_views', 'unique_visitors', 'top_sources', 'top_cities', 'source', 'count', 'city'],
  aiGetEventGuests: ['items', 'name', 'email', 'status', 'ticket_type_title', 'checked_in'],
  aiGetEventCheckins: ['items', 'name', 'email', 'ticket_type_title', 'checked_in_at'],
  aiGetEventPaymentStats: ['total_payments', 'total_revenue', 'by_provider', 'currency', 'amount_cents', 'provider', 'count'],
  aiGetEventFeedbackSummary: ['average_rating', 'total_reviews', 'rating_distribution', 'rating', 'count'],
  aiListEventFeedbacks: ['items', 'rating', 'comment', 'user_name', 'created_at'],
  aiGetEventApplicationAnswers: ['user_name', 'email', 'answers', 'submitted_at', 'question', 'answer'],
  listEventTicketTypes: ['title', 'active', 'private', 'limited', 'description'],
  createEventTicketType: ['title', 'active', 'private', 'limited', 'description'],
  updateEventTicketType: ['title', 'active', 'private', 'limited', 'description'],
  aiCreateEventTicketDiscount: ['_id', 'code', 'discount_type', 'value', 'limit', 'created_at'],
  aiCalculateTicketPrice: ['subtotal_cents', 'discount_cents', 'total_cents', 'currency'],
  inviteEvent: ['_id'], // Returns Event!
  aiDecideEventJoinRequests: ['processed_count', 'decision'],
  acceptEvent: ['state'], // Returns EventRsvp!
  declineEvent: ['state'], // Returns EventRsvp!
  aiGetMyTickets: ['items', 'event_title', 'ticket_type_title', 'status', 'event_id', 'event_start', 'event_end'],
  listMySpaces: ['items', '_id', 'title', 'slug', 'description', 'total'],
  createSpace: ['_id', 'title', 'slug', 'description', 'handle_twitter', 'handle_instagram', 'handle_linkedin', 'handle_youtube', 'handle_tiktok', 'website', 'tint_color', 'private', 'theme_data', 'theme_name', 'dark_theme_image', 'light_theme_image', 'address', 'title', 'city', 'country'],
  updateSpace: ['_id', 'title', 'slug', 'description', 'state', 'handle_twitter', 'handle_instagram', 'handle_linkedin', 'handle_youtube', 'handle_tiktok', 'website', 'tint_color', 'private', 'theme_data', 'theme_name', 'dark_theme_image', 'light_theme_image', 'address', 'title', 'city', 'country', 'image_avatar', 'image_cover'],
  listNewPaymentAccounts: ['_id', 'active', 'type', 'title', 'provider', 'created_at', 'account_info', 'currencies', 'address', 'network', 'StripeAccount', 'SolanaAccount', 'EthereumAccount', 'DigitalAccount', 'SafeAccount', 'EthereumEscrowAccount', 'EthereumRelayAccount', 'EthereumStakeAccount'],
  createNewPaymentAccount: ['_id', 'active', 'type', 'title', 'provider', 'created_at'],
  updateNewPaymentAccount: ['_id', 'active', 'type', 'title', 'provider', 'created_at'],
  disconnectStripeAccount: [], // Boolean
  getStripeConnectedAccountCapability: ['id', 'capabilities', 'type', 'detail', 'available', 'display_preference', 'overridable', 'preference', 'value'],
  getSafeFreeLimit: ['current', 'max'],
  aiGetSpaceMembers: ['items', 'name', 'email', 'role', 'joined_at'],
  aiGetSpaceStats: ['total_members', 'admins', 'ambassadors', 'subscribers', 'total_events', 'total_attendees', 'average_event_rating'],
  aiAddSpaceMember: [], // scalar
  aiRemoveSpaceMember: [], // scalar
  getNotifications: ['_id', 'type', 'title', 'message', 'created_at', 'is_seen', 'from_expanded', 'ref_event_expanded', 'ref_space_expanded', 'name'],
  readNotifications: [], // Boolean
  getNotificationFilters: ['_id', 'mode', 'notification_type', 'notification_category', 'ref_type', 'ref_id', 'space_scoped'],
  setNotificationFilter: ['_id', 'mode', 'notification_type', 'notification_category', 'ref_type', 'ref_id', 'space_scoped'],
  deleteNotificationFilter: [], // Boolean
  getNotificationChannelPreferences: ['_id', 'enabled_channels', 'notification_type', 'notification_category', 'ref_type', 'ref_id', 'space_scoped'],
  setNotificationChannelPreference: ['_id', 'enabled_channels', 'notification_type', 'notification_category', 'ref_type', 'ref_id', 'space_scoped'],
  deleteNotificationChannelPreference: [], // Boolean
  listChains: ['chain_id', 'name', 'platform', 'rpc_url'],
  aiListLaunchpadCoins: ['items', '_id', 'name', 'symbol', 'status'],
  aiAddLaunchpadCoin: ['_id', 'name', 'symbol', 'status'],
  aiUpdateLaunchpadCoin: ['_id', 'name', 'symbol', 'status'],
  aiSuggestSections: ['type', 'name', 'reason', 'default_props'],
  aiCreatePageConfig: ['_id', 'name', 'status', 'version'],
  aiUpdatePageConfigSection: ['_id', 'name', 'status', 'version', 'sections', 'id', 'type', 'order', 'hidden'],
  getPageConfig: ['_id', 'owner_type', 'owner_id', 'name', 'description', 'status', 'version', 'published_version', 'template_id', 'thumbnail_url', 'sections', 'id', 'type', 'order', 'hidden', 'props'],
  updatePageConfig: ['_id', 'name', 'status', 'version'],
  getPublishedConfig: ['_id', 'owner_type', 'owner_id', 'name', 'status', 'version', 'sections', 'id', 'type', 'order', 'hidden'],
  createPreviewLink: ['_id', 'token', 'link_type', 'resource_id', 'expires_at'],
  createPageConfig: ['_id', 'owner_type', 'owner_id', 'name', 'status', 'version'],
  aiGeneratePageFromDescription: [], // opaque JSON

  // === Standard backend endpoints ===
  getEventJoinRequests: ['total', 'records', '_id', 'user', 'email', 'state', 'ticket_issued', 'created_at', 'user_expanded', 'name'],
  getEventTicketCategories: ['_id', 'event', 'title', 'description', 'position'],
  getEventPaymentSummary: ['currency', 'decimals', 'amount', 'transfer_amount', 'pending_transfer_amount'],
  getEventInvitedStatistics: ['total', 'total_joined', 'total_declined', 'emails_opened', 'records', '_id', 'email', 'state', 'invited_by_name', 'created_at'],
  getSpaceStatistics: ['admins', 'ambassadors', 'subscribers', 'created_events', 'submitted_events', 'event_attendees', 'avg_event_rating'],
  getSpaceMembersLeaderboard: ['total', 'items', '_id', 'user_name', 'email', 'role', 'attended_count', 'hosted_event_count', 'submitted_event_count'],
  getSpaceEventsInsight: ['total', 'items', '_id', 'title', 'checkins', 'tickets_count', 'rating'],
  getTopSpaceHosts: ['user_expanded', '_id', 'name', 'email', 'space_member', 'hosted_event_count', 'role'],
  exportEventTickets: ['count', 'tickets', '_id', 'shortid', 'user_email', 'user_name', 'buyer_name', 'buyer_email', 'ticket_type', 'ticket_type_title', 'quantity', 'payment_amount', 'currency', 'purchase_date', 'checkin_date', 'active', 'checked_in', 'checked_in_at', 'created_at', 'state'],
  exportEventApplications: ['user', 'non_login_user', 'questions', 'answers', '_id', 'email', 'name', 'answer'],
  getEventGuestsStatistics: ['going', 'not_going', 'pending', 'total', 'checkins', 'total_tickets_sold', 'total_revenue', 'pending_approval', 'pending_invite', 'declined', 'checked_in', 'ticket_types', 'ticket_type', 'ticket_type_title', 'guests_count'],
  listEventGuests: ['total', 'items', '_id', 'user', 'email', 'state', 'ticket_type_title', 'checked_in', 'user_expanded', 'name', 'display_name', 'created_at', 'ticket', 'type', 'join_request'],
  getEventGuestDetail: ['_id', 'user', 'email', 'state', 'ticket_types', 'user_expanded', 'application_answers', 'payments', 'name', 'title', 'amount', 'currency', 'question', 'answer', 'image_avatar', 'ticket', 'type', 'payment', 'join_request', 'application'],
  getTicketStatistics: ['total_sold', 'total_remaining', 'by_type', '_id', 'title', 'sold', 'remaining', 'limit', 'all', 'checked_in', 'not_checked_in', 'invited', 'issued', 'cancelled', 'applicants', 'state', 'count', 'ticket_types', 'ticket_type', 'ticket_type_title'],
  getEventTicketSoldChartData: ['items', 'created_at', 'type'],
  getEventCheckinChartData: ['items', 'created_at'],
  getEventViewChartData: ['items', 'date'],
  getEventViewStats: ['counts'],
  getEventTopViews: ['total', 'by_city', 'by_source', 'geoip_city', 'geoip_region', 'geoip_country', 'count', 'utm_source'],
  getEventTopInviters: ['total', 'items', 'inviter', '_id', 'name', 'image_avatar', 'count'],
  getEventCohostRequests: ['total', 'records', '_id', 'from', 'to', 'to_email', 'state', 'event_role', 'stamp', 'user', 'status', 'created_at', 'user_expanded', 'name', 'email'],

  // === Connector endpoints ===
  connectPlatform: ['connectionId', 'authUrl', 'requiresApiKey'],
  submitApiKey: ['id', 'connectorType', 'status', 'config', 'installedBy', 'installedAt', 'lastSyncAt', 'lastSyncStatus', 'enabled', 'errorMessage'],
  configureConnection: ['id', 'connectorType', 'status', 'config', 'enabled', 'errorMessage'],
  fetchConnectionConfigOptions: ['value', 'label'],
  connectionLogs: ['_id', 'actionId', 'triggerType', 'triggeredBy', 'status', 'recordsProcessed', 'recordsFailed', 'duration', 'errorMessage', 'createdAt'],
  disconnectPlatform: ['success', 'tokenRevoked', 'revocationError'], // DisconnectResult
  connectorSlotInfo: ['used', 'max', 'canAddMore', 'currentTier'],
  availableConnectors: ['id', 'name', 'category', 'authType', 'capabilities'],
  executeConnectorAction: [], // opaque
  spaceConnections: ['id', 'connectorType', 'status', 'config', 'enabled', 'lastSyncAt', 'lastSyncStatus', 'errorMessage'],

  // === Atlas reward endpoints ===
  atlasRewardSummary: ['organizer_accrued_usdc', 'organizer_pending_usdc', 'organizer_paid_out_usdc', 'attendee_accrued_usdc', 'attendee_pending_usdc', 'attendee_paid_out_usdc', 'volume_tier', 'monthly_gmv_usdc', 'next_tier_threshold_usdc', 'next_payout_date', 'is_self_verified', 'verification_cta_extra_usdc'],
  atlasRewardHistory: ['_id', 'event_id', 'gross_amount_usdc', 'organizer_cashback_usdc', 'attendee_cashback_usdc', 'organizer_volume_bonus_usdc', 'attendee_discovery_bonus_usdc', 'payment_method', 'status', 'created_at'],
  atlasPayoutHistory: ['amount_usdc', 'payout_method', 'tx_hash', 'stripe_transfer_id', 'status', 'processed_at'],
  atlasReferralSummary: ['code', 'total_referrals', 'total_reward_usdc'],
  atlasGetPayoutSettings: ['stripe_connect_account_id', 'wallet_address', 'wallet_chain', 'preferred_method'],
  atlasUpdatePayoutSettings: ['wallet_address', 'wallet_chain', 'preferred_method', 'stripe_connect_account_id'],
  atlasGenerateReferralCode: ['code'],
  atlasApplyReferralCode: [], // void

  // === Ticket lifecycle endpoints ===
  createTickets: ['_id', 'type', 'accepted'],
  cancelTickets: [], // scalar
  assignTickets: [], // scalar
  upgradeTicket: [], // scalar
  mailEventTicket: [], // scalar
  mailTicketPaymentReceipt: [], // scalar

  // === Payment operation endpoints ===
  listEventPayments: ['total', 'records', '_id', 'amount', 'currency', 'state', 'formatted_total_amount', 'formatted_discount_amount', 'formatted_fee_amount', 'buyer_info', 'email', 'first_name', 'last_name', 'tickets', 'type'],
  getEventPayment: ['_id', 'amount', 'currency', 'state', 'formatted_total_amount', 'formatted_discount_amount', 'formatted_fee_amount', 'buyer_info', 'email', 'first_name', 'last_name', 'tickets', 'type', 'stripe_payment_info', 'payment_intent_id'],
  getEventPaymentStatistics: ['total_payments', 'stripe_payments', 'count', 'revenue', 'currency', 'formatted_total_amount', 'crypto_payments', 'networks', 'chain_id'],

  // === Mutations returning Boolean or simple types ===
  cloneEvent: [], // Returns [ObjectId]
  generateRecurringDates: [], // Returns [Date]
  checkinUser: ['state', 'messages', 'primary', 'secondary'],
  cancelEventInvitations: [], // Boolean
  deleteEventTicketType: [], // Boolean
  reorderTicketTypes: [], // Boolean
  deleteSpace: [], // Boolean
  updateSpaceMember: ['_id', 'role', 'visible', 'state'],
  pinEventsToSpace: ['requests', '_id', 'event', 'state'],
  unpinEventsFromSpace: [], // Boolean
  updateUser: ['_id', 'name', 'display_name', 'description', 'tagline', 'timezone', 'username', 'job_title', 'company_name', 'website'],
  searchUsers: ['_id', 'name', 'email', 'username', 'display_name', 'verified'],
  updateEventTicketDiscount: ['_id', 'title', 'payment_ticket_discounts', 'code', 'ratio', 'use_limit', 'use_limit_per', 'ticket_limit', 'ticket_limit_per', 'active'],
  deleteEventTicketDiscounts: ['_id', 'title', 'payment_ticket_discounts', 'code', 'active', 'use_count'],
  generateStripeAccountLink: ['url', 'expires_at'],
  manageEventCohostRequests: [], // Boolean

  // === Page config endpoints ===
  publishPageConfig: ['_id', 'name', 'status', 'published_version'],
  archivePageConfig: ['_id', 'name', 'status'],
  saveConfigVersion: ['_id', 'config_id', 'version', 'name'],
  restoreConfigVersion: ['_id', 'name', 'status', 'version'],
  listConfigVersions: ['_id', 'config_id', 'version', 'name'],
  getSectionCatalog: ['type', 'name', 'description', 'category', 'supports_children'],
  listTemplates: ['_id', 'name', 'slug', 'description', 'category', 'tags', 'thumbnail_url', 'target', 'visibility'],
  cloneTemplateToConfig: ['_id', 'name', 'status', 'version'],

  // === Token gate endpoints ===
  listEventTokenGates: ['_id', 'name', 'token_address', 'network', 'decimals', 'min_value', 'max_value', 'is_nft', 'event', 'gated_ticket_types'],
  createEventTokenGate: ['_id', 'name', 'token_address', 'network', 'event', 'gated_ticket_types'],
  updateEventTokenGate: ['_id', 'name', 'token_address', 'network', 'gated_ticket_types'],
  deleteEventTokenGate: [], // Boolean

  // === POAP endpoints ===
  listPoapDrops: ['_id', 'name', 'description', 'amount', 'image_url', 'minting_network', 'claim_count', 'status'],
  createPoapDrop: ['_id', 'name', 'description', 'amount', 'status', 'minting_network'],
  updatePoapDrop: ['_id', 'name', 'description', 'amount', 'status', 'minting_network'],
  importPoapDrop: ['_id', 'name', 'description', 'amount', 'status'],

  // === Ticket category endpoints ===
  createEventTicketCategory: ['_id', 'event', 'title', 'description', 'position'],
  updateEventTicketCategory: [], // Boolean
  deleteEventTicketCategory: [], // Boolean
  reorderTicketTypeCategories: [], // Boolean

  // === Space tag endpoints ===
  listSpaceTags: ['_id', 'space', 'tag', 'color', 'type', 'targets_count'],
  insertSpaceTag: ['_id', 'space', 'tag', 'color', 'type'],
  deleteSpaceTag: [], // Boolean
  manageSpaceTag: [], // Boolean

  // === Event question endpoints ===
  createEventQuestion: ['_id', 'event', 'user', 'question', 'stamp', 'likes'],
  deleteEventQuestion: [], // Boolean
  toggleEventQuestionLike: [], // Boolean
  getEventQuestions: ['_id', 'event', 'user', 'question', 'stamp', 'likes', 'liked', 'user_expanded', 'name', 'image_avatar'],

  // === Email settings endpoints ===
  listEventEmailSettings: ['_id', 'event', 'subject', 'template_type', 'scheduled_at', 'sent_at', 'disabled', 'system', 'body', 'recipient_count', 'type', 'is_system_email', 'subject_preview', 'body_preview'],
  createEventEmailSetting: ['_id', 'event', 'subject', 'template_type', 'body', 'scheduled_at', 'type', 'is_system_email', 'subject_preview', 'disabled'],
  updateEventEmailSetting: ['_id', 'subject', 'body', 'scheduled_at', 'type', 'disabled', 'subject_preview'],
  deleteEventEmailSetting: [], // Boolean
  toggleEventEmailSettings: [], // Boolean
  sendEventEmailSettingTestEmails: [], // Boolean

  // === AI credits endpoints ===
  getStandCredits: ['credits', 'subscription_tier', 'subscription_credits', 'purchased_credits', 'subscription_renewal_date', 'subscription_status', 'credits_high_water_mark', 'estimated_depletion_date'],
  getUsageAnalytics: ['daily_usage', 'by_model', 'top_users', 'totals', 'date', 'requests', 'credits', 'model', 'tier', 'percentage', 'user_id', 'avg_credits_per_request'],
  purchaseCredits: ['checkout_url', 'session_id'],
  getAvailableModels: ['id', 'provider', 'name', 'tier', 'minimum_credits_per_request', 'capabilities', 'is_default'],
  setPreferredModel: ['id', 'provider', 'name', 'tier', 'minimum_credits_per_request', 'capabilities', 'is_default'],
  setSpaceDefaultModel: ['id', 'provider', 'name', 'tier', 'minimum_credits_per_request', 'capabilities', 'is_default'],

  // === Newsletter endpoints ===
  listSpaceNewsletters: ['_id', 'subject_preview', 'draft', 'disabled', 'scheduled_at', 'sent_at', 'failed_at', 'created_at', 'recipient_types'],
  getSpaceNewsletter: ['_id', 'custom_subject_html', 'custom_body_html', 'draft', 'disabled', 'scheduled_at', 'sent_at', 'failed_at', 'failed_reason', 'recipient_types', 'cc', 'created_at', 'subject_preview', 'body_preview'],
  createSpaceNewsletter: ['_id', 'subject_preview', 'draft', 'scheduled_at', 'created_at'],
  updateSpaceNewsletter: ['_id', 'subject_preview', 'draft', 'disabled', 'scheduled_at'],
  deleteSpaceNewsletter: [], // Boolean
  sendSpaceNewsletterTestEmails: [], // Boolean
  getSpaceNewsletterStatistics: ['sent_count', 'delivered_count', 'open_count'],

  // === Subscription endpoints ===
  getSpaceSubscription: ['subscription', 'items', 'payment', '_id', 'space', 'status', 'current_period_start', 'current_period_end', 'cancel_at_period_end', 'type', 'active', 'client_secret', 'publishable_key'],
  listSubscriptionFeatureConfigs: ['feature_code', 'feature_type', 'description', 'display_label', 'tiers'],
  listSubscriptionItems: ['type', 'title', 'pricing', 'credits_per_month', 'price', 'annual_price', 'currency', 'decimals'],
  purchaseSubscription: ['checkout_url', 'session_id'],
  cancelSubscription: ['success', 'effective_date'],

  // === Space event moderation & quota endpoints ===
  getSpaceEventRequests: ['total', 'records', '_id', 'state', 'created_at', 'event_expanded', 'title', 'shortid', 'start', 'created_by_expanded', 'name', 'decided_at', 'decided_by_expanded'],
  decideSpaceEventRequests: [], // Boolean
  getSpaceEventSummary: ['all_events', 'virtual_events', 'irl_events', 'live_events', 'upcoming_events', 'past_events'],
  getSpaceSendingQuota: ['type', 'reset_frequency', 'remain', 'total', 'used'],
  getMySpaceEventRequests: ['total', 'records', '_id', 'state', 'created_at', 'decided_at', 'event_expanded', 'title', 'shortid', 'start'],

  // === Space role permissions endpoints ===
  listSpaceRoleFeatures: ['features', 'code', 'title', 'codes'],
  updateSpaceRoleFeatures: [], // Boolean

  // === Advanced analytics endpoints ===
  getSpaceMemberAmountByDate: ['_id', 'total'],
  getTopSpaceEventAttendees: ['attended_event_count', 'user_expanded', '_id', 'name', 'email', 'non_login_user'],
  getSpaceEventLocationsLeaderboard: ['country', 'city', 'total'],
  generateCubejsToken: [], // scalar String
  getSpaceRewardStatistics: ['events_count', 'checkin_settings_count', 'ticket_settings_count', 'unique_recipients_count'],
  getEventLatestViews: ['views', 'date', 'geoip_country', 'geoip_region', 'geoip_city', 'user_agent'],
  // File upload & image management
  createFileUploads: ['_id', 'url', 'presigned_url', 'type', 'key'],
  confirmFileUploads: [], // Boolean
  createFile: ['_id', 'url', 'type', 'size'],

  // Event session reservations
  getEventSessionReservations: ['user', 'event', 'session', 'ticket_type', 'user_expanded', '_id', 'name'],
  getEventSessionReservationSummary: ['session', 'ticket_type', 'count'],
  createEventSessionReservation: [], // Boolean
  deleteEventSessionReservation: [], // Boolean

  // Event voting
  listEventVotings: ['_id', 'title', 'description', 'state', 'start', 'end', 'stage', 'timezone', 'selected_option', 'voting_options', 'option_id'],
  castVote: [], // Boolean
};

/**
 * Extract all field names from a GraphQL selection set string (including nested).
 * Returns a flat array of all field identifiers found.
 */
function extractAllFieldNames(selectionSet: string): string[] {
  // Remove all GraphQL structural characters, variable refs, and argument blocks
  const cleaned = selectionSet
    // Remove argument blocks like ($var: Type) or (event: $event)
    .replace(/\([^)]*\)/g, ' ')
    // Remove braces
    .replace(/[{}]/g, ' ')
    // Remove spread operators
    .replace(/\.\.\./g, ' ');

  return cleaned
    .split(/[\s,\n]+/)
    .map(f => f.trim())
    .filter(f =>
      f.length > 0 &&
      !f.startsWith('$') &&
      !f.startsWith('#') &&
      !f.includes(':') &&
      // Filter out GraphQL keywords
      f !== 'query' &&
      f !== 'mutation' &&
      f !== 'fragment' &&
      f !== 'on' &&
      // Must be a valid identifier
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f),
    );
}

/**
 * Extract GraphQL operations from the registry source.
 * Returns the operation name, all field names requested, and source line number.
 */
function extractQueriesFromSource(source: string): Array<{ operation: string; fields: string[]; line: number }> {
  const queries: Array<{ operation: string; fields: string[]; line: number }> = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    // Look for graphqlRequest calls that contain query/mutation
    const line = lines[i];

    // Match the start of a GraphQL query string
    const gqlStart = line.match(/(?:query|mutation)\s*(?:\([^)]*\))?\s*\{/);
    if (!gqlStart) continue;

    // Collect the full GraphQL string by tracking brace depth
    let gqlBlock = '';
    let braceCount = 0;
    let started = false;

    for (let j = i; j < Math.min(i + 30, lines.length); j++) {
      const currentLine = lines[j];
      for (const char of currentLine) {
        if (char === '{') { braceCount++; started = true; }
        if (char === '}') braceCount--;
      }
      gqlBlock += currentLine + '\n';
      if (started && braceCount <= 0) break;
    }

    // Extract the operation name (first identifier after the outermost opening brace)
    const opMatch = gqlBlock.match(/(?:query|mutation)\s*(?:\([^)]*\))?\s*\{\s*(\w+)/);
    if (!opMatch) continue;

    const operation = opMatch[1];

    // Get just the operation's selection set (everything after the operation name and its args)
    const opPattern = new RegExp(
      `${operation}\\s*(?:\\([^)]*\\))?\\s*\\{`,
    );
    const opIdx = gqlBlock.search(opPattern);
    if (opIdx === -1) {
      // Operation has no selection set (scalar return)
      queries.push({ operation, fields: [], line: i + 1 });
      continue;
    }

    // Find the matching closing brace for the operation's selection set
    const afterOp = gqlBlock.substring(opIdx);
    const firstBrace = afterOp.indexOf('{');
    if (firstBrace === -1) {
      queries.push({ operation, fields: [], line: i + 1 });
      continue;
    }

    let depth = 0;
    let selectionEnd = -1;
    for (let c = firstBrace; c < afterOp.length; c++) {
      if (afterOp[c] === '{') depth++;
      if (afterOp[c] === '}') {
        depth--;
        if (depth === 0) { selectionEnd = c; break; }
      }
    }

    if (selectionEnd === -1) {
      queries.push({ operation, fields: [], line: i + 1 });
      continue;
    }

    const selectionSet = afterOp.substring(firstBrace + 1, selectionEnd);
    const fields = extractAllFieldNames(selectionSet);

    // Remove the operation name itself if it ended up in the fields
    const filteredFields = fields.filter(f => f !== operation);

    queries.push({ operation, fields: filteredFields, line: i + 1 });
  }

  return queries;
}

// --- Tests ---

describe('Schema Validation — CLI queries match backend fields', () => {
  const queries = extractQueriesFromSource(registrySource);

  // De-duplicate: same operation+fields can appear multiple times
  const seen = new Set<string>();
  const uniqueQueries = queries.filter(q => {
    const key = `${q.operation}:${q.fields.join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  it('should find at least 40 GraphQL operations in the registry', () => {
    expect(uniqueQueries.length).toBeGreaterThanOrEqual(40);
  });

  it('should have a BACKEND_SCHEMA entry for every extracted operation', () => {
    const missing = uniqueQueries
      .filter(q => BACKEND_SCHEMA[q.operation] === undefined)
      .map(q => `${q.operation} (line ${q.line})`);
    if (missing.length > 0) {
      expect.fail(
        `Operations missing from BACKEND_SCHEMA — add them:\n${missing.join('\n')}`,
      );
    }
  });

  for (const { operation, fields, line } of uniqueQueries) {
    const schemaFields = BACKEND_SCHEMA[operation];
    if (schemaFields === undefined || schemaFields.length === 0) continue;
    if (fields.length === 0) continue;

    it(`[line ${line}] ${operation} — all requested fields exist in backend schema`, () => {
      const invalidFields = fields.filter(f => !schemaFields.includes(f));
      if (invalidFields.length > 0) {
        expect.fail(
          `${operation} requests fields not in backend schema: [${invalidFields.join(', ')}]\n` +
          `Valid fields: [${schemaFields.join(', ')}]\n` +
          `Registry line ~${line}\n` +
          `Fix: either correct the CLI query or add the field to BACKEND_SCHEMA.`,
        );
      }
    });
  }
});
