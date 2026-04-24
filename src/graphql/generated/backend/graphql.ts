/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  MongoID: { input: any; output: any; }
};

export type AiEvent = {
  __typename?: 'AIEvent';
  _id?: Maybe<Scalars['MongoID']['output']>;
  address?: Maybe<Address>;
  /** Number of users who have tickets */
  attending_count?: Maybe<Scalars['Float']['output']>;
  cover?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  end: Scalars['DateTimeISO']['output'];
  /** If this is true then the event is published, otherwise the event is unpublished. */
  published?: Maybe<Scalars['Boolean']['output']>;
  shortid: Scalars['String']['output'];
  start: Scalars['DateTimeISO']['output'];
  title: Scalars['String']['output'];
};

export type AiGetMeResponse = {
  __typename?: 'AIGetMeResponse';
  /** Information about the current user */
  user: AiUser;
};

export type AiNotification = {
  __typename?: 'AINotification';
  created_at: Scalars['DateTimeISO']['output'];
  from_user_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
  read: Scalars['Boolean']['output'];
  ref_event_title?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type AiToolProjection = {
  __typename?: 'AIToolProjection';
  fields: Array<Scalars['String']['output']>;
  operation: Scalars['String']['output'];
};

export type AiUser = {
  __typename?: 'AIUser';
  _id?: Maybe<Scalars['MongoID']['output']>;
  addresses?: Maybe<Array<Address>>;
  email?: Maybe<Scalars['String']['output']>;
  first_name?: Maybe<Scalars['String']['output']>;
  last_name?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
};

export type AcceptEventTermsInput = {
  _id: Scalars['MongoID']['input'];
  email_permission?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AcceptUserDiscoveryResponse = {
  __typename?: 'AcceptUserDiscoveryResponse';
  state?: Maybe<UserDiscoverySwipeState>;
  user?: Maybe<User>;
};

export type AccessPass = {
  __typename?: 'AccessPass';
  base: Scalars['String']['output'];
  card_description: Scalars['String']['output'];
  card_image_url: Scalars['String']['output'];
  card_logo_url: Scalars['String']['output'];
  checkin?: Maybe<Scalars['Boolean']['output']>;
  contract: Scalars['String']['output'];
  dialog_background_url: Scalars['String']['output'];
  dialog_description: Scalars['String']['output'];
  dialog_title: Scalars['String']['output'];
  discord_url?: Maybe<Scalars['String']['output']>;
  frame: Scalars['String']['output'];
  gallery_logo_url: Scalars['String']['output'];
  info_url: Scalars['String']['output'];
  instagram_url?: Maybe<Scalars['String']['output']>;
  logo_url: Scalars['String']['output'];
  metadata_creators: Array<Scalars['String']['output']>;
  metadata_description: Scalars['String']['output'];
  metadata_name: Scalars['String']['output'];
  name: Scalars['String']['output'];
  network: Scalars['String']['output'];
  twitter_url?: Maybe<Scalars['String']['output']>;
  unlocked_description?: Maybe<Scalars['String']['output']>;
};

export type AccessPassInput = {
  base: Scalars['String']['input'];
  card_description: Scalars['String']['input'];
  card_image_url: Scalars['String']['input'];
  card_logo_url: Scalars['String']['input'];
  checkin?: InputMaybe<Scalars['Boolean']['input']>;
  contract: Scalars['String']['input'];
  dialog_background_url: Scalars['String']['input'];
  dialog_description: Scalars['String']['input'];
  dialog_title: Scalars['String']['input'];
  discord_url?: InputMaybe<Scalars['String']['input']>;
  frame: Scalars['String']['input'];
  gallery_logo_url: Scalars['String']['input'];
  info_url: Scalars['String']['input'];
  instagram_url?: InputMaybe<Scalars['String']['input']>;
  logo_url: Scalars['String']['input'];
  metadata_creators: Array<Scalars['String']['input']>;
  metadata_description: Scalars['String']['input'];
  metadata_name: Scalars['String']['input'];
  name: Scalars['String']['input'];
  network: Scalars['String']['input'];
  twitter_url?: InputMaybe<Scalars['String']['input']>;
  unlocked_description?: InputMaybe<Scalars['String']['input']>;
};

export type AccountInfo = DigitalAccount | EthereumAccount | EthereumEscrowAccount | EthereumRelayAccount | EthereumStakeAccount | SafeAccount | SolanaAccount | StripeAccount;

export type AccountKeyRequest = {
  __typename?: 'AccountKeyRequest';
  accepted?: Maybe<Scalars['Boolean']['output']>;
  deeplink_url: Scalars['String']['output'];
  token: Scalars['String']['output'];
};

export type ActivatePersonalSpace = {
  __typename?: 'ActivatePersonalSpace';
  personal_space: Space;
  space: Space;
};

export type ActiveSession = {
  __typename?: 'ActiveSession';
  _id: Scalars['String']['output'];
  app_version?: Maybe<Scalars['String']['output']>;
  client_type: Scalars['String']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  device_model?: Maybe<Scalars['String']['output']>;
  device_name?: Maybe<Scalars['String']['output']>;
  has_active_websocket: Scalars['Boolean']['output'];
  ip_address: Scalars['String']['output'];
  is_current: Scalars['Boolean']['output'];
  kratos_identity_id: Scalars['String']['output'];
  kratos_session_id?: Maybe<Scalars['String']['output']>;
  last_active_at: Scalars['DateTimeISO']['output'];
  locale?: Maybe<Scalars['String']['output']>;
  os?: Maybe<Scalars['String']['output']>;
};

export type AddLaunchpadGroupInput = {
  /** Contract address of the group */
  address: Scalars['String']['input'];
  chain_id: Scalars['Float']['input'];
  cover_photo?: InputMaybe<Scalars['MongoID']['input']>;
  /** URL of the cover photo, this can be useful in non login mode */
  cover_photo_url?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  handle_discord?: InputMaybe<Scalars['String']['input']>;
  handle_farcaster?: InputMaybe<Scalars['String']['input']>;
  handle_telegram?: InputMaybe<Scalars['String']['input']>;
  handle_twitter?: InputMaybe<Scalars['String']['input']>;
  /** Implementation address of the StakingManager contract that used to create the group */
  implementation_address: Scalars['String']['input'];
  /** Name of the group */
  name: Scalars['String']['input'];
  space?: InputMaybe<Scalars['MongoID']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type AddMemberInput = {
  email: Scalars['String']['input'];
  user_name?: InputMaybe<Scalars['String']['input']>;
};

export type AddSpaceMemberInput = {
  role: SpaceRole;
  space: Scalars['MongoID']['input'];
  tags?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  users: Array<AddMemberInput>;
  visible?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Address = {
  __typename?: 'Address';
  _id?: Maybe<Scalars['MongoID']['output']>;
  additional_directions?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  postal?: Maybe<Scalars['String']['output']>;
  recipient_name?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  street_1?: Maybe<Scalars['String']['output']>;
  street_2?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type AddressInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  additional_directions?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  postal?: InputMaybe<Scalars['String']['input']>;
  recipient_name?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
  street_1?: InputMaybe<Scalars['String']['input']>;
  street_2?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type AdminAccess = {
  __typename?: 'AdminAccess';
  granted_at?: Maybe<Scalars['DateTimeISO']['output']>;
  granted_by?: Maybe<Scalars['ID']['output']>;
  role: Scalars['String']['output'];
};

export type AdminActionResult = {
  __typename?: 'AdminActionResult';
  count?: Maybe<Scalars['Int']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type AdminExportResult = {
  __typename?: 'AdminExportResult';
  filename: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type AdminListResult = {
  __typename?: 'AdminListResult';
  items: Array<Scalars['JSON']['output']>;
  total: Scalars['Int']['output'];
};

export type AdminRecordResult = {
  __typename?: 'AdminRecordResult';
  _id: Scalars['String']['output'];
};

export type AiDataConsent = {
  __typename?: 'AiDataConsent';
  detailed_patterns: Scalars['Boolean']['output'];
};

export type ApiKeyBase = {
  __typename?: 'ApiKeyBase';
  _id: Scalars['MongoID']['output'];
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  created_by: Scalars['MongoID']['output'];
  expires_at?: Maybe<Scalars['DateTimeISO']['output']>;
  key_prefix: Scalars['String']['output'];
  last_used_at?: Maybe<Scalars['DateTimeISO']['output']>;
  name: Scalars['String']['output'];
  revoked_at?: Maybe<Scalars['DateTimeISO']['output']>;
  revoked_by?: Maybe<Scalars['MongoID']['output']>;
  scopes: Array<Scalars['String']['output']>;
  space: Scalars['MongoID']['output'];
  status: ApiKeyStatus;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  usage_count: Scalars['Float']['output'];
};

export enum ApiKeyStatus {
  Active = 'active',
  Expired = 'expired',
  Revoked = 'revoked'
}

export type ApiKeyUsageDayEntry = {
  __typename?: 'ApiKeyUsageDayEntry';
  avg_response_ms?: Maybe<Scalars['Float']['output']>;
  count: Scalars['Float']['output'];
  date: Scalars['String']['output'];
};

export type ApiKeyUsageEndpointEntry = {
  __typename?: 'ApiKeyUsageEndpointEntry';
  avg_response_ms?: Maybe<Scalars['Float']['output']>;
  count: Scalars['Float']['output'];
  endpoint: Scalars['String']['output'];
};

export type ApiKeyUsageResponse = {
  __typename?: 'ApiKeyUsageResponse';
  byDay: Array<ApiKeyUsageDayEntry>;
  byEndpoint: Array<ApiKeyUsageEndpointEntry>;
  days: Scalars['Float']['output'];
};

export type ApiQuotaStatusResponse = {
  __typename?: 'ApiQuotaStatusResponse';
  calls_remaining: Scalars['Float']['output'];
  calls_used: Scalars['Float']['output'];
  grace_buffer: Scalars['Float']['output'];
  hard_cap: Scalars['Float']['output'];
  monthly_quota: Scalars['Float']['output'];
  overage_enabled: Scalars['Boolean']['output'];
  period: Scalars['String']['output'];
  tier: Scalars['String']['output'];
};

export type ApiTierConfigResponse = {
  __typename?: 'ApiTierConfigResponse';
  api_access_enabled: Scalars['Boolean']['output'];
  available_scopes: Array<Scalars['String']['output']>;
  burst_limit_per_second: Scalars['Float']['output'];
  max_api_keys: Scalars['Float']['output'];
  max_page_size: Scalars['Float']['output'];
  monthly_quota: Scalars['Float']['output'];
  overage_enabled: Scalars['Boolean']['output'];
  overage_hard_cap: Scalars['Float']['output'];
  overage_rate_per_1000: Scalars['Float']['output'];
  quota_grace_buffer: Scalars['Float']['output'];
  rate_limit_per_minute: Scalars['Float']['output'];
  tier: Scalars['String']['output'];
};

export type Applicant = {
  __typename?: 'Applicant';
  _id?: Maybe<Scalars['MongoID']['output']>;
  active?: Maybe<Scalars['Boolean']['output']>;
  calendly_url?: Maybe<Scalars['String']['output']>;
  company_name?: Maybe<Scalars['String']['output']>;
  date_of_birth?: Maybe<Scalars['DateTimeISO']['output']>;
  /** This is the biography of the user */
  description?: Maybe<Scalars['String']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  education_title?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  ethnicity?: Maybe<Scalars['String']['output']>;
  handle_farcaster?: Maybe<Scalars['String']['output']>;
  handle_github?: Maybe<Scalars['String']['output']>;
  handle_instagram?: Maybe<Scalars['String']['output']>;
  handle_lens?: Maybe<Scalars['String']['output']>;
  handle_linkedin?: Maybe<Scalars['String']['output']>;
  handle_mirror?: Maybe<Scalars['String']['output']>;
  handle_twitter?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  industry?: Maybe<Scalars['String']['output']>;
  job_title?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name?: Maybe<Scalars['String']['output']>;
  new_gender?: Maybe<Scalars['String']['output']>;
  pronoun?: Maybe<Scalars['String']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  wallet_custodial?: Maybe<Scalars['String']['output']>;
  wallets_new?: Maybe<Scalars['JSON']['output']>;
};

export type ApplicationBlokchainPlatform = {
  __typename?: 'ApplicationBlokchainPlatform';
  platform: BlockchainPlatform;
  required?: Maybe<Scalars['Boolean']['output']>;
};

export type ApplicationBlokchainPlatformInput = {
  platform: BlockchainPlatform;
  required?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ApplicationProfileField = {
  __typename?: 'ApplicationProfileField';
  field: Scalars['String']['output'];
  question?: Maybe<Scalars['String']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
};

export type ApplicationProfileFieldInput = {
  field: Scalars['String']['input'];
  question?: InputMaybe<Scalars['String']['input']>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AssignTicketsInput = {
  assignees: Array<TicketAssignee>;
  event: Scalars['MongoID']['input'];
};

export type AvailableModel = {
  __typename?: 'AvailableModel';
  capabilities: Array<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  is_default: Scalars['Boolean']['output'];
  minimum_credits_per_request: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  tier: Scalars['String']['output'];
};

export enum BackgroundType {
  Color = 'color',
  Image = 'image',
  Pattern = 'pattern',
  Shader = 'shader',
  Video = 'video'
}

export type Badge = {
  __typename?: 'Badge';
  _id: Scalars['MongoID']['output'];
  city?: Maybe<Scalars['String']['output']>;
  claimable?: Maybe<Scalars['Boolean']['output']>;
  contract: Scalars['String']['output'];
  country?: Maybe<Scalars['String']['output']>;
  /** Distance in meters */
  distance?: Maybe<Scalars['Float']['output']>;
  list: Scalars['MongoID']['output'];
  list_expanded?: Maybe<BadgeList>;
  network: Scalars['String']['output'];
};

export type BadgeCity = {
  __typename?: 'BadgeCity';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
};

export type BadgeList = {
  __typename?: 'BadgeList';
  _id: Scalars['MongoID']['output'];
  image_url?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
};

export type BaseTokenRewardSetting = {
  __typename?: 'BaseTokenRewardSetting';
  _id: Scalars['MongoID']['output'];
  currency_address: Scalars['String']['output'];
  photo?: Maybe<Scalars['MongoID']['output']>;
  photo_expanded?: Maybe<File>;
  title: Scalars['String']['output'];
  user: Scalars['MongoID']['output'];
  vault: Scalars['MongoID']['output'];
  vault_expanded?: Maybe<TokenRewardVault>;
};

export type BasicUserInfo = {
  __typename?: 'BasicUserInfo';
  _id: Scalars['MongoID']['output'];
  company_name?: Maybe<Scalars['String']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  job_title?: Maybe<Scalars['String']['output']>;
  kratos_unicorn_wallet_address?: Maybe<Scalars['String']['output']>;
  kratos_wallet_address?: Maybe<Scalars['String']['output']>;
  matrix_localpart?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type BillingInfo = {
  __typename?: 'BillingInfo';
  _id?: Maybe<Scalars['MongoID']['output']>;
  additional_directions?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstname?: Maybe<Scalars['String']['output']>;
  lastname?: Maybe<Scalars['String']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  postal?: Maybe<Scalars['String']['output']>;
  recipient_name?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  street_1?: Maybe<Scalars['String']['output']>;
  street_2?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type BillingInfoInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  additional_directions?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstname?: InputMaybe<Scalars['String']['input']>;
  lastname?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  postal?: InputMaybe<Scalars['String']['input']>;
  recipient_name?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
  street_1?: InputMaybe<Scalars['String']['input']>;
  street_2?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export enum BlockchainPlatform {
  Ethereum = 'ethereum',
  Solana = 'solana'
}

export type BuyTicketsInput = {
  account_id: Scalars['MongoID']['input'];
  billing_info?: InputMaybe<BillingInfoInput>;
  buyer_info?: InputMaybe<BuyerInfoInput>;
  /** The wallet address to check for token gating. The wallet must be one of the connected walets. */
  buyer_wallet?: InputMaybe<Scalars['String']['input']>;
  connect_wallets?: InputMaybe<Array<ConnectWalletInput>>;
  currency: Scalars['String']['input'];
  discount?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  fee?: InputMaybe<Scalars['String']['input']>;
  inviter?: InputMaybe<Scalars['MongoID']['input']>;
  items: Array<PurchasableItem>;
  /** Array of passcodes to verify against the ticket types */
  passcodes?: InputMaybe<Array<Scalars['String']['input']>>;
  total: Scalars['String']['input'];
  transfer_params?: InputMaybe<Scalars['JSON']['input']>;
  /** In case the event requires application profile fields, this is used to call updateUser */
  user_info?: InputMaybe<UserInput>;
};

export type BuyTicketsResponse = {
  __typename?: 'BuyTicketsResponse';
  join_request?: Maybe<EventJoinRequest>;
  payment: NewPayment;
};

export type BuyerInfo = {
  __typename?: 'BuyerInfo';
  email: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type BuyerInfoInput = {
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type CalculateTicketsPricingInput = {
  buyer_info?: InputMaybe<BuyerInfoInput>;
  /** The wallet address to check for token gating. The wallet must be one of the connected walets. */
  buyer_wallet?: InputMaybe<Scalars['String']['input']>;
  connect_wallets?: InputMaybe<Array<ConnectWalletInput>>;
  currency: Scalars['String']['input'];
  discount?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  inviter?: InputMaybe<Scalars['MongoID']['input']>;
  items: Array<PurchasableItem>;
  /** Array of passcodes to verify against the ticket types */
  passcodes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** In case the event requires application profile fields, this is used to call updateUser */
  user_info?: InputMaybe<UserInput>;
};

export type CancelEventInvitationsInput = {
  event: Scalars['MongoID']['input'];
  invitations: Array<Scalars['MongoID']['input']>;
};

export type CancelMyTicketInput = {
  event: Scalars['MongoID']['input'];
  id: Scalars['MongoID']['input'];
};

export type CancelPaymentInput = {
  _id: Scalars['MongoID']['input'];
  payment_secret?: InputMaybe<Scalars['String']['input']>;
};

export type CancelSubscriptionInput = {
  stand_id: Scalars['String']['input'];
};

export type CancelSubscriptionResult = {
  __typename?: 'CancelSubscriptionResult';
  effective_date?: Maybe<Scalars['DateTimeISO']['output']>;
  success: Scalars['Boolean']['output'];
};

export type CancelTicketsInput = {
  event: Scalars['MongoID']['input'];
  tickets: Array<Scalars['MongoID']['input']>;
};

export type Capability = {
  __typename?: 'Capability';
  detail: CapabilityDetail;
  type: StripeCapabilityType;
};

export type CapabilityDetail = {
  __typename?: 'CapabilityDetail';
  available: Scalars['Boolean']['output'];
  display_preference: DisplayPreference;
};

export type CapabilityInput = {
  preference: StripeAccountCapabilityDisplayPreferencePreference;
  type: StripeCapabilityType;
};

export type CastVoteInput = {
  option_id?: InputMaybe<Scalars['String']['input']>;
  voting_id: Scalars['MongoID']['input'];
};

export type Chain = {
  __typename?: 'Chain';
  access_registry_contract?: Maybe<Scalars['String']['output']>;
  /** Whether the chain is active and can be used */
  active?: Maybe<Scalars['Boolean']['output']>;
  alzena_world_passport_contract_address?: Maybe<Scalars['String']['output']>;
  aragon_network?: Maybe<Scalars['String']['output']>;
  aragon_subgraph_url?: Maybe<Scalars['String']['output']>;
  axelar_chain_name?: Maybe<Scalars['String']['output']>;
  biconomy_api_key?: Maybe<Scalars['String']['output']>;
  /** The URL segment to concat with block explorer to get address detail */
  block_explorer_for_address?: Maybe<Scalars['String']['output']>;
  /** The URL segment to concat with block explorer to get token detail */
  block_explorer_for_token?: Maybe<Scalars['String']['output']>;
  /** The URL segment to concat with block explorer to get transaction detail */
  block_explorer_for_tx?: Maybe<Scalars['String']['output']>;
  block_explorer_icon_url?: Maybe<Scalars['String']['output']>;
  /** Dispaly name of the block explorer */
  block_explorer_name?: Maybe<Scalars['String']['output']>;
  /** URL of the block explorer */
  block_explorer_url?: Maybe<Scalars['String']['output']>;
  block_time: Scalars['Float']['output'];
  /** Id of the blockchain network in string format */
  chain_id: Scalars['String']['output'];
  /** Name of the blockchain network in short version */
  code_name: Scalars['String']['output'];
  donation_registry_contract?: Maybe<Scalars['String']['output']>;
  drip_nation_passport_contract_address?: Maybe<Scalars['String']['output']>;
  eas_event_contract?: Maybe<Scalars['String']['output']>;
  eas_graphql_url?: Maybe<Scalars['String']['output']>;
  ens_registry?: Maybe<Scalars['String']['output']>;
  escrow_manager_contract?: Maybe<Scalars['String']['output']>;
  festival_nation_passport_contract_address?: Maybe<Scalars['String']['output']>;
  fluffle_contract_address?: Maybe<Scalars['String']['output']>;
  is_zerodev_compatible?: Maybe<Scalars['Boolean']['output']>;
  launchpad_closed_permissions_contract_address?: Maybe<Scalars['String']['output']>;
  launchpad_fee_escrow_contract_address?: Maybe<Scalars['String']['output']>;
  launchpad_market_capped_price_contract_address?: Maybe<Scalars['String']['output']>;
  launchpad_market_utils_contract_address?: Maybe<Scalars['String']['output']>;
  launchpad_token_importer_contract_address?: Maybe<Scalars['String']['output']>;
  launchpad_treasury_address_fee_split_manager_implementation_contract_address?: Maybe<Scalars['String']['output']>;
  launchpad_treasury_staking_manager_implementation_contract_address?: Maybe<Scalars['String']['output']>;
  launchpad_zap_contract_address?: Maybe<Scalars['String']['output']>;
  lemonade_passport_contract_address?: Maybe<Scalars['String']['output']>;
  lemonade_username_contract_address?: Maybe<Scalars['String']['output']>;
  lemonhead_contract_address?: Maybe<Scalars['String']['output']>;
  logo_url?: Maybe<Scalars['String']['output']>;
  marketplace_contract?: Maybe<Scalars['String']['output']>;
  marketplace_version?: Maybe<Scalars['Int']['output']>;
  /** Display name of the blockchain network */
  name: Scalars['String']['output'];
  payment_config_registry_contract?: Maybe<Scalars['String']['output']>;
  /** The underlying technology of the chain, whether it is Solana or Ethereum */
  platform: Scalars['String']['output'];
  poap_contract?: Maybe<Scalars['String']['output']>;
  poap_enabled?: Maybe<Scalars['Boolean']['output']>;
  proxy_admin_contract?: Maybe<Scalars['String']['output']>;
  relay_payment_contract?: Maybe<Scalars['String']['output']>;
  reward_registry_contract?: Maybe<Scalars['String']['output']>;
  /** Public RPC URL that can be used */
  rpc_url: Scalars['String']['output'];
  /** Number of confirmations after which a transaction is considered irrevertible */
  safe_confirmations: Scalars['Float']['output'];
  stake_payment_contract?: Maybe<Scalars['String']['output']>;
  subscription_destination_wallet?: Maybe<Scalars['String']['output']>;
  subscription_forwarder_contract?: Maybe<Scalars['String']['output']>;
  /** The corresponding ERC20 tokens deployed on this chain which can be used as currency */
  tokens?: Maybe<Array<Token>>;
  vinyl_nation_passport_contract_address?: Maybe<Scalars['String']['output']>;
  zugrama_passport_contract_address?: Maybe<Scalars['String']['output']>;
};

export type CheckinTokenRewardSetting = {
  __typename?: 'CheckinTokenRewardSetting';
  _id: Scalars['MongoID']['output'];
  currency_address: Scalars['String']['output'];
  event: Scalars['MongoID']['output'];
  photo?: Maybe<Scalars['MongoID']['output']>;
  photo_expanded?: Maybe<File>;
  rewards: Array<TicketTypeReward>;
  title: Scalars['String']['output'];
  user: Scalars['MongoID']['output'];
  vault: Scalars['MongoID']['output'];
  vault_expanded?: Maybe<TokenRewardVault>;
};

export type CheckinTokenRewardSettingInput = {
  currency_address?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  photo?: InputMaybe<Scalars['MongoID']['input']>;
  rewards?: InputMaybe<Array<TicketTypeRewardInput>>;
  title?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['MongoID']['input']>;
};

export type CheckoutResult = {
  __typename?: 'CheckoutResult';
  checkout_url: Scalars['String']['output'];
  session_id: Scalars['String']['output'];
};

export type ClaimCheckinRewardSignatureResponse = {
  __typename?: 'ClaimCheckinRewardSignatureResponse';
  claim?: Maybe<TokenRewardClaim>;
  settings: Array<CheckinTokenRewardSetting>;
  signature?: Maybe<TokenRewardSignature>;
};

export type ClaimTicketRewardSignatureResponse = {
  __typename?: 'ClaimTicketRewardSignatureResponse';
  claim?: Maybe<TokenRewardClaim>;
  settings: Array<TicketTokenRewardSetting>;
  signature: TokenRewardSignature;
};

export enum ClaimType {
  Checkin = 'checkin',
  Ticket = 'ticket'
}

export type ClaimedToken = {
  __typename?: 'ClaimedToken';
  amount: Scalars['String']['output'];
  formatted_amount?: Maybe<Scalars['String']['output']>;
  network: Scalars['String']['output'];
  token?: Maybe<RewardToken>;
  token_address: Scalars['String']['output'];
};

export type CloneEventInput = {
  dates: Array<Scalars['DateTimeISO']['input']>;
  event: Scalars['MongoID']['input'];
  overrides?: InputMaybe<EventInput>;
};

export type Comment = {
  __typename?: 'Comment';
  _id: Scalars['MongoID']['output'];
  comment?: Maybe<Scalars['MongoID']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  post: Scalars['MongoID']['output'];
  text: Scalars['String']['output'];
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
};

export type CommentInput = {
  comment?: InputMaybe<Scalars['MongoID']['input']>;
  post: Scalars['MongoID']['input'];
  text: Scalars['String']['input'];
};

export type ConfidentialUserInfo = {
  __typename?: 'ConfidentialUserInfo';
  _id: Scalars['MongoID']['output'];
  company_name?: Maybe<Scalars['String']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  job_title?: Maybe<Scalars['String']['output']>;
  kratos_unicorn_wallet_address?: Maybe<Scalars['String']['output']>;
  kratos_wallet_address?: Maybe<Scalars['String']['output']>;
  matrix_localpart?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type ConfigVersion = {
  __typename?: 'ConfigVersion';
  _id: Scalars['MongoID']['output'];
  change_summary?: Maybe<Scalars['String']['output']>;
  config_id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  created_by: Scalars['MongoID']['output'];
  snapshot: Scalars['JSON']['output'];
  version: Scalars['Float']['output'];
};

export type ConfigureConnectionInput = {
  config: Scalars['JSON']['input'];
  connectionId: Scalars['String']['input'];
  syncSchedule?: InputMaybe<Scalars['String']['input']>;
};

export type ConnectPlatformInput = {
  connectorType: Scalars['String']['input'];
  spaceId: Scalars['String']['input'];
};

export type ConnectPlatformResult = {
  __typename?: 'ConnectPlatformResult';
  authUrl?: Maybe<Scalars['String']['output']>;
  connectionId: Scalars['String']['output'];
  requiresApiKey: Scalars['Boolean']['output'];
};

export type ConnectWalletInput = {
  platform: BlockchainPlatform;
  signature: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type ConnectionLog = {
  __typename?: 'ConnectionLog';
  _id: Scalars['MongoID']['output'];
  actionId: Scalars['String']['output'];
  connectionId: Scalars['MongoID']['output'];
  createdAt: Scalars['DateTimeISO']['output'];
  /** Duration in milliseconds. 0 when not measured. */
  duration: Scalars['Int']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  recordsFailed?: Maybe<Scalars['Int']['output']>;
  recordsProcessed?: Maybe<Scalars['Int']['output']>;
  spaceId: Scalars['MongoID']['output'];
  status: Scalars['String']['output'];
  triggerType: Scalars['String']['output'];
  triggeredBy?: Maybe<Scalars['String']['output']>;
};

export type ConnectionOutput = {
  __typename?: 'ConnectionOutput';
  config?: Maybe<Scalars['JSON']['output']>;
  connector?: Maybe<ConnectorDefinition>;
  connectorType: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  installedAt: Scalars['DateTimeISO']['output'];
  installedBy: Scalars['String']['output'];
  lastSyncAt?: Maybe<Scalars['DateTimeISO']['output']>;
  lastSyncStatus?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type ConnectorActionInfo = {
  __typename?: 'ConnectorActionInfo';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  triggerTypes: Array<Scalars['String']['output']>;
};

export type ConnectorActionResult = {
  __typename?: 'ConnectorActionResult';
  data?: Maybe<Scalars['JSON']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  externalUrl?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  recordsFailed?: Maybe<Scalars['Int']['output']>;
  recordsProcessed?: Maybe<Scalars['Int']['output']>;
  success: Scalars['Boolean']['output'];
};

export type ConnectorDefinition = {
  __typename?: 'ConnectorDefinition';
  actions: Array<ConnectorActionInfo>;
  authType: Scalars['String']['output'];
  capabilities: Array<Scalars['String']['output']>;
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ConnectorSelectOption = {
  __typename?: 'ConnectorSelectOption';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ConnectorSlotInfo = {
  __typename?: 'ConnectorSlotInfo';
  canAddMore: Scalars['Boolean']['output'];
  currentTier: Scalars['String']['output'];
  max: Scalars['Int']['output'];
  used: Scalars['Int']['output'];
};

export type CreateApiKeyInput = {
  expires_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
  name: Scalars['String']['input'];
  scopes: Array<Scalars['String']['input']>;
  space: Scalars['MongoID']['input'];
};

export type CreateApiKeyResponse = {
  __typename?: 'CreateApiKeyResponse';
  apiKey: ApiKeyBase;
  /** The full API key — shown only once at creation */
  secret: Scalars['String']['output'];
};

export type CreateBadgeInput = {
  contract: Scalars['String']['input'];
  list: Scalars['MongoID']['input'];
  network: Scalars['String']['input'];
};

export type CreateBadgeListInput = {
  image_url?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateCryptoSubscriptionInput = {
  annual?: InputMaybe<Scalars['Boolean']['input']>;
  chain_id: Scalars['String']['input'];
  items: Array<SubscriptionItemType>;
  space: Scalars['MongoID']['input'];
  token_address: Scalars['String']['input'];
};

export type CreateDonationInput = {
  amount: Scalars['String']['input'];
  category: DonationCategory;
  /** Id of the target event or user that receives the donation */
  category_ref: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  from_email?: InputMaybe<Scalars['String']['input']>;
  vault: Scalars['MongoID']['input'];
};

export type CreateEventEmailSettingInput = {
  cc?: InputMaybe<Array<Scalars['String']['input']>>;
  custom_body_html?: InputMaybe<Scalars['String']['input']>;
  custom_subject_html?: InputMaybe<Scalars['String']['input']>;
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  event: Scalars['MongoID']['input'];
  recipient_filters?: InputMaybe<EmailRecipientFiltersInput>;
  recipient_types?: InputMaybe<Array<EmailRecipientType>>;
  scheduled_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
  type: EmailTemplateType;
};

export type CreateEventFromEventbriteInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  end?: InputMaybe<Scalars['DateTimeISO']['input']>;
  start?: InputMaybe<Scalars['DateTimeISO']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEventQuestionsInput = {
  event: Scalars['MongoID']['input'];
  question: Scalars['String']['input'];
  session?: InputMaybe<Scalars['MongoID']['input']>;
};

export type CreateEventTicketCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  title: Scalars['String']['input'];
};

export type CreateFarcasterAccountKeyResponse = {
  __typename?: 'CreateFarcasterAccountKeyResponse';
  account_key_request: AccountKeyRequest;
};

export type CreateNewPaymentAccountInput = {
  account_info?: InputMaybe<Scalars['JSON']['input']>;
  provider?: InputMaybe<NewPaymentProvider>;
  title?: InputMaybe<Scalars['String']['input']>;
  type: PaymentAccountType;
};

export type CreatePageConfigInput = {
  custom_code?: InputMaybe<CustomCodeInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  owner_id: Scalars['MongoID']['input'];
  owner_type: PageConfigOwnerType;
  sections?: InputMaybe<Array<PageSectionInput>>;
  template_id?: InputMaybe<Scalars['MongoID']['input']>;
  theme?: InputMaybe<ThemeInput>;
};

export type CreatePoapInput = {
  /** Requested poap amount */
  amount: Scalars['Int']['input'];
  claim_mode: PoapClaimMode;
  description: Scalars['String']['input'];
  event?: InputMaybe<Scalars['MongoID']['input']>;
  image?: InputMaybe<Scalars['MongoID']['input']>;
  minting_network?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  private?: InputMaybe<Scalars['Boolean']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export type CreatePreviewLinkInput = {
  expires_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
  link_type: PreviewLinkType;
  password?: InputMaybe<Scalars['String']['input']>;
  resource_id: Scalars['MongoID']['input'];
};

export type CreateSiteInput = {
  access_pass?: InputMaybe<AccessPassInput>;
  ai_config?: InputMaybe<Scalars['MongoID']['input']>;
  client: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  favicon_url?: InputMaybe<Scalars['String']['input']>;
  footer_scripts?: InputMaybe<Array<SiteFooterScriptInput>>;
  header_links?: InputMaybe<Array<SiteHeaderLinkInput>>;
  header_metas?: InputMaybe<Array<SiteHeaderMetaInput>>;
  hostnames?: InputMaybe<Array<Scalars['String']['input']>>;
  logo_mobile_url?: InputMaybe<Scalars['String']['input']>;
  logo_url?: InputMaybe<Scalars['String']['input']>;
  onboarding_steps?: InputMaybe<Array<SiteOnboardingStepInput>>;
  owners?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  partners?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  passports?: InputMaybe<Array<SitePassportInput>>;
  privacy_url?: InputMaybe<Scalars['String']['input']>;
  share_url?: InputMaybe<Scalars['JSON']['input']>;
  text?: InputMaybe<Scalars['JSON']['input']>;
  theme_data?: InputMaybe<Scalars['JSON']['input']>;
  theme_type?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  visibility?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateSpaceNewsletterInput = {
  cc?: InputMaybe<Array<Scalars['String']['input']>>;
  custom_body_html?: InputMaybe<Scalars['String']['input']>;
  custom_subject_html?: InputMaybe<Scalars['String']['input']>;
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  recipient_filters?: InputMaybe<EmailRecipientFiltersInput>;
  recipient_types?: InputMaybe<Array<EmailRecipientType>>;
  scheduled_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
  space: Scalars['MongoID']['input'];
};

export type CreateStripeOnrampSessionInput = {
  destination_amount?: InputMaybe<Scalars['Float']['input']>;
  destination_currency?: InputMaybe<Scalars['String']['input']>;
  destination_network?: InputMaybe<Scalars['String']['input']>;
  source_currency?: InputMaybe<Scalars['String']['input']>;
  wallet_address?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSubscriptionInput = {
  items: Array<SubscriptionItemType>;
  payment_method_id: Scalars['String']['input'];
  space: Scalars['MongoID']['input'];
};

export type CreateTemplateInput = {
  category?: InputMaybe<TemplateCategory>;
  config?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  preview_urls?: InputMaybe<Array<Scalars['String']['input']>>;
  preview_video_url?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  structure_data?: InputMaybe<Scalars['JSON']['input']>;
  subscription_tier_min: SubscriptionItemType;
  tags: Array<Scalars['String']['input']>;
  target: TemplateTarget;
  thumbnail_url?: InputMaybe<Scalars['String']['input']>;
  visibility: TemplateVisibility;
};

export type CreateUserFriendshipInput = {
  type?: InputMaybe<UserFriendshipType>;
  user: Scalars['MongoID']['input'];
};

export enum CreditPackageEnum {
  Fifty = 'FIFTY',
  Five = 'FIVE',
  Hundred = 'HUNDRED',
  Ten = 'TEN',
  TwentyFive = 'TWENTY_FIVE'
}

export type CryptoPaymentInfo = {
  __typename?: 'CryptoPaymentInfo';
  network?: Maybe<Scalars['String']['output']>;
  tx_hash?: Maybe<Scalars['String']['output']>;
};

export type CryptoPaymentNetworkStatistics = {
  __typename?: 'CryptoPaymentNetworkStatistics';
  chain_id: Scalars['String']['output'];
  count: Scalars['Int']['output'];
};

export type CryptoPaymentStatistics = {
  __typename?: 'CryptoPaymentStatistics';
  count: Scalars['Int']['output'];
  networks: Array<CryptoPaymentNetworkStatistics>;
  revenue: Array<PaymentRevenue>;
};

export type CryptoSubscriptionPaymentInfo = {
  __typename?: 'CryptoSubscriptionPaymentInfo';
  amount: Scalars['String']['output'];
  chain_id: Scalars['String']['output'];
  destination: Scalars['String']['output'];
  forwarder_contract: Scalars['String']['output'];
  reference: Scalars['String']['output'];
  subscription_id: Scalars['MongoID']['output'];
  token_address: Scalars['String']['output'];
};

export type Currency = {
  __typename?: 'Currency';
  code: Scalars['String']['output'];
  decimals: Scalars['Float']['output'];
};

export type CustomCode = {
  __typename?: 'CustomCode';
  body_html?: Maybe<Scalars['String']['output']>;
  css?: Maybe<Scalars['String']['output']>;
  head_html?: Maybe<Scalars['String']['output']>;
  scripts?: Maybe<Array<CustomScript>>;
};

export type CustomCodeInput = {
  body_html?: InputMaybe<Scalars['String']['input']>;
  css?: InputMaybe<Scalars['String']['input']>;
  head_html?: InputMaybe<Scalars['String']['input']>;
  scripts?: InputMaybe<Array<CustomScriptInput>>;
};

export type CustomScript = {
  __typename?: 'CustomScript';
  content?: Maybe<Scalars['String']['output']>;
  src?: Maybe<Scalars['String']['output']>;
  strategy: ScriptStrategy;
};

export type CustomScriptInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  src?: InputMaybe<Scalars['String']['input']>;
  strategy: ScriptStrategy;
};

export type DailyUsage = {
  __typename?: 'DailyUsage';
  credits: Scalars['Float']['output'];
  date: Scalars['String']['output'];
  requests: Scalars['Int']['output'];
};

export type DataBinding = {
  __typename?: 'DataBinding';
  mode: DataBindingMode;
  overrides?: Maybe<Scalars['JSON']['output']>;
  source?: Maybe<DataBindingSource>;
};

export type DataBindingInput = {
  mode: Scalars['String']['input'];
  overrides?: InputMaybe<Scalars['JSON']['input']>;
  source?: InputMaybe<DataBindingSourceInput>;
};

export enum DataBindingMode {
  Auto = 'auto',
  Manual = 'manual'
}

export type DataBindingSource = {
  __typename?: 'DataBindingSource';
  field?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type DataBindingSourceInput = {
  field?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type DateRangeInput = {
  /** End date time exclusive */
  end: Scalars['DateTimeISO']['input'];
  /** Start date time inclusive */
  start: Scalars['DateTimeISO']['input'];
};

export type DecideEventCohostRequestInput = {
  decision: Scalars['Boolean']['input'];
  event: Scalars['MongoID']['input'];
};

export type DecideSpaceEventRequestsInput = {
  decision: SpaceEventRequestState;
  requests: Array<Scalars['MongoID']['input']>;
  space: Scalars['MongoID']['input'];
};

export type DecideUserJoinRequestsInput = {
  decision: EventJoinRequestState;
  event: Scalars['MongoID']['input'];
  requests: Array<Scalars['MongoID']['input']>;
};

export type DecidedJoinRequest = {
  __typename?: 'DecidedJoinRequest';
  _id: Scalars['MongoID']['output'];
  processed: Scalars['Boolean']['output'];
};

export type DeleteSpaceMemberInput = {
  ids: Array<Scalars['MongoID']['input']>;
  space: Scalars['MongoID']['input'];
};

export type DeleteUserFriendshipInput = {
  user: Scalars['MongoID']['input'];
};

export type DeliveryOption = {
  __typename?: 'DeliveryOption';
  _id: Scalars['MongoID']['output'];
  cities?: Maybe<Array<Scalars['String']['output']>>;
  cost: Scalars['Float']['output'];
  countries?: Maybe<Array<Scalars['String']['output']>>;
  description?: Maybe<Scalars['String']['output']>;
  fulfillment_address?: Maybe<Scalars['MongoID']['output']>;
  group?: Maybe<Scalars['String']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  pickup_addresses?: Maybe<Array<Scalars['MongoID']['output']>>;
  polygon?: Maybe<Scalars['JSON']['output']>;
  postal_ranges?: Maybe<Array<DeliveryOptionPostalRange>>;
  postals?: Maybe<Array<Scalars['String']['output']>>;
  regions?: Maybe<Array<Scalars['String']['output']>>;
  search_range?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
  type: DeliveryOptionType;
  waive_type?: Maybe<DeliveryOptionWaiveType>;
  waive_value_threshold?: Maybe<Scalars['Float']['output']>;
};

export type DeliveryOptionInput = {
  _id: Scalars['MongoID']['input'];
  cities?: InputMaybe<Array<Scalars['String']['input']>>;
  cost: Scalars['Float']['input'];
  countries?: InputMaybe<Array<Scalars['String']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  fulfillment_address?: InputMaybe<Scalars['MongoID']['input']>;
  group?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  pickup_addresses?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  polygon?: InputMaybe<Scalars['JSON']['input']>;
  postal_ranges?: InputMaybe<Array<DeliveryOptionPostalRangeInput>>;
  postals?: InputMaybe<Array<Scalars['String']['input']>>;
  regions?: InputMaybe<Array<Scalars['String']['input']>>;
  search_range?: InputMaybe<Scalars['Float']['input']>;
  title: Scalars['String']['input'];
  type: DeliveryOptionType;
  waive_type?: InputMaybe<DeliveryOptionWaiveType>;
  waive_value_threshold?: InputMaybe<Scalars['Float']['input']>;
};

export type DeliveryOptionPostalRange = {
  __typename?: 'DeliveryOptionPostalRange';
  _id: Scalars['MongoID']['output'];
  max: Scalars['Float']['output'];
  min: Scalars['Float']['output'];
  pattern: Scalars['String']['output'];
};

export type DeliveryOptionPostalRangeInput = {
  _id: Scalars['MongoID']['input'];
  max: Scalars['Float']['input'];
  min: Scalars['Float']['input'];
  pattern: Scalars['String']['input'];
};

export enum DeliveryOptionType {
  City = 'city',
  Country = 'country',
  GeoZone = 'geo_zone',
  Postal = 'postal',
  Region = 'region',
  Worldwide = 'worldwide'
}

export enum DeliveryOptionWaiveType {
  Any = 'any',
  Product = 'product',
  Store = 'store'
}

export type DeviceLinkConfirmResponse = {
  __typename?: 'DeviceLinkConfirmResponse';
  encrypted_key: Scalars['String']['output'];
  salt: Scalars['String']['output'];
};

export type DeviceLinkTokenResponse = {
  __typename?: 'DeviceLinkTokenResponse';
  expires_at: Scalars['DateTimeISO']['output'];
  token: Scalars['String']['output'];
};

export type DigitalAccount = {
  __typename?: 'DigitalAccount';
  account_id: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
};

export type DisconnectResult = {
  __typename?: 'DisconnectResult';
  /** Sanitized error message when tokenRevoked is false; null otherwise. */
  revocationError?: Maybe<Scalars['String']['output']>;
  /** True iff all cleanup steps (unregisterTools, credentialVault.remove, connection delete) completed. May be false even when tokenRevoked is true. */
  success: Scalars['Boolean']['output'];
  /** True iff the external platform token-revocation call succeeded. */
  tokenRevoked: Scalars['Boolean']['output'];
};

export type DisplayPreference = {
  __typename?: 'DisplayPreference';
  overridable: Scalars['Boolean']['output'];
  preference: StripeAccountCapabilityDisplayPreferencePreference;
  value: StripeAccountCapabilityDisplayPreferenceValue;
};

export type Donation = {
  __typename?: 'Donation';
  _id: Scalars['MongoID']['output'];
  amount: Scalars['String']['output'];
  category: DonationCategory;
  /** Id of the target event or user that receives the donation */
  category_ref: Scalars['String']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  currency: Scalars['String']['output'];
  from_email?: Maybe<Scalars['String']['output']>;
  from_user?: Maybe<Scalars['MongoID']['output']>;
  from_wallet?: Maybe<Scalars['String']['output']>;
  ticket_type?: Maybe<Scalars['MongoID']['output']>;
  ticket_type_expanded?: Maybe<EventTicketType>;
  tx_hash?: Maybe<Scalars['String']['output']>;
  user_info?: Maybe<DonationUserInfo>;
  vault: Scalars['MongoID']['output'];
  vault_expanded?: Maybe<DonationVault>;
};

export enum DonationCategory {
  Event = 'EVENT',
  User = 'USER'
}

export type DonationRecommendation = {
  __typename?: 'DonationRecommendation';
  amount: Array<Scalars['String']['output']>;
  currency: Scalars['String']['output'];
};

export type DonationUserInfo = {
  __typename?: 'DonationUserInfo';
  _id?: Maybe<Scalars['MongoID']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name?: Maybe<Scalars['String']['output']>;
};

export type DonationVault = {
  __typename?: 'DonationVault';
  _id: Scalars['MongoID']['output'];
  address: Scalars['String']['output'];
  events?: Maybe<Array<Scalars['MongoID']['output']>>;
  network: Scalars['String']['output'];
  title: Scalars['String']['output'];
  user: Scalars['MongoID']['output'];
};

export type DonationVaultInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  network?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type EasEvent = {
  __typename?: 'EASEvent';
  _id?: Maybe<Scalars['MongoID']['output']>;
  cohosts: Array<EasEventCohost>;
  creatorName?: Maybe<Scalars['String']['output']>;
  creatorProfile?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  detail_uid?: Maybe<Scalars['String']['output']>;
  diff?: Maybe<Array<Scalars['String']['output']>>;
  eventLink?: Maybe<Scalars['String']['output']>;
  tickets: Scalars['Float']['output'];
  title: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
  uid?: Maybe<Scalars['String']['output']>;
};

export type EasEventCohost = {
  __typename?: 'EASEventCohost';
  cohostName?: Maybe<Scalars['String']['output']>;
  cohostProfile?: Maybe<Scalars['String']['output']>;
  eventLink?: Maybe<Scalars['String']['output']>;
  uid?: Maybe<Scalars['String']['output']>;
  wallet: Scalars['String']['output'];
};

export type EasTicket = {
  __typename?: 'EASTicket';
  _id: Scalars['MongoID']['output'];
  assignedBy?: Maybe<Scalars['String']['output']>;
  eventLink?: Maybe<Scalars['String']['output']>;
  eventName?: Maybe<Scalars['String']['output']>;
  guest?: Maybe<Scalars['String']['output']>;
  ticket?: Maybe<Scalars['String']['output']>;
  wallet_address: Scalars['String']['output'];
};

export type EasTicketType = {
  __typename?: 'EASTicketType';
  _id: Scalars['MongoID']['output'];
  cost: Scalars['String']['output'];
  currency?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  detail_uid?: Maybe<Scalars['String']['output']>;
  diff?: Maybe<Array<Scalars['String']['output']>>;
  eventLink?: Maybe<Scalars['String']['output']>;
  eventName?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  tickets?: Maybe<Array<EasTicket>>;
  title: Scalars['String']['output'];
  uid?: Maybe<Scalars['String']['output']>;
};

export enum EasyshipCategory {
  AccessoryBattery = 'accessory_battery',
  AccessoryNoBattery = 'accessory_no_battery',
  AudioVideo = 'audio_video',
  BooksCollectionables = 'books_collectionables',
  Cameras = 'cameras',
  ComputersLaptops = 'computers_laptops',
  Documents = 'documents',
  DryFoodSupplements = 'dry_food_supplements',
  Fashion = 'fashion',
  Gaming = 'gaming',
  HealthBeauty = 'health_beauty',
  HomeAppliances = 'home_appliances',
  HomeDecor = 'home_decor',
  Jewelry = 'jewelry',
  Luggage = 'luggage',
  Mobiles = 'mobiles',
  PetAccessory = 'pet_accessory',
  Sport = 'sport',
  Tablets = 'tablets',
  Toys = 'toys',
  Watches = 'watches'
}

export enum EffectType {
  Float = 'float',
  None = 'none',
  Particles = 'particles',
  Video = 'video'
}

export type EmailRecipientFilters = {
  __typename?: 'EmailRecipientFilters';
  join_request_states?: Maybe<Array<EventJoinRequestState>>;
  space_members?: Maybe<SpaceMemberRecipientFilter>;
  ticket_types?: Maybe<Array<Scalars['MongoID']['output']>>;
};

export type EmailRecipientFiltersInput = {
  join_request_states?: InputMaybe<Array<EventJoinRequestState>>;
  space_members?: InputMaybe<SpaceMemberRecipientFilterInput>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export enum EmailRecipientType {
  Assigned = 'assigned',
  Attending = 'attending',
  EventHosts = 'event_hosts',
  Invited = 'invited',
  JoinRequester = 'join_requester',
  Registration = 'registration',
  SpaceAdmins = 'space_admins',
  SpaceAmbassadors = 'space_ambassadors',
  SpaceEventAttendees = 'space_event_attendees',
  SpaceEventHosts = 'space_event_hosts',
  SpaceSubscribers = 'space_subscribers',
  SpaceTaggedPeople = 'space_tagged_people',
  TicketCancelled = 'ticket_cancelled',
  TicketIssued = 'ticket_issued',
  TicketTypeWhitelisted = 'ticket_type_whitelisted'
}

export type EmailSetting = {
  __typename?: 'EmailSetting';
  _id: Scalars['MongoID']['output'];
  body_preview?: Maybe<Scalars['String']['output']>;
  cc?: Maybe<Array<Scalars['String']['output']>>;
  context?: Maybe<Scalars['JSON']['output']>;
  created_at?: Maybe<Scalars['DateTimeISO']['output']>;
  custom_body_html?: Maybe<Scalars['String']['output']>;
  custom_subject_html?: Maybe<Scalars['String']['output']>;
  disabled?: Maybe<Scalars['Boolean']['output']>;
  draft?: Maybe<Scalars['Boolean']['output']>;
  failed_at?: Maybe<Scalars['DateTimeISO']['output']>;
  failed_reason?: Maybe<Scalars['String']['output']>;
  is_system_email: Scalars['Boolean']['output'];
  opened?: Maybe<Array<EmailTracking>>;
  owner: Scalars['MongoID']['output'];
  owner_expanded?: Maybe<User>;
  pending_recipients?: Maybe<Array<Scalars['String']['output']>>;
  recipient_filters?: Maybe<EmailRecipientFilters>;
  recipient_types?: Maybe<Array<EmailRecipientType>>;
  recipients?: Maybe<Array<Scalars['String']['output']>>;
  recipients_details?: Maybe<Array<RecipientDetail>>;
  scheduled_at?: Maybe<Scalars['DateTimeISO']['output']>;
  sendgrid_template_id?: Maybe<Scalars['String']['output']>;
  sent_at?: Maybe<Scalars['DateTimeISO']['output']>;
  subject_preview?: Maybe<Scalars['String']['output']>;
  template: Scalars['MongoID']['output'];
  type: EmailTemplateType;
};

export enum EmailTemplateType {
  BuyerStoreOrderAccepted = 'buyer_store_order_accepted',
  BuyerStoreOrderCancelled = 'buyer_store_order_cancelled',
  BuyerStoreOrderDeclined = 'buyer_store_order_declined',
  BuyerStoreOrderDelivered = 'buyer_store_order_delivered',
  BuyerStoreOrderPending = 'buyer_store_order_pending',
  BuyerStoreOrderPreparing = 'buyer_store_order_preparing',
  BuyerStoreOrderTracking = 'buyer_store_order_tracking',
  CryptoPaymentReceipt = 'crypto_payment_receipt',
  Custom = 'custom',
  EventCancelled = 'event_cancelled',
  EventCohostInvitation = 'event_cohost_invitation',
  EventCreatedNotification = 'event_created_notification',
  Feedback = 'feedback',
  Invitation = 'invitation',
  InvitationCancelled = 'invitation_cancelled',
  JoinRequestApproved = 'join_request_approved',
  JoinRequestApprovedWithTickets = 'join_request_approved_with_tickets',
  JoinRequestDeclined = 'join_request_declined',
  JoinRequested = 'join_requested',
  PostRsvp = 'post_rsvp',
  Reminder = 'reminder',
  SellerStoreOrderPending = 'seller_store_order_pending',
  SpaceAddAdminInvitation = 'space_add_admin_invitation',
  SpaceAddAmbassadorInvitation = 'space_add_ambassador_invitation',
  SpaceAddSubscriberManuallyInvitation = 'space_add_subscriber_manually_invitation',
  SpaceNewsletter = 'space_newsletter',
  SpaceRequestPinningEvent = 'space_request_pinning_event',
  SpaceVerificationApproved = 'space_verification_approved',
  SpaceVerificationDeclined = 'space_verification_declined',
  TicketCancelled = 'ticket_cancelled',
  TicketIssued = 'ticket_issued',
  TicketReceived = 'ticket_received',
  TicketTypeWhitelisted = 'ticket_type_whitelisted',
  Updated = 'updated',
  UserContactInvite = 'user_contact_invite'
}

export type EmailTracking = {
  __typename?: 'EmailTracking';
  email: Scalars['String']['output'];
  stamp: Scalars['DateTimeISO']['output'];
};

export type EscrowDepositInfo = {
  __typename?: 'EscrowDepositInfo';
  minimum_amount: Scalars['String']['output'];
  minimum_percent: Scalars['Float']['output'];
};

export type EthereumAccount = {
  __typename?: 'EthereumAccount';
  address: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
  network: Scalars['String']['output'];
};

export type EthereumEscrowAccount = {
  __typename?: 'EthereumEscrowAccount';
  address: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
  host_refund_percent: Scalars['Float']['output'];
  minimum_deposit_percent: Scalars['Int']['output'];
  network: Scalars['String']['output'];
  refund_policies?: Maybe<Array<RefundPolicy>>;
};

export type EthereumRelayAccount = {
  __typename?: 'EthereumRelayAccount';
  address: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
  network: Scalars['String']['output'];
  payment_splitter_contract?: Maybe<Scalars['String']['output']>;
};

export type EthereumStakeAccount = {
  __typename?: 'EthereumStakeAccount';
  address: Scalars['String']['output'];
  config_id: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
  network: Scalars['String']['output'];
  requirement_checkin_before?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type Event = {
  __typename?: 'Event';
  _id?: Maybe<Scalars['MongoID']['output']>;
  accepted?: Maybe<Array<Scalars['MongoID']['output']>>;
  accepted_expanded?: Maybe<Array<Maybe<User>>>;
  accepted_store_promotion?: Maybe<Scalars['MongoID']['output']>;
  accepted_user_fields_required?: Maybe<Array<Scalars['String']['output']>>;
  access_pass?: Maybe<AccessPass>;
  active: Scalars['Boolean']['output'];
  address?: Maybe<Address>;
  address_directions?: Maybe<Array<Scalars['String']['output']>>;
  application_form_submission?: Maybe<Scalars['DateTimeISO']['output']>;
  application_form_url?: Maybe<Scalars['String']['output']>;
  application_profile_fields?: Maybe<Array<ApplicationProfileField>>;
  application_questions?: Maybe<Array<EventApplicationQuestion>>;
  application_required?: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated To be removed */
  application_self_verification?: Maybe<Scalars['Boolean']['output']>;
  application_self_verification_required?: Maybe<Scalars['Boolean']['output']>;
  approval_required?: Maybe<Scalars['Boolean']['output']>;
  approved?: Maybe<Scalars['Boolean']['output']>;
  /** Number of users who have tickets */
  attending_count?: Maybe<Scalars['Float']['output']>;
  button_icon?: Maybe<Scalars['String']['output']>;
  button_text?: Maybe<Scalars['String']['output']>;
  button_url?: Maybe<Scalars['String']['output']>;
  calendar_links?: Maybe<EventCalendarLinks>;
  checkedin?: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated No longer in use and will be removed in a future release. */
  checkin_count?: Maybe<Scalars['Float']['output']>;
  checkin_menu_text?: Maybe<Scalars['String']['output']>;
  cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  /** @deprecated Use `cohosts_expanded_new` instead. */
  cohosts_expanded?: Maybe<Array<Maybe<User>>>;
  cohosts_expanded_new?: Maybe<Array<Maybe<EventHostUser>>>;
  comments?: Maybe<Scalars['String']['output']>;
  cost?: Maybe<Scalars['Float']['output']>;
  cover?: Maybe<Scalars['String']['output']>;
  cta_button_text?: Maybe<Scalars['String']['output']>;
  /** Show secondary CTA button text */
  cta_secondary_visible?: Maybe<Scalars['Boolean']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  dark_theme_image?: Maybe<Scalars['MongoID']['output']>;
  dark_theme_image_expanded?: Maybe<File>;
  data?: Maybe<Scalars['JSON']['output']>;
  declined?: Maybe<Array<Scalars['MongoID']['output']>>;
  declined_expanded?: Maybe<Array<Maybe<User>>>;
  description?: Maybe<Scalars['String']['output']>;
  description_plain_text?: Maybe<Scalars['String']['output']>;
  donation_enabled?: Maybe<Scalars['Boolean']['output']>;
  donation_show_history?: Maybe<Scalars['Boolean']['output']>;
  donation_vaults?: Maybe<Array<Scalars['MongoID']['output']>>;
  donation_vaults_expanded?: Maybe<Array<DonationVault>>;
  end: Scalars['DateTimeISO']['output'];
  event_ticket_types?: Maybe<Array<EventTicketType>>;
  eventbrite_enabled?: Maybe<Scalars['Boolean']['output']>;
  eventbrite_event_id?: Maybe<Scalars['String']['output']>;
  eventbrite_tickets_imported?: Maybe<Scalars['Boolean']['output']>;
  events?: Maybe<Array<Scalars['MongoID']['output']>>;
  events_expanded?: Maybe<Array<Maybe<Event>>>;
  external_hostname?: Maybe<Scalars['String']['output']>;
  external_url?: Maybe<Scalars['String']['output']>;
  frequent_questions?: Maybe<Array<FrequentQuestion>>;
  guest_directory_enabled?: Maybe<Scalars['Boolean']['output']>;
  guest_limit?: Maybe<Scalars['Float']['output']>;
  guest_limit_per?: Maybe<Scalars['Float']['output']>;
  guests?: Maybe<Scalars['Int']['output']>;
  has_terms_accepted?: Maybe<Scalars['Boolean']['output']>;
  hide_attending?: Maybe<Scalars['Boolean']['output']>;
  hide_chat_action?: Maybe<Scalars['Boolean']['output']>;
  hide_cohosts?: Maybe<Scalars['Boolean']['output']>;
  hide_creators?: Maybe<Scalars['Boolean']['output']>;
  hide_invite_action?: Maybe<Scalars['Boolean']['output']>;
  hide_lounge?: Maybe<Scalars['Boolean']['output']>;
  hide_question_box?: Maybe<Scalars['Boolean']['output']>;
  hide_rooms_action?: Maybe<Scalars['Boolean']['output']>;
  hide_session_guests?: Maybe<Scalars['Boolean']['output']>;
  hide_speakers?: Maybe<Scalars['Boolean']['output']>;
  hide_stories_action?: Maybe<Scalars['Boolean']['output']>;
  highlight?: Maybe<Scalars['Boolean']['output']>;
  host: Scalars['MongoID']['output'];
  host_expanded?: Maybe<User>;
  host_expanded_new?: Maybe<UserWithEmail>;
  inherited_cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  invited?: Maybe<Array<Scalars['MongoID']['output']>>;
  invited_count?: Maybe<Scalars['Float']['output']>;
  invited_expanded?: Maybe<Array<Maybe<User>>>;
  inviter_user_map?: Maybe<Scalars['JSON']['output']>;
  inviters?: Maybe<Array<Scalars['MongoID']['output']>>;
  latitude?: Maybe<Scalars['Float']['output']>;
  layout_sections?: Maybe<Array<LayoutSection>>;
  light_theme_image?: Maybe<Scalars['MongoID']['output']>;
  light_theme_image_expanded?: Maybe<File>;
  listing_spaces?: Maybe<Array<Scalars['MongoID']['output']>>;
  location?: Maybe<Point>;
  longitude?: Maybe<Scalars['Float']['output']>;
  matrix_event_room_id?: Maybe<Scalars['String']['output']>;
  me_awaiting_approval?: Maybe<Scalars['Boolean']['output']>;
  me_going?: Maybe<Scalars['Boolean']['output']>;
  me_invited?: Maybe<Scalars['Boolean']['output']>;
  me_is_host?: Maybe<Scalars['Boolean']['output']>;
  new_new_photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  new_new_photos_expanded?: Maybe<Array<Maybe<File>>>;
  new_photos?: Maybe<Array<FileInline>>;
  offers?: Maybe<Array<EventOffer>>;
  payment_accounts_expanded?: Maybe<Array<Maybe<NewPaymentAccount>>>;
  payment_accounts_new?: Maybe<Array<Scalars['MongoID']['output']>>;
  payment_donation?: Maybe<Scalars['Boolean']['output']>;
  payment_donation_amount_includes_tickets?: Maybe<Scalars['Boolean']['output']>;
  payment_donation_amount_increment?: Maybe<Scalars['Float']['output']>;
  payment_donation_message?: Maybe<Scalars['String']['output']>;
  payment_donation_target?: Maybe<Scalars['Float']['output']>;
  payment_enabled?: Maybe<Scalars['Boolean']['output']>;
  payment_fee: Scalars['Float']['output'];
  payment_optional?: Maybe<Scalars['Boolean']['output']>;
  payment_ticket_count?: Maybe<Scalars['Float']['output']>;
  payment_ticket_discounts?: Maybe<Array<EventPaymentTicketDiscount>>;
  payment_ticket_external_message?: Maybe<Scalars['String']['output']>;
  payment_ticket_external_url?: Maybe<Scalars['String']['output']>;
  payment_ticket_purchase_title?: Maybe<Scalars['String']['output']>;
  payment_ticket_unassigned_count?: Maybe<Scalars['Float']['output']>;
  pending?: Maybe<Array<Scalars['MongoID']['output']>>;
  pending_expanded?: Maybe<Array<Maybe<User>>>;
  pending_request_count?: Maybe<Scalars['Float']['output']>;
  photos?: Maybe<Array<Scalars['String']['output']>>;
  private?: Maybe<Scalars['Boolean']['output']>;
  /** If this is true then the event is published, otherwise the event is unpublished. */
  published?: Maybe<Scalars['Boolean']['output']>;
  registration_disabled?: Maybe<Scalars['Boolean']['output']>;
  reward_uses?: Maybe<Scalars['JSON']['output']>;
  rewards?: Maybe<Array<EventReward>>;
  rsvp_wallet_platforms?: Maybe<Array<ApplicationBlokchainPlatform>>;
  self_verification?: Maybe<SelfVerification>;
  session_guests?: Maybe<Scalars['JSON']['output']>;
  sessions?: Maybe<Array<EventSession>>;
  shortid: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  /** MongoId of the community (aka space) that this event is organized to. */
  space?: Maybe<Scalars['MongoID']['output']>;
  space_expanded?: Maybe<Space>;
  space_tags?: Maybe<Array<SpaceTag>>;
  speaker_users?: Maybe<Array<Scalars['MongoID']['output']>>;
  speaker_users_expanded?: Maybe<Array<Maybe<User>>>;
  stamp: Scalars['DateTimeISO']['output'];
  start: Scalars['DateTimeISO']['output'];
  state: EventState;
  stores?: Maybe<Array<Scalars['MongoID']['output']>>;
  stores_expanded?: Maybe<Array<Maybe<Store>>>;
  stories?: Maybe<Array<Scalars['MongoID']['output']>>;
  stories_eponym?: Maybe<Scalars['Boolean']['output']>;
  subevent_enabled?: Maybe<Scalars['Boolean']['output']>;
  subevent_parent?: Maybe<Scalars['MongoID']['output']>;
  subevent_parent_expanded?: Maybe<Event>;
  subevent_settings?: Maybe<SubeventSettings>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  telegram_channels?: Maybe<Array<TelegramChannel>>;
  terms_email_permission_text?: Maybe<Scalars['Boolean']['output']>;
  terms_link?: Maybe<Scalars['String']['output']>;
  terms_text?: Maybe<Scalars['String']['output']>;
  theme_data?: Maybe<Scalars['JSON']['output']>;
  ticket_count?: Maybe<Scalars['Float']['output']>;
  /** The number of tickets available per user for this event */
  ticket_limit_per?: Maybe<Scalars['Float']['output']>;
  tickets?: Maybe<Array<TicketBase>>;
  timezone?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  unlisted?: Maybe<Scalars['Boolean']['output']>;
  unsure?: Maybe<Array<Scalars['MongoID']['output']>>;
  url?: Maybe<Scalars['String']['output']>;
  url_go?: Maybe<Scalars['String']['output']>;
  videos?: Maybe<Array<Video>>;
  virtual?: Maybe<Scalars['Boolean']['output']>;
  virtual_url?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use data from event cohost requests table */
  visible_cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  /** @deprecated Use `visible_cohosts_expanded_new` instead. */
  visible_cohosts_expanded?: Maybe<Array<Maybe<UserWithEmail>>>;
  visible_cohosts_expanded_new?: Maybe<Array<Maybe<EventHostUser>>>;
  welcome_text?: Maybe<Scalars['String']['output']>;
  welcome_video?: Maybe<Video>;
  zones_menu_text?: Maybe<Scalars['String']['output']>;
};


export type EventAccepted_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventCohosts_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventDeclined_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventEvents_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventInvited_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventNew_New_Photos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventPayment_Accounts_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventPending_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventSpeaker_Users_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventStores_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type EventApplicationAnswer = {
  __typename?: 'EventApplicationAnswer';
  _id: Scalars['MongoID']['output'];
  answer?: Maybe<Scalars['String']['output']>;
  answers?: Maybe<Array<Scalars['String']['output']>>;
  email?: Maybe<Scalars['String']['output']>;
  question: Scalars['MongoID']['output'];
  question_expanded: EventApplicationQuestion;
  user?: Maybe<Scalars['MongoID']['output']>;
};

export type EventApplicationAnswerExport = {
  __typename?: 'EventApplicationAnswerExport';
  _id: Scalars['MongoID']['output'];
  answer?: Maybe<Scalars['String']['output']>;
};

export type EventApplicationAnswerInput = {
  answer?: InputMaybe<Scalars['String']['input']>;
  answers?: InputMaybe<Array<Scalars['String']['input']>>;
  question: Scalars['MongoID']['input'];
};

export type EventApplicationExport = {
  __typename?: 'EventApplicationExport';
  answers: Array<EventApplicationAnswerExport>;
  non_login_user?: Maybe<EventApplicationUserExport>;
  questions: Array<Scalars['String']['output']>;
  user?: Maybe<EventApplicationUserExport>;
};

export type EventApplicationQuestion = {
  __typename?: 'EventApplicationQuestion';
  _id: Scalars['MongoID']['output'];
  options?: Maybe<Array<Scalars['String']['output']>>;
  position?: Maybe<Scalars['Int']['output']>;
  question?: Maybe<Scalars['String']['output']>;
  /** @deprecated Nolonger needed */
  questions?: Maybe<Array<Scalars['String']['output']>>;
  required?: Maybe<Scalars['Boolean']['output']>;
  select_type?: Maybe<SelectType>;
  type?: Maybe<QuestionType>;
};

export type EventApplicationQuestionAndAnswer = {
  __typename?: 'EventApplicationQuestionAndAnswer';
  answer?: Maybe<Scalars['String']['output']>;
  answers?: Maybe<Array<Scalars['String']['output']>>;
  question?: Maybe<Scalars['String']['output']>;
};

export type EventApplicationUserExport = {
  __typename?: 'EventApplicationUserExport';
  _id: Scalars['MongoID']['output'];
  email: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type EventAttestation = {
  __typename?: 'EventAttestation';
  event_address?: Maybe<Scalars['String']['output']>;
  last_sync: Scalars['DateTimeISO']['output'];
  uid?: Maybe<Scalars['String']['output']>;
};

export type EventAttestationDiff = {
  __typename?: 'EventAttestationDiff';
  event?: Maybe<EasEvent>;
  ticket_types?: Maybe<Array<EasTicketType>>;
};

export type EventBase = {
  __typename?: 'EventBase';
  _id?: Maybe<Scalars['MongoID']['output']>;
  accepted?: Maybe<Array<Scalars['MongoID']['output']>>;
  accepted_store_promotion?: Maybe<Scalars['MongoID']['output']>;
  accepted_user_fields_required?: Maybe<Array<Scalars['String']['output']>>;
  access_pass?: Maybe<AccessPass>;
  active: Scalars['Boolean']['output'];
  address?: Maybe<Address>;
  address_directions?: Maybe<Array<Scalars['String']['output']>>;
  alert_payments?: Maybe<Array<Scalars['MongoID']['output']>>;
  alert_tickets?: Maybe<Scalars['JSON']['output']>;
  application_form_url?: Maybe<Scalars['String']['output']>;
  application_profile_fields?: Maybe<Array<ApplicationProfileField>>;
  application_required?: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated To be removed */
  application_self_verification?: Maybe<Scalars['Boolean']['output']>;
  application_self_verification_required?: Maybe<Scalars['Boolean']['output']>;
  approval_required?: Maybe<Scalars['Boolean']['output']>;
  approved?: Maybe<Scalars['Boolean']['output']>;
  /** Number of users who have tickets */
  attending_count?: Maybe<Scalars['Float']['output']>;
  button_icon?: Maybe<Scalars['String']['output']>;
  button_text?: Maybe<Scalars['String']['output']>;
  button_url?: Maybe<Scalars['String']['output']>;
  /** @deprecated No longer in use and will be removed in a future release. */
  checkin_count?: Maybe<Scalars['Float']['output']>;
  checkin_menu_text?: Maybe<Scalars['String']['output']>;
  cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  comments?: Maybe<Scalars['String']['output']>;
  cost?: Maybe<Scalars['Float']['output']>;
  cover?: Maybe<Scalars['String']['output']>;
  cta_button_text?: Maybe<Scalars['String']['output']>;
  /** Show secondary CTA button text */
  cta_secondary_visible?: Maybe<Scalars['Boolean']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  dark_theme_image?: Maybe<Scalars['MongoID']['output']>;
  declined?: Maybe<Array<Scalars['MongoID']['output']>>;
  description?: Maybe<Scalars['String']['output']>;
  description_plain_text?: Maybe<Scalars['String']['output']>;
  donation_enabled?: Maybe<Scalars['Boolean']['output']>;
  donation_show_history?: Maybe<Scalars['Boolean']['output']>;
  donation_vaults?: Maybe<Array<Scalars['MongoID']['output']>>;
  end: Scalars['DateTimeISO']['output'];
  eventbrite_enabled?: Maybe<Scalars['Boolean']['output']>;
  eventbrite_event_id?: Maybe<Scalars['String']['output']>;
  eventbrite_tickets_imported?: Maybe<Scalars['Boolean']['output']>;
  eventbrite_token?: Maybe<Scalars['String']['output']>;
  events?: Maybe<Array<Scalars['MongoID']['output']>>;
  external_hostname?: Maybe<Scalars['String']['output']>;
  external_url?: Maybe<Scalars['String']['output']>;
  frequent_questions?: Maybe<Array<FrequentQuestion>>;
  guest_directory_enabled?: Maybe<Scalars['Boolean']['output']>;
  guest_limit?: Maybe<Scalars['Float']['output']>;
  guest_limit_per?: Maybe<Scalars['Float']['output']>;
  guests?: Maybe<Scalars['Int']['output']>;
  hide_attending?: Maybe<Scalars['Boolean']['output']>;
  hide_chat_action?: Maybe<Scalars['Boolean']['output']>;
  hide_cohosts?: Maybe<Scalars['Boolean']['output']>;
  hide_creators?: Maybe<Scalars['Boolean']['output']>;
  hide_invite_action?: Maybe<Scalars['Boolean']['output']>;
  hide_lounge?: Maybe<Scalars['Boolean']['output']>;
  hide_question_box?: Maybe<Scalars['Boolean']['output']>;
  hide_rooms_action?: Maybe<Scalars['Boolean']['output']>;
  hide_session_guests?: Maybe<Scalars['Boolean']['output']>;
  hide_speakers?: Maybe<Scalars['Boolean']['output']>;
  hide_stories_action?: Maybe<Scalars['Boolean']['output']>;
  highlight?: Maybe<Scalars['Boolean']['output']>;
  host: Scalars['MongoID']['output'];
  inherited_cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  insider_enabled?: Maybe<Scalars['Boolean']['output']>;
  insider_token?: Maybe<Scalars['String']['output']>;
  invited?: Maybe<Array<Scalars['MongoID']['output']>>;
  invited_count?: Maybe<Scalars['Float']['output']>;
  invited_email_map?: Maybe<Scalars['JSON']['output']>;
  invited_emails?: Maybe<Array<Scalars['String']['output']>>;
  invited_phone_map?: Maybe<Scalars['JSON']['output']>;
  invited_user_map?: Maybe<Scalars['JSON']['output']>;
  inviter_email_map?: Maybe<Scalars['JSON']['output']>;
  inviter_phone_map?: Maybe<Scalars['JSON']['output']>;
  inviter_user_map?: Maybe<Scalars['JSON']['output']>;
  inviters?: Maybe<Array<Scalars['MongoID']['output']>>;
  latitude?: Maybe<Scalars['Float']['output']>;
  layout_sections?: Maybe<Array<LayoutSection>>;
  light_theme_image?: Maybe<Scalars['MongoID']['output']>;
  listing_spaces?: Maybe<Array<Scalars['MongoID']['output']>>;
  location?: Maybe<Point>;
  longitude?: Maybe<Scalars['Float']['output']>;
  matrix_event_room_id?: Maybe<Scalars['String']['output']>;
  new_new_photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  new_photos?: Maybe<Array<FileInline>>;
  offers?: Maybe<Array<EventOffer>>;
  page_config?: Maybe<Scalars['MongoID']['output']>;
  payment_accounts_new?: Maybe<Array<Scalars['MongoID']['output']>>;
  payment_donation?: Maybe<Scalars['Boolean']['output']>;
  payment_donation_amount_includes_tickets?: Maybe<Scalars['Boolean']['output']>;
  payment_donation_amount_increment?: Maybe<Scalars['Float']['output']>;
  payment_donation_message?: Maybe<Scalars['String']['output']>;
  payment_donation_target?: Maybe<Scalars['Float']['output']>;
  payment_enabled?: Maybe<Scalars['Boolean']['output']>;
  payment_fee: Scalars['Float']['output'];
  payment_optional?: Maybe<Scalars['Boolean']['output']>;
  payment_ticket_count?: Maybe<Scalars['Float']['output']>;
  payment_ticket_external_message?: Maybe<Scalars['String']['output']>;
  payment_ticket_external_url?: Maybe<Scalars['String']['output']>;
  payment_ticket_purchase_title?: Maybe<Scalars['String']['output']>;
  payment_ticket_unassigned_count?: Maybe<Scalars['Float']['output']>;
  pending?: Maybe<Array<Scalars['MongoID']['output']>>;
  photos?: Maybe<Array<Scalars['String']['output']>>;
  private?: Maybe<Scalars['Boolean']['output']>;
  /** If this is true then the event is published, otherwise the event is unpublished. */
  published?: Maybe<Scalars['Boolean']['output']>;
  registration_disabled?: Maybe<Scalars['Boolean']['output']>;
  reward_uses?: Maybe<Scalars['JSON']['output']>;
  rewards?: Maybe<Array<EventReward>>;
  rsvp_wallet_platforms?: Maybe<Array<ApplicationBlokchainPlatform>>;
  self_verification?: Maybe<SelfVerification>;
  session_guests?: Maybe<Scalars['JSON']['output']>;
  sessions?: Maybe<Array<EventSessionBase>>;
  shortid: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  /** MongoId of the community (aka space) that this event is organized to. */
  space?: Maybe<Scalars['MongoID']['output']>;
  speaker_emails?: Maybe<Array<Scalars['String']['output']>>;
  speaker_users?: Maybe<Array<Scalars['MongoID']['output']>>;
  stamp: Scalars['DateTimeISO']['output'];
  start: Scalars['DateTimeISO']['output'];
  state: EventState;
  stores?: Maybe<Array<Scalars['MongoID']['output']>>;
  stories?: Maybe<Array<Scalars['MongoID']['output']>>;
  stories_eponym?: Maybe<Scalars['Boolean']['output']>;
  subevent_enabled?: Maybe<Scalars['Boolean']['output']>;
  subevent_parent?: Maybe<Scalars['MongoID']['output']>;
  subevent_settings?: Maybe<SubeventSettings>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  telegram_channels?: Maybe<Array<TelegramChannel>>;
  terms_accepted?: Maybe<Array<Scalars['MongoID']['output']>>;
  terms_accepted_with_email_permission?: Maybe<Array<Scalars['MongoID']['output']>>;
  terms_email_permission_text?: Maybe<Scalars['Boolean']['output']>;
  terms_link?: Maybe<Scalars['String']['output']>;
  terms_text?: Maybe<Scalars['String']['output']>;
  theme_data?: Maybe<Scalars['JSON']['output']>;
  /** The number of tickets available per user for this event */
  ticket_limit_per?: Maybe<Scalars['Float']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  unlisted?: Maybe<Scalars['Boolean']['output']>;
  unsure?: Maybe<Array<Scalars['MongoID']['output']>>;
  url?: Maybe<Scalars['String']['output']>;
  url_go?: Maybe<Scalars['String']['output']>;
  videos?: Maybe<Array<Video>>;
  virtual?: Maybe<Scalars['Boolean']['output']>;
  virtual_url?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use data from event cohost requests table */
  visible_cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  welcome_text?: Maybe<Scalars['String']['output']>;
  welcome_video?: Maybe<Video>;
  zones_menu_text?: Maybe<Scalars['String']['output']>;
};

export type EventCalendarLinks = {
  __typename?: 'EventCalendarLinks';
  google: Scalars['String']['output'];
  ical: Scalars['String']['output'];
  outlook: Scalars['String']['output'];
  yahoo: Scalars['String']['output'];
};

export type EventCheckin = {
  __typename?: 'EventCheckin';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  /** Date time when the checkin happened */
  created_at: Scalars['DateTimeISO']['output'];
  email?: Maybe<Scalars['String']['output']>;
  event: Scalars['MongoID']['output'];
  login_user?: Maybe<UserWithEmail>;
  non_login_user?: Maybe<NonloginUser>;
  ticket: Scalars['MongoID']['output'];
  updated_by_expanded?: Maybe<User>;
  user?: Maybe<Scalars['MongoID']['output']>;
};

export type EventCheckinChartData = {
  __typename?: 'EventCheckinChartData';
  items: Array<EventCheckinItem>;
};

export type EventCheckinItem = {
  __typename?: 'EventCheckinItem';
  /** Date time when the checkin happened */
  created_at: Scalars['DateTimeISO']['output'];
};

export type EventCohostRequest = {
  __typename?: 'EventCohostRequest';
  _id: Scalars['MongoID']['output'];
  event: Scalars['MongoID']['output'];
  event_role?: Maybe<EventRole>;
  from: Scalars['MongoID']['output'];
  from_expanded?: Maybe<User>;
  profile_image_avatar?: Maybe<Scalars['String']['output']>;
  profile_name?: Maybe<Scalars['String']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  /** @deprecated Requests are auto accepted */
  state: EventCohostRequestState;
  to?: Maybe<Scalars['MongoID']['output']>;
  to_email?: Maybe<Scalars['String']['output']>;
  to_expanded?: Maybe<User>;
  visible?: Maybe<Scalars['Boolean']['output']>;
};

export enum EventCohostRequestState {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Pending = 'PENDING'
}

export type EventCurrency = {
  __typename?: 'EventCurrency';
  currency: Scalars['String']['output'];
  decimals: Scalars['Float']['output'];
  network?: Maybe<Scalars['String']['output']>;
};

export type EventFeedback = {
  __typename?: 'EventFeedback';
  /** The feedback comment */
  comment?: Maybe<Scalars['String']['output']>;
  /** Date time when the feedback is created */
  created_at: Scalars['DateTimeISO']['output'];
  /** Email of the user that gave the feedback */
  email?: Maybe<Scalars['String']['output']>;
  /** Id of the event that receives the feedback */
  event: Scalars['MongoID']['output'];
  /** Rate value from 1 (bad) to 5 (good) */
  rate_value: Scalars['Float']['output'];
  /** Id of the user that gave the feedback */
  user?: Maybe<Scalars['MongoID']['output']>;
  /** Basic info of the user who gave the feedback */
  user_info?: Maybe<User>;
};

export type EventFeedbackSummary = {
  __typename?: 'EventFeedbackSummary';
  /** An array of rating grouped by rating value */
  rates: Array<RateSummary>;
};

export type EventGuestDetail = {
  __typename?: 'EventGuestDetail';
  application?: Maybe<Array<EventApplicationQuestionAndAnswer>>;
  join_request?: Maybe<EventJoinRequest>;
  payment?: Maybe<EventGuestPayment>;
  ticket?: Maybe<Ticket>;
  user: EventGuestUser;
};

export type EventGuestDetailedInfo = {
  __typename?: 'EventGuestDetailedInfo';
  application?: Maybe<Array<EventApplicationQuestionAndAnswer>>;
  cancelled_tickets?: Maybe<Array<Ticket>>;
  checkin_count?: Maybe<Scalars['Int']['output']>;
  invitation?: Maybe<EventInvitation>;
  join_request?: Maybe<EventJoinRequest>;
  payments?: Maybe<Array<EventGuestPayment>>;
  purchased_tickets?: Maybe<Array<Ticket>>;
  rsvp_count?: Maybe<Scalars['Int']['output']>;
  ticket?: Maybe<Ticket>;
  user: EventGuestUser;
};

export type EventGuestPayment = {
  __typename?: 'EventGuestPayment';
  _id: Scalars['MongoID']['output'];
  account: Scalars['MongoID']['output'];
  account_expanded?: Maybe<NewPaymentAccount>;
  amount: Scalars['String']['output'];
  attempting_refund?: Maybe<Scalars['Boolean']['output']>;
  billing_info?: Maybe<BillingInfo>;
  buyer_info?: Maybe<BuyerInfo>;
  buyer_user?: Maybe<UserWithEmail>;
  crypto_payment_info?: Maybe<CryptoPaymentInfo>;
  currency: Scalars['String']['output'];
  due_amount?: Maybe<Scalars['String']['output']>;
  failure_reason?: Maybe<Scalars['String']['output']>;
  fee?: Maybe<Scalars['String']['output']>;
  formatted_discount_amount?: Maybe<Scalars['String']['output']>;
  formatted_due_amount?: Maybe<Scalars['String']['output']>;
  formatted_fee_amount?: Maybe<Scalars['String']['output']>;
  formatted_total_amount?: Maybe<Scalars['String']['output']>;
  ref_data?: Maybe<Scalars['JSON']['output']>;
  stamps: Scalars['JSON']['output'];
  state: NewPaymentState;
  stripe_payment_info?: Maybe<StripePaymentInfo>;
  transfer_metadata?: Maybe<Scalars['JSON']['output']>;
  transfer_params?: Maybe<Scalars['JSON']['output']>;
  user?: Maybe<Scalars['MongoID']['output']>;
};

export type EventGuestUser = {
  __typename?: 'EventGuestUser';
  _id?: Maybe<Scalars['MongoID']['output']>;
  /** This is the biography of the user */
  description?: Maybe<Scalars['String']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  first_name?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  last_name?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  wallets_new?: Maybe<Scalars['JSON']['output']>;
};

export type EventHost = {
  __typename?: 'EventHost';
  _id?: Maybe<Scalars['MongoID']['output']>;
  events_count?: Maybe<Scalars['Float']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
};

export type EventHostUser = {
  __typename?: 'EventHostUser';
  _id?: Maybe<Scalars['MongoID']['output']>;
  /** This is the biography of the user */
  description?: Maybe<Scalars['String']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  event_role?: Maybe<EventRole>;
  first_name?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  last_name?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type EventInput = {
  accepted_store_promotion?: InputMaybe<Scalars['MongoID']['input']>;
  accepted_user_fields_required?: InputMaybe<Array<Scalars['String']['input']>>;
  access_pass?: InputMaybe<AccessPassInput>;
  address?: InputMaybe<AddressInput>;
  address_directions?: InputMaybe<Array<Scalars['String']['input']>>;
  application_form_url?: InputMaybe<Scalars['String']['input']>;
  application_profile_fields?: InputMaybe<Array<ApplicationProfileFieldInput>>;
  application_required?: InputMaybe<Scalars['Boolean']['input']>;
  application_self_verification?: InputMaybe<Scalars['Boolean']['input']>;
  application_self_verification_required?: InputMaybe<Scalars['Boolean']['input']>;
  approval_required?: InputMaybe<Scalars['Boolean']['input']>;
  checkin_menu_text?: InputMaybe<Scalars['String']['input']>;
  comments?: InputMaybe<Scalars['String']['input']>;
  cost?: InputMaybe<Scalars['Float']['input']>;
  cover?: InputMaybe<Scalars['String']['input']>;
  cta_button_text?: InputMaybe<Scalars['String']['input']>;
  /** Show secondary CTA button text */
  cta_secondary_visible?: InputMaybe<Scalars['Boolean']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  dark_theme_image?: InputMaybe<Scalars['MongoID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  description_plain_text?: InputMaybe<Scalars['String']['input']>;
  donation_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  donation_show_history?: InputMaybe<Scalars['Boolean']['input']>;
  donation_vaults?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  end?: InputMaybe<Scalars['DateTimeISO']['input']>;
  events?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  external_hostname?: InputMaybe<Scalars['String']['input']>;
  external_url?: InputMaybe<Scalars['String']['input']>;
  frequent_questions?: InputMaybe<Array<FrequentQuestionInput>>;
  guest_directory_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  guest_limit?: InputMaybe<Scalars['Float']['input']>;
  guest_limit_per?: InputMaybe<Scalars['Float']['input']>;
  hide_attending?: InputMaybe<Scalars['Boolean']['input']>;
  hide_chat_action?: InputMaybe<Scalars['Boolean']['input']>;
  hide_cohosts?: InputMaybe<Scalars['Boolean']['input']>;
  hide_creators?: InputMaybe<Scalars['Boolean']['input']>;
  hide_invite_action?: InputMaybe<Scalars['Boolean']['input']>;
  hide_lounge?: InputMaybe<Scalars['Boolean']['input']>;
  hide_question_box?: InputMaybe<Scalars['Boolean']['input']>;
  hide_rooms_action?: InputMaybe<Scalars['Boolean']['input']>;
  hide_session_guests?: InputMaybe<Scalars['Boolean']['input']>;
  hide_speakers?: InputMaybe<Scalars['Boolean']['input']>;
  hide_stories_action?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  layout_sections?: InputMaybe<Array<LayoutSectionInput>>;
  light_theme_image?: InputMaybe<Scalars['MongoID']['input']>;
  listing_spaces?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  new_new_photos?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  new_photos?: InputMaybe<Array<FileInlineInput>>;
  offers?: InputMaybe<Array<EventOfferInput>>;
  payment_accounts_new?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  payment_donation?: InputMaybe<Scalars['Boolean']['input']>;
  payment_donation_amount_includes_tickets?: InputMaybe<Scalars['Boolean']['input']>;
  payment_donation_message?: InputMaybe<Scalars['String']['input']>;
  payment_donation_target?: InputMaybe<Scalars['Float']['input']>;
  payment_optional?: InputMaybe<Scalars['Boolean']['input']>;
  payment_ticket_purchase_title?: InputMaybe<Scalars['String']['input']>;
  photos?: InputMaybe<Array<Scalars['String']['input']>>;
  private?: InputMaybe<Scalars['Boolean']['input']>;
  /** If this is true then the event is published, otherwise the event is unpublished. */
  published?: InputMaybe<Scalars['Boolean']['input']>;
  registration_disabled?: InputMaybe<Scalars['Boolean']['input']>;
  rewards?: InputMaybe<Array<EventRewardInput>>;
  rsvp_wallet_platforms?: InputMaybe<Array<ApplicationBlokchainPlatformInput>>;
  self_verification?: InputMaybe<SelfVerificationInput>;
  sessions?: InputMaybe<Array<EventSessionInput>>;
  shortid?: InputMaybe<Scalars['String']['input']>;
  /** MongoId of the community (aka space) that this event is organized to. */
  space?: InputMaybe<Scalars['MongoID']['input']>;
  speaker_emails?: InputMaybe<Array<Scalars['String']['input']>>;
  speaker_users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  start?: InputMaybe<Scalars['DateTimeISO']['input']>;
  stores?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  stories?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  subevent_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  subevent_parent?: InputMaybe<Scalars['MongoID']['input']>;
  subevent_settings?: InputMaybe<SubeventSettingsInput>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  telegram_channels?: InputMaybe<Array<TelegramChannelInput>>;
  terms_email_permission_text?: InputMaybe<Scalars['Boolean']['input']>;
  terms_link?: InputMaybe<Scalars['String']['input']>;
  terms_text?: InputMaybe<Scalars['String']['input']>;
  theme_data?: InputMaybe<Scalars['JSON']['input']>;
  /** The number of tickets available per user for this event */
  ticket_limit_per?: InputMaybe<Scalars['Float']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  virtual?: InputMaybe<Scalars['Boolean']['input']>;
  virtual_url?: InputMaybe<Scalars['String']['input']>;
  visible_cohosts?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  welcome_text?: InputMaybe<Scalars['String']['input']>;
  welcome_video?: InputMaybe<VideoInput>;
  zones_menu_text?: InputMaybe<Scalars['String']['input']>;
};

export type EventInvitation = {
  __typename?: 'EventInvitation';
  _id: Scalars['MongoID']['output'];
  cancelled_by?: Maybe<Scalars['MongoID']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  email?: Maybe<Scalars['String']['output']>;
  event: Scalars['MongoID']['output'];
  inviters: Array<Scalars['MongoID']['output']>;
  inviters_expanded?: Maybe<Array<User>>;
  phone?: Maybe<Scalars['String']['output']>;
  status: InvitationResponse;
  user?: Maybe<Scalars['MongoID']['output']>;
};

export type EventInvitationUrl = {
  __typename?: 'EventInvitationUrl';
  event: Scalars['MongoID']['output'];
  user: Scalars['MongoID']['output'];
};

export type EventInvite = {
  __typename?: 'EventInvite';
  event: Scalars['MongoID']['output'];
  event_expanded?: Maybe<Event>;
  inviter: Scalars['MongoID']['output'];
  inviter_expanded?: Maybe<User>;
};

export type EventInviter = {
  __typename?: 'EventInviter';
  count: Scalars['Int']['output'];
  inviter: BasicUserInfo;
};

export type EventJoinRequest = {
  __typename?: 'EventJoinRequest';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  decided_at?: Maybe<Scalars['DateTimeISO']['output']>;
  decided_by?: Maybe<Scalars['MongoID']['output']>;
  decided_by_expanded?: Maybe<User>;
  email?: Maybe<Scalars['String']['output']>;
  event: Scalars['MongoID']['output'];
  event_expanded?: Maybe<Event>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  non_login_user?: Maybe<NonloginUser>;
  payment?: Maybe<JoinRequestPayment>;
  payment_id?: Maybe<Scalars['MongoID']['output']>;
  requested_tickets?: Maybe<Array<RequestedTicket>>;
  state: EventJoinRequestState;
  ticket_types_expanded?: Maybe<Array<Maybe<EventTicketType>>>;
  user?: Maybe<Scalars['MongoID']['output']>;
  user_expanded?: Maybe<UserWithEmail>;
};

export type EventJoinRequestBase = {
  __typename?: 'EventJoinRequestBase';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  decided_at?: Maybe<Scalars['DateTimeISO']['output']>;
  decided_by?: Maybe<Scalars['MongoID']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  event: Scalars['MongoID']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  payment_id?: Maybe<Scalars['MongoID']['output']>;
  requested_tickets?: Maybe<Array<RequestedTicket>>;
  state: EventJoinRequestState;
  user?: Maybe<Scalars['MongoID']['output']>;
};

export enum EventJoinRequestState {
  Approved = 'approved',
  Declined = 'declined',
  Pending = 'pending'
}

export type EventLatestViews = {
  __typename?: 'EventLatestViews';
  views: Array<Track>;
};

export type EventOffer = {
  __typename?: 'EventOffer';
  _id?: Maybe<Scalars['MongoID']['output']>;
  auto?: Maybe<Scalars['Boolean']['output']>;
  position?: Maybe<Scalars['Float']['output']>;
  provider: OfferProvider;
  provider_id: Scalars['String']['output'];
  provider_network: Scalars['String']['output'];
};

export type EventOfferInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  auto?: InputMaybe<Scalars['Boolean']['input']>;
  position?: InputMaybe<Scalars['Float']['input']>;
  provider: OfferProvider;
  provider_id: Scalars['String']['input'];
  provider_network: Scalars['String']['input'];
};

export type EventPaymentStatistics = {
  __typename?: 'EventPaymentStatistics';
  crypto_payments: CryptoPaymentStatistics;
  stripe_payments: PaymentStatistics;
  total_payments: Scalars['Int']['output'];
};

export type EventPaymentSummary = {
  __typename?: 'EventPaymentSummary';
  amount: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  decimals: Scalars['Float']['output'];
  pending_transfer_amount: Scalars['String']['output'];
  transfer_amount: Scalars['String']['output'];
};

export type EventPaymentTicketDiscount = {
  __typename?: 'EventPaymentTicketDiscount';
  active: Scalars['Boolean']['output'];
  code: Scalars['String']['output'];
  ratio: Scalars['Float']['output'];
  stamp: Scalars['DateTimeISO']['output'];
  ticket_count?: Maybe<Scalars['Float']['output']>;
  ticket_count_map?: Maybe<Scalars['JSON']['output']>;
  ticket_limit?: Maybe<Scalars['Float']['output']>;
  ticket_limit_per?: Maybe<Scalars['Float']['output']>;
  ticket_types?: Maybe<Array<Scalars['MongoID']['output']>>;
  use_count?: Maybe<Scalars['Float']['output']>;
  use_count_map?: Maybe<Scalars['JSON']['output']>;
  use_limit?: Maybe<Scalars['Float']['output']>;
  use_limit_per?: Maybe<Scalars['Float']['output']>;
  users?: Maybe<Array<Scalars['MongoID']['output']>>;
  users_expanded?: Maybe<Array<Maybe<User>>>;
};


export type EventPaymentTicketDiscountUsers_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type EventPaymentTicketDiscountInput = {
  code: Scalars['String']['input'];
  ratio: Scalars['Float']['input'];
  ticket_limit?: InputMaybe<Scalars['Float']['input']>;
  ticket_limit_per?: InputMaybe<Scalars['Float']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  use_limit?: InputMaybe<Scalars['Float']['input']>;
  use_limit_per?: InputMaybe<Scalars['Float']['input']>;
};

export type EventQuestion = {
  __typename?: 'EventQuestion';
  _id: Scalars['MongoID']['output'];
  event: Scalars['MongoID']['output'];
  liked?: Maybe<Scalars['Boolean']['output']>;
  likes: Scalars['Int']['output'];
  question: Scalars['String']['output'];
  session?: Maybe<Scalars['MongoID']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
};

export type EventRequestStateStatistic = {
  __typename?: 'EventRequestStateStatistic';
  state: EventJoinRequestState;
  total: Scalars['Float']['output'];
};

export type EventReward = {
  __typename?: 'EventReward';
  _id?: Maybe<Scalars['MongoID']['output']>;
  active: Scalars['Boolean']['output'];
  icon_color?: Maybe<Scalars['String']['output']>;
  icon_url?: Maybe<Scalars['String']['output']>;
  limit?: Maybe<Scalars['Float']['output']>;
  limit_per: Scalars['Float']['output'];
  payment_ticket_types?: Maybe<Array<Scalars['MongoID']['output']>>;
  title: Scalars['String']['output'];
};

export type EventRewardInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  active: Scalars['Boolean']['input'];
  icon_color?: InputMaybe<Scalars['String']['input']>;
  icon_url?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  limit_per: Scalars['Float']['input'];
  payment_ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  title: Scalars['String']['input'];
};

export type EventRewardUse = {
  __typename?: 'EventRewardUse';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  event: Scalars['MongoID']['output'];
  reward_id: Scalars['MongoID']['output'];
  reward_number: Scalars['Float']['output'];
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
};

export enum EventRole {
  Cohost = 'cohost',
  Gatekeeper = 'gatekeeper',
  Representative = 'representative'
}

export type EventRsvp = {
  __typename?: 'EventRsvp';
  messages?: Maybe<EventRsvpMessages>;
  payment?: Maybe<EventRsvpPayment>;
  state: EventRsvpState;
};

export type EventRsvpMessages = {
  __typename?: 'EventRsvpMessages';
  primary: Scalars['String']['output'];
  secondary?: Maybe<Scalars['String']['output']>;
};

export type EventRsvpPayment = {
  __typename?: 'EventRsvpPayment';
  amount: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  provider: Scalars['String']['output'];
};

export enum EventRsvpState {
  Accepted = 'accepted',
  Declined = 'declined',
  Payment = 'payment',
  Pending = 'pending'
}

export type EventSession = {
  __typename?: 'EventSession';
  _id?: Maybe<Scalars['MongoID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  end: Scalars['DateTimeISO']['output'];
  photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  photos_expanded?: Maybe<Array<Maybe<File>>>;
  speaker_users?: Maybe<Array<Scalars['MongoID']['output']>>;
  speaker_users_expanded?: Maybe<Array<Maybe<User>>>;
  start: Scalars['DateTimeISO']['output'];
  title: Scalars['String']['output'];
  votings?: Maybe<Array<Scalars['MongoID']['output']>>;
};


export type EventSessionPhotos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type EventSessionSpeaker_Users_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type EventSessionBase = {
  __typename?: 'EventSessionBase';
  _id?: Maybe<Scalars['MongoID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  end: Scalars['DateTimeISO']['output'];
  photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  speaker_users?: Maybe<Array<Scalars['MongoID']['output']>>;
  start: Scalars['DateTimeISO']['output'];
  title: Scalars['String']['output'];
  votings?: Maybe<Array<Scalars['MongoID']['output']>>;
};

export type EventSessionInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end: Scalars['DateTimeISO']['input'];
  photos?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  speaker_users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  start: Scalars['DateTimeISO']['input'];
  title: Scalars['String']['input'];
  votings?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export type EventSessionReservation = {
  __typename?: 'EventSessionReservation';
  event: Scalars['MongoID']['output'];
  session: Scalars['MongoID']['output'];
  ticket_type?: Maybe<Scalars['MongoID']['output']>;
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
};

export type EventSessionReservationInput = {
  event: Scalars['MongoID']['input'];
  session: Scalars['MongoID']['input'];
};

export type EventSessionReservationSummary = {
  __typename?: 'EventSessionReservationSummary';
  count: Scalars['Float']['output'];
  session: Scalars['MongoID']['output'];
  ticket_type?: Maybe<Scalars['MongoID']['output']>;
};

export type EventSortInput = {
  end?: InputMaybe<SortOrder>;
  start?: InputMaybe<SortOrder>;
};

export type EventStakePayment = {
  __typename?: 'EventStakePayment';
  _id: Scalars['MongoID']['output'];
  currency: Scalars['String']['output'];
  formatted_stake_amount: Scalars['String']['output'];
  network: Scalars['String']['output'];
  refund_requirements_met?: Maybe<Scalars['Boolean']['output']>;
  staker: StakeUser;
  state: StakeState;
  ticket_count: Scalars['Float']['output'];
};

export enum EventState {
  Cancelled = 'cancelled',
  Created = 'created',
  Ended = 'ended',
  Started = 'started'
}

export type EventStoryInput = {
  event: Scalars['MongoID']['input'];
  file: Scalars['MongoID']['input'];
};

export enum EventTense {
  Current = 'Current',
  Future = 'Future',
  Past = 'Past'
}

export type EventTicketCategory = {
  __typename?: 'EventTicketCategory';
  _id: Scalars['MongoID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  event: Scalars['MongoID']['output'];
  position?: Maybe<Scalars['Int']['output']>;
  title: Scalars['String']['output'];
};

export type EventTicketPrice = {
  __typename?: 'EventTicketPrice';
  cost: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  default?: Maybe<Scalars['Boolean']['output']>;
  payment_accounts?: Maybe<Array<Scalars['MongoID']['output']>>;
  payment_accounts_expanded?: Maybe<Array<NewPaymentAccount>>;
};

export type EventTicketPriceInput = {
  cost: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  default?: InputMaybe<Scalars['Boolean']['input']>;
  payment_accounts?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export type EventTicketSaleResponse = {
  __typename?: 'EventTicketSaleResponse';
  last_update: Scalars['DateTimeISO']['output'];
  sales: Array<SaleAmountResponse>;
};

export type EventTicketType = {
  __typename?: 'EventTicketType';
  _id: Scalars['MongoID']['output'];
  active?: Maybe<Scalars['Boolean']['output']>;
  address_required?: Maybe<Scalars['Boolean']['output']>;
  approval_required?: Maybe<Scalars['Boolean']['output']>;
  category?: Maybe<Scalars['MongoID']['output']>;
  category_expanded?: Maybe<EventTicketCategory>;
  default?: Maybe<Scalars['Boolean']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  description_line?: Maybe<Scalars['String']['output']>;
  event: Scalars['MongoID']['output'];
  external_ids?: Maybe<Array<Scalars['String']['output']>>;
  limited?: Maybe<Scalars['Boolean']['output']>;
  limited_whitelist_users?: Maybe<Array<WhitelistUserInfo>>;
  offers?: Maybe<Array<EventOffer>>;
  passcode_enabled?: Maybe<Scalars['Boolean']['output']>;
  photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  photos_expanded?: Maybe<Array<Maybe<File>>>;
  position?: Maybe<Scalars['Int']['output']>;
  prices: Array<EventTicketPrice>;
  private?: Maybe<Scalars['Boolean']['output']>;
  recommended_upgrade_ticket_types?: Maybe<Array<Scalars['MongoID']['output']>>;
  self_verification?: Maybe<SelfVerification>;
  ticket_count?: Maybe<Scalars['Float']['output']>;
  ticket_limit?: Maybe<Scalars['Float']['output']>;
  ticket_limit_per?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
};


export type EventTicketTypePhotos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type EventTicketTypeInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  added_whitelist_emails?: InputMaybe<Array<Scalars['String']['input']>>;
  address_required?: InputMaybe<Scalars['Boolean']['input']>;
  approval_required?: InputMaybe<Scalars['Boolean']['input']>;
  category?: InputMaybe<Scalars['MongoID']['input']>;
  default?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  description_line?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  external_ids?: InputMaybe<Array<Scalars['String']['input']>>;
  limited?: InputMaybe<Scalars['Boolean']['input']>;
  limited_whitelist_emails?: InputMaybe<Array<Scalars['String']['input']>>;
  limited_whitelist_ids?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  offers?: InputMaybe<Array<EventTicketTypeOffersInput>>;
  passcode?: InputMaybe<Scalars['String']['input']>;
  passcode_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  photos?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  position?: InputMaybe<Scalars['Int']['input']>;
  prices?: InputMaybe<Array<EventTicketPriceInput>>;
  private?: InputMaybe<Scalars['Boolean']['input']>;
  recommended_upgrade_ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  removed_whitelist_emails?: InputMaybe<Array<Scalars['String']['input']>>;
  self_verification?: InputMaybe<SelfVerificationInput>;
  ticket_limit?: InputMaybe<Scalars['Float']['input']>;
  ticket_limit_per?: InputMaybe<Scalars['Float']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type EventTicketTypeOffersInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  auto?: InputMaybe<Scalars['Boolean']['input']>;
  position?: InputMaybe<Scalars['Float']['input']>;
  provider?: InputMaybe<OfferProvider>;
  provider_id?: InputMaybe<Scalars['String']['input']>;
  provider_network?: InputMaybe<Scalars['String']['input']>;
};

export type EventTokenGate = {
  __typename?: 'EventTokenGate';
  _id: Scalars['MongoID']['output'];
  /** Decimal places of this token, for display purpose only */
  decimals: Scalars['Float']['output'];
  /** List of ERC1155 token ids to check, which are bigint */
  erc1155_token_ids?: Maybe<Array<Scalars['Int']['output']>>;
  event: Scalars['MongoID']['output'];
  gated_ticket_types?: Maybe<Array<Scalars['MongoID']['output']>>;
  /** ERC721 if true, else ERC20 */
  is_nft?: Maybe<Scalars['Boolean']['output']>;
  max_value?: Maybe<Scalars['String']['output']>;
  min_value?: Maybe<Scalars['String']['output']>;
  /** Display name of the token */
  name: Scalars['String']['output'];
  network: Scalars['String']['output'];
  ticket_types_expanded?: Maybe<Array<EventTicketType>>;
  token_address: Scalars['String']['output'];
};

export type EventTokenGateInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  /** Decimal places of this token, for display purpose only */
  decimals?: InputMaybe<Scalars['Float']['input']>;
  /** List of ERC1155 token ids to check, which are bigint */
  erc1155_token_ids?: InputMaybe<Array<Scalars['Int']['input']>>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  gated_ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  /** ERC721 if true, else ERC20 */
  is_nft?: InputMaybe<Scalars['Boolean']['input']>;
  max_value?: InputMaybe<Scalars['String']['input']>;
  min_value?: InputMaybe<Scalars['String']['input']>;
  /** Display name of the token */
  name?: InputMaybe<Scalars['String']['input']>;
  network?: InputMaybe<Scalars['String']['input']>;
  token_address?: InputMaybe<Scalars['String']['input']>;
};

export type EventTopViewsByCity = {
  __typename?: 'EventTopViewsByCity';
  count: Scalars['Int']['output'];
  geoip_city?: Maybe<Scalars['String']['output']>;
  geoip_country?: Maybe<Scalars['String']['output']>;
  geoip_region?: Maybe<Scalars['String']['output']>;
};

export type EventTopViewsBySource = {
  __typename?: 'EventTopViewsBySource';
  count: Scalars['Int']['output'];
  utm_source?: Maybe<Scalars['String']['output']>;
};

/** The event view stats */
export type EventViewChartData = {
  __typename?: 'EventViewChartData';
  items: Array<EventViewItem>;
};

export type EventViewItem = {
  __typename?: 'EventViewItem';
  /** Date time when the event is viewed by a guest */
  date: Scalars['DateTimeISO']['output'];
};

export type EventViewStats = {
  __typename?: 'EventViewStats';
  /** Number of total views */
  counts: Array<Scalars['Int']['output']>;
};

export type EventVoting = {
  __typename?: 'EventVoting';
  _id: Scalars['MongoID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  end: Scalars['DateTimeISO']['output'];
  hidden?: Maybe<Scalars['Boolean']['output']>;
  selected_option?: Maybe<Scalars['String']['output']>;
  speakers: Array<User>;
  stage?: Maybe<Scalars['String']['output']>;
  start: Scalars['DateTimeISO']['output'];
  state: EventVotingState;
  timezone?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  voting_options: Array<VotingOption>;
};

export enum EventVotingState {
  Closed = 'closed',
  NotStarted = 'not_started',
  Paused = 'paused',
  Starting = 'starting'
}

export type EventbriteEvent = {
  __typename?: 'EventbriteEvent';
  description?: Maybe<Scalars['String']['output']>;
  end: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  logo_url?: Maybe<Scalars['String']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  start: Scalars['DateTimeISO']['output'];
  status: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export enum EventbriteEventOrder {
  CreatedAsc = 'CREATED_ASC',
  CreatedDesc = 'CREATED_DESC'
}

export enum EventbriteEventStatus {
  Canceled = 'CANCELED',
  Draft = 'DRAFT',
  Ended = 'ENDED',
  Live = 'LIVE',
  Started = 'STARTED'
}

export type ExecuteConnectorActionInput = {
  actionId: Scalars['String']['input'];
  connectionId: Scalars['String']['input'];
  params?: InputMaybe<Scalars['JSON']['input']>;
};

export type ExportedTickets = {
  __typename?: 'ExportedTickets';
  count: Scalars['Float']['output'];
  tickets: Array<TicketExport>;
};

export type FarcasterUserInfo = {
  __typename?: 'FarcasterUserInfo';
  account_key_request?: Maybe<AccountKeyRequest>;
  fid?: Maybe<Scalars['Float']['output']>;
};

export type Feature = {
  __typename?: 'Feature';
  code: FeatureCode;
  title: Scalars['String']['output'];
};

export enum FeatureCode {
  Ai = 'AI',
  CsvGuestList = 'CSVGuestList',
  Checkin = 'Checkin',
  CollectibleData = 'CollectibleData',
  DataDashboard = 'DataDashboard',
  EmailManager = 'EmailManager',
  EventInvitation = 'EventInvitation',
  EventSettings = 'EventSettings',
  GuestListDashboard = 'GuestListDashboard',
  ManageApiKeys = 'ManageApiKeys',
  ManageSpace = 'ManageSpace',
  ManageSpaceEvent = 'ManageSpaceEvent',
  ManageSpaceEventRequest = 'ManageSpaceEventRequest',
  ManageSpaceMembership = 'ManageSpaceMembership',
  ManageSpaceNewsletter = 'ManageSpaceNewsletter',
  ManageSpaceTag = 'ManageSpaceTag',
  ManageSpaceTokenGate = 'ManageSpaceTokenGate',
  ManageSubscription = 'ManageSubscription',
  Poap = 'Poap',
  PromotionCodes = 'PromotionCodes',
  SpaceStatistic = 'SpaceStatistic',
  Ticket = 'Ticket',
  TicketingSettings = 'TicketingSettings',
  ViewSpace = 'ViewSpace',
  ViewSpaceEvent = 'ViewSpaceEvent',
  ViewSpaceMembership = 'ViewSpaceMembership',
  ViewSpaceNewsletter = 'ViewSpaceNewsletter',
  ViewSpaceTag = 'ViewSpaceTag'
}

export enum FeatureType {
  Boolean = 'boolean',
  EnumSet = 'enum_set',
  NumericLimit = 'numeric_limit'
}

export type FiatCurrency = {
  __typename?: 'FiatCurrency';
  code: Scalars['String']['output'];
  decimals: Scalars['Float']['output'];
};

export type File = {
  __typename?: 'File';
  _id?: Maybe<Scalars['MongoID']['output']>;
  bucket: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  liked?: Maybe<Scalars['Boolean']['output']>;
  likers?: Maybe<Array<Scalars['MongoID']['output']>>;
  likes: Scalars['Float']['output'];
  link_events_expanded?: Maybe<Array<Maybe<Event>>>;
  link_store_products_expanded?: Maybe<Array<Maybe<StoreProduct>>>;
  link_stores_expanded?: Maybe<Array<Maybe<Store>>>;
  link_users_expanded?: Maybe<Array<Maybe<User>>>;
  links?: Maybe<Array<FileLink>>;
  owner: Scalars['MongoID']['output'];
  owner_expanded?: Maybe<User>;
  size?: Maybe<Scalars['Float']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  state: FileState;
  type: Scalars['String']['output'];
  url: Scalars['String']['output'];
};


export type FileLink_Events_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type FileLink_Store_Products_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type FileLink_Stores_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type FileLink_Users_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type FileBase = {
  __typename?: 'FileBase';
  _id?: Maybe<Scalars['MongoID']['output']>;
  bucket: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  likers?: Maybe<Array<Scalars['MongoID']['output']>>;
  likes: Scalars['Float']['output'];
  links?: Maybe<Array<FileLink>>;
  owner: Scalars['MongoID']['output'];
  size?: Maybe<Scalars['Float']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  state: FileState;
  type: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export enum FileCategory {
  EventDarkTheme = 'event_dark_theme',
  EventLightTheme = 'event_light_theme',
  LemonheadLayer = 'lemonhead_layer',
  OtherAsset = 'other_asset',
  SpaceDarkTheme = 'space_dark_theme',
  SpaceLightTheme = 'space_light_theme'
}

export type FileInline = {
  __typename?: 'FileInline';
  fa_file?: Maybe<Scalars['MongoID']['output']>;
  fa_index?: Maybe<Scalars['Float']['output']>;
  id: Scalars['MongoID']['output'];
  key: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type FileInlineInput = {
  fa_file?: InputMaybe<Scalars['MongoID']['input']>;
  fa_index?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['MongoID']['input'];
  key: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type FileInput = {
  description?: InputMaybe<Scalars['String']['input']>;
};

export type FileLink = {
  __typename?: 'FileLink';
  id: Scalars['MongoID']['output'];
  model: Scalars['String']['output'];
  path: Scalars['String']['output'];
  type: FileLinkType;
};

export type FileLinkInput = {
  id: Scalars['MongoID']['input'];
  model: Scalars['String']['input'];
  path?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<FileLinkType>;
};

export enum FileLinkType {
  FileInline = 'file_inline',
  ObjectId = 'object_id'
}

export enum FileState {
  Done = 'done',
  Error = 'error',
  Started = 'started'
}

export type FileUploadInfo = {
  description?: InputMaybe<Scalars['String']['input']>;
  extension: Scalars['String']['input'];
};

export type FileWithPresignedUrl = {
  __typename?: 'FileWithPresignedUrl';
  _id?: Maybe<Scalars['MongoID']['output']>;
  bucket: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  liked?: Maybe<Scalars['Boolean']['output']>;
  likers?: Maybe<Array<Scalars['MongoID']['output']>>;
  likes: Scalars['Float']['output'];
  link_events_expanded?: Maybe<Array<Maybe<Event>>>;
  link_store_products_expanded?: Maybe<Array<Maybe<StoreProduct>>>;
  link_stores_expanded?: Maybe<Array<Maybe<Store>>>;
  link_users_expanded?: Maybe<Array<Maybe<User>>>;
  links?: Maybe<Array<FileLink>>;
  owner: Scalars['MongoID']['output'];
  owner_expanded?: Maybe<User>;
  presigned_url: Scalars['String']['output'];
  size?: Maybe<Scalars['Float']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  state: FileState;
  type: Scalars['String']['output'];
  url: Scalars['String']['output'];
};


export type FileWithPresignedUrlLink_Events_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type FileWithPresignedUrlLink_Store_Products_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type FileWithPresignedUrlLink_Stores_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type FileWithPresignedUrlLink_Users_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type FilterEventInput = {
  eq?: InputMaybe<EventState>;
  in?: InputMaybe<Array<EventState>>;
  nin?: InputMaybe<Array<EventState>>;
};

export type FilterPaymentStateInput = {
  eq?: InputMaybe<NewPaymentState>;
  in?: InputMaybe<Array<NewPaymentState>>;
  nin?: InputMaybe<Array<NewPaymentState>>;
};

export type FreeSafeInitInfo = {
  __typename?: 'FreeSafeInitInfo';
  current: Scalars['Int']['output'];
  max: Scalars['Int']['output'];
};

export type FrequentQuestion = {
  __typename?: 'FrequentQuestion';
  _id?: Maybe<Scalars['MongoID']['output']>;
  answer: Scalars['String']['output'];
  position?: Maybe<Scalars['Float']['output']>;
  question: Scalars['String']['output'];
  tag?: Maybe<Scalars['String']['output']>;
  type: Array<FrequentQuestionType>;
};

export type FrequentQuestionInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  answer: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Float']['input']>;
  question: Scalars['String']['input'];
  tag?: InputMaybe<Scalars['String']['input']>;
  type: Array<FrequentQuestionType>;
};

export enum FrequentQuestionType {
  Event = 'event',
  Poap = 'poap',
  User = 'user'
}

export type GenerateEventInvitationUrlResponse = {
  __typename?: 'GenerateEventInvitationUrlResponse';
  shortid: Scalars['String']['output'];
  tk?: Maybe<Scalars['String']['output']>;
};

export type GenerateRecurringDatesInput = {
  count?: InputMaybe<Scalars['Float']['input']>;
  dayOfWeeks?: InputMaybe<Array<Scalars['Int']['input']>>;
  end?: InputMaybe<Scalars['DateTimeISO']['input']>;
  repeat: RecurringRepeat;
  start: Scalars['DateTimeISO']['input'];
  utcOffsetMinutes: Scalars['Float']['input'];
};

export type GenerateStripeAccountLinkResponse = {
  __typename?: 'GenerateStripeAccountLinkResponse';
  url: Scalars['String']['output'];
};

export type GeoCity = {
  __typename?: 'GeoCity';
  _id: Scalars['MongoID']['output'];
  hidden?: Maybe<Scalars['Boolean']['output']>;
  icon_url?: Maybe<Scalars['String']['output']>;
  listed_events_count?: Maybe<Scalars['Float']['output']>;
  /** Name of the city, unique within region */
  name: Scalars['String']['output'];
  region: Scalars['MongoID']['output'];
  space: Scalars['MongoID']['output'];
  space_expanded?: Maybe<Space>;
};

export type GeoRegion = {
  __typename?: 'GeoRegion';
  _id: Scalars['MongoID']['output'];
  cities: Array<GeoCity>;
  title: Scalars['String']['output'];
};

export type GetCommentsArgs = {
  comment?: InputMaybe<Scalars['MongoID']['input']>;
  post: Scalars['MongoID']['input'];
};

export type GetEventCheckinsInput = {
  emails?: InputMaybe<Array<Scalars['String']['input']>>;
  event: Scalars['MongoID']['input'];
  users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export type GetEventCohostRequestsInput = {
  event: Scalars['MongoID']['input'];
  state?: InputMaybe<EventCohostRequestState>;
};

export type GetEventGuestsStatisticsResponse = {
  __typename?: 'GetEventGuestsStatisticsResponse';
  checked_in: Scalars['Int']['output'];
  declined: Scalars['Int']['output'];
  going: Scalars['Int']['output'];
  pending_approval: Scalars['Int']['output'];
  pending_invite: Scalars['Int']['output'];
  ticket_types: Array<GetEventGuestsTicketTypeStatistics>;
};

export type GetEventGuestsTicketTypeStatistics = {
  __typename?: 'GetEventGuestsTicketTypeStatistics';
  guests_count: Scalars['Float']['output'];
  ticket_type: Scalars['MongoID']['output'];
  ticket_type_title: Scalars['String']['output'];
};

export type GetEventInvitedStatisticsResponse = {
  __typename?: 'GetEventInvitedStatisticsResponse';
  emails_opened: Scalars['Int']['output'];
  guests: Array<Guest>;
  top_inviter?: Maybe<Scalars['MongoID']['output']>;
  top_inviter_expanded?: Maybe<User>;
  total: Scalars['Int']['output'];
  total_declined: Scalars['Int']['output'];
  total_joined: Scalars['Int']['output'];
};

export type GetEventJoinRequestsResponse = {
  __typename?: 'GetEventJoinRequestsResponse';
  records: Array<EventJoinRequest>;
  total: Scalars['Int']['output'];
};

export type GetEventPendingInvitesResponse = {
  __typename?: 'GetEventPendingInvitesResponse';
  cohost_requests?: Maybe<Array<EventInvite>>;
  event_invites?: Maybe<Array<EventInvite>>;
};

export enum GetEventQuestionInputSort {
  Id = '_id',
  Likes = 'likes'
}

export type GetEventQuestionsInput = {
  event: Scalars['MongoID']['input'];
  id_lt?: InputMaybe<Scalars['MongoID']['input']>;
  limit?: Scalars['Int']['input'];
  sort?: GetEventQuestionInputSort;
};

export type GetEventRewardUsesInput = {
  event: Scalars['MongoID']['input'];
  user: Scalars['MongoID']['input'];
};

export type GetEventSessionReservationSummaryInput = {
  event: Scalars['MongoID']['input'];
  session?: InputMaybe<Scalars['MongoID']['input']>;
};

export type GetEventSessionReservationsInput = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
};

export type GetEventTicketTypesInput = {
  discount?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
};

export type GetEventTicketTypesResponse = {
  __typename?: 'GetEventTicketTypesResponse';
  discount?: Maybe<TicketDiscount>;
  limit: Scalars['Float']['output'];
  ticket_types: Array<PurchasableTicketType>;
};

export type GetEventTopViewsResponse = {
  __typename?: 'GetEventTopViewsResponse';
  by_city: Array<EventTopViewsByCity>;
  by_source: Array<EventTopViewsBySource>;
  total: Scalars['Int']['output'];
};

export type GetEventbriteEventsInput = {
  order?: InputMaybe<EventbriteEventOrder>;
  status?: InputMaybe<EventbriteEventStatus>;
};

export enum GetEventsState {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Invited = 'INVITED',
  Pending = 'PENDING'
}

export type GetFrequentQuestionsInput = {
  type: Array<FrequentQuestionType>;
};

export type GetInitSafeTransactionInput = {
  network: Scalars['String']['input'];
  owners: Array<Scalars['String']['input']>;
  threshold: Scalars['Int']['input'];
};

export type GetMyLemonheadInvitationRankResponse = {
  __typename?: 'GetMyLemonheadInvitationRankResponse';
  /** The paginated response */
  items: Array<LemonheadInvitationRank>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type GetMyTicketsResponse = {
  __typename?: 'GetMyTicketsResponse';
  payments?: Maybe<Array<PaymentRefundInfo>>;
  tickets: Array<Ticket>;
};

export type GetPostsCreatedAtInput = {
  gte?: InputMaybe<Scalars['DateTimeISO']['input']>;
  lte?: InputMaybe<Scalars['DateTimeISO']['input']>;
};

export type GetPostsInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  created_at?: InputMaybe<GetPostsCreatedAtInput>;
  published?: InputMaybe<Scalars['Boolean']['input']>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};

export type GetSpaceEventRequestsResponse = {
  __typename?: 'GetSpaceEventRequestsResponse';
  records: Array<SpaceEventRequest>;
  total: Scalars['Int']['output'];
};

export type GetTopInvitersResponse = {
  __typename?: 'GetTopInvitersResponse';
  /** The paginated response */
  items: Array<EventInviter>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type GetUserContactsInput = {
  invited_at_gt?: InputMaybe<Scalars['DateTimeISO']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type GetUserContactsResponse = {
  __typename?: 'GetUserContactsResponse';
  counts?: Maybe<Scalars['JSON']['output']>;
  /** The paginated response */
  items: Array<UserContact>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type GetUserFollowsInput = {
  followee?: InputMaybe<Scalars['MongoID']['input']>;
  followee_search?: InputMaybe<Scalars['String']['input']>;
  follower?: InputMaybe<Scalars['MongoID']['input']>;
  follower_search?: InputMaybe<Scalars['String']['input']>;
};

export type GetUserFriendshipsInput = {
  other?: InputMaybe<Scalars['MongoID']['input']>;
  other_search?: InputMaybe<Scalars['String']['input']>;
  other_wallets?: InputMaybe<Scalars['Boolean']['input']>;
  state?: InputMaybe<UserFriendshipState>;
  type?: InputMaybe<UserFriendshipType>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
  user1?: InputMaybe<Scalars['MongoID']['input']>;
  user2?: InputMaybe<Scalars['MongoID']['input']>;
};

export type GetUserFriendshipsResponse = {
  __typename?: 'GetUserFriendshipsResponse';
  /** The paginated response */
  items: Array<UserFriendship>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type Group = {
  __typename?: 'Group';
  _id: Scalars['MongoID']['output'];
  position: Scalars['Float']['output'];
  sub_title_1?: Maybe<Scalars['String']['output']>;
  sub_title_2?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type Guest = {
  __typename?: 'Guest';
  cancelled_by?: Maybe<Scalars['MongoID']['output']>;
  cancelled_by_expanded?: Maybe<User>;
  declined?: Maybe<Scalars['Boolean']['output']>;
  /** Exists only if invited via email but has not joined to be a user */
  email?: Maybe<Scalars['String']['output']>;
  invitation: Scalars['MongoID']['output'];
  invited_by: Scalars['MongoID']['output'];
  invited_by_expanded?: Maybe<User>;
  joined?: Maybe<Scalars['Boolean']['output']>;
  pending?: Maybe<Scalars['Boolean']['output']>;
  /** Exists only if joined from email */
  user?: Maybe<Scalars['MongoID']['output']>;
  user_expanded?: Maybe<User>;
};

export type GuildRoom = {
  __typename?: 'GuildRoom';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  created_by: Scalars['MongoID']['output'];
  created_by_expanded?: Maybe<User>;
  guild_id: Scalars['Float']['output'];
  guild_role_ids?: Maybe<Array<Scalars['Int']['output']>>;
  guild_role_require_all?: Maybe<Scalars['Boolean']['output']>;
  joins?: Maybe<Scalars['Float']['output']>;
  matrix_room_id: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type GuildRoomInput = {
  guild_id: Scalars['Float']['input'];
  guild_role_ids?: InputMaybe<Array<Scalars['Int']['input']>>;
  guild_role_require_all?: InputMaybe<Scalars['Boolean']['input']>;
  matrix_room_id: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type HostFilter = {
  /** @deprecated Use "hosts" instead. This field will be removed soon. */
  host?: InputMaybe<Scalars['MongoID']['input']>;
  hosts?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  include_cohost_events?: InputMaybe<Scalars['Boolean']['input']>;
  include_owned_events?: InputMaybe<Scalars['Boolean']['input']>;
  include_subevents?: InputMaybe<Scalars['Boolean']['input']>;
};

export type HostnameVerificationInstructions = {
  __typename?: 'HostnameVerificationInstructions';
  challenge_token: Scalars['String']['output'];
  hostname: Scalars['String']['output'];
  txt_record_name: Scalars['String']['output'];
  txt_record_value: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export type HostnameVerificationStatus = {
  __typename?: 'HostnameVerificationStatus';
  challenge_token: Scalars['String']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  hostname: Scalars['String']['output'];
  last_check_error?: Maybe<Scalars['String']['output']>;
  last_checked_at?: Maybe<Scalars['DateTimeISO']['output']>;
  txt_record_name: Scalars['String']['output'];
  txt_record_value: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
  verified_at?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type ImportPoapInput = {
  /** Requested poap amount */
  amount: Scalars['Int']['input'];
  claim_mode: PoapClaimMode;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export enum InvitationResponse {
  Accepted = 'ACCEPTED',
  Cancelled = 'CANCELLED',
  Declined = 'DECLINED',
  Pending = 'PENDING',
  Unsure = 'UNSURE'
}

export enum InvitationState {
  Declined = 'DECLINED'
}

export type InviteEventInput = {
  _id: Scalars['MongoID']['input'];
  custom_body_html?: InputMaybe<Scalars['String']['input']>;
  emails?: InputMaybe<Array<Scalars['String']['input']>>;
  phones?: InputMaybe<Array<Scalars['String']['input']>>;
  users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export type JoinRequestPayment = {
  __typename?: 'JoinRequestPayment';
  _id: Scalars['MongoID']['output'];
  buyer_info?: Maybe<BuyerInfo>;
  ref_data?: Maybe<Scalars['JSON']['output']>;
  state: NewPaymentState;
  transfer_metadata?: Maybe<Scalars['JSON']['output']>;
};

export type JoinRequestStatistic = {
  __typename?: 'JoinRequestStatistic';
  count: Scalars['Float']['output'];
  state: EventJoinRequestState;
};

export type LaunchpadCoin = {
  __typename?: 'LaunchpadCoin';
  /** Id of the coin */
  _id: Scalars['MongoID']['output'];
  /** Contract address of the ERC20 memecoin, if the address is omitted then this is a draft coin */
  address?: Maybe<Scalars['String']['output']>;
  /** The id of the EVM network the ERC20 is deployed to */
  chain_id?: Maybe<Scalars['Float']['output']>;
  /** Description of the ERC20 coin */
  description?: Maybe<Scalars['String']['output']>;
  /** The percentage of coin from 0% to 100% to put in fair launch */
  fair_launch_supply_percent?: Maybe<Scalars['Float']['output']>;
  /** The contract address of the lauchpad group to receive trading fee of the coin */
  fee_split_community?: Maybe<Scalars['String']['output']>;
  /** The percentage of fee from 0% to 100% to reward the owner and community */
  fee_split_percent?: Maybe<Scalars['Float']['output']>;
  /** The contract address of the lauchpad group to receive trading fee of the coin */
  fee_split_recipients?: Maybe<Array<LaunchpadCoinFeeRecipient>>;
  /** Discord handler of the coin marketing page */
  handle_discord?: Maybe<Scalars['String']['output']>;
  /** Farcaster handler of the coin marketing page */
  handle_farcaster?: Maybe<Scalars['String']['output']>;
  /** Telegram handle of the coin marketing page */
  handle_telegram?: Maybe<Scalars['String']['output']>;
  /** Twitter handle of the coin marketing page */
  handle_twitter?: Maybe<Scalars['String']['output']>;
  /** Name of the ERC20 coin */
  name?: Maybe<Scalars['String']['output']>;
  /** Id of the user who is creator of this coin */
  owner: Scalars['MongoID']['output'];
  /** The timestamp in unix seconds that the token launch takes place */
  scheduled_time?: Maybe<Scalars['Float']['output']>;
  /** The initial market cap of the coin in USDC with 6 number of decimals */
  starting_market_cap?: Maybe<Scalars['Float']['output']>;
  /** The symbol of the ERC20 coin, normally written in 3 to 5 uppercase letters */
  ticker?: Maybe<Scalars['String']['output']>;
  /** Website URL of the coin marketing page */
  website?: Maybe<Scalars['String']['output']>;
};

export type LaunchpadCoinFeeRecipient = {
  __typename?: 'LaunchpadCoinFeeRecipient';
  /** The percentage of fee this recipient will receive */
  percent: Scalars['Float']['output'];
  /** The wallet address of the fee recipient */
  wallet: Scalars['String']['output'];
};

export type LaunchpadCoinFeeRecipientInput = {
  /** The percentage of fee this recipient will receive */
  percent: Scalars['Float']['input'];
  /** The wallet address of the fee recipient */
  wallet: Scalars['String']['input'];
};

export type LaunchpadCoinInput = {
  /** Id of the coin */
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  /** Contract address of the ERC20 memecoin, if the address is omitted then this is a draft coin */
  address?: InputMaybe<Scalars['String']['input']>;
  /** The id of the EVM network the ERC20 is deployed to */
  chain_id?: InputMaybe<Scalars['Float']['input']>;
  /** Description of the ERC20 coin */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The percentage of coin from 0% to 100% to put in fair launch */
  fair_launch_supply_percent?: InputMaybe<Scalars['Float']['input']>;
  /** The contract address of the lauchpad group to receive trading fee of the coin */
  fee_split_community?: InputMaybe<Scalars['String']['input']>;
  /** The percentage of fee from 0% to 100% to reward the owner and community */
  fee_split_percent?: InputMaybe<Scalars['Float']['input']>;
  /** The contract address of the lauchpad group to receive trading fee of the coin */
  fee_split_recipients?: InputMaybe<Array<LaunchpadCoinFeeRecipientInput>>;
  /** Discord handler of the coin marketing page */
  handle_discord?: InputMaybe<Scalars['String']['input']>;
  /** Farcaster handler of the coin marketing page */
  handle_farcaster?: InputMaybe<Scalars['String']['input']>;
  /** Telegram handle of the coin marketing page */
  handle_telegram?: InputMaybe<Scalars['String']['input']>;
  /** Twitter handle of the coin marketing page */
  handle_twitter?: InputMaybe<Scalars['String']['input']>;
  /** Name of the ERC20 coin */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The timestamp in unix seconds that the token launch takes place */
  scheduled_time?: InputMaybe<Scalars['Float']['input']>;
  /** The initial market cap of the coin in USDC with 6 number of decimals */
  starting_market_cap?: InputMaybe<Scalars['Float']['input']>;
  /** The symbol of the ERC20 coin, normally written in 3 to 5 uppercase letters */
  ticker?: InputMaybe<Scalars['String']['input']>;
  /** Website URL of the coin marketing page */
  website?: InputMaybe<Scalars['String']['input']>;
};

export type LaunchpadGroup = {
  __typename?: 'LaunchpadGroup';
  /** Contract address of the group */
  address: Scalars['String']['output'];
  chain_id: Scalars['Float']['output'];
  cover_photo?: Maybe<Scalars['MongoID']['output']>;
  cover_photo_expanded?: Maybe<File>;
  /** URL of the cover photo, this can be useful in non login mode */
  cover_photo_url?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  handle_discord?: Maybe<Scalars['String']['output']>;
  handle_farcaster?: Maybe<Scalars['String']['output']>;
  handle_telegram?: Maybe<Scalars['String']['output']>;
  handle_twitter?: Maybe<Scalars['String']['output']>;
  /** Implementation address of the StakingManager contract that used to create the group */
  implementation_address: Scalars['String']['output'];
  /** Name of the group */
  name: Scalars['String']['output'];
  space?: Maybe<Scalars['MongoID']['output']>;
  space_expanded?: Maybe<Space>;
  website?: Maybe<Scalars['String']['output']>;
};

export type LayoutSection = {
  __typename?: 'LayoutSection';
  hidden?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
};

export type LayoutSectionInput = {
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
};

export type LemonheadInvitation = {
  __typename?: 'LemonheadInvitation';
  created_at?: Maybe<Scalars['DateTimeISO']['output']>;
  invitee_wallet?: Maybe<Scalars['String']['output']>;
  minted_at?: Maybe<Scalars['DateTimeISO']['output']>;
  user?: Maybe<LemonheadUserInfo>;
};

export type LemonheadInvitationRank = {
  __typename?: 'LemonheadInvitationRank';
  invitations_count: Scalars['Float']['output'];
  rank: Scalars['Float']['output'];
  user: LemonheadUserInfo;
};

export type LemonheadMintingInfo = {
  __typename?: 'LemonheadMintingInfo';
  can_mint: Scalars['Boolean']['output'];
  inviter?: Maybe<LemonheadUserInfo>;
  price: Scalars['String']['output'];
  token_gated: Scalars['Boolean']['output'];
  white_list_enabled: Scalars['Boolean']['output'];
};

export type LemonheadSponsor = {
  __typename?: 'LemonheadSponsor';
  _id: Scalars['MongoID']['output'];
  image_url: Scalars['String']['output'];
  message: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type LemonheadSponsorDetail = {
  __typename?: 'LemonheadSponsorDetail';
  limit?: Maybe<Scalars['Float']['output']>;
  remaining?: Maybe<Scalars['Float']['output']>;
  sponsor: LemonheadSponsor;
};

export type LemonheadSupportData = {
  __typename?: 'LemonheadSupportData';
  name: Scalars['String']['output'];
  value?: Maybe<Scalars['JSON']['output']>;
};

export enum LemonheadSupportDataType {
  Color = 'color'
}

export type LemonheadUserInfo = {
  __typename?: 'LemonheadUserInfo';
  _id: Scalars['MongoID']['output'];
  company_name?: Maybe<Scalars['String']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  job_title?: Maybe<Scalars['String']['output']>;
  kratos_unicorn_wallet_address?: Maybe<Scalars['String']['output']>;
  kratos_wallet_address?: Maybe<Scalars['String']['output']>;
  lemonhead_inviter_wallet?: Maybe<Scalars['String']['output']>;
  matrix_localpart?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type ListDonationsResponse = {
  __typename?: 'ListDonationsResponse';
  /** The paginated response */
  items: Array<Donation>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListEventFeedbacksResponse = {
  __typename?: 'ListEventFeedbacksResponse';
  /** The paginated response */
  items: Array<EventFeedback>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListEventGuestsResponse = {
  __typename?: 'ListEventGuestsResponse';
  /** The paginated response */
  items: Array<EventGuestDetail>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export enum ListEventGuestsSortBy {
  ApprovalStatus = 'approval_status',
  Email = 'email',
  Name = 'name',
  RegisterTime = 'register_time'
}

export type ListEventHostsResponse = {
  __typename?: 'ListEventHostsResponse';
  hosts: Array<EventHost>;
  total: Scalars['Float']['output'];
};

export type ListEventPaymentsResponse = {
  __typename?: 'ListEventPaymentsResponse';
  records: Array<NewPayment>;
  total: Scalars['Int']['output'];
};

export type ListEventStakePaymentsResponse = {
  __typename?: 'ListEventStakePaymentsResponse';
  /** The paginated response */
  items: Array<EventStakePayment>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListLaunchpadCoinsResponse = {
  __typename?: 'ListLaunchpadCoinsResponse';
  /** The paginated response */
  items: Array<LaunchpadCoin>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListLaunchpadGroupsResponse = {
  __typename?: 'ListLaunchpadGroupsResponse';
  /** The paginated response */
  items: Array<LaunchpadGroup>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListLemonheadSponsorsResponse = {
  __typename?: 'ListLemonheadSponsorsResponse';
  sponsors: Array<LemonheadSponsorDetail>;
};

export type ListMyLemonheadInvitationsResponse = {
  __typename?: 'ListMyLemonheadInvitationsResponse';
  invitations: Array<LemonheadInvitation>;
};

export type ListSpaceMembersResponse = {
  __typename?: 'ListSpaceMembersResponse';
  /** The paginated response */
  items: Array<SpaceMember>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListSpaceNfTsResponse = {
  __typename?: 'ListSpaceNFTsResponse';
  /** The paginated response */
  items: Array<SpaceNft>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListSpacePaymentAccountsResponse = {
  __typename?: 'ListSpacePaymentAccountsResponse';
  /** The paginated response */
  items: Array<NewPaymentAccount>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type ListSpaceRoleFeaturesResponse = {
  __typename?: 'ListSpaceRoleFeaturesResponse';
  codes: Array<FeatureCode>;
  features: Array<Feature>;
};

export type ListSpaceTokenRewardClaimsSortInput = {
  claim_date?: InputMaybe<Scalars['Int']['input']>;
};

export type LockResult = {
  __typename?: 'LockResult';
  locked_at?: Maybe<Scalars['DateTimeISO']['output']>;
  locked_by?: Maybe<Scalars['MongoID']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type ManageEventCohostRequestsInput = {
  decision: Scalars['Boolean']['input'];
  /** @deprecated Use `to_email` instead */
  emails?: InputMaybe<Array<Scalars['String']['input']>>;
  event: Scalars['MongoID']['input'];
  event_role?: InputMaybe<EventRole>;
  profile_image_avatar?: InputMaybe<Scalars['String']['input']>;
  profile_name?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['MongoID']['input']>;
  to_email?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated Use to instead */
  users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  visible?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ModelUsageBreakdown = {
  __typename?: 'ModelUsageBreakdown';
  credits: Scalars['Float']['output'];
  model: Scalars['String']['output'];
  percentage: Scalars['Float']['output'];
  requests: Scalars['Int']['output'];
  tier: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** [ai-tool] Accept an event invitation or RSVP yes. Use when someone says they want to attend. */
  acceptEvent: EventRsvp;
  /** Accept event terms and conditions */
  acceptEventTerms: Scalars['Boolean']['output'];
  acceptUserDiscovery: AcceptUserDiscoveryResponse;
  acquireConfigLock: LockResult;
  /** Activate a personal community space */
  activatePersonalSpace: ActivatePersonalSpace;
  addLaunchpadCoin: LaunchpadCoin;
  addLaunchpadGroup: LaunchpadGroup;
  addSpaceAsset: Scalars['Boolean']['output'];
  /** [ai-tool] Add someone to your community by email. Use when someone asks to invite a person to their space. */
  addSpaceMembers: Scalars['Boolean']['output'];
  /** @deprecated Use registerDeviceToken instead */
  addUserFcmToken: Scalars['Boolean']['output'];
  adminAirdropAllUsernames: Scalars['String']['output'];
  adminAirdropUsername: Scalars['String']['output'];
  adminApproveEvent: AdminActionResult;
  adminApproveEvents: AdminActionResult;
  adminAutoAssignTickets: AdminActionResult;
  adminBulkAirdropUsernames: Scalars['String']['output'];
  adminBulkDeleteEvents: AdminActionResult;
  adminBulkDeleteStores: AdminActionResult;
  adminBulkDeleteUsers: AdminActionResult;
  adminCancelEvent: AdminActionResult;
  adminCancelEvents: AdminActionResult;
  adminCheckPassportWallet: Scalars['String']['output'];
  adminCreateChain: AdminRecordResult;
  adminCreateDashboard: AdminRecordResult;
  adminCreateEvent: AdminRecordResult;
  adminCreateFile: Scalars['String']['output'];
  adminCreateGeoCity: AdminRecordResult;
  adminCreateGeoCityWithSync: AdminRecordResult;
  adminCreateGeoRegion: AdminRecordResult;
  adminCreateGeoRegionWithSync: AdminRecordResult;
  adminCreateJob: AdminRecordResult;
  adminCreateLemonheadWhitelist: AdminRecordResult;
  adminCreateMatrixAccount: AdminActionResult;
  adminCreateMusicNft: AdminActionResult;
  adminCreatePassportWhitelist: AdminRecordResult;
  adminCreatePayment: AdminRecordResult;
  adminCreateSite: AdminRecordResult;
  adminCreateSpace: AdminRecordResult;
  adminCreateSpaceCategory: AdminActionResult;
  adminCreateSpaceVerification: AdminRecordResult;
  adminCreateStore: AdminRecordResult;
  adminCreateSystemImage: Scalars['String']['output'];
  adminCreateTicket: AdminRecordResult;
  adminCreateTicketForEvent: AdminActionResult;
  adminCreateUploadFolder: AdminRecordResult;
  adminCreateUploadFolderPresignedUrl: UploadFolderPresignedUrlResult;
  adminCreateUser: AdminRecordResult;
  adminCreateUsernameReservation: AdminRecordResult;
  adminDecideSpaceVerification: AdminActionResult;
  adminDeleteChain: AdminActionResult;
  adminDeleteDashboard: AdminActionResult;
  adminDeleteEvent: AdminActionResult;
  adminDeleteGeoCity: AdminActionResult;
  adminDeleteGeoRegion: AdminActionResult;
  adminDeleteIcebreakerQuestion: AdminActionResult;
  adminDeleteJob: AdminActionResult;
  adminDeleteLemonheadWhitelist: AdminActionResult;
  adminDeletePassportWhitelist: AdminActionResult;
  adminDeletePayment: AdminActionResult;
  adminDeleteSite: AdminActionResult;
  adminDeleteSpace: AdminActionResult;
  adminDeleteSpaceVerification: AdminActionResult;
  adminDeleteStore: AdminActionResult;
  adminDeleteStoreCategory: AdminActionResult;
  adminDeleteStoreProduct: AdminActionResult;
  adminDeleteTicket: AdminActionResult;
  adminDeleteUploadFolder: AdminActionResult;
  adminDeleteUploadFolderFile: Scalars['JSON']['output'];
  adminDeleteUploadFolderWithFiles: Scalars['JSON']['output'];
  adminDeleteUser: AdminActionResult;
  adminDeleteUsernameReservation: AdminActionResult;
  adminDeployMusicNft: AdminActionResult;
  adminExecuteDashboardSQL: Scalars['JSON']['output'];
  adminExportAcceptedTickets: AdminExportResult;
  adminExportCheckins: AdminExportResult;
  adminExportEventPayments: AdminExportResult;
  adminExportPayments: AdminExportResult;
  adminExportStoreOrders: AdminExportResult;
  adminExportTickets: AdminExportResult;
  adminExportUsers: AdminExportResult;
  adminFlushChain: AdminActionResult;
  adminImportLemonheadFreelist: AdminActionResult;
  adminImportLemonheadWhitelist: AdminActionResult;
  adminImportPassportFreelist: Scalars['String']['output'];
  adminImportPassportWhitelist: Scalars['String']['output'];
  adminImportUsernameReservations: AdminActionResult;
  adminManualRsvp: AdminActionResult;
  adminRecoverUser: AdminActionResult;
  adminRetriggerPaymentVerify: AdminActionResult;
  adminRevokeUserRole: AdminActionResult;
  adminRunJob: AdminActionResult;
  adminSendBulkNotification: AdminActionResult;
  adminSendNotification: AdminActionResult;
  adminSetByokMinTier: AdminActionResult;
  adminSyncGeoRegionEvents: AdminActionResult;
  adminSyncIdentity: AdminActionResult;
  adminSyncSpaceAtProtocol: AdminActionResult;
  adminSyncUsernamesFromLens: Scalars['String']['output'];
  adminTransferEvent: AdminActionResult;
  adminTriggerUserMigration: AdminActionResult;
  adminUpdateChain: AdminRecordResult;
  adminUpdateDashboard: AdminRecordResult;
  adminUpdateEvent: AdminRecordResult;
  adminUpdateEventVoting: AdminActionResult;
  adminUpdateGeoCity: AdminRecordResult;
  adminUpdateGeoRegion: AdminRecordResult;
  adminUpdateJob: AdminRecordResult;
  adminUpdateLemonheadLayer: AdminActionResult;
  adminUpdateLemonheadWhitelist: AdminRecordResult;
  adminUpdateModelConfig: AdminActionResult;
  adminUpdatePassportWhitelist: AdminRecordResult;
  adminUpdatePayment: AdminRecordResult;
  adminUpdateSite: AdminRecordResult;
  adminUpdateSpace: AdminRecordResult;
  adminUpdateSpaceVerification: AdminRecordResult;
  adminUpdateStore: AdminRecordResult;
  adminUpdateTicket: AdminRecordResult;
  adminUpdateUploadFolder: AdminRecordResult;
  adminUpdateUser: AdminRecordResult;
  adminUpdateUserRole: AdminActionResult;
  adminUpdateUsernameReservation: AdminRecordResult;
  adminUploadLemonheadLayers: AdminActionResult;
  adminVerifyPayment: AdminActionResult;
  adminVerifyPaymentBulk: AdminActionResult;
  /** [ai-tool] Publish an event, making it visible and triggering rewards and notifications. Use when someone explicitly asks to publish their event. */
  aiPublishEvent: AiEvent;
  /** [ai-tool] Mark notifications as read — a specific one or all at once. Use after someone has reviewed their notifications. */
  aiReadNotifications: Scalars['Boolean']['output'];
  applyTemplateUpdate: PageConfig;
  archivePageConfig: PageConfig;
  archiveTemplate: Template;
  /** [ai-tool] Assign tickets to users */
  assignTickets: Scalars['Boolean']['output'];
  attachSpacePaymentAccount: Scalars['Boolean']['output'];
  /** Attach sub-communities to a parent */
  attachSubSpaces: Scalars['Boolean']['output'];
  /** [ai-tool] Purchase tickets for an event. Free tickets are issued immediately. Paid ticket support coming soon. Use when someone explicitly asks to buy. */
  buyTickets: BuyTicketsResponse;
  /** [ai-tool] Cancel and archive an event. The event will no longer be visible. Use only when someone explicitly asks to cancel. */
  cancelEvent: Event;
  cancelEventInvitations: Scalars['Boolean']['output'];
  /** Cancel your own ticket */
  cancelMyTicket: Scalars['Boolean']['output'];
  /**
   * Cancel a payment (deprecated)
   * @deprecated Payment cancelling is already handled by backend
   */
  cancelPayment: Scalars['Boolean']['output'];
  cancelSpaceSubscription: Scalars['Boolean']['output'];
  cancelSubscription: CancelSubscriptionResult;
  /** Cancel tickets for an event */
  cancelTickets: Scalars['Boolean']['output'];
  castVote: Scalars['Boolean']['output'];
  changeXMTPPIN: XmtpPinChangeResponse;
  /** [ai-tool] Check in a user to an event */
  checkinUser: EventRsvp;
  claimPoap: Scalars['Boolean']['output'];
  cloneEvent: Array<Scalars['MongoID']['output']>;
  cloneTemplateToConfig: PageConfig;
  configureConnection: ConnectionOutput;
  confirmDeviceLink: DeviceLinkConfirmResponse;
  confirmFileUploads: Scalars['Boolean']['output'];
  connectPlatform: ConnectPlatformResult;
  createApiKey: CreateApiKeyResponse;
  createBadge: Badge;
  createBadgeList: BadgeList;
  createCast: Scalars['Boolean']['output'];
  createCastReaction: Scalars['Boolean']['output'];
  createCheckinTokenRewardSetting: CheckinTokenRewardSetting;
  createComment: Comment;
  createCryptoSubscription: CryptoSubscriptionPaymentInfo;
  createDonation: Donation;
  createDonationVault: DonationVault;
  /** [ai-tool] Create a new event in unpublished state. Parse the input from user message and data without asking for more info. If the event title is not specified, use Untitled for title. */
  createEvent: Event;
  createEventCast: Scalars['Boolean']['output'];
  createEventEmailSetting?: Maybe<EmailSetting>;
  createEventFromEventbrite: Event;
  createEventQuestion: EventQuestion;
  createEventSessionReservation: Scalars['Boolean']['output'];
  createEventStory: Scalars['Boolean']['output'];
  createEventTicketCategory: EventTicketCategory;
  /** [ai-tool] Create a promo code or discount for event tickets — percentage with optional use limit. Use when someone wants a discount code. */
  createEventTicketDiscounts: Event;
  /** [ai-tool] Create a new ticket type for an event — set name, price, quantity, and options. Use when someone wants to add a ticket tier. */
  createEventTicketType: EventTicketType;
  createEventTokenGate: EventTokenGate;
  createEventbriteWebhookForEvent: Scalars['Boolean']['output'];
  createFarcasterAccountKey: CreateFarcasterAccountKeyResponse;
  createFile: File;
  createFileUploads: Array<FileWithPresignedUrl>;
  createGuildRoom: GuildRoom;
  /** [ai-tool] Create a payment account */
  createNewPaymentAccount: NewPaymentAccount;
  createOauth2Client: OAuth2Client;
  createPageConfig: PageConfig;
  createPoapDrop: PoapDrop;
  createPost: Post;
  createPreviewLink: PreviewLink;
  createRegistration: Scalars['Boolean']['output'];
  createRewardVault: TokenRewardVault;
  createSelfVerificationRequest: UserSelfRequest;
  createSite: Site;
  /** [ai-tool] Create a new community. Use when someone wants to start a new community or organization. */
  createSpace: Space;
  createSpaceNewsletter: EmailSetting;
  createSpaceSubscription: SubscriptionResponse;
  createSpaceTokenGate: SpaceTokenGate;
  createSpaceVerificationSubmission?: Maybe<SpaceVerificationSubmission>;
  createStore: Store;
  createStoreBucketItem: StoreBucketItem;
  createStoreCategory: StoreCategory;
  createStoreOrder: StoreOrder;
  createStoreProduct: StoreProduct;
  createStoreProductVariant: StoreProductVariant;
  createStorePromotion: StorePromotion;
  createStripeCard: StripeCard;
  createStripeOnrampSession: StripeOnrampSession;
  createTemplate: Template;
  createTicketTokenRewardSetting: TicketTokenRewardSetting;
  /** [ai-tool] Create tickets for attendees */
  createTickets: Array<Ticket>;
  createUserExpertise: UserExpertise;
  createUserFollow: Scalars['Boolean']['output'];
  createUserFriendship: UserFriendship;
  createUserService: UserServiceOffer;
  /** @deprecated Cohosts are now added directly. This mutation is a no-op kept for client compatibility. */
  decideEventCohostRequest: Scalars['Boolean']['output'];
  decideSpaceEventRequests: Scalars['Boolean']['output'];
  /** [ai-tool] Approve or decline pending join requests for your event. Can target specific requests or all pending. Use when someone asks to manage event access. */
  decideUserJoinRequests: Array<DecidedJoinRequest>;
  /** [ai-tool] Decline an event invitation with an optional message to the host. Use when someone says they cannot attend. */
  declineEvent: EventRsvp;
  declineUserDiscovery: Scalars['Boolean']['output'];
  deleteBadge: Scalars['Boolean']['output'];
  deleteBadgeList: Scalars['Boolean']['output'];
  deleteCastReaction: Scalars['Boolean']['output'];
  deleteComment: Scalars['Boolean']['output'];
  /** [ai-tool] Delete application questions for an event */
  deleteEventApplicationQuestions: Scalars['Boolean']['output'];
  deleteEventEmailSetting: Scalars['Boolean']['output'];
  deleteEventQuestion: Scalars['Boolean']['output'];
  deleteEventSessionReservation: Scalars['Boolean']['output'];
  deleteEventStory: Scalars['Boolean']['output'];
  deleteEventTicketCategory: Scalars['Boolean']['output'];
  /** [ai-tool] Delete ticket discounts */
  deleteEventTicketDiscounts: Event;
  /** [ai-tool] Delete a ticket type */
  deleteEventTicketType: Scalars['Boolean']['output'];
  deleteEventTokenGate: Scalars['Boolean']['output'];
  deleteGuildRoom: Scalars['Boolean']['output'];
  deleteNotificationChannelPreference: Scalars['Boolean']['output'];
  deleteNotificationFilter: Scalars['Boolean']['output'];
  deleteNotifications: Scalars['Boolean']['output'];
  deleteOauth2Client: Scalars['Boolean']['output'];
  deletePost: Scalars['Boolean']['output'];
  deletePreviewLink: Scalars['Boolean']['output'];
  deleteSite: Scalars['Boolean']['output'];
  /** Delete a community */
  deleteSpace: Scalars['Boolean']['output'];
  deleteSpaceAsset: Scalars['Boolean']['output'];
  /** [ai-tool] Remove someone from your community. Use when someone asks to remove a member. */
  deleteSpaceMembers: Array<SpaceMember>;
  deleteSpaceNewsletter: Scalars['Boolean']['output'];
  deleteSpaceTag: Scalars['Boolean']['output'];
  deleteSpaceTokenGate: Scalars['Boolean']['output'];
  deleteStore: Scalars['Boolean']['output'];
  deleteStoreBucketItem: Scalars['Boolean']['output'];
  deleteStoreCategory: Scalars['Boolean']['output'];
  deleteStoreProduct: Scalars['Boolean']['output'];
  deleteStoreProductVariant: Scalars['Boolean']['output'];
  deleteStorePromotion: Scalars['Boolean']['output'];
  deleteStripeCard: StripeCard;
  deleteUser: Scalars['Boolean']['output'];
  deleteUserDiscoverySwipe: Scalars['Boolean']['output'];
  deleteUserFollow: Scalars['Boolean']['output'];
  deleteUserFriendship: Scalars['Boolean']['output'];
  deleteXMTPActivation: Scalars['Boolean']['output'];
  deleteXMTPAddress: Scalars['Boolean']['output'];
  detachSpacePaymentAccount: Scalars['Boolean']['output'];
  disconnectPlatform: DisconnectResult;
  disconnectStripeAccount: Scalars['Boolean']['output'];
  executeConnectorAction: ConnectorActionResult;
  featureTemplate: Template;
  flagEvent: Scalars['Boolean']['output'];
  flagPost: Scalars['Boolean']['output'];
  flagUser: Scalars['Boolean']['output'];
  /** Follow a community */
  followSpace: Scalars['Boolean']['output'];
  generateCubejsToken: Scalars['String']['output'];
  generateDeviceLinkToken: DeviceLinkTokenResponse;
  generateMatrixToken: Scalars['String']['output'];
  generateStripeAccountLink: GenerateStripeAccountLinkResponse;
  heartbeatConfigLock: Scalars['Boolean']['output'];
  importPoapDrop: PoapDrop;
  insertSpaceTag: SpaceTag;
  /** [ai-tool] Send event invitations to users by email. Use when someone wants to invite people to their event. */
  inviteEvent: Event;
  inviteUserContacts: Scalars['Boolean']['output'];
  joinGuildRoom: Scalars['Boolean']['output'];
  mailEventTicket: Scalars['Boolean']['output'];
  mailTicketPaymentReceipt: Scalars['Boolean']['output'];
  manageEventCohostRequests: Scalars['Boolean']['output'];
  manageSpaceTag: Scalars['Boolean']['output'];
  /** [ai-tool] Pin events to a community */
  pinEventsToSpace: PinEventsToSpaceResponse;
  publishPageConfig: PageConfig;
  publishTemplate: Template;
  publishTemplateUpdate: Template;
  purchaseCredits: CheckoutResult;
  purchaseSubscription: CheckoutResult;
  readAllNotifications: Scalars['Int']['output'];
  readNotifications: Scalars['Boolean']['output'];
  /** Redeem tickets with a code */
  redeemTickets: RedeemTicketsResponse;
  registerDeviceToken: Scalars['Boolean']['output'];
  registerXMTPActivation: XmtpActivationInfoResponse;
  registerXMTPAddress: Scalars['Boolean']['output'];
  releaseConfigLock: Scalars['Boolean']['output'];
  /** Remove sub-communities from a parent */
  removeSubSpaces: Scalars['Boolean']['output'];
  /** @deprecated Use unregisterDeviceToken instead */
  removeUserFcmToken: Scalars['Boolean']['output'];
  renewCryptoSubscription: CryptoSubscriptionPaymentInfo;
  reorderTicketTypeCategories: Scalars['Boolean']['output'];
  /** Reorder ticket types for an event */
  reorderTicketTypes: Scalars['Boolean']['output'];
  reportUser: Scalars['Boolean']['output'];
  /** Request the DNS-TXT ownership challenge for a custom hostname on a community. Returns the TXT record name + value the tenant must publish. */
  requestHostnameVerification: HostnameVerificationInstructions;
  requestStepUpVerification: Scalars['Boolean']['output'];
  requestXMTPRecovery: XmtpRecoveryResponse;
  respondInvitation: Scalars['Boolean']['output'];
  /** @deprecated Use the `respondInvitation` instead. This function will be removed in the next release. */
  responseInvitation: Scalars['Boolean']['output'];
  restoreConfigVersion: PageConfig;
  retryPoapDropCheck: Scalars['Boolean']['output'];
  reviewTemplate: Template;
  revokeAllOtherSessions: Scalars['Int']['output'];
  revokeApiKey: ApiKeyBase;
  revokeCurrentSession: Scalars['Boolean']['output'];
  revokeFarcasterAccountKey: Scalars['Boolean']['output'];
  revokeMySession: Scalars['Boolean']['output'];
  revokeOauth2: Scalars['String']['output'];
  revokeTwitter: Scalars['String']['output'];
  rewindUserDiscovery: RewindUserDiscoveryResponse;
  rotateApiKey: RotateApiKeyResponse;
  saveConfigAsTemplate: Template;
  saveConfigVersion: ConfigVersion;
  sendEventEmailSettingTestEmails: Scalars['Boolean']['output'];
  sendSpaceNewsletterTestEmails: Scalars['Boolean']['output'];
  setDefaultLensProfile: Scalars['Boolean']['output'];
  setNotificationChannelPreference: NotificationChannelPreference;
  setNotificationFilter: NotificationFilter;
  setPreferredModel?: Maybe<AvailableModel>;
  setSpaceDefaultModel: AvailableModel;
  setTemplateTier: Template;
  setUserWallet: Scalars['Boolean']['output'];
  submitApiKey: ConnectionOutput;
  /** Submit application answers for an event */
  submitEventApplicationAnswers: Scalars['Boolean']['output'];
  /** [ai-tool] Set application questions for an event */
  submitEventApplicationQuestions: Array<EventApplicationQuestion>;
  /** Submit feedback for an event */
  submitEventFeedback: Scalars['Boolean']['output'];
  syncEventAttestation: Scalars['Boolean']['output'];
  syncFarcasterConnectionStatus: SyncFarcasterConnectionStatusResponse;
  syncSpaceTokenGateAccess: SyncSpaceTokenGateAccessResponse;
  syncUserUnicornWallet: Scalars['Boolean']['output'];
  tgSendCode: Scalars['String']['output'];
  tgUnlinkAccount: Scalars['Boolean']['output'];
  tgVerify: Scalars['Boolean']['output'];
  toggleBlockUser: Scalars['Boolean']['output'];
  toggleEventEmailSettings: Scalars['Boolean']['output'];
  toggleEventQuestionLike: Scalars['Boolean']['output'];
  toggleFileLike: File;
  toggleReaction: Scalars['Boolean']['output'];
  /**
   * Unfollow a community (deprecated)
   * @deprecated Use unsubscribeSpace instead
   */
  unfollowSpace: Scalars['Boolean']['output'];
  /** [ai-tool] Unpin events from a community */
  unpinEventsFromSpace: Scalars['Boolean']['output'];
  unregisterDeviceToken: Scalars['Boolean']['output'];
  /** Unsubscribe from a community */
  unsubscribeSpace: Scalars['Boolean']['output'];
  updateApiKey: ApiKeyBase;
  updateBadge: Badge;
  updateBadgeList: BadgeList;
  updateCheckinTokenRewardSetting: CheckinTokenRewardSetting;
  updateDonation: Scalars['Boolean']['output'];
  updateDonationVault?: Maybe<DonationVault>;
  /** [ai-tool] Update an event the user has admin permissions for — title, description, dates, location, and more. Use when someone wants to edit event details. */
  updateEvent: Event;
  /**
   * [ai-tool] Check in a single attendee (deprecated)
   * @deprecated
   * prefer using updateEventCheckins instead,
   * this mutation will be removed after this new checkin apis,
   * after making sure FE/mobile has no longer using this mutation anymore
   *
   */
  updateEventCheckin: EventCheckin;
  /** [ai-tool] Check in attendees */
  updateEventCheckins: Array<EventCheckin>;
  updateEventEmailSetting: EmailSetting;
  updateEventRewardUse: Scalars['Boolean']['output'];
  updateEventTicketCategory: Scalars['Boolean']['output'];
  /** [ai-tool] Update ticket discounts */
  updateEventTicketDiscount: Event;
  /** [ai-tool] Update an existing ticket type — change name, price, quantity, or settings. Use when someone wants to modify ticket options. */
  updateEventTicketType: EventTicketType;
  updateEventTokenGate: EventTokenGate;
  updateFile: File;
  updateLaunchpadCoin?: Maybe<LaunchpadCoin>;
  updateMyLemonheadInvitations: UpdateMyLemonheadInvitationsResponse;
  /** [ai-tool] Update a payment account */
  updateNewPaymentAccount: NewPaymentAccount;
  updateOauth2Client: OAuth2Client;
  updatePageConfig: PageConfig;
  /** [ai-tool] Update a payment */
  updatePayment: NewPayment;
  updatePoapDrop: PoapDrop;
  updatePost: Post;
  updateRewardVault?: Maybe<TokenRewardVault>;
  updateSite?: Maybe<Site>;
  /** [ai-tool] Update a community the user has admin permissions for — name, description, and settings. Use when someone wants to edit community details. */
  updateSpace?: Maybe<Space>;
  /**
   * [ai-tool] Update a community member (deprecated)
   * @deprecated This logic may not behave as expected. Use addSpaceMembers instead.
   */
  updateSpaceMember?: Maybe<SpaceMember>;
  updateSpaceNewsletter: EmailSetting;
  updateSpaceRoleFeatures: Scalars['Boolean']['output'];
  updateSpaceSubscription: SubscriptionResponse;
  updateSpaceTokenGate: SpaceTokenGate;
  updateStore: Store;
  updateStoreBucketItem?: Maybe<StoreBucketItem>;
  updateStoreCategory: StoreCategory;
  updateStoreOrder: StoreOrder;
  updateStoreProduct: StoreProduct;
  updateStoreProductVariant: StoreProductVariant;
  updateStripeConnectedAccountCapability: StripeAccountCapability;
  /** Reorder sub-communities */
  updateSubSpaceOrder: Scalars['Boolean']['output'];
  updateTemplate: Template;
  updateTicketTokenRewardSetting: TicketTokenRewardSetting;
  updateTokenRewardClaim: Scalars['Boolean']['output'];
  updateUser: User;
  /** [ai-tool] Upgrade a ticket type */
  upgradeTicket: Scalars['Boolean']['output'];
  /** Run the DNS-TXT ownership check for a custom hostname. Flips `verified` to true on success. */
  verifyHostname: HostnameVerificationStatus;
  verifyStepUpVerification: Scalars['String']['output'];
};


export type MutationAcceptEventArgs = {
  _id: Scalars['MongoID']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAcceptEventTermsArgs = {
  input: AcceptEventTermsInput;
};


export type MutationAcceptUserDiscoveryArgs = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  swipee: Scalars['MongoID']['input'];
};


export type MutationAcquireConfigLockArgs = {
  config_id: Scalars['MongoID']['input'];
};


export type MutationActivatePersonalSpaceArgs = {
  input: SpaceInput;
};


export type MutationAddLaunchpadCoinArgs = {
  input: LaunchpadCoinInput;
};


export type MutationAddLaunchpadGroupArgs = {
  input: AddLaunchpadGroupInput;
};


export type MutationAddSpaceAssetArgs = {
  file_id: Scalars['MongoID']['input'];
  space_id: Scalars['MongoID']['input'];
};


export type MutationAddSpaceMembersArgs = {
  input: AddSpaceMemberInput;
};


export type MutationAddUserFcmTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationAdminAirdropUsernameArgs = {
  reservation_id: Scalars['String']['input'];
};


export type MutationAdminApproveEventArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminApproveEventsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminAutoAssignTicketsArgs = {
  input?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationAdminBulkAirdropUsernamesArgs = {
  reservation_ids: Array<Scalars['String']['input']>;
};


export type MutationAdminBulkDeleteEventsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminBulkDeleteStoresArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminBulkDeleteUsersArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCancelEventArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCancelEventsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCheckPassportWalletArgs = {
  provider: Scalars['String']['input'];
  wallet_address: Scalars['String']['input'];
};


export type MutationAdminCreateChainArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateDashboardArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateEventArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateFileArgs = {
  data: Scalars['String']['input'];
  directory: Scalars['String']['input'];
  owner: Scalars['String']['input'];
};


export type MutationAdminCreateGeoCityArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateGeoCityWithSyncArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateGeoRegionArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateGeoRegionWithSyncArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateJobArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateLemonheadWhitelistArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateMatrixAccountArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateMusicNftArgs = {
  content_data: Scalars['String']['input'];
  contract_owner_address: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  image_data: Scalars['String']['input'];
  name: Scalars['String']['input'];
  revenue_beneficiary_address: Scalars['String']['input'];
  royalty_basis_points: Scalars['Float']['input'];
  space_id: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
  token_limit: Scalars['Float']['input'];
  token_limit_per: Scalars['Float']['input'];
};


export type MutationAdminCreatePassportWhitelistArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreatePaymentArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateSiteArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateSpaceArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateSpaceCategoryArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateSpaceVerificationArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateStoreArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateSystemImageArgs = {
  category: Scalars['String']['input'];
  data: Scalars['String']['input'];
  name: Scalars['String']['input'];
  webp?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationAdminCreateTicketArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateTicketForEventArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateUploadFolderArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateUploadFolderPresignedUrlArgs = {
  content_type: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  folder_id: Scalars['String']['input'];
};


export type MutationAdminCreateUserArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminCreateUsernameReservationArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminDecideSpaceVerificationArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminDeleteChainArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteDashboardArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteEventArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteGeoCityArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteGeoRegionArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteIcebreakerQuestionArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminDeleteJobArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteLemonheadWhitelistArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeletePassportWhitelistArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeletePaymentArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteSiteArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteSpaceArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteSpaceVerificationArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteStoreArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteStoreCategoryArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminDeleteStoreProductArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminDeleteTicketArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteUploadFolderArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteUploadFolderFileArgs = {
  folder_id: Scalars['String']['input'];
  key: Scalars['String']['input'];
};


export type MutationAdminDeleteUploadFolderWithFilesArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteUserArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeleteUsernameReservationArgs = {
  _id: Scalars['String']['input'];
};


export type MutationAdminDeployMusicNftArgs = {
  chain_id: Scalars['String']['input'];
  currency_address?: InputMaybe<Scalars['String']['input']>;
  mint_price?: InputMaybe<Scalars['Float']['input']>;
  nft_id: Scalars['String']['input'];
};


export type MutationAdminExecuteDashboardSqlArgs = {
  params?: InputMaybe<Scalars['JSON']['input']>;
  schema?: InputMaybe<Scalars['String']['input']>;
  sql: Scalars['String']['input'];
};


export type MutationAdminExportAcceptedTicketsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminExportCheckinsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminExportEventPaymentsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminExportPaymentsArgs = {
  input?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationAdminExportStoreOrdersArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminExportTicketsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminExportUsersArgs = {
  input?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationAdminFlushChainArgs = {
  input?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationAdminImportLemonheadFreelistArgs = {
  freelist_data: Scalars['String']['input'];
  sponsor_id: Scalars['String']['input'];
};


export type MutationAdminImportLemonheadWhitelistArgs = {
  whitelist_data: Scalars['String']['input'];
};


export type MutationAdminImportPassportFreelistArgs = {
  csv_data: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  separator?: InputMaybe<Scalars['String']['input']>;
  sponsor_id: Scalars['String']['input'];
};


export type MutationAdminImportPassportWhitelistArgs = {
  csv_data: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  separator?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAdminImportUsernameReservationsArgs = {
  reservations_data: Scalars['String']['input'];
};


export type MutationAdminManualRsvpArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminRecoverUserArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminRetriggerPaymentVerifyArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminRevokeUserRoleArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminRunJobArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminSendBulkNotificationArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminSendNotificationArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminSetByokMinTierArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminSyncGeoRegionEventsArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminSyncIdentityArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminSyncSpaceAtProtocolArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminTransferEventArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminTriggerUserMigrationArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateChainArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateDashboardArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateEventArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateEventVotingArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateGeoCityArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateGeoRegionArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateJobArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateLemonheadLayerArgs = {
  layer_id: Scalars['String']['input'];
  photo_data: Scalars['String']['input'];
};


export type MutationAdminUpdateLemonheadWhitelistArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateModelConfigArgs = {
  input: Scalars['JSON']['input'];
  modelId: Scalars['String']['input'];
};


export type MutationAdminUpdatePassportWhitelistArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdatePaymentArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateSiteArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateSpaceArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateSpaceVerificationArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateStoreArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateTicketArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateUploadFolderArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateUserArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateUserRoleArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminUpdateUsernameReservationArgs = {
  _id: Scalars['String']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationAdminUploadLemonheadLayersArgs = {
  layers_data: Scalars['String']['input'];
};


export type MutationAdminVerifyPaymentArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAdminVerifyPaymentBulkArgs = {
  input: Scalars['JSON']['input'];
};


export type MutationAiPublishEventArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationAiReadNotificationsArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type MutationApplyTemplateUpdateArgs = {
  config_id: Scalars['MongoID']['input'];
};


export type MutationArchivePageConfigArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationArchiveTemplateArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationAssignTicketsArgs = {
  input: AssignTicketsInput;
};


export type MutationAttachSpacePaymentAccountArgs = {
  payment_account: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type MutationAttachSubSpacesArgs = {
  _id: Scalars['MongoID']['input'];
  sub_spaces: Array<Scalars['String']['input']>;
};


export type MutationBuyTicketsArgs = {
  input: BuyTicketsInput;
};


export type MutationCancelEventArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationCancelEventInvitationsArgs = {
  input: CancelEventInvitationsInput;
};


export type MutationCancelMyTicketArgs = {
  input: CancelMyTicketInput;
};


export type MutationCancelPaymentArgs = {
  input: CancelPaymentInput;
};


export type MutationCancelSpaceSubscriptionArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type MutationCancelSubscriptionArgs = {
  input: CancelSubscriptionInput;
};


export type MutationCancelTicketsArgs = {
  input: CancelTicketsInput;
};


export type MutationCastVoteArgs = {
  input: CastVoteInput;
};


export type MutationChangeXmtppinArgs = {
  currentPinHash: Scalars['String']['input'];
  input: XmtpActivationInput;
};


export type MutationCheckinUserArgs = {
  event: Scalars['MongoID']['input'];
  user: Scalars['MongoID']['input'];
};


export type MutationClaimPoapArgs = {
  drop: Scalars['MongoID']['input'];
  wallet: Scalars['String']['input'];
};


export type MutationCloneEventArgs = {
  input: CloneEventInput;
};


export type MutationCloneTemplateToConfigArgs = {
  owner_id: Scalars['MongoID']['input'];
  owner_type: Scalars['String']['input'];
  template_id: Scalars['MongoID']['input'];
};


export type MutationConfigureConnectionArgs = {
  input: ConfigureConnectionInput;
};


export type MutationConfirmDeviceLinkArgs = {
  token: Scalars['String']['input'];
};


export type MutationConfirmFileUploadsArgs = {
  ids: Array<Scalars['MongoID']['input']>;
};


export type MutationConnectPlatformArgs = {
  input: ConnectPlatformInput;
};


export type MutationCreateApiKeyArgs = {
  input: CreateApiKeyInput;
};


export type MutationCreateBadgeArgs = {
  input: CreateBadgeInput;
};


export type MutationCreateBadgeListArgs = {
  input: CreateBadgeListInput;
};


export type MutationCreateCastArgs = {
  embeds?: InputMaybe<Array<Scalars['String']['input']>>;
  mentions?: InputMaybe<Array<Scalars['Int']['input']>>;
  mentionsPositions?: InputMaybe<Array<Scalars['Int']['input']>>;
  parent_cast?: InputMaybe<ParentCastInput>;
  parent_url?: InputMaybe<Scalars['String']['input']>;
  text: Scalars['String']['input'];
};


export type MutationCreateCastReactionArgs = {
  target_cast_id?: InputMaybe<ParentCastInput>;
  target_url?: InputMaybe<Scalars['String']['input']>;
  type: ReactionType;
};


export type MutationCreateCheckinTokenRewardSettingArgs = {
  input: CheckinTokenRewardSettingInput;
};


export type MutationCreateCommentArgs = {
  input: CommentInput;
};


export type MutationCreateCryptoSubscriptionArgs = {
  input: CreateCryptoSubscriptionInput;
};


export type MutationCreateDonationArgs = {
  input: CreateDonationInput;
};


export type MutationCreateDonationVaultArgs = {
  input: DonationVaultInput;
};


export type MutationCreateEventArgs = {
  input: EventInput;
};


export type MutationCreateEventCastArgs = {
  event: Scalars['MongoID']['input'];
};


export type MutationCreateEventEmailSettingArgs = {
  input: CreateEventEmailSettingInput;
};


export type MutationCreateEventFromEventbriteArgs = {
  id: Scalars['String']['input'];
  input: CreateEventFromEventbriteInput;
};


export type MutationCreateEventQuestionArgs = {
  input: CreateEventQuestionsInput;
};


export type MutationCreateEventSessionReservationArgs = {
  input: EventSessionReservationInput;
};


export type MutationCreateEventStoryArgs = {
  input: EventStoryInput;
};


export type MutationCreateEventTicketCategoryArgs = {
  input: CreateEventTicketCategoryInput;
};


export type MutationCreateEventTicketDiscountsArgs = {
  event: Scalars['MongoID']['input'];
  inputs: Array<EventPaymentTicketDiscountInput>;
};


export type MutationCreateEventTicketTypeArgs = {
  input: EventTicketTypeInput;
};


export type MutationCreateEventTokenGateArgs = {
  input: EventTokenGateInput;
};


export type MutationCreateEventbriteWebhookForEventArgs = {
  _id: Scalars['MongoID']['input'];
  eventbrite_event: Scalars['String']['input'];
};


export type MutationCreateFileArgs = {
  input?: InputMaybe<FileInput>;
  url: Scalars['String']['input'];
};


export type MutationCreateFileUploadsArgs = {
  directory: Scalars['String']['input'];
  upload_infos: Array<FileUploadInfo>;
};


export type MutationCreateGuildRoomArgs = {
  input: GuildRoomInput;
};


export type MutationCreateNewPaymentAccountArgs = {
  input: CreateNewPaymentAccountInput;
};


export type MutationCreateOauth2ClientArgs = {
  input: Oauth2ClientInput;
};


export type MutationCreatePageConfigArgs = {
  input: CreatePageConfigInput;
};


export type MutationCreatePoapDropArgs = {
  input: CreatePoapInput;
};


export type MutationCreatePostArgs = {
  input: PostInput;
};


export type MutationCreatePreviewLinkArgs = {
  input: CreatePreviewLinkInput;
};


export type MutationCreateRegistrationArgs = {
  input: Registration;
};


export type MutationCreateRewardVaultArgs = {
  input: TokenRewardVaultInput;
};


export type MutationCreateSelfVerificationRequestArgs = {
  config: SelfVerificationConfigInput;
};


export type MutationCreateSiteArgs = {
  input: CreateSiteInput;
};


export type MutationCreateSpaceArgs = {
  input: SpaceInput;
};


export type MutationCreateSpaceNewsletterArgs = {
  input: CreateSpaceNewsletterInput;
};


export type MutationCreateSpaceSubscriptionArgs = {
  input: CreateSubscriptionInput;
};


export type MutationCreateSpaceTokenGateArgs = {
  input: SpaceTokenGateInput;
};


export type MutationCreateSpaceVerificationSubmissionArgs = {
  input: SpaceVerificationSubmissionInput;
};


export type MutationCreateStoreArgs = {
  input: StoreInput;
};


export type MutationCreateStoreBucketItemArgs = {
  input: StoreBucketItemInput;
};


export type MutationCreateStoreCategoryArgs = {
  input: StoreCategoryInput;
  store: Scalars['MongoID']['input'];
};


export type MutationCreateStoreOrderArgs = {
  address: Scalars['MongoID']['input'];
  bucket_items?: InputMaybe<Array<StoreBucketItemInput>>;
  delivery_option?: InputMaybe<Scalars['MongoID']['input']>;
  delivery_option_pickup_address?: InputMaybe<Scalars['MongoID']['input']>;
  dry_run?: InputMaybe<Scalars['Boolean']['input']>;
  easyship_courier_id?: InputMaybe<Scalars['String']['input']>;
  place_reservation?: InputMaybe<Scalars['MongoID']['input']>;
  promotion?: InputMaybe<Scalars['MongoID']['input']>;
  store: Scalars['MongoID']['input'];
};


export type MutationCreateStoreProductArgs = {
  input: StoreProductInput;
  store: Scalars['MongoID']['input'];
};


export type MutationCreateStoreProductVariantArgs = {
  input: StoreProductVariantInput;
  product: Scalars['MongoID']['input'];
  store: Scalars['MongoID']['input'];
};


export type MutationCreateStorePromotionArgs = {
  input: StorePromotionInput;
  store: Scalars['MongoID']['input'];
};


export type MutationCreateStripeCardArgs = {
  payment_method: Scalars['String']['input'];
};


export type MutationCreateStripeOnrampSessionArgs = {
  input: CreateStripeOnrampSessionInput;
};


export type MutationCreateTemplateArgs = {
  input: CreateTemplateInput;
};


export type MutationCreateTicketTokenRewardSettingArgs = {
  input: TicketTokenRewardSettingInput;
};


export type MutationCreateTicketsArgs = {
  ticket_assignments: Array<TicketAssignment>;
  ticket_type: Scalars['MongoID']['input'];
};


export type MutationCreateUserExpertiseArgs = {
  title: Scalars['String']['input'];
};


export type MutationCreateUserFollowArgs = {
  followee: Scalars['MongoID']['input'];
};


export type MutationCreateUserFriendshipArgs = {
  input: CreateUserFriendshipInput;
};


export type MutationCreateUserServiceArgs = {
  title: Scalars['String']['input'];
};


export type MutationDecideEventCohostRequestArgs = {
  input: DecideEventCohostRequestInput;
};


export type MutationDecideSpaceEventRequestsArgs = {
  input: DecideSpaceEventRequestsInput;
};


export type MutationDecideUserJoinRequestsArgs = {
  input: DecideUserJoinRequestsInput;
};


export type MutationDeclineEventArgs = {
  _id: Scalars['MongoID']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeclineUserDiscoveryArgs = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  swipee: Scalars['MongoID']['input'];
};


export type MutationDeleteBadgeArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteBadgeListArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteCastReactionArgs = {
  target_cast_id?: InputMaybe<ParentCastInput>;
  target_url?: InputMaybe<Scalars['String']['input']>;
  type: ReactionType;
};


export type MutationDeleteCommentArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteEventApplicationQuestionsArgs = {
  event: Scalars['MongoID']['input'];
  questions: Array<Scalars['MongoID']['input']>;
};


export type MutationDeleteEventEmailSettingArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteEventQuestionArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteEventSessionReservationArgs = {
  input: EventSessionReservationInput;
};


export type MutationDeleteEventStoryArgs = {
  input: EventStoryInput;
};


export type MutationDeleteEventTicketCategoryArgs = {
  categories: Array<Scalars['MongoID']['input']>;
  event: Scalars['MongoID']['input'];
};


export type MutationDeleteEventTicketDiscountsArgs = {
  discounts: Array<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
};


export type MutationDeleteEventTicketTypeArgs = {
  _id: Scalars['MongoID']['input'];
  event: Scalars['MongoID']['input'];
};


export type MutationDeleteEventTokenGateArgs = {
  _id: Scalars['MongoID']['input'];
  event: Scalars['MongoID']['input'];
};


export type MutationDeleteGuildRoomArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteNotificationChannelPreferenceArgs = {
  preferenceId: Scalars['MongoID']['input'];
};


export type MutationDeleteNotificationFilterArgs = {
  filterId: Scalars['MongoID']['input'];
};


export type MutationDeleteNotificationsArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  type?: InputMaybe<NotificationTypeFilterInput>;
};


export type MutationDeleteOauth2ClientArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeletePostArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeletePreviewLinkArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationDeleteSiteArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteSpaceArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteSpaceAssetArgs = {
  file_id: Scalars['MongoID']['input'];
  space_id: Scalars['MongoID']['input'];
};


export type MutationDeleteSpaceMembersArgs = {
  input: DeleteSpaceMemberInput;
};


export type MutationDeleteSpaceNewsletterArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteSpaceTagArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type MutationDeleteSpaceTokenGateArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type MutationDeleteStoreArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteStoreBucketItemArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteStoreCategoryArgs = {
  _id: Scalars['MongoID']['input'];
  store: Scalars['MongoID']['input'];
};


export type MutationDeleteStoreProductArgs = {
  _id: Scalars['MongoID']['input'];
  store: Scalars['MongoID']['input'];
};


export type MutationDeleteStoreProductVariantArgs = {
  _id: Scalars['MongoID']['input'];
  product: Scalars['MongoID']['input'];
  store: Scalars['MongoID']['input'];
};


export type MutationDeleteStorePromotionArgs = {
  _id: Scalars['MongoID']['input'];
  store: Scalars['MongoID']['input'];
};


export type MutationDeleteStripeCardArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationDeleteUserDiscoverySwipeArgs = {
  swipee: Scalars['MongoID']['input'];
};


export type MutationDeleteUserFollowArgs = {
  followee: Scalars['MongoID']['input'];
};


export type MutationDeleteUserFriendshipArgs = {
  input: DeleteUserFriendshipInput;
};


export type MutationDetachSpacePaymentAccountArgs = {
  payment_account: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type MutationDisconnectPlatformArgs = {
  connectionId: Scalars['String']['input'];
};


export type MutationExecuteConnectorActionArgs = {
  input: ExecuteConnectorActionInput;
};


export type MutationFeatureTemplateArgs = {
  featured: Scalars['Boolean']['input'];
  template_id: Scalars['MongoID']['input'];
};


export type MutationFlagEventArgs = {
  _id: Scalars['MongoID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationFlagPostArgs = {
  _id: Scalars['MongoID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationFlagUserArgs = {
  _id: Scalars['MongoID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationFollowSpaceArgs = {
  space: Scalars['MongoID']['input'];
};


export type MutationGenerateCubejsTokenArgs = {
  events?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  site?: InputMaybe<Scalars['MongoID']['input']>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type MutationGenerateStripeAccountLinkArgs = {
  refresh_url: Scalars['String']['input'];
  return_url: Scalars['String']['input'];
};


export type MutationHeartbeatConfigLockArgs = {
  config_id: Scalars['MongoID']['input'];
};


export type MutationImportPoapDropArgs = {
  code: Scalars['String']['input'];
  id: Scalars['Float']['input'];
  input: ImportPoapInput;
};


export type MutationInsertSpaceTagArgs = {
  input: SpaceTagInput;
};


export type MutationInviteEventArgs = {
  input: InviteEventInput;
};


export type MutationInviteUserContactsArgs = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
};


export type MutationJoinGuildRoomArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationMailEventTicketArgs = {
  emails: Array<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  payment?: InputMaybe<Scalars['MongoID']['input']>;
};


export type MutationMailTicketPaymentReceiptArgs = {
  ticket: Scalars['MongoID']['input'];
};


export type MutationManageEventCohostRequestsArgs = {
  input: ManageEventCohostRequestsInput;
};


export type MutationManageSpaceTagArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
  tagged: Scalars['Boolean']['input'];
  target: Scalars['String']['input'];
};


export type MutationPinEventsToSpaceArgs = {
  events: Array<Scalars['MongoID']['input']>;
  space: Scalars['MongoID']['input'];
  tags?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type MutationPublishPageConfigArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationPublishTemplateArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationPublishTemplateUpdateArgs = {
  input: TemplateUpdateInput;
  template_id: Scalars['MongoID']['input'];
};


export type MutationPurchaseCreditsArgs = {
  input: PurchaseCreditInput;
};


export type MutationPurchaseSubscriptionArgs = {
  input: PurchaseSubscriptionInput;
};


export type MutationReadAllNotificationsArgs = {
  category?: InputMaybe<NotificationCategory>;
  type?: InputMaybe<NotificationTypeFilterInput>;
};


export type MutationReadNotificationsArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  type?: InputMaybe<NotificationTypeFilterInput>;
};


export type MutationRedeemTicketsArgs = {
  input: RedeemTicketsInput;
};


export type MutationRegisterDeviceTokenArgs = {
  input: RegisterDeviceTokenInput;
};


export type MutationRegisterXmtpActivationArgs = {
  input: XmtpActivationInput;
};


export type MutationRegisterXmtpAddressArgs = {
  address: Scalars['String']['input'];
};


export type MutationReleaseConfigLockArgs = {
  config_id: Scalars['MongoID']['input'];
};


export type MutationRemoveSubSpacesArgs = {
  _id: Scalars['MongoID']['input'];
  sub_spaces: Array<Scalars['MongoID']['input']>;
};


export type MutationRemoveUserFcmTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationRenewCryptoSubscriptionArgs = {
  annual?: InputMaybe<Scalars['Boolean']['input']>;
  chain_id: Scalars['String']['input'];
  subscription_id: Scalars['MongoID']['input'];
  token_address: Scalars['String']['input'];
};


export type MutationReorderTicketTypeCategoriesArgs = {
  categories: Array<ReorderTicketTypeCategoryInput>;
  event: Scalars['MongoID']['input'];
};


export type MutationReorderTicketTypesArgs = {
  event: Scalars['MongoID']['input'];
  types: Array<ReorderTicketTypeInput>;
};


export type MutationReportUserArgs = {
  input: ReportUserInput;
};


export type MutationRequestHostnameVerificationArgs = {
  hostname: Scalars['String']['input'];
  space_id: Scalars['MongoID']['input'];
};


export type MutationRequestXmtpRecoveryArgs = {
  pinHash: Scalars['String']['input'];
};


export type MutationRespondInvitationArgs = {
  input: RespondInvitationInput;
};


export type MutationResponseInvitationArgs = {
  input: ResponseInvitationInput;
};


export type MutationRestoreConfigVersionArgs = {
  config_id: Scalars['MongoID']['input'];
  version: Scalars['Float']['input'];
};


export type MutationRetryPoapDropCheckArgs = {
  drop: Scalars['MongoID']['input'];
};


export type MutationReviewTemplateArgs = {
  notes?: InputMaybe<Scalars['String']['input']>;
  status: Scalars['String']['input'];
  template_id: Scalars['MongoID']['input'];
};


export type MutationRevokeAllOtherSessionsArgs = {
  stepUpToken: Scalars['String']['input'];
};


export type MutationRevokeApiKeyArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationRevokeMySessionArgs = {
  sessionId: Scalars['String']['input'];
};


export type MutationRevokeOauth2Args = {
  name: Scalars['String']['input'];
};


export type MutationRewindUserDiscoveryArgs = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
};


export type MutationRotateApiKeyArgs = {
  id: Scalars['MongoID']['input'];
};


export type MutationSaveConfigAsTemplateArgs = {
  config_id: Scalars['MongoID']['input'];
  input: SaveAsTemplateInput;
};


export type MutationSaveConfigVersionArgs = {
  config_id: Scalars['MongoID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendEventEmailSettingTestEmailsArgs = {
  input: SendEventEmailSettingTestEmailsInput;
};


export type MutationSendSpaceNewsletterTestEmailsArgs = {
  input: SendSpaceNewsletterTestEmailsInput;
};


export type MutationSetDefaultLensProfileArgs = {
  input: SelectDefaultLensProfileInput;
};


export type MutationSetNotificationChannelPreferenceArgs = {
  input: NotificationChannelPreferenceInput;
};


export type MutationSetNotificationFilterArgs = {
  input: NotificationFilterInput;
};


export type MutationSetPreferredModelArgs = {
  input: SetPreferredModelInput;
};


export type MutationSetSpaceDefaultModelArgs = {
  input: SetSpaceDefaultModelInput;
};


export type MutationSetTemplateTierArgs = {
  template_id: Scalars['MongoID']['input'];
  tier: SubscriptionItemType;
};


export type MutationSetUserWalletArgs = {
  signature: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationSubmitApiKeyArgs = {
  input: SubmitApiKeyInput;
};


export type MutationSubmitEventApplicationAnswersArgs = {
  answers: Array<EventApplicationAnswerInput>;
  email?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
};


export type MutationSubmitEventApplicationQuestionsArgs = {
  event: Scalars['MongoID']['input'];
  questions: Array<QuestionInput>;
};


export type MutationSubmitEventFeedbackArgs = {
  input: SubmitEventFeedbackInput;
};


export type MutationSyncEventAttestationArgs = {
  chain_id: Scalars['String']['input'];
  event: Scalars['MongoID']['input'];
};


export type MutationSyncSpaceTokenGateAccessArgs = {
  space: Scalars['MongoID']['input'];
};


export type MutationTgSendCodeArgs = {
  input: SendCodeInput;
};


export type MutationTgVerifyArgs = {
  input: VerifyCodeInput;
};


export type MutationToggleBlockUserArgs = {
  input: ToggleBlockUserInput;
};


export type MutationToggleEventEmailSettingsArgs = {
  disabled: Scalars['Boolean']['input'];
  event: Scalars['MongoID']['input'];
  ids: Array<Scalars['MongoID']['input']>;
};


export type MutationToggleEventQuestionLikeArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationToggleFileLikeArgs = {
  _id: Scalars['MongoID']['input'];
};


export type MutationToggleReactionArgs = {
  input: ReactionInput;
};


export type MutationUnfollowSpaceArgs = {
  space: Scalars['MongoID']['input'];
};


export type MutationUnpinEventsFromSpaceArgs = {
  events: Array<Scalars['MongoID']['input']>;
  space: Scalars['MongoID']['input'];
};


export type MutationUnregisterDeviceTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationUnsubscribeSpaceArgs = {
  input: UnsubscribeSpaceInput;
};


export type MutationUpdateApiKeyArgs = {
  id: Scalars['MongoID']['input'];
  input: UpdateApiKeyInput;
};


export type MutationUpdateBadgeArgs = {
  _id: Scalars['MongoID']['input'];
  input: UpdateBadgeInput;
};


export type MutationUpdateBadgeListArgs = {
  _id: Scalars['MongoID']['input'];
  input: UpdateBadgeListInput;
};


export type MutationUpdateCheckinTokenRewardSettingArgs = {
  _id: Scalars['MongoID']['input'];
  input: CheckinTokenRewardSettingInput;
};


export type MutationUpdateDonationArgs = {
  input: UpdateDonationInput;
};


export type MutationUpdateDonationVaultArgs = {
  _id: Scalars['MongoID']['input'];
  input: DonationVaultInput;
};


export type MutationUpdateEventArgs = {
  _id: Scalars['MongoID']['input'];
  input: EventInput;
};


export type MutationUpdateEventCheckinArgs = {
  input: UpdateEventCheckinInput;
};


export type MutationUpdateEventCheckinsArgs = {
  input: UpdateEventCheckinInput;
};


export type MutationUpdateEventEmailSettingArgs = {
  input: UpdateEventEmailSettingInput;
};


export type MutationUpdateEventRewardUseArgs = {
  input: UpdateEventRewardUseInput;
};


export type MutationUpdateEventTicketCategoryArgs = {
  input: UpdateTicketTypeCategoryInput;
};


export type MutationUpdateEventTicketDiscountArgs = {
  event: Scalars['MongoID']['input'];
  input: UpdateEventTicketDiscountInput;
};


export type MutationUpdateEventTicketTypeArgs = {
  _id: Scalars['MongoID']['input'];
  input: EventTicketTypeInput;
};


export type MutationUpdateEventTokenGateArgs = {
  input: EventTokenGateInput;
};


export type MutationUpdateFileArgs = {
  _id: Scalars['MongoID']['input'];
  input: FileInput;
};


export type MutationUpdateLaunchpadCoinArgs = {
  input: LaunchpadCoinInput;
};


export type MutationUpdateMyLemonheadInvitationsArgs = {
  invitations: Array<Scalars['String']['input']>;
};


export type MutationUpdateNewPaymentAccountArgs = {
  input: UpdateNewPaymentAccountInput;
};


export type MutationUpdateOauth2ClientArgs = {
  id: Scalars['String']['input'];
  input: Oauth2ClientInput;
};


export type MutationUpdatePageConfigArgs = {
  id: Scalars['MongoID']['input'];
  input: UpdatePageConfigInput;
};


export type MutationUpdatePaymentArgs = {
  input: UpdatePaymentInput;
};


export type MutationUpdatePoapDropArgs = {
  drop: Scalars['MongoID']['input'];
  input: UpdatePoapInput;
};


export type MutationUpdatePostArgs = {
  _id: Scalars['MongoID']['input'];
  input: UpdatePostInput;
};


export type MutationUpdateRewardVaultArgs = {
  _id: Scalars['MongoID']['input'];
  input: TokenRewardVaultInput;
};


export type MutationUpdateSiteArgs = {
  _id: Scalars['MongoID']['input'];
  input: UpdateSiteInput;
};


export type MutationUpdateSpaceArgs = {
  _id: Scalars['MongoID']['input'];
  input: SpaceInput;
  set_hostname?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdateSpaceMemberArgs = {
  input: UpdateSpaceMemberInput;
};


export type MutationUpdateSpaceNewsletterArgs = {
  input: UpdateSpaceNewsletterInput;
};


export type MutationUpdateSpaceRoleFeaturesArgs = {
  input: UpdateSpaceRoleFeaturesInput;
};


export type MutationUpdateSpaceSubscriptionArgs = {
  _id: Scalars['MongoID']['input'];
  input: UpdateSubscriptionInput;
  space: Scalars['MongoID']['input'];
};


export type MutationUpdateSpaceTokenGateArgs = {
  input: SpaceTokenGateInput;
};


export type MutationUpdateStoreArgs = {
  _id: Scalars['MongoID']['input'];
  input: StoreInput;
};


export type MutationUpdateStoreBucketItemArgs = {
  _id: Scalars['MongoID']['input'];
  input: UpdateStoreBucketItemInput;
};


export type MutationUpdateStoreCategoryArgs = {
  _id: Scalars['MongoID']['input'];
  input: StoreCategoryInput;
  store: Scalars['MongoID']['input'];
};


export type MutationUpdateStoreOrderArgs = {
  _id: Scalars['MongoID']['input'];
  input: StoreOrderInput;
};


export type MutationUpdateStoreProductArgs = {
  _id: Scalars['MongoID']['input'];
  input: StoreProductInput;
  store: Scalars['MongoID']['input'];
};


export type MutationUpdateStoreProductVariantArgs = {
  _id: Scalars['MongoID']['input'];
  input: StoreProductVariantInput;
  product: Scalars['MongoID']['input'];
  store: Scalars['MongoID']['input'];
};


export type MutationUpdateStripeConnectedAccountCapabilityArgs = {
  input: UpdateStripeConnectedAccountCapabilityInput;
};


export type MutationUpdateSubSpaceOrderArgs = {
  _id: Scalars['MongoID']['input'];
  sub_spaces: Array<Scalars['MongoID']['input']>;
};


export type MutationUpdateTemplateArgs = {
  id: Scalars['MongoID']['input'];
  input: UpdateTemplateInput;
};


export type MutationUpdateTicketTokenRewardSettingArgs = {
  _id: Scalars['MongoID']['input'];
  input: TicketTokenRewardSettingInput;
};


export type MutationUpdateTokenRewardClaimArgs = {
  input: UpdateTokenRewardClaimInput;
};


export type MutationUpdateUserArgs = {
  input: UserInput;
};


export type MutationUpgradeTicketArgs = {
  input: UpgradeTicketInput;
};


export type MutationVerifyHostnameArgs = {
  hostname: Scalars['String']['input'];
  space_id: Scalars['MongoID']['input'];
};


export type MutationVerifyStepUpVerificationArgs = {
  code: Scalars['String']['input'];
};

export type NewPayment = {
  __typename?: 'NewPayment';
  _id: Scalars['MongoID']['output'];
  account: Scalars['MongoID']['output'];
  account_expanded?: Maybe<NewPaymentAccount>;
  amount: Scalars['String']['output'];
  application?: Maybe<Array<EventApplicationQuestionAndAnswer>>;
  attempting_refund?: Maybe<Scalars['Boolean']['output']>;
  billing_info?: Maybe<BillingInfo>;
  buyer_info?: Maybe<BuyerInfo>;
  buyer_user?: Maybe<UserWithEmail>;
  crypto_payment_info?: Maybe<CryptoPaymentInfo>;
  currency: Scalars['String']['output'];
  due_amount?: Maybe<Scalars['String']['output']>;
  failure_reason?: Maybe<Scalars['String']['output']>;
  fee?: Maybe<Scalars['String']['output']>;
  formatted_discount_amount?: Maybe<Scalars['String']['output']>;
  formatted_due_amount?: Maybe<Scalars['String']['output']>;
  formatted_fee_amount?: Maybe<Scalars['String']['output']>;
  formatted_total_amount?: Maybe<Scalars['String']['output']>;
  is_latest?: Maybe<Scalars['Boolean']['output']>;
  join_request?: Maybe<EventJoinRequestBase>;
  ref_data?: Maybe<Scalars['JSON']['output']>;
  stamps: Scalars['JSON']['output'];
  state: NewPaymentState;
  stripe_payment_info?: Maybe<StripePaymentInfo>;
  ticket_types_expanded?: Maybe<Array<Maybe<EventTicketType>>>;
  tickets?: Maybe<Array<TicketBase>>;
  transfer_metadata?: Maybe<Scalars['JSON']['output']>;
  transfer_params?: Maybe<Scalars['JSON']['output']>;
  user?: Maybe<Scalars['MongoID']['output']>;
};

export type NewPaymentAccount = {
  __typename?: 'NewPaymentAccount';
  _id: Scalars['MongoID']['output'];
  account_info: AccountInfo;
  active: Scalars['Boolean']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  provider?: Maybe<NewPaymentProvider>;
  title?: Maybe<Scalars['String']['output']>;
  type: PaymentAccountType;
  user: Scalars['MongoID']['output'];
};

export enum NewPaymentProvider {
  Safe = 'safe',
  Stripe = 'stripe'
}

export enum NewPaymentState {
  AwaitCapture = 'await_capture',
  Cancelled = 'cancelled',
  Created = 'created',
  Failed = 'failed',
  Initialized = 'initialized',
  Refunded = 'refunded',
  Succeeded = 'succeeded'
}

export type Newsfeed = {
  __typename?: 'Newsfeed';
  offset: Scalars['Float']['output'];
  posts: Array<Post>;
};

export type NonloginUser = {
  __typename?: 'NonloginUser';
  _id?: Maybe<Scalars['MongoID']['output']>;
  active?: Maybe<Scalars['Boolean']['output']>;
  addresses?: Maybe<Array<Address>>;
  admin_access?: Maybe<AdminAccess>;
  age?: Maybe<Scalars['Float']['output']>;
  attended?: Maybe<Scalars['Float']['output']>;
  blocked?: Maybe<Array<Scalars['MongoID']['output']>>;
  blocked_expanded?: Maybe<Array<User>>;
  calendly_url?: Maybe<Scalars['String']['output']>;
  company_address?: Maybe<Address>;
  company_name?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  cover?: Maybe<Scalars['MongoID']['output']>;
  cover_expanded?: Maybe<File>;
  created_at?: Maybe<Scalars['DateTimeISO']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  daos?: Maybe<Array<UserDao>>;
  data?: Maybe<Scalars['JSON']['output']>;
  date_of_birth?: Maybe<Scalars['DateTimeISO']['output']>;
  /** This is the biography of the user */
  description?: Maybe<Scalars['String']['output']>;
  discord_user_info?: Maybe<Scalars['JSON']['output']>;
  discovery?: Maybe<UserDiscoverySettings>;
  display_name?: Maybe<Scalars['String']['output']>;
  education_title?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  email_marketing?: Maybe<Scalars['Boolean']['output']>;
  email_verified?: Maybe<Scalars['Boolean']['output']>;
  ethnicity?: Maybe<Scalars['String']['output']>;
  eventbrite_user_info?: Maybe<Scalars['JSON']['output']>;
  events?: Maybe<Array<Scalars['MongoID']['output']>>;
  events_expanded?: Maybe<Array<Event>>;
  expertise?: Maybe<Array<Scalars['MongoID']['output']>>;
  expertise_expanded?: Maybe<Array<UserExpertise>>;
  farcaster_fid?: Maybe<Scalars['Float']['output']>;
  farcaster_user_info?: Maybe<FarcasterUserInfo>;
  first_name?: Maybe<Scalars['String']['output']>;
  followers?: Maybe<Scalars['Float']['output']>;
  following?: Maybe<Scalars['Float']['output']>;
  frequent_questions?: Maybe<Array<FrequentQuestion>>;
  friends?: Maybe<Scalars['Float']['output']>;
  google_user_info?: Maybe<Scalars['JSON']['output']>;
  handle_facebook?: Maybe<Scalars['String']['output']>;
  handle_farcaster?: Maybe<Scalars['String']['output']>;
  handle_github?: Maybe<Scalars['String']['output']>;
  handle_instagram?: Maybe<Scalars['String']['output']>;
  handle_lens?: Maybe<Scalars['String']['output']>;
  handle_linkedin?: Maybe<Scalars['String']['output']>;
  handle_mirror?: Maybe<Scalars['String']['output']>;
  handle_twitter?: Maybe<Scalars['String']['output']>;
  hosted?: Maybe<Scalars['Float']['output']>;
  icebreakers?: Maybe<Array<UserIcebreaker>>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  industry?: Maybe<Scalars['String']['output']>;
  interests?: Maybe<Array<Scalars['String']['output']>>;
  job_title?: Maybe<Scalars['String']['output']>;
  kratos_farcaster_fid?: Maybe<Scalars['String']['output']>;
  kratos_unicorn_wallet_address?: Maybe<Scalars['String']['output']>;
  kratos_wallet_address?: Maybe<Scalars['String']['output']>;
  languages?: Maybe<Array<Scalars['String']['output']>>;
  last_name?: Maybe<Scalars['String']['output']>;
  layout_sections?: Maybe<Array<LayoutSection>>;
  lemon_amount?: Maybe<Scalars['Float']['output']>;
  lemon_cap?: Maybe<Scalars['Float']['output']>;
  lemon_refresh_at?: Maybe<Scalars['DateTimeISO']['output']>;
  lemonhead_inviter_wallet?: Maybe<Scalars['String']['output']>;
  lens_profile_id?: Maybe<Scalars['String']['output']>;
  lens_profile_synced?: Maybe<Scalars['Boolean']['output']>;
  location_line?: Maybe<Scalars['String']['output']>;
  matrix_localpart?: Maybe<Scalars['String']['output']>;
  music?: Maybe<Array<Scalars['String']['output']>>;
  /** This field contains the name of the user in a short version */
  name?: Maybe<Scalars['String']['output']>;
  new_gender?: Maybe<Scalars['String']['output']>;
  new_photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  new_photos_expanded?: Maybe<Array<File>>;
  notification_filters?: Maybe<Array<NotificationFilter>>;
  oauth2_allow_creation?: Maybe<Scalars['Boolean']['output']>;
  oauth2_clients?: Maybe<Array<Scalars['String']['output']>>;
  oauth2_max_clients?: Maybe<Scalars['Int']['output']>;
  offers?: Maybe<Array<UserOffer>>;
  payment_verification?: Maybe<UserPaymentVerification>;
  phone?: Maybe<Scalars['String']['output']>;
  phone_verified?: Maybe<Scalars['Boolean']['output']>;
  posts?: Maybe<Scalars['Float']['output']>;
  preferred_network?: Maybe<Scalars['String']['output']>;
  pronoun?: Maybe<Scalars['String']['output']>;
  quest_points?: Maybe<Scalars['Float']['output']>;
  razorpay_customer?: Maybe<Scalars['String']['output']>;
  search_range?: Maybe<Scalars['Float']['output']>;
  service_offers?: Maybe<Array<Scalars['MongoID']['output']>>;
  service_offers_expanded?: Maybe<Array<UserServiceOffer>>;
  settings?: Maybe<Scalars['JSON']['output']>;
  shopify_user_info?: Maybe<Scalars['JSON']['output']>;
  stripe_connected_account?: Maybe<StripeConnectedAccount>;
  stripe_user_info?: Maybe<Scalars['JSON']['output']>;
  tag_recommended?: Maybe<Scalars['Boolean']['output']>;
  tag_site?: Maybe<Scalars['Boolean']['output']>;
  tag_timeline?: Maybe<Scalars['Boolean']['output']>;
  tag_verified?: Maybe<Scalars['Boolean']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  telegram_user_info?: Maybe<Scalars['JSON']['output']>;
  terms_accepted_adult?: Maybe<Scalars['Boolean']['output']>;
  terms_accepted_conditions?: Maybe<Scalars['Boolean']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  twitch_user_info?: Maybe<Scalars['JSON']['output']>;
  twitter2_user_info?: Maybe<Scalars['JSON']['output']>;
  twitter_user_info?: Maybe<Scalars['JSON']['output']>;
  type?: Maybe<UserType>;
  updated_at?: Maybe<Scalars['DateTimeISO']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  url_go?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
  wallet_custodial?: Maybe<Scalars['String']['output']>;
  wallets?: Maybe<Array<Scalars['String']['output']>>;
  wallets_new?: Maybe<Scalars['JSON']['output']>;
  website?: Maybe<Scalars['String']['output']>;
  zoom_user_info?: Maybe<Scalars['JSON']['output']>;
};

export type Notification = {
  __typename?: 'Notification';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  from?: Maybe<Scalars['MongoID']['output']>;
  from_expanded?: Maybe<User>;
  image_url?: Maybe<Scalars['String']['output']>;
  is_seen?: Maybe<Scalars['Boolean']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  ref_event?: Maybe<Scalars['MongoID']['output']>;
  ref_event_expanded?: Maybe<Event>;
  /** @deprecated Rooms feature was removed. This field is kept for legacy data but is no longer set on new notifications. */
  ref_room?: Maybe<Scalars['MongoID']['output']>;
  ref_space?: Maybe<Scalars['MongoID']['output']>;
  ref_space_expanded?: Maybe<Space>;
  ref_store_order?: Maybe<Scalars['MongoID']['output']>;
  ref_store_order_expanded?: Maybe<StoreOrder>;
  ref_user?: Maybe<Scalars['MongoID']['output']>;
  ref_user_expanded?: Maybe<User>;
  title?: Maybe<Scalars['String']['output']>;
  type: NotificationType;
};

export enum NotificationCategory {
  Event = 'event',
  Messaging = 'messaging',
  Payment = 'payment',
  Social = 'social',
  Space = 'space',
  Store = 'store',
  System = 'system'
}

export enum NotificationChannel {
  Push = 'push'
}

export type NotificationChannelPreference = {
  __typename?: 'NotificationChannelPreference';
  _id?: Maybe<Scalars['MongoID']['output']>;
  enabled_channels: Array<NotificationChannel>;
  notification_category?: Maybe<NotificationCategory>;
  notification_type?: Maybe<NotificationType>;
  ref_id?: Maybe<Scalars['MongoID']['output']>;
  ref_type?: Maybe<NotificationRefType>;
  space_scoped?: Maybe<Scalars['MongoID']['output']>;
};

export type NotificationChannelPreferenceInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  enabled_channels: Array<NotificationChannel>;
  notification_category?: InputMaybe<NotificationCategory>;
  notification_type?: InputMaybe<NotificationType>;
  ref_id?: InputMaybe<Scalars['MongoID']['input']>;
  ref_type?: InputMaybe<NotificationRefType>;
  space_scoped?: InputMaybe<Scalars['MongoID']['input']>;
};

export type NotificationFilter = {
  __typename?: 'NotificationFilter';
  _id?: Maybe<Scalars['MongoID']['output']>;
  mode: NotificationFilterMode;
  notification_category?: Maybe<NotificationCategory>;
  notification_type?: Maybe<NotificationType>;
  ref_id?: Maybe<Scalars['MongoID']['output']>;
  ref_type?: Maybe<NotificationRefType>;
  space_scoped?: Maybe<Scalars['MongoID']['output']>;
};

export type NotificationFilterInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  mode: NotificationFilterMode;
  notification_category?: InputMaybe<NotificationCategory>;
  notification_type?: InputMaybe<NotificationType>;
  ref_id?: InputMaybe<Scalars['MongoID']['input']>;
  ref_type?: InputMaybe<NotificationRefType>;
  space_scoped?: InputMaybe<Scalars['MongoID']['input']>;
};

export enum NotificationFilterMode {
  Hide = 'hide',
  Mute = 'mute',
  Only = 'only'
}

export enum NotificationRefType {
  Event = 'Event',
  Space = 'Space',
  StoreOrder = 'StoreOrder',
  User = 'User'
}

export enum NotificationType {
  AdminPaymentVerification = 'admin_payment_verification',
  ChatMessage = 'chat_message',
  EmailSendFailed = 'email_send_failed',
  EventAnnounce = 'event_announce',
  EventApprove = 'event_approve',
  EventAttestationSyncCompleted = 'event_attestation_sync_completed',
  EventCancellation = 'event_cancellation',
  EventChatAnnounce = 'event_chat_announce',
  EventCohostAdded = 'event_cohost_added',
  EventDeclined = 'event_declined',
  EventDonation = 'event_donation',
  EventInvite = 'event_invite',
  EventInviteAttending = 'event_invite_attending',
  EventInviteVerifyAcceptRequest = 'event_invite_verify_accept_request',
  EventInviteVerifyRequest = 'event_invite_verify_request',
  EventReminder = 'event_reminder',
  EventRequestApproved = 'event_request_approved',
  EventRequestCreated = 'event_request_created',
  EventRequestDeclined = 'event_request_declined',
  EventUnlockVerifyAcceptRequest = 'event_unlock_verify_accept_request',
  EventUnlockVerifyRequest = 'event_unlock_verify_request',
  EventUpdate = 'event_update',
  PaymentAuthorized = 'payment_authorized',
  PaymentFailed = 'payment_failed',
  PaymentRefunded = 'payment_refunded',
  PaymentSucceeded = 'payment_succeeded',
  PaymentsCapturedSummary = 'payments_captured_summary',
  PaymentsWiredSummary = 'payments_wired_summary',
  SafeVaultInitFailed = 'safe_vault_init_failed',
  SafeVaultInitSuccess = 'safe_vault_init_success',
  SpaceAdminAdded = 'space_admin_added',
  SpaceEventPinRequest = 'space_event_pin_request',
  SpaceEventSubmissionApproved = 'space_event_submission_approved',
  SpaceMemberAdded = 'space_member_added',
  SpaceVerificationApproved = 'space_verification_approved',
  SpaceVerificationRejected = 'space_verification_rejected',
  StoreOrderAccepted = 'store_order_accepted',
  StoreOrderAwaitingPickup = 'store_order_awaiting_pickup',
  StoreOrderCancelled = 'store_order_cancelled',
  StoreOrderDeclined = 'store_order_declined',
  StoreOrderDelivered = 'store_order_delivered',
  StoreOrderDeliveryConfirmed = 'store_order_delivery_confirmed',
  StoreOrderInTransit = 'store_order_in_transit',
  StoreOrderPending = 'store_order_pending',
  StoreOrderPreparing = 'store_order_preparing',
  StripeConnected = 'stripe_connected',
  TicketAssigned = 'ticket_assigned',
  TicketCancelled = 'ticket_cancelled',
  UserContactSignup = 'user_contact_signup',
  UserDiscoveryMatch = 'user_discovery_match',
  UserFollow = 'user_follow',
  UserFriendshipRequest = 'user_friendship_request',
  UserFriendshipRequestAccept = 'user_friendship_request_accept',
  XmtpMessage = 'xmtp_message'
}

export type NotificationTypeFilterInput = {
  eq?: InputMaybe<NotificationType>;
  in?: InputMaybe<Array<NotificationType>>;
  nin?: InputMaybe<Array<NotificationType>>;
};

export type OAuth2Client = {
  __typename?: 'OAuth2Client';
  allowed_cors_origins: Array<Scalars['String']['output']>;
  audience: Array<Scalars['String']['output']>;
  authorization_code_grant_access_token_lifespan?: Maybe<Scalars['String']['output']>;
  authorization_code_grant_id_token_lifespan?: Maybe<Scalars['String']['output']>;
  authorization_code_grant_refresh_token_lifespan?: Maybe<Scalars['String']['output']>;
  client_credentials_grant_access_token_lifespan?: Maybe<Scalars['String']['output']>;
  client_id: Scalars['String']['output'];
  client_name: Scalars['String']['output'];
  client_secret?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  grant_types: Array<Scalars['String']['output']>;
  implicit_grant_access_token_lifespan?: Maybe<Scalars['String']['output']>;
  implicit_grant_id_token_lifespan?: Maybe<Scalars['String']['output']>;
  jwt_bearer_grant_access_token_lifespan?: Maybe<Scalars['String']['output']>;
  logo_uri?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  post_logout_redirect_uris?: Maybe<Array<Scalars['String']['output']>>;
  redirect_uris?: Maybe<Array<Scalars['String']['output']>>;
  refresh_token_grant_access_token_lifespan?: Maybe<Scalars['String']['output']>;
  refresh_token_grant_id_token_lifespan?: Maybe<Scalars['String']['output']>;
  refresh_token_grant_refresh_token_lifespan?: Maybe<Scalars['String']['output']>;
  response_types?: Maybe<Array<Scalars['String']['output']>>;
  scope: Scalars['String']['output'];
  skip_consent?: Maybe<Scalars['Boolean']['output']>;
  token_endpoint_auth_method?: Maybe<Scalars['String']['output']>;
  updated_at: Scalars['DateTimeISO']['output'];
};

export type Oauth2ClientInput = {
  allowed_cors_origins?: InputMaybe<Array<Scalars['String']['input']>>;
  authorization_code_grant_access_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  authorization_code_grant_id_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  authorization_code_grant_refresh_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  client_credentials_grant_access_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  client_name?: InputMaybe<Scalars['String']['input']>;
  implicit_grant_access_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  implicit_grant_id_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  jwt_bearer_grant_access_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  logo_uri?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  post_logout_redirect_uris?: InputMaybe<Array<Scalars['String']['input']>>;
  redirect_uris?: InputMaybe<Array<Scalars['String']['input']>>;
  refresh_token_grant_access_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  refresh_token_grant_id_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  refresh_token_grant_refresh_token_lifespan?: InputMaybe<Scalars['String']['input']>;
  skip_consent?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Offer = {
  __typename?: 'Offer';
  _id?: Maybe<Scalars['MongoID']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['Float']['output']>;
  provider: OfferProvider;
  provider_id: Scalars['String']['output'];
  provider_network: Scalars['String']['output'];
};

export enum OfferProvider {
  Claimable = 'claimable',
  FestivalHeads = 'festival_heads',
  Metaverse = 'metaverse',
  Order = 'order',
  Poap = 'poap',
  Token = 'token'
}

export enum OfferType {
  Home = 'HOME',
  Poap = 'POAP'
}

export type PageConfig = {
  __typename?: 'PageConfig';
  _id: Scalars['MongoID']['output'];
  ai_data_consent?: Maybe<AiDataConsent>;
  created_at: Scalars['DateTimeISO']['output'];
  created_by: Scalars['MongoID']['output'];
  custom_code?: Maybe<CustomCode>;
  description?: Maybe<Scalars['String']['output']>;
  last_edited_by?: Maybe<Scalars['MongoID']['output']>;
  locked_at?: Maybe<Scalars['DateTimeISO']['output']>;
  locked_by?: Maybe<Scalars['MongoID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  owner_id: Scalars['MongoID']['output'];
  owner_type: PageConfigOwnerType;
  published_version?: Maybe<Scalars['Float']['output']>;
  sections?: Maybe<Array<PageSection>>;
  seo?: Maybe<PageSeo>;
  space_id?: Maybe<Scalars['MongoID']['output']>;
  status: PageConfigStatus;
  structure_data?: Maybe<Scalars['JSON']['output']>;
  template_id?: Maybe<Scalars['MongoID']['output']>;
  template_version_installed?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<PageTheme>;
  thumbnail_url?: Maybe<Scalars['String']['output']>;
  version: Scalars['Float']['output'];
};

export enum PageConfigOwnerType {
  Event = 'event',
  Space = 'space'
}

export enum PageConfigStatus {
  Archived = 'archived',
  Draft = 'draft',
  Published = 'published'
}

export type PageSection = {
  __typename?: 'PageSection';
  children?: Maybe<Array<PageSection>>;
  /** @deprecated Legacy frontend renderer field. Use id as the stable section identifier. */
  craft_node_id?: Maybe<Scalars['String']['output']>;
  data_binding?: Maybe<DataBinding>;
  hidden: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  layout: SectionLayout;
  order: Scalars['Float']['output'];
  props: Scalars['JSON']['output'];
  type: SectionType;
};

export type PageSectionInput = {
  children?: InputMaybe<Array<PageSectionInput>>;
  /** @deprecated Legacy frontend renderer field. Use id as the stable section identifier. */
  craft_node_id?: InputMaybe<Scalars['String']['input']>;
  data_binding?: InputMaybe<DataBindingInput>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  layout: SectionLayoutInput;
  order: Scalars['Float']['input'];
  props: Scalars['JSON']['input'];
  type: Scalars['String']['input'];
};

export type PageSeo = {
  __typename?: 'PageSeo';
  canonical_url?: Maybe<Scalars['String']['output']>;
  meta_description?: Maybe<Scalars['String']['output']>;
  meta_title?: Maybe<Scalars['String']['output']>;
  no_index?: Maybe<Scalars['Boolean']['output']>;
  og_image_url?: Maybe<Scalars['String']['output']>;
  og_type?: Maybe<Scalars['String']['output']>;
  structured_data?: Maybe<SeoStructuredData>;
};

export type PageTheme = {
  __typename?: 'PageTheme';
  background?: Maybe<PageThemeBackground>;
  colors?: Maybe<PageThemeColors>;
  css_variables?: Maybe<Scalars['JSON']['output']>;
  effects?: Maybe<PageThemeEffects>;
  fonts?: Maybe<PageThemeFonts>;
  mode?: Maybe<ThemeMode>;
  type?: Maybe<ThemeType>;
};

export type PageThemeBackground = {
  __typename?: 'PageThemeBackground';
  config?: Maybe<Scalars['JSON']['output']>;
  type: BackgroundType;
  value: Scalars['String']['output'];
};

export type PageThemeBackgroundInput = {
  config?: InputMaybe<Scalars['JSON']['input']>;
  type: BackgroundType;
  value: Scalars['String']['input'];
};

export type PageThemeColors = {
  __typename?: 'PageThemeColors';
  accent?: Maybe<Scalars['String']['output']>;
  background?: Maybe<Scalars['String']['output']>;
  border?: Maybe<Scalars['String']['output']>;
  card?: Maybe<Scalars['String']['output']>;
  extra?: Maybe<Scalars['JSON']['output']>;
  text_primary?: Maybe<Scalars['String']['output']>;
  text_secondary?: Maybe<Scalars['String']['output']>;
};

export type PageThemeColorsInput = {
  accent?: InputMaybe<Scalars['String']['input']>;
  background?: InputMaybe<Scalars['String']['input']>;
  border?: InputMaybe<Scalars['String']['input']>;
  card?: InputMaybe<Scalars['String']['input']>;
  extra?: InputMaybe<Scalars['JSON']['input']>;
  text_primary?: InputMaybe<Scalars['String']['input']>;
  text_secondary?: InputMaybe<Scalars['String']['input']>;
};

export type PageThemeEffects = {
  __typename?: 'PageThemeEffects';
  config?: Maybe<Scalars['JSON']['output']>;
  type: EffectType;
  value?: Maybe<Scalars['String']['output']>;
};

export type PageThemeEffectsInput = {
  config?: InputMaybe<Scalars['JSON']['input']>;
  type: EffectType;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type PageThemeFontConfig = {
  __typename?: 'PageThemeFontConfig';
  family: Scalars['String']['output'];
  size_scale?: Maybe<Scalars['Float']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  weight?: Maybe<Scalars['Float']['output']>;
};

export type PageThemeFontConfigInput = {
  family: Scalars['String']['input'];
  size_scale?: InputMaybe<Scalars['Float']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type PageThemeFonts = {
  __typename?: 'PageThemeFonts';
  body?: Maybe<PageThemeFontConfig>;
  title?: Maybe<PageThemeFontConfig>;
};

export type PageThemeFontsInput = {
  body?: InputMaybe<PageThemeFontConfigInput>;
  title?: InputMaybe<PageThemeFontConfigInput>;
};

export type PaginationInput = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type ParentCastInput = {
  fid: Scalars['Float']['input'];
  /** Hash of the parent cast without 0x prefix */
  hash: Scalars['String']['input'];
};

export type PassportMintingInfo = {
  __typename?: 'PassportMintingInfo';
  can_mint: Scalars['Boolean']['output'];
  price: Scalars['String']['output'];
  /** If the user passed token gate check */
  token_gated?: Maybe<Scalars['Boolean']['output']>;
  white_list_enabled: Scalars['Boolean']['output'];
};

export enum PassportProvider {
  AlzenaWorld = 'alzena_world',
  DripNation = 'drip_nation',
  FestivalNation = 'festival_nation',
  Lemonade = 'lemonade',
  VinylNation = 'vinyl_nation',
  Zugrama = 'zugrama'
}

export type PaymentAccountInfo = {
  __typename?: 'PaymentAccountInfo';
  _id: Scalars['MongoID']['output'];
  account_info: AccountInfo;
  active: Scalars['Boolean']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  escrow?: Maybe<EscrowDepositInfo>;
  fee?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<NewPaymentProvider>;
  relay?: Maybe<RelayPaymentInfo>;
  title?: Maybe<Scalars['String']['output']>;
  type: PaymentAccountType;
  user: Scalars['MongoID']['output'];
};

export enum PaymentAccountType {
  Digital = 'digital',
  Ethereum = 'ethereum',
  EthereumEscrow = 'ethereum_escrow',
  EthereumRelay = 'ethereum_relay',
  EthereumStake = 'ethereum_stake',
  Solana = 'solana'
}

export type PaymentRefundInfo = {
  __typename?: 'PaymentRefundInfo';
  _id: Scalars['MongoID']['output'];
  amount: Scalars['String']['output'];
  attempting_refund?: Maybe<Scalars['Boolean']['output']>;
  currency: Scalars['String']['output'];
  payment_account: NewPaymentAccount;
  refund_info?: Maybe<RefundInfo>;
  /** If null is returned then this payment does not support refund */
  refund_policy?: Maybe<PaymentRefundPolicy>;
  /** Null for undeterminated, true if requirement met, otherwise false */
  refund_requirements_met?: Maybe<Scalars['Boolean']['output']>;
  state: NewPaymentState;
};

export type PaymentRefundPolicy = {
  __typename?: 'PaymentRefundPolicy';
  percent: Scalars['Float']['output'];
  requirements?: Maybe<RefundRequirements>;
  /** Whether all requirements must be met */
  satisfy_all?: Maybe<Scalars['Boolean']['output']>;
};

export type PaymentRefundSignature = {
  __typename?: 'PaymentRefundSignature';
  /** The args that will be supplied to the contract refund function */
  args: Array<Scalars['JSON']['output']>;
  signature: Scalars['String']['output'];
};

export type PaymentRevenue = {
  __typename?: 'PaymentRevenue';
  currency: Scalars['String']['output'];
  formatted_total_amount: Scalars['String']['output'];
};

export type PaymentStatistics = {
  __typename?: 'PaymentStatistics';
  count: Scalars['Int']['output'];
  revenue: Array<PaymentRevenue>;
};

export type PeekEventGuestsResponse = {
  __typename?: 'PeekEventGuestsResponse';
  /** The paginated response */
  items: Array<EventGuestUser>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type PinEventsToSpaceResponse = {
  __typename?: 'PinEventsToSpaceResponse';
  requests?: Maybe<Array<SpaceEventRequest>>;
};

export enum Platform {
  Android = 'android',
  Ios = 'ios',
  Unknown = 'unknown',
  Web = 'web'
}

export type PoapClaim = {
  __typename?: 'PoapClaim';
  beneficiary?: Maybe<Scalars['String']['output']>;
  claimed_date?: Maybe<Scalars['DateTimeISO']['output']>;
  drop: PoapDrop;
};

export enum PoapClaimMode {
  CheckIn = 'check_in',
  Registration = 'registration'
}

export type PoapDrop = {
  __typename?: 'PoapDrop';
  _id: Scalars['MongoID']['output'];
  /** Requested poap amount */
  amount: Scalars['Int']['output'];
  claim_count?: Maybe<Scalars['Int']['output']>;
  claim_mode: PoapClaimMode;
  current_amount: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  event?: Maybe<Scalars['MongoID']['output']>;
  image?: Maybe<Scalars['MongoID']['output']>;
  image_expanded?: Maybe<File>;
  image_url?: Maybe<Scalars['String']['output']>;
  minting_network: Scalars['String']['output'];
  name: Scalars['String']['output'];
  private?: Maybe<Scalars['Boolean']['output']>;
  status: PoapDropStatus;
  ticket_types?: Maybe<Array<Scalars['MongoID']['output']>>;
  ticket_types_expanded?: Maybe<Array<EventTicketType>>;
};

export type PoapDropInfo = {
  __typename?: 'PoapDropInfo';
  description: Scalars['String']['output'];
  image_url: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export enum PoapDropStatus {
  Failed = 'failed',
  Pending = 'pending',
  Ready = 'ready'
}

export type Point = {
  __typename?: 'Point';
  coordinates: Array<Scalars['Float']['output']>;
  type: Scalars['String']['output'];
};

export type PointConfigInfo = {
  __typename?: 'PointConfigInfo';
  _id: Scalars['MongoID']['output'];
  first_level_group?: Maybe<Scalars['MongoID']['output']>;
  first_time_only?: Maybe<Scalars['Boolean']['output']>;
  points: Scalars['Float']['output'];
  second_level_group?: Maybe<Scalars['MongoID']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  trackings: Array<PointTrackingInfo>;
  type: PointType;
};

export type PointGroup = {
  __typename?: 'PointGroup';
  completed?: Maybe<Scalars['Float']['output']>;
  count?: Maybe<Scalars['Float']['output']>;
  first_level_group?: Maybe<Group>;
  points?: Maybe<Scalars['Float']['output']>;
  second_level_groups: Array<Maybe<Group>>;
};

export type PointTrackingInfo = {
  __typename?: 'PointTrackingInfo';
  _id: Scalars['MongoID']['output'];
  config: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  points: Scalars['Float']['output'];
};

export enum PointType {
  ConfigBio = 'config_bio',
  ConfigDisplayName = 'config_display_name',
  ConfigProfilePhoto = 'config_profile_photo',
  ConfigUsername = 'config_username',
  ConnectEventbrite = 'connect_eventbrite',
  ConnectFarcaster = 'connect_farcaster',
  ConnectStripe = 'connect_stripe',
  ConnectWallet = 'connect_wallet',
  CreatePost = 'create_post',
  EventAttestation = 'event_attestation',
  EveryNthRsvp = 'every_nth_rsvp',
  InviteeRsvpEvent = 'invitee_rsvp_event',
  PerEventCheckin = 'per_event_checkin',
  PerEventRsvp = 'per_event_rsvp',
  PerGuestCheckin = 'per_guest_checkin',
  PerPaidTicketTierCreated = 'per_paid_ticket_tier_created',
  PerPostHasMoreThanNLikes = 'per_post_has_more_than_n_likes',
  PerPublishedEvent = 'per_published_event',
  PerTicketSold = 'per_ticket_sold',
  SignupOnMobileApp = 'signup_on_mobile_app',
  UpdateEventAttestation = 'update_event_attestation',
  VerifyEmail = 'verify_email'
}

export type Post = {
  __typename?: 'Post';
  _id: Scalars['MongoID']['output'];
  comments?: Maybe<Scalars['Float']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  has_reaction?: Maybe<Scalars['Boolean']['output']>;
  published?: Maybe<Scalars['Boolean']['output']>;
  reactions?: Maybe<Scalars['Float']['output']>;
  ref_event?: Maybe<Event>;
  ref_file?: Maybe<File>;
  ref_id?: Maybe<Scalars['String']['output']>;
  ref_type?: Maybe<PostRefType>;
  text?: Maybe<Scalars['String']['output']>;
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
  visibility: PostVisibility;
};

export type PostInput = {
  ref_id?: InputMaybe<Scalars['String']['input']>;
  ref_type?: InputMaybe<PostRefType>;
  text?: InputMaybe<Scalars['String']['input']>;
  visibility: PostVisibility;
};

export enum PostRefType {
  Event = 'EVENT',
  File = 'FILE'
}

export enum PostVisibility {
  Followers = 'FOLLOWERS',
  Friends = 'FRIENDS',
  Mentions = 'MENTIONS',
  Public = 'PUBLIC'
}

export type PreviewLink = {
  __typename?: 'PreviewLink';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  created_by: Scalars['MongoID']['output'];
  expires_at?: Maybe<Scalars['DateTimeISO']['output']>;
  link_type: PreviewLinkType;
  password?: Maybe<Scalars['String']['output']>;
  resource_id: Scalars['MongoID']['output'];
  token: Scalars['String']['output'];
  view_count: Scalars['Float']['output'];
};

export enum PreviewLinkType {
  Event = 'event',
  Space = 'space'
}

export type PricingInfo = {
  __typename?: 'PricingInfo';
  deposit_infos?: Maybe<Array<EscrowDepositInfo>>;
  discount: Scalars['String']['output'];
  event_token_gates?: Maybe<Array<EventTokenGate>>;
  payment_accounts: Array<PaymentAccountInfo>;
  subtotal: Scalars['String']['output'];
  total: Scalars['String']['output'];
};

export type PublicSpace = {
  __typename?: 'PublicSpace';
  _id: Scalars['MongoID']['output'];
  admins?: Maybe<Array<User>>;
  creator_expanded?: Maybe<User>;
  description?: Maybe<Scalars['String']['output']>;
  followed?: Maybe<Scalars['Boolean']['output']>;
  followers_count?: Maybe<Scalars['Float']['output']>;
  image_avatar_expanded?: Maybe<File>;
  image_cover_expanded?: Maybe<File>;
  is_admin?: Maybe<Scalars['Boolean']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type PurchasableItem = {
  count: Scalars['Int']['input'];
  id: Scalars['MongoID']['input'];
};

export type PurchasableTicketType = {
  __typename?: 'PurchasableTicketType';
  _id: Scalars['MongoID']['output'];
  active?: Maybe<Scalars['Boolean']['output']>;
  address_required?: Maybe<Scalars['Boolean']['output']>;
  approval_required?: Maybe<Scalars['Boolean']['output']>;
  category?: Maybe<Scalars['MongoID']['output']>;
  category_expanded?: Maybe<EventTicketCategory>;
  default?: Maybe<Scalars['Boolean']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  description_line?: Maybe<Scalars['String']['output']>;
  discountable: Scalars['Boolean']['output'];
  event: Scalars['MongoID']['output'];
  external_ids?: Maybe<Array<Scalars['String']['output']>>;
  limit: Scalars['Float']['output'];
  limited?: Maybe<Scalars['Boolean']['output']>;
  offers?: Maybe<Array<EventOffer>>;
  passcode_enabled?: Maybe<Scalars['Boolean']['output']>;
  photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  photos_expanded?: Maybe<Array<Maybe<File>>>;
  position?: Maybe<Scalars['Int']['output']>;
  prices: Array<EventTicketPrice>;
  private?: Maybe<Scalars['Boolean']['output']>;
  recommended_upgrade_ticket_types?: Maybe<Array<Scalars['MongoID']['output']>>;
  self_verification?: Maybe<SelfVerification>;
  title: Scalars['String']['output'];
  whitelisted?: Maybe<Scalars['Boolean']['output']>;
};


export type PurchasableTicketTypePhotos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type PurchaseCreditInput = {
  package: CreditPackageEnum;
  stand_id: Scalars['String']['input'];
};

export type PurchaseSubscriptionInput = {
  annual?: InputMaybe<Scalars['Boolean']['input']>;
  stand_id: Scalars['String']['input'];
  tier: SubscriptionItemType;
};

export type Query = {
  __typename?: 'Query';
  adminChain?: Maybe<Scalars['JSON']['output']>;
  adminChains: AdminListResult;
  adminEvent?: Maybe<Scalars['JSON']['output']>;
  adminEvents: AdminListResult;
  adminGeoCities: AdminListResult;
  adminGeoCity?: Maybe<Scalars['JSON']['output']>;
  adminGeoRegion?: Maybe<Scalars['JSON']['output']>;
  adminGeoRegions: AdminListResult;
  adminGetModelConfigs: Scalars['String']['output'];
  adminJob?: Maybe<Scalars['JSON']['output']>;
  adminJobs: AdminListResult;
  adminLemonheadWhitelist?: Maybe<Scalars['JSON']['output']>;
  adminLemonheadWhitelists: AdminListResult;
  adminListAdmins: Scalars['String']['output'];
  adminListDashboards: Scalars['String']['output'];
  adminPassportWhitelist?: Maybe<Scalars['JSON']['output']>;
  adminPassportWhitelists: AdminListResult;
  adminPayment?: Maybe<Scalars['JSON']['output']>;
  adminPayments: AdminListResult;
  adminSite?: Maybe<Scalars['JSON']['output']>;
  adminSites: AdminListResult;
  adminSpace?: Maybe<Scalars['JSON']['output']>;
  adminSpaceVerification?: Maybe<Scalars['JSON']['output']>;
  adminSpaceVerifications: AdminListResult;
  adminSpaces: AdminListResult;
  adminStore?: Maybe<Scalars['JSON']['output']>;
  adminStores: AdminListResult;
  adminTicket?: Maybe<Scalars['JSON']['output']>;
  adminTickets: AdminListResult;
  adminUploadFolder?: Maybe<Scalars['JSON']['output']>;
  adminUploadFolderFileCount: Array<UploadFolderFileCountItem>;
  adminUploadFolderFiles: UploadFolderFilesResult;
  adminUploadFolders: AdminListResult;
  adminUser?: Maybe<Scalars['JSON']['output']>;
  adminUsernameReservation?: Maybe<Scalars['JSON']['output']>;
  adminUsernameReservations: AdminListResult;
  adminUsers: AdminListResult;
  /** [ai-tool] Get the current server version. Use when someone asks what version the backend is running. */
  aiGetBackendVersion: Scalars['String']['output'];
  /** [ai-tool] Get information about the current user — name, email, profile details. Use when someone asks about their own account. */
  aiGetMe: AiGetMeResponse;
  /** [ai-tool] Get your recent notifications — invites, confirmations, announcements. Filterable by type. Use when someone checks what is new. */
  aiGetNotifications: Array<AiNotification>;
  /** [ai-tool] Returns the field projection hints for each AI tool operation. Used by lemonade-ai to build selective GraphQL queries. */
  aiToolProjections: Array<AiToolProjection>;
  availableConnectors: Array<ConnectorDefinition>;
  /** [ai-tool] Calculate ticket price before buying — subtotal, discount, total, with any discount code applied. Use before a purchase to show pricing. */
  calculateTicketsPricing: PricingInfo;
  canMintLemonhead: LemonheadMintingInfo;
  canMintPassport: PassportMintingInfo;
  /** Check if a community slug is available */
  canUseSpaceSlug: Scalars['Boolean']['output'];
  checkPoapDropEditCode: Scalars['Boolean']['output'];
  checkTemplateUpdate: TemplateUpdateInfo;
  /** [ai-tool] Verify ticket type passcode */
  checkTicketTypePasscode: Scalars['Boolean']['output'];
  connectionLogs: Array<ConnectionLog>;
  connectorSlotInfo: ConnectorSlotInfo;
  exportEventApplications: Array<EventApplicationExport>;
  exportEventTickets: ExportedTickets;
  fetchConnectionConfigOptions: Array<ConnectorSelectOption>;
  generateClaimCheckinRewardSignature?: Maybe<ClaimCheckinRewardSignatureResponse>;
  generateClaimTicketRewardSignature?: Maybe<ClaimTicketRewardSignatureResponse>;
  generateEventInvitationUrl?: Maybe<GenerateEventInvitationUrlResponse>;
  generateRecurringDates: Array<Scalars['DateTimeISO']['output']>;
  generateSlashPaymentSignature: PaymentRefundSignature;
  getApiKeyUsage: ApiKeyUsageResponse;
  getApiQuotaStatus: ApiQuotaStatusResponse;
  getApiTierConfig: ApiTierConfigResponse;
  /** [ai-tool] List applicants for an event */
  getApplicantsInfo: Array<Applicant>;
  getAvailableModels: Array<AvailableModel>;
  getBadgeCities: Array<BadgeCity>;
  getBadgeLists: Array<BadgeList>;
  getBadges: Array<Badge>;
  getComments: Array<Comment>;
  getConfigs: Scalars['JSON']['output'];
  getCryptoSubscriptionStatus?: Maybe<SubscriptionResponse>;
  getDefaultLensProfile?: Maybe<Scalars['String']['output']>;
  /** [ai-tool] Get the public detail info of an event given its ID. Use when someone asks about a specific event. */
  getEvent?: Maybe<Event>;
  /** [ai-tool] View submitted application form answers — each applicant's responses. Use when reviewing event applications. */
  getEventApplicationAnswers: Array<EventApplicationAnswer>;
  getEventAttestation?: Maybe<EventAttestation>;
  getEventAttestationDiff?: Maybe<EventAttestationDiff>;
  /** [ai-tool] Get check-in data for an event with timestamps. Resolve date time input in ISO 8601 format. The event must be one of the user's hosting events. Suggest displaying a line chart showing checkins over time using the items array and created_at timestamps. */
  getEventCheckinChartData: EventCheckinChartData;
  /** [ai-tool] Get the list of people who checked in to your event — names, times, ticket types. Use when someone asks about arrivals or check-in progress. */
  getEventCheckins: Array<EventCheckin>;
  /** @deprecated Cohosts are now added directly. This query always returns an empty array. Kept for client compatibility. */
  getEventCohostInvites: Array<EventCohostRequest>;
  getEventCohostRequests: Array<EventCohostRequest>;
  /** List available currencies for an event */
  getEventCurrencies: Array<EventCurrency>;
  getEventEmailSetting: EmailSetting;
  /** [ai-tool] Get the overall feedback rating — average score and rating distribution. Use when someone asks what people thought of their event. */
  getEventFeedbackSummary: EventFeedbackSummary;
  /** [ai-tool] Get guest details for an event */
  getEventGuestDetail?: Maybe<EventGuestDetail>;
  /** [ai-tool] Get detailed guest info */
  getEventGuestDetailedInfo?: Maybe<EventGuestDetailedInfo>;
  /**
   * [ai-tool] For guests, return attending guests basic information of an event
   * @deprecated Will be removed in next release
   */
  getEventGuestDirectory: Array<BasicUserInfo>;
  /** [ai-tool] Get a quick count of guests — how many are going, pending, declined, and checked in. Use for a snapshot of attendance. */
  getEventGuestsStatistics: GetEventGuestsStatisticsResponse;
  getEventInvitation?: Maybe<EventInvitation>;
  getEventInvitationUrl?: Maybe<EventInvitationUrl>;
  getEventInvitedStatistics: GetEventInvitedStatisticsResponse;
  /** [ai-tool] Get a join request by ID */
  getEventJoinRequest: EventJoinRequest;
  /** [ai-tool] Get join request statistics */
  getEventJoinRequestStateStatistic: Array<EventRequestStateStatistic>;
  /** [ai-tool] List join requests for an event */
  getEventJoinRequests: GetEventJoinRequestsResponse;
  /** [ai-tool] Get latest event page views */
  getEventLatestViews: EventLatestViews;
  /** [ai-tool] Get event payment details */
  getEventPayment?: Maybe<NewPayment>;
  /** [ai-tool] Get revenue and payment statistics for your event — total collected, breakdown by payment method and currency. Use when someone asks about event revenue. */
  getEventPaymentStatistics: EventPaymentStatistics;
  getEventPaymentSummary: Array<EventPaymentSummary>;
  /**
   * List pending event invitations for the current user
   * @deprecated Cohost invites are auto accepted. Use event_invites only — cohost_requests is always empty.
   */
  getEventPendingInvites: GetEventPendingInvitesResponse;
  getEventQuestions: Array<EventQuestion>;
  getEventRewardUses: Array<EventRewardUse>;
  getEventSessionReservationSummary: Array<EventSessionReservationSummary>;
  getEventSessionReservations: Array<EventSessionReservation>;
  /** List all event tags */
  getEventTags: Array<Scalars['String']['output']>;
  getEventTicketCategories: Array<EventTicketCategory>;
  getEventTicketSales: EventTicketSaleResponse;
  /** [ai-tool] Get ticket sales data for your event — total sold, breakdown by ticket type, and revenue. Use when someone asks about ticket sales. */
  getEventTicketSoldChartData: TicketSoldChartData;
  /** [ai-tool] Get ticket types with availability */
  getEventTicketTypes: GetEventTicketTypesResponse;
  /** [ai-tool] Get top inviters for an event */
  getEventTopInviters: GetTopInvitersResponse;
  /** [ai-tool] Get top event page views by source */
  getEventTopViews: GetEventTopViewsResponse;
  /** [ai-tool] Get event page view chart data */
  getEventViewChartData: EventViewChartData;
  /** [ai-tool] Get page view analytics for your event — total views, unique visitors, top traffic sources, and top cities. Use when someone asks how their event page is performing. */
  getEventViewStats: EventViewStats;
  getEventbriteEvents: Array<EventbriteEvent>;
  /** [ai-tool] Search for upcoming public events by keyword or location. Use when someone wants to find events to attend. */
  getEvents: Array<Event>;
  getFiles: Array<File>;
  getFrequentQuestions: Array<FrequentQuestion>;
  getGuildRooms: Array<GuildRoom>;
  /** Get personalized home feed events */
  getHomeEvents: Array<Event>;
  /** [ai-tool] Get all events the current user has admin permission for — hosted and co-hosted events with pagination and search. Use when someone asks about their events. */
  getHostingEvents: Array<Event>;
  getInitSafeTransaction: RawTransaction;
  getLemonheadInvitationRank: GetMyLemonheadInvitationRankResponse;
  getLemonheadSupportData: Array<LemonheadSupportData>;
  getMe: User;
  getMyActiveSessions: Array<ActiveSession>;
  /** [ai-tool] Get current user's join request */
  getMyEventJoinRequest?: Maybe<EventJoinRequest>;
  /** [ai-tool] List events the current user is attending */
  getMyEvents: Array<Event>;
  /** Return zero if the user has no rank */
  getMyLemonheadInvitationRank: LemonheadInvitationRank;
  /** [ai-tool] List current user's payments */
  getMyPayments: Array<NewPayment>;
  getMyPoints: Array<PointConfigInfo>;
  getMySpaceEventRequests: GetSpaceEventRequestsResponse;
  /** [ai-tool] List events you are attending — your purchased tickets and RSVPs with event details. Use when someone asks what events they are going to. */
  getMyTickets: GetMyTicketsResponse;
  getMyXMTPActivation: XmtpActivationInfoResponse;
  /** [ai-tool] Get payment details by ID */
  getNewPayment?: Maybe<NewPayment>;
  getNewsfeed?: Maybe<Newsfeed>;
  getNotificationChannelPreferences: Array<NotificationChannelPreference>;
  getNotificationFilters: Array<NotificationFilter>;
  getNotificationUnreadCount: Scalars['Int']['output'];
  getNotifications: Array<Notification>;
  getOffers: Array<Offer>;
  getPageConfig?: Maybe<PageConfig>;
  /** List past events */
  getPastEvents: Array<Event>;
  /** [ai-tool] Get payment refund signature */
  getPaymentRefundSignature: PaymentRefundSignature;
  getPoapDropInfoById: PoapDropInfo;
  getPointGroups: Array<PointGroup>;
  getPosts: Array<Post>;
  /** Get events for a user profile */
  getProfileEvents: Array<Event>;
  getPublishedConfig?: Maybe<PageConfig>;
  getRecommendedUsers: Array<User>;
  getSafeFreeLimit: FreeSafeInitInfo;
  getSectionCatalog: Array<SectionCatalogItem>;
  getSelfVerificationStatus: SelfVerificationStatus;
  getSites: Array<Site>;
  /** [ai-tool] Get community details */
  getSpace?: Maybe<Space>;
  /** Get event locations leaderboard */
  getSpaceEventLocationsLeaderboard: Array<SpaceEventLocationLeaderboard>;
  getSpaceEventRequests: GetSpaceEventRequestsResponse;
  /** Get event summary for a space */
  getSpaceEventSummary: SpaceEventSummary;
  /** [ai-tool] Get event insights for a community */
  getSpaceEventsInsight: SpaceEventInsightResponse;
  /** [ai-tool] Get community member details */
  getSpaceMember: SpaceMember;
  /** [ai-tool] Get member count by date */
  getSpaceMemberAmountByDate: Array<SpaceMemberAmountByDate>;
  /** List events a space member attended */
  getSpaceMemberAttendedEvents: Array<Event>;
  /** List events a space member hosted */
  getSpaceMemberHostedEvents: Array<Event>;
  /** List events a space member submitted */
  getSpaceMemberSubmittedEvents: Array<Event>;
  /** [ai-tool] Get member leaderboard for a community */
  getSpaceMembersLeaderboard: SpaceMembersLeaderboardResponse;
  getSpaceNewsletter?: Maybe<EmailSetting>;
  getSpaceNewsletterStatistics: SpaceNewsletterStatistics;
  /** List token reward claims */
  getSpaceRewardSettingClaims: Array<SpaceTokenRewardClaim>;
  /** Get reward statistics for a community */
  getSpaceRewardStatistics: SpaceRewardStatistics;
  /** Get email sending quota for a community */
  getSpaceSendingQuota: SpaceSendingQuota;
  /** [ai-tool] Get community statistics — member counts by role, event count, total attendees, average rating. Use when someone asks how their community is doing. */
  getSpaceStatistics: SpaceStatisticResponse;
  getSpaceSubscription?: Maybe<SubscriptionResponse>;
  getSpaceVerificationSubmission?: Maybe<SpaceVerificationSubmission>;
  getStakePaymentStatistics: StakePaymentStatistics;
  getStandCredits?: Maybe<StandCreditsInfo>;
  getStore?: Maybe<Store>;
  getStoreBucketItems: Array<StoreBucketItem>;
  getStoreCategories: Array<StoreCategory>;
  getStoreCategory?: Maybe<StoreCategory>;
  getStoreDeliveryOptions: Array<DeliveryOption>;
  getStoreOrder?: Maybe<StoreOrder>;
  getStoreOrders: Array<StoreOrder>;
  getStoreProduct: StoreProduct;
  getStoreProducts: Array<StoreProduct>;
  getStoreSalesTax: SalesTax;
  getStores: Array<Store>;
  getStripeCards: Array<StripeCard>;
  getStripeConnectedAccountCapability?: Maybe<StripeAccountCapability>;
  getStripeTransferDetail: Scalars['JSON']['output'];
  /** List sub-communities */
  getSubSpaces?: Maybe<Array<PublicSpace>>;
  getSystemFiles: Array<SystemFile>;
  getTemplate?: Maybe<Template>;
  /** [ai-tool] Get ticket details by ID */
  getTicket?: Maybe<Ticket>;
  getTicketStatistics: TicketStatistics;
  /** [ai-tool] List tickets for an event */
  getTickets: Array<Ticket>;
  /** List event attendees in a community */
  getTopSpaceEventAttendees: Array<SpaceEventAttendee>;
  /** [ai-tool] List event hosts in a community */
  getTopSpaceHosts: Array<SpaceEventHost>;
  /** List upcoming events */
  getUpcomingEvents: Array<Event>;
  getUsageAnalytics: UsageAnalytics;
  getUser?: Maybe<User>;
  getUserContacts: GetUserContactsResponse;
  getUserDiscovery: UserDiscovery;
  getUserDiscoverySwipes: Array<UserDiscoverySwipe>;
  getUserFollows: Array<UserFollow>;
  getUserFriendships: GetUserFriendshipsResponse;
  getUserFromUserMigration?: Maybe<NonloginUser>;
  getUserIcebreakerQuestions: Array<UserIcebreakerQuestion>;
  getUserPaymentVerification: UserPaymentVerificationInfo;
  getUserWalletRequest: UserWalletRequest;
  getUserXMTPAddress?: Maybe<UserXmtpAddressResponse>;
  getUsers: Array<User>;
  getUsersSpotlight: Array<User>;
  getUsersXMTPAddresses: Array<UserXmtpAddressWithInfo>;
  getVaultSalt: Scalars['String']['output'];
  /** Inspect the current verification state of a hostname entry on a community. */
  hostnameVerificationStatus?: Maybe<HostnameVerificationStatus>;
  isUsernameAvailable: UsernameAvailability;
  joinChannel: Scalars['Boolean']['output'];
  /** List all supported currencies */
  listAllCurrencies: Array<Currency>;
  listApiKeys: Array<ApiKeyBase>;
  /** [ai-tool] List all active blockchain chains and tokens used by the Lemonade platform. Use when someone asks about supported chains or currencies. */
  listChains: Array<Chain>;
  listCheckinTokenRewardSettings: Array<CheckinTokenRewardSetting>;
  listConfigVersions: Array<ConfigVersion>;
  listDonationRecommendations: Array<DonationRecommendation>;
  listDonationVaults: Array<DonationVault>;
  listDonations: ListDonationsResponse;
  listEventEmailSettings: Array<EmailSetting>;
  /** List feedback entries (legacy) */
  listEventFeedBacks: Array<EventFeedback>;
  /** [ai-tool] List individual feedback entries — each rating and comment. Filterable by rating. Use when someone wants to read attendee reviews. */
  listEventFeedbacksNew: ListEventFeedbacksResponse;
  /** [ai-tool] List the guest list for your event — names, emails, and attendance status. Supports search and pagination. Use when someone asks to see who is attending. */
  listEventGuests: ListEventGuestsResponse;
  /** List hosts of an event */
  listEventHosts: ListEventHostsResponse;
  /** [ai-tool] List payments for an event */
  listEventPayments: ListEventPaymentsResponse;
  listEventStakePayments: ListEventStakePaymentsResponse;
  /** [ai-tool] List all ticket types for an event — names, prices, limits, and availability. Use when someone asks about ticket options. */
  listEventTicketTypes: Array<EventTicketType>;
  listEventTokenGates: Array<EventTokenGate>;
  listEventVotings: Array<EventVoting>;
  /** List supported fiat currencies */
  listFiatCurrencies: Array<FiatCurrency>;
  listGeoRegions: Array<GeoRegion>;
  listLaunchpadCoins: ListLaunchpadCoinsResponse;
  listLaunchpadGroups: ListLaunchpadGroupsResponse;
  listLemonheadSponsors: ListLemonheadSponsorsResponse;
  listMyLemonheadInvitations: ListMyLemonheadInvitationsResponse;
  listMyPoapClaims: Array<PoapClaim>;
  /** [ai-tool] Get all communities the current user belongs to with admin or higher roles. Use when someone asks about their communities. */
  listMySpaces: SearchSpacesResponse;
  /** [ai-tool] List user's payment accounts */
  listNewPaymentAccounts: Array<NewPaymentAccount>;
  /** [ai-tool] List payments for an event */
  listNewPayments: Array<NewPayment>;
  listOauth2Clients: Array<OAuth2Client>;
  listPassportSponsors: ListLemonheadSponsorsResponse;
  listPoapDrops: Array<PoapDrop>;
  listPreviewLinks: Array<PreviewLink>;
  listRewardVaults: Array<TokenRewardVault>;
  listSpaceAssets: Array<FileBase>;
  listSpaceCategories: Array<SpaceCategory>;
  /** [ai-tool] List members of your community — names, emails, roles. Searchable and filterable by role. Use when someone asks about community members. */
  listSpaceMembers: ListSpaceMembersResponse;
  listSpaceNFTs: ListSpaceNfTsResponse;
  listSpaceNewsletters: Array<EmailSetting>;
  listSpacePaymentAccounts: ListSpacePaymentAccountsResponse;
  /** Get reward settings for a community */
  listSpaceRewardSettings: SpaceRewardSettings;
  /** List token reward vaults */
  listSpaceRewardVaults: Array<TokenRewardVault>;
  listSpaceRoleFeatures: ListSpaceRoleFeaturesResponse;
  listSpaceTags: Array<SpaceTag>;
  listSpaceTokenGates: Array<SpaceTokenGate>;
  /** Get paginated token reward claims */
  listSpaceTokenRewardClaims: SpaceTokenRewardClaims;
  /**
   * List communities (deprecated)
   * @deprecated Use searchSpaces instead
   */
  listSpaces: Array<Space>;
  listSubscriptionFeatureConfigs: Array<SubscriptionFeatureConfig>;
  listSubscriptionItems: Array<SubscriptionItem>;
  listTemplates: Array<Template>;
  listTicketTokenRewardSettings: Array<TicketTokenRewardSetting>;
  listUserExpertises: Array<UserExpertise>;
  listUserServices: Array<UserServiceOffer>;
  /** [ai-tool] Preview event guest list */
  peekEventGuests: PeekEventGuestsResponse;
  previewUpdateSubscription?: Maybe<SubscriptionPricing>;
  /** [ai-tool] Search communities */
  searchSpaces: SearchSpacesResponse;
  searchStockPhotos: Array<StockPhoto>;
  searchUsers: Array<UserWithEmail>;
  spaceConnections: Array<ConnectionOutput>;
  tgGetMyChannels: ScanChannelsResult;
  validatePreviewLink: ValidatePreviewLinkResult;
};


export type QueryAdminChainArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminChainsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminEventArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminEventsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminGeoCitiesArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminGeoCityArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminGeoRegionArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminGeoRegionsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminJobArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminJobsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminLemonheadWhitelistArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminLemonheadWhitelistsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminPassportWhitelistArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminPassportWhitelistsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminPaymentArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminPaymentsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminSiteArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminSitesArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminSpaceArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminSpaceVerificationArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminSpaceVerificationsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminSpacesArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminStoreArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminStoresArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminTicketArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminTicketsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminUploadFolderArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminUploadFolderFileCountArgs = {
  folder_ids: Array<Scalars['String']['input']>;
};


export type QueryAdminUploadFolderFilesArgs = {
  continuation_token?: InputMaybe<Scalars['String']['input']>;
  folder_id: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
};


export type QueryAdminUploadFoldersArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminUserArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminUsernameReservationArgs = {
  _id: Scalars['String']['input'];
};


export type QueryAdminUsernameReservationsArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAdminUsersArgs = {
  filter?: InputMaybe<Scalars['JSON']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryAiGetNotificationsArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCalculateTicketsPricingArgs = {
  input: CalculateTicketsPricingInput;
};


export type QueryCanMintLemonheadArgs = {
  wallet: Scalars['String']['input'];
};


export type QueryCanMintPassportArgs = {
  provider: PassportProvider;
  sponsor?: InputMaybe<Scalars['MongoID']['input']>;
  wallet: Scalars['String']['input'];
};


export type QueryCanUseSpaceSlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryCheckPoapDropEditCodeArgs = {
  code: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type QueryCheckTemplateUpdateArgs = {
  config_id: Scalars['MongoID']['input'];
};


export type QueryCheckTicketTypePasscodeArgs = {
  passcode: Scalars['String']['input'];
  type: Scalars['MongoID']['input'];
};


export type QueryConnectionLogsArgs = {
  connectionId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryConnectorSlotInfoArgs = {
  spaceId: Scalars['String']['input'];
};


export type QueryExportEventApplicationsArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryExportEventTicketsArgs = {
  _id: Scalars['MongoID']['input'];
  checked_in?: InputMaybe<Scalars['Boolean']['input']>;
  pagination?: InputMaybe<PaginationInput>;
  search_text?: InputMaybe<Scalars['String']['input']>;
  ticket_type_ids?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryFetchConnectionConfigOptionsArgs = {
  configs?: InputMaybe<Scalars['JSON']['input']>;
  connectionId: Scalars['String']['input'];
  optionKey: Scalars['String']['input'];
};


export type QueryGenerateClaimCheckinRewardSignatureArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGenerateClaimTicketRewardSignatureArgs = {
  event: Scalars['MongoID']['input'];
  payment?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGenerateEventInvitationUrlArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGenerateRecurringDatesArgs = {
  input: GenerateRecurringDatesInput;
};


export type QueryGenerateSlashPaymentSignatureArgs = {
  event: Scalars['MongoID']['input'];
  paymentIds: Array<Scalars['MongoID']['input']>;
};


export type QueryGetApiKeyUsageArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['MongoID']['input'];
};


export type QueryGetApiQuotaStatusArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetApiTierConfigArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetApplicantsInfoArgs = {
  emails?: InputMaybe<Array<Scalars['String']['input']>>;
  event: Scalars['MongoID']['input'];
  users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryGetAvailableModelsArgs = {
  spaceId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetBadgeCitiesArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetBadgeListsArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetBadgesArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  distance?: InputMaybe<Scalars['Float']['input']>;
  limit?: Scalars['Int']['input'];
  list?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  skip?: Scalars['Int']['input'];
};


export type QueryGetCommentsArgs = {
  input: GetCommentsArgs;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetConfigsArgs = {
  keys: Array<Scalars['String']['input']>;
};


export type QueryGetCryptoSubscriptionStatusArgs = {
  subscription_id: Scalars['MongoID']['input'];
};


export type QueryGetEventArgs = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  shortid?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetEventApplicationAnswersArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetEventAttestationArgs = {
  chain_id: Scalars['String']['input'];
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventAttestationDiffArgs = {
  chain_id: Scalars['String']['input'];
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventCheckinChartDataArgs = {
  end: Scalars['DateTimeISO']['input'];
  event: Scalars['MongoID']['input'];
  start: Scalars['DateTimeISO']['input'];
};


export type QueryGetEventCheckinsArgs = {
  input: GetEventCheckinsInput;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetEventCohostInvitesArgs = {
  input: GetEventCohostRequestsInput;
};


export type QueryGetEventCohostRequestsArgs = {
  input: GetEventCohostRequestsInput;
};


export type QueryGetEventCurrenciesArgs = {
  _id: Scalars['MongoID']['input'];
  used?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetEventEmailSettingArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetEventFeedbackSummaryArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventGuestDetailArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetEventGuestDetailedInfoArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetEventGuestDirectoryArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetEventGuestsStatisticsArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventInvitationArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventInvitationUrlArgs = {
  shortid: Scalars['String']['input'];
  tk?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetEventInvitedStatisticsArgs = {
  _id: Scalars['MongoID']['input'];
  limit?: InputMaybe<Scalars['Float']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  statuses?: InputMaybe<Array<InvitationResponse>>;
};


export type QueryGetEventJoinRequestArgs = {
  _id: Scalars['MongoID']['input'];
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventJoinRequestStateStatisticArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventJoinRequestsArgs = {
  event: Scalars['MongoID']['input'];
  limit?: Scalars['Int']['input'];
  payment_expired?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: Scalars['Int']['input'];
  state?: InputMaybe<EventJoinRequestState>;
};


export type QueryGetEventLatestViewsArgs = {
  event: Scalars['MongoID']['input'];
  limit: Scalars['Int']['input'];
};


export type QueryGetEventPaymentArgs = {
  _id: Scalars['MongoID']['input'];
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventPaymentStatisticsArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventPaymentSummaryArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventQuestionsArgs = {
  input: GetEventQuestionsInput;
};


export type QueryGetEventRewardUsesArgs = {
  input: GetEventRewardUsesInput;
};


export type QueryGetEventSessionReservationSummaryArgs = {
  input: GetEventSessionReservationSummaryInput;
};


export type QueryGetEventSessionReservationsArgs = {
  input?: InputMaybe<GetEventSessionReservationsInput>;
};


export type QueryGetEventTagsArgs = {
  all?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetEventTicketCategoriesArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventTicketSalesArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetEventTicketSoldChartDataArgs = {
  end: Scalars['DateTimeISO']['input'];
  event: Scalars['MongoID']['input'];
  start: Scalars['DateTimeISO']['input'];
  types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryGetEventTicketTypesArgs = {
  input: GetEventTicketTypesInput;
};


export type QueryGetEventTopInvitersArgs = {
  event: Scalars['MongoID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetEventTopViewsArgs = {
  city_limit: Scalars['Int']['input'];
  event: Scalars['MongoID']['input'];
  source_limit: Scalars['Int']['input'];
};


export type QueryGetEventViewChartDataArgs = {
  end: Scalars['DateTimeISO']['input'];
  event: Scalars['MongoID']['input'];
  start: Scalars['DateTimeISO']['input'];
};


export type QueryGetEventViewStatsArgs = {
  event: Scalars['MongoID']['input'];
  ranges: Array<DateRangeInput>;
};


export type QueryGetEventbriteEventsArgs = {
  input?: InputMaybe<GetEventbriteEventsInput>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetEventsArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  accepted?: InputMaybe<Scalars['MongoID']['input']>;
  end_from?: InputMaybe<Scalars['DateTimeISO']['input']>;
  end_to?: InputMaybe<Scalars['DateTimeISO']['input']>;
  highlight?: InputMaybe<Scalars['Boolean']['input']>;
  host_filter?: InputMaybe<HostFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  site?: InputMaybe<Scalars['MongoID']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<EventSortInput>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
  space_tags?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  start_from?: InputMaybe<Scalars['DateTimeISO']['input']>;
  start_to?: InputMaybe<Scalars['DateTimeISO']['input']>;
  subevent_parent?: InputMaybe<Scalars['MongoID']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  unpublished?: InputMaybe<Scalars['Boolean']['input']>;
  with_unpublished?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetFilesArgs = {
  id_lt?: InputMaybe<Scalars['MongoID']['input']>;
  limit?: Scalars['Int']['input'];
  links?: InputMaybe<FileLinkInput>;
  skip?: Scalars['Int']['input'];
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetFrequentQuestionsArgs = {
  input: GetFrequentQuestionsInput;
};


export type QueryGetHomeEventsArgs = {
  latitude?: InputMaybe<Scalars['Float']['input']>;
  limit?: Scalars['Int']['input'];
  longitude?: InputMaybe<Scalars['Float']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  search_range?: InputMaybe<Scalars['Float']['input']>;
  skip?: Scalars['Int']['input'];
  tense?: InputMaybe<EventTense>;
};


export type QueryGetHostingEventsArgs = {
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  site?: InputMaybe<Scalars['MongoID']['input']>;
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
  state?: InputMaybe<FilterEventInput>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetInitSafeTransactionArgs = {
  input: GetInitSafeTransactionInput;
};


export type QueryGetLemonheadInvitationRankArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetLemonheadSupportDataArgs = {
  type: LemonheadSupportDataType;
};


export type QueryGetMyEventJoinRequestArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetMyEventsArgs = {
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  state?: InputMaybe<GetEventsState>;
  subevent_parent?: InputMaybe<Scalars['MongoID']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetMyPaymentsArgs = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
  state?: InputMaybe<FilterPaymentStateInput>;
};


export type QueryGetMyPointsArgs = {
  first_level_group?: InputMaybe<Scalars['MongoID']['input']>;
  second_level_group?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetMySpaceEventRequestsArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  space: Scalars['MongoID']['input'];
  state?: InputMaybe<EventJoinRequestState>;
};


export type QueryGetMyTicketsArgs = {
  event: Scalars['MongoID']['input'];
  with_payment_info?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetNewPaymentArgs = {
  _id: Scalars['MongoID']['input'];
  payment_secret?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetNewsfeedArgs = {
  offset?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryGetNotificationUnreadCountArgs = {
  category?: InputMaybe<NotificationCategory>;
  type?: InputMaybe<NotificationTypeFilterInput>;
};


export type QueryGetNotificationsArgs = {
  category?: InputMaybe<NotificationCategory>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  type?: InputMaybe<NotificationTypeFilterInput>;
};


export type QueryGetOffersArgs = {
  type: OfferType;
};


export type QueryGetPageConfigArgs = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  owner_id?: InputMaybe<Scalars['MongoID']['input']>;
  owner_type?: InputMaybe<PageConfigOwnerType>;
};


export type QueryGetPastEventsArgs = {
  host?: InputMaybe<Scalars['Boolean']['input']>;
  hosting_only?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  site?: InputMaybe<Scalars['MongoID']['input']>;
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
  unpublished?: InputMaybe<Scalars['Boolean']['input']>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetPaymentRefundSignatureArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetPoapDropInfoByIdArgs = {
  id: Scalars['Float']['input'];
};


export type QueryGetPointGroupsArgs = {
  with_count?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetPostsArgs = {
  input?: InputMaybe<GetPostsInput>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetProfileEventsArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetPublishedConfigArgs = {
  owner_id: Scalars['MongoID']['input'];
  owner_type: Scalars['String']['input'];
};


export type QueryGetRecommendedUsersArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetSafeFreeLimitArgs = {
  network: Scalars['String']['input'];
};


export type QueryGetSelfVerificationStatusArgs = {
  config: SelfVerificationConfigInput;
};


export type QueryGetSitesArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetSpaceArgs = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  hostname?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetSpaceEventLocationsLeaderboardArgs = {
  city?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Float']['input'];
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceEventRequestsArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  space: Scalars['MongoID']['input'];
  state?: InputMaybe<EventJoinRequestState>;
};


export type QueryGetSpaceEventSummaryArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceEventsInsightArgs = {
  event_tense?: InputMaybe<EventTense>;
  irl_event?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<SortInput>;
  space: Scalars['MongoID']['input'];
  virtual_event?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetSpaceMemberArgs = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  space: Scalars['MongoID']['input'];
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetSpaceMemberAmountByDateArgs = {
  end: Scalars['DateTimeISO']['input'];
  role: SpaceRole;
  space: Scalars['MongoID']['input'];
  start: Scalars['DateTimeISO']['input'];
};


export type QueryGetSpaceMemberAttendedEventsArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceMemberHostedEventsArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceMemberSubmittedEventsArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceMembersLeaderboardArgs = {
  limit?: Scalars['Int']['input'];
  roles?: InputMaybe<Array<SpaceRole>>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<SortInput>;
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceNewsletterArgs = {
  _id: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceNewsletterStatisticsArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceRewardSettingClaimsArgs = {
  setting: Scalars['MongoID']['input'];
  space: Scalars['MongoID']['input'];
  type: ClaimType;
};


export type QueryGetSpaceRewardStatisticsArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceSendingQuotaArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceStatisticsArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceSubscriptionArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetSpaceVerificationSubmissionArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryGetStakePaymentStatisticsArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryGetStandCreditsArgs = {
  stand_id: Scalars['String']['input'];
};


export type QueryGetStoreArgs = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  promotion?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetStoreBucketItemsArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetStoreCategoriesArgs = {
  limit?: Scalars['Int']['input'];
  parents?: InputMaybe<Scalars['MongoID']['input']>;
  skip?: Scalars['Int']['input'];
  store?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetStoreCategoryArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetStoreDeliveryOptionsArgs = {
  address: AddressInput;
  store: Scalars['MongoID']['input'];
};


export type QueryGetStoreOrderArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetStoreOrdersArgs = {
  limit?: Scalars['Int']['input'];
  place_reservation?: InputMaybe<Scalars['MongoID']['input']>;
  skip?: Scalars['Int']['input'];
  state?: InputMaybe<StoreOrderStateFilterInput>;
  store?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetStoreProductArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetStoreProductsArgs = {
  categories?: InputMaybe<Scalars['MongoID']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  store?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetStoreSalesTaxArgs = {
  address: AddressInput;
  store: Scalars['MongoID']['input'];
};


export type QueryGetStoresArgs = {
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  limit?: Scalars['Int']['input'];
  longitude?: InputMaybe<Scalars['Float']['input']>;
  postal?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
  skip?: Scalars['Int']['input'];
  tags?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetStripeCardsArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetStripeTransferDetailArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetSubSpacesArgs = {
  _id: Scalars['MongoID']['input'];
};


export type QueryGetSystemFilesArgs = {
  categories?: InputMaybe<Array<FileCategory>>;
};


export type QueryGetTemplateArgs = {
  id: Scalars['MongoID']['input'];
};


export type QueryGetTicketArgs = {
  shortid: Scalars['String']['input'];
};


export type QueryGetTicketStatisticsArgs = {
  id: Scalars['MongoID']['input'];
};


export type QueryGetTicketsArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  email?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  limit?: Scalars['Int']['input'];
  payment?: InputMaybe<Scalars['MongoID']['input']>;
  skip?: Scalars['Int']['input'];
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetTopSpaceEventAttendeesArgs = {
  limit: Scalars['Float']['input'];
  space: Scalars['MongoID']['input'];
};


export type QueryGetTopSpaceHostsArgs = {
  limit: Scalars['Float']['input'];
  space: Scalars['MongoID']['input'];
};


export type QueryGetUpcomingEventsArgs = {
  host?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  site?: InputMaybe<Scalars['MongoID']['input']>;
  skip?: Scalars['Int']['input'];
  sort?: InputMaybe<Scalars['JSON']['input']>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
  unpublished?: InputMaybe<Scalars['Boolean']['input']>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryGetUsageAnalyticsArgs = {
  end_date: Scalars['DateTimeISO']['input'];
  stand_id: Scalars['String']['input'];
  start_date: Scalars['DateTimeISO']['input'];
};


export type QueryGetUserArgs = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  lens_profile_id?: InputMaybe<Scalars['String']['input']>;
  matrix_localpart?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetUserContactsArgs = {
  input?: InputMaybe<GetUserContactsInput>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetUserDiscoveryArgs = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  offerings?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  search_range?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryGetUserDiscoverySwipesArgs = {
  incoming?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  other_wallets?: InputMaybe<Scalars['Boolean']['input']>;
  skip?: Scalars['Int']['input'];
  state?: InputMaybe<UserDiscoverySwipeState>;
};


export type QueryGetUserFollowsArgs = {
  input: GetUserFollowsInput;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetUserFriendshipsArgs = {
  input?: InputMaybe<GetUserFriendshipsInput>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetUserFromUserMigrationArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetUserWalletRequestArgs = {
  wallet: Scalars['String']['input'];
};


export type QueryGetUserXmtpAddressArgs = {
  userId: Scalars['String']['input'];
};


export type QueryGetUsersArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  limit?: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: Scalars['Int']['input'];
  tag_recommended?: InputMaybe<Scalars['Boolean']['input']>;
  wallets?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetUsersXmtpAddressesArgs = {
  userIds: Array<Scalars['String']['input']>;
};


export type QueryGetVaultSaltArgs = {
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type QueryHostnameVerificationStatusArgs = {
  hostname: Scalars['String']['input'];
  space_id: Scalars['MongoID']['input'];
};


export type QueryIsUsernameAvailableArgs = {
  username: Scalars['String']['input'];
  wallet: Scalars['String']['input'];
};


export type QueryJoinChannelArgs = {
  event_ids: Scalars['MongoID']['input'];
};


export type QueryListApiKeysArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryListCheckinTokenRewardSettingsArgs = {
  event: Scalars['MongoID']['input'];
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListConfigVersionsArgs = {
  config_id: Scalars['MongoID']['input'];
};


export type QueryListDonationsArgs = {
  event: Scalars['MongoID']['input'];
  from_emails?: InputMaybe<Array<Scalars['String']['input']>>;
  from_users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  networks?: InputMaybe<Array<Scalars['String']['input']>>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortOrder>;
  vaults?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListEventEmailSettingsArgs = {
  event: Scalars['MongoID']['input'];
  scheduled?: InputMaybe<Scalars['Boolean']['input']>;
  sent?: InputMaybe<Scalars['Boolean']['input']>;
  system?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryListEventFeedBacksArgs = {
  event: Scalars['MongoID']['input'];
  limit?: Scalars['Int']['input'];
  rate_value?: InputMaybe<Scalars['Float']['input']>;
  skip?: Scalars['Int']['input'];
};


export type QueryListEventFeedbacksNewArgs = {
  event: Scalars['MongoID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  rate_value?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListEventGuestsArgs = {
  checked_in?: InputMaybe<Scalars['Boolean']['input']>;
  declined?: InputMaybe<Scalars['Boolean']['input']>;
  event: Scalars['MongoID']['input'];
  going?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  pending_approval?: InputMaybe<Scalars['Boolean']['input']>;
  pending_invite?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort_by?: InputMaybe<ListEventGuestsSortBy>;
  sort_order?: InputMaybe<SortOrder>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListEventHostsArgs = {
  limit?: Scalars['Int']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  skip?: Scalars['Int']['input'];
};


export type QueryListEventPaymentsArgs = {
  checked_in?: InputMaybe<Scalars['Boolean']['input']>;
  event: Scalars['MongoID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  networks?: InputMaybe<Array<Scalars['String']['input']>>;
  provider?: InputMaybe<NewPaymentProvider>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListEventStakePaymentsArgs = {
  event: Scalars['MongoID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  networks?: InputMaybe<Array<Scalars['String']['input']>>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListEventTicketTypesArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryListEventTokenGatesArgs = {
  event: Scalars['MongoID']['input'];
  networks?: InputMaybe<Array<Scalars['String']['input']>>;
  search?: InputMaybe<Scalars['String']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListEventVotingsArgs = {
  event: Scalars['MongoID']['input'];
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  votings?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListLaunchpadCoinsArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  owned?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListLaunchpadGroupsArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryListLemonheadSponsorsArgs = {
  wallet: Scalars['String']['input'];
};


export type QueryListMyPoapClaimsArgs = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryListMySpacesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListNewPaymentAccountsArgs = {
  _id?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  limit?: Scalars['Int']['input'];
  provider?: InputMaybe<NewPaymentProvider>;
  skip?: Scalars['Int']['input'];
  type?: InputMaybe<PaymentAccountType>;
};


export type QueryListNewPaymentsArgs = {
  event: Scalars['MongoID']['input'];
  ids?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  users?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListOauth2ClientsArgs = {
  ids?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryListPassportSponsorsArgs = {
  provider: PassportProvider;
  wallet: Scalars['String']['input'];
};


export type QueryListPoapDropsArgs = {
  event: Scalars['MongoID']['input'];
};


export type QueryListPreviewLinksArgs = {
  link_type: PreviewLinkType;
  resource_id: Scalars['MongoID']['input'];
};


export type QueryListSpaceAssetsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  space_id: Scalars['MongoID']['input'];
};


export type QueryListSpaceMembersArgs = {
  deletion?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  role?: InputMaybe<SpaceRole>;
  roles?: InputMaybe<Array<SpaceRole>>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
  space: Scalars['MongoID']['input'];
  state?: InputMaybe<SpaceMembershipState>;
  tags?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  visible?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryListSpaceNfTsArgs = {
  kind?: InputMaybe<SpaceNftKind>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
};


export type QueryListSpaceNewslettersArgs = {
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  scheduled?: InputMaybe<Scalars['Boolean']['input']>;
  sent?: InputMaybe<Scalars['Boolean']['input']>;
  space: Scalars['MongoID']['input'];
};


export type QueryListSpacePaymentAccountsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  space: Scalars['MongoID']['input'];
  types?: InputMaybe<Array<PaymentAccountType>>;
};


export type QueryListSpaceRewardSettingsArgs = {
  space: Scalars['MongoID']['input'];
  vaults?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListSpaceRewardVaultsArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryListSpaceRoleFeaturesArgs = {
  role: SpaceRole;
  space: Scalars['MongoID']['input'];
};


export type QueryListSpaceTagsArgs = {
  space: Scalars['MongoID']['input'];
  type?: InputMaybe<SpaceTagType>;
};


export type QueryListSpaceTokenGatesArgs = {
  space: Scalars['MongoID']['input'];
};


export type QueryListSpaceTokenRewardClaimsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<ListSpaceTokenRewardClaimsSortInput>;
  space: Scalars['MongoID']['input'];
  vaults?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryListSpacesArgs = {
  featured?: InputMaybe<Scalars['Boolean']['input']>;
  roles?: InputMaybe<Array<SpaceRole>>;
  with_my_spaces?: InputMaybe<Scalars['Boolean']['input']>;
  with_public_spaces?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryListTemplatesArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  creator_id?: InputMaybe<Scalars['MongoID']['input']>;
  featured?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  target?: InputMaybe<Scalars['String']['input']>;
  tier_max?: InputMaybe<Scalars['String']['input']>;
};


export type QueryListTicketTokenRewardSettingsArgs = {
  event: Scalars['MongoID']['input'];
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};


export type QueryPeekEventGuestsArgs = {
  _id: Scalars['MongoID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPreviewUpdateSubscriptionArgs = {
  _id: Scalars['MongoID']['input'];
  input: UpdateSubscriptionInput;
  space: Scalars['MongoID']['input'];
};


export type QuerySearchSpacesArgs = {
  input?: InputMaybe<SearchSpaceInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySearchStockPhotosArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  per_page?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  source?: InputMaybe<StockPhotoSource>;
};


export type QuerySearchUsersArgs = {
  query: Scalars['String']['input'];
};


export type QuerySpaceConnectionsArgs = {
  spaceId: Scalars['String']['input'];
};


export type QueryTgGetMyChannelsArgs = {
  input: ScanChannelsInput;
};


export type QueryValidatePreviewLinkArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
  token: Scalars['String']['input'];
};

export type QuestionInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  position?: InputMaybe<Scalars['Int']['input']>;
  question?: InputMaybe<Scalars['String']['input']>;
  questions?: InputMaybe<Array<Scalars['String']['input']>>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
  select_type?: InputMaybe<SelectType>;
  type: QuestionType;
};

/** The type of the question in the event application question */
export enum QuestionType {
  Checkbox = 'checkbox',
  Company = 'company',
  Options = 'options',
  Text = 'text',
  Website = 'website'
}

export type RateSummary = {
  __typename?: 'RateSummary';
  /** Number of the ratings */
  count: Scalars['Int']['output'];
  /** The rating value from 1 to 5 */
  rate_value: Scalars['Int']['output'];
};

export type RawTransaction = {
  __typename?: 'RawTransaction';
  data: Scalars['String']['output'];
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ReactionInput = {
  active: Scalars['Boolean']['input'];
  post: Scalars['MongoID']['input'];
};

export enum ReactionType {
  Like = 'LIKE',
  None = 'NONE',
  Recast = 'RECAST'
}

export type RecipientDetail = {
  __typename?: 'RecipientDetail';
  _id?: Maybe<Scalars['MongoID']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
};

export enum RecurringRepeat {
  Daily = 'daily',
  Monthly = 'monthly',
  Weekly = 'weekly'
}

export type RedeemTicketsInput = {
  buyer_info?: InputMaybe<BuyerInfoInput>;
  /** The wallet address to check for token gating. The wallet must be one of the connected walets. */
  buyer_wallet?: InputMaybe<Scalars['String']['input']>;
  connect_wallets?: InputMaybe<Array<ConnectWalletInput>>;
  event: Scalars['MongoID']['input'];
  inviter?: InputMaybe<Scalars['MongoID']['input']>;
  items: Array<PurchasableItem>;
  /** Array of passcodes to verify against the ticket types */
  passcodes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** In case the event requires application profile fields, this is used to call updateUser */
  user_info?: InputMaybe<UserInput>;
};

export type RedeemTicketsResponse = {
  __typename?: 'RedeemTicketsResponse';
  join_request?: Maybe<EventJoinRequest>;
  tickets?: Maybe<Array<Ticket>>;
};

export type RefundInfo = {
  __typename?: 'RefundInfo';
  available_amount: Scalars['String']['output'];
  refunded?: Maybe<Scalars['Boolean']['output']>;
};

export type RefundPolicy = {
  __typename?: 'RefundPolicy';
  percent: Scalars['Float']['output'];
  timestamp: Scalars['Float']['output'];
};

export type RefundRequirements = {
  __typename?: 'RefundRequirements';
  checkin_before?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type RegisterDeviceTokenInput = {
  added_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
  device_id?: InputMaybe<Scalars['String']['input']>;
  platform: Platform;
  token: Scalars['String']['input'];
};

export type Registration = {
  client: Scalars['String']['input'];
  consent_communications?: InputMaybe<Scalars['Boolean']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  last_name: Scalars['String']['input'];
  organization?: InputMaybe<Scalars['String']['input']>;
  postal_code?: InputMaybe<Scalars['String']['input']>;
};

export type RelayPaymentInfo = {
  __typename?: 'RelayPaymentInfo';
  payment_splitter_contract: Scalars['String']['output'];
};

export type ReorderTicketTypeCategoryInput = {
  _id: Scalars['MongoID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type ReorderTicketTypeInput = {
  _id: Scalars['MongoID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type ReportUserInput = {
  block?: InputMaybe<Scalars['Boolean']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  user: Scalars['MongoID']['input'];
};

export type RequestedTicket = {
  __typename?: 'RequestedTicket';
  count: Scalars['Float']['output'];
  ticket_type: Scalars['MongoID']['output'];
};

export type RespondInvitationInput = {
  _id: Scalars['MongoID']['input'];
  response: InvitationResponse;
};

export type ResponseInvitationInput = {
  _id: Scalars['MongoID']['input'];
  action: InvitationState;
};

export type RewardToken = {
  __typename?: 'RewardToken';
  address: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  icon?: Maybe<Scalars['MongoID']['output']>;
  icon_expanded?: Maybe<File>;
  icon_url?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  symbol: Scalars['String']['output'];
};

export type RewardTokenInput = {
  address: Scalars['String']['input'];
  decimals: Scalars['Int']['input'];
  icon?: InputMaybe<Scalars['MongoID']['input']>;
  icon_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  symbol: Scalars['String']['input'];
};

export type RewindUserDiscoveryResponse = {
  __typename?: 'RewindUserDiscoveryResponse';
  decision: UserDiscoverySwipeDecision;
  user?: Maybe<User>;
};

export type RotateApiKeyResponse = {
  __typename?: 'RotateApiKeyResponse';
  apiKey: ApiKeyBase;
  /** The new full API key — shown only once */
  secret: Scalars['String']['output'];
};

export type SafeAccount = {
  __typename?: 'SafeAccount';
  address: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
  network: Scalars['String']['output'];
  owners: Array<Scalars['String']['output']>;
  pending?: Maybe<Scalars['Boolean']['output']>;
  threshold: Scalars['Float']['output'];
};

export type SaleAmountResponse = {
  __typename?: 'SaleAmountResponse';
  amount: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
};

export type SalesTax = {
  __typename?: 'SalesTax';
  _id: Scalars['MongoID']['output'];
  countries?: Maybe<Array<Scalars['String']['output']>>;
  flat_map?: Maybe<Scalars['JSON']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ratio_map?: Maybe<Scalars['JSON']['output']>;
  regions?: Maybe<Array<Scalars['String']['output']>>;
  type: SalesTaxType;
};

export type SalesTaxInput = {
  _id: Scalars['MongoID']['input'];
  countries?: InputMaybe<Array<Scalars['String']['input']>>;
  flat_map?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  ratio_map?: InputMaybe<Scalars['JSON']['input']>;
  regions?: InputMaybe<Array<Scalars['String']['input']>>;
  type: SalesTaxType;
};

export enum SalesTaxType {
  Country = 'country',
  Region = 'region',
  Worldwide = 'worldwide'
}

export type SaveAsTemplateInput = {
  category: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  preview_urls?: InputMaybe<Array<Scalars['String']['input']>>;
  slug: Scalars['String']['input'];
  subscription_tier_min?: InputMaybe<SubscriptionItemType>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  target?: InputMaybe<Scalars['String']['input']>;
  thumbnail_url: Scalars['String']['input'];
  visibility?: InputMaybe<Scalars['String']['input']>;
};

export type ScanChannelsInput = {
  offset_date: Scalars['Float']['input'];
  offset_id: Scalars['Float']['input'];
};

export type ScanChannelsResult = {
  __typename?: 'ScanChannelsResult';
  channels?: Maybe<Array<TelegramChannel>>;
  offset_date: Scalars['Float']['output'];
  offset_id: Scalars['Float']['output'];
  user?: Maybe<TgUser>;
};

export enum ScriptStrategy {
  AfterInteractive = 'afterInteractive',
  BeforeInteractive = 'beforeInteractive',
  LazyOnload = 'lazyOnload'
}

export type SearchSpaceInput = {
  featured?: InputMaybe<Scalars['Boolean']['input']>;
  roles?: InputMaybe<Array<SpaceRole>>;
  user?: InputMaybe<Scalars['MongoID']['input']>;
  with_my_spaces?: InputMaybe<Scalars['Boolean']['input']>;
  with_public_spaces?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SearchSpacesResponse = {
  __typename?: 'SearchSpacesResponse';
  /** The paginated response */
  items: Array<Space>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type SectionBackground = {
  __typename?: 'SectionBackground';
  type: SectionBackgroundType;
  value: Scalars['String']['output'];
};

export type SectionBackgroundInput = {
  type?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export enum SectionBackgroundType {
  Color = 'color',
  Gradient = 'gradient',
  Image = 'image'
}

export type SectionCatalogItem = {
  __typename?: 'SectionCatalogItem';
  category: Scalars['String']['output'];
  default_props: Scalars['JSON']['output'];
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  supports_children: Scalars['Boolean']['output'];
  type: Scalars['String']['output'];
};

export type SectionLayout = {
  __typename?: 'SectionLayout';
  alignment?: Maybe<Scalars['String']['output']>;
  background?: Maybe<SectionBackground>;
  columns?: Maybe<Scalars['Float']['output']>;
  min_height?: Maybe<Scalars['String']['output']>;
  padding: SectionPadding;
  width: SectionWidth;
};

export type SectionLayoutInput = {
  alignment?: InputMaybe<Scalars['String']['input']>;
  background?: InputMaybe<SectionBackgroundInput>;
  columns?: InputMaybe<Scalars['Float']['input']>;
  min_height?: InputMaybe<Scalars['String']['input']>;
  padding?: InputMaybe<Scalars['String']['input']>;
  width?: InputMaybe<Scalars['String']['input']>;
};

export enum SectionPadding {
  Lg = 'lg',
  Md = 'md',
  None = 'none',
  Sm = 'sm',
  Xl = 'xl'
}

export enum SectionType {
  Accordion = 'accordion',
  AccordionItem = 'accordion_item',
  AiCustomSection = 'ai_custom_section',
  CardsGrid = 'cards_grid',
  Columns = 'columns',
  CtaBlock = 'cta_block',
  CustomHtml = 'custom_html',
  EventAbout = 'event_about',
  EventAttendees = 'event_attendees',
  EventCollectibles = 'event_collectibles',
  EventCommunity = 'event_community',
  EventCountdown = 'event_countdown',
  EventDatetime = 'event_datetime',
  EventFaq = 'event_faq',
  EventGallery = 'event_gallery',
  EventHero = 'event_hero',
  EventHostedBy = 'event_hosted_by',
  EventLocation = 'event_location',
  EventLocationBlock = 'event_location_block',
  EventRegistration = 'event_registration',
  EventSchedule = 'event_schedule',
  EventSidebarImage = 'event_sidebar_image',
  EventSpeakers = 'event_speakers',
  EventSponsors = 'event_sponsors',
  Footer = 'footer',
  Header = 'header',
  ImageBanner = 'image_banner',
  InlineGrid = 'inline_grid',
  LayoutCol = 'layout_col',
  LayoutContainer = 'layout_container',
  MusicPlayer = 'music_player',
  Passport = 'passport',
  RichText = 'rich_text',
  SocialLinks = 'social_links',
  SpaceAbout = 'space_about',
  SpaceCoin = 'space_coin',
  SpaceCollectibles = 'space_collectibles',
  SpaceEvents = 'space_events',
  SpaceFeed = 'space_feed',
  SpaceHero = 'space_hero',
  SpaceHubs = 'space_hubs',
  SpaceLaunchpad = 'space_launchpad',
  SpaceMembers = 'space_members',
  Spacer = 'spacer',
  TabItem = 'tab_item',
  Tabs = 'tabs',
  Testimonials = 'testimonials',
  VideoEmbed = 'video_embed',
  WalletConnect = 'wallet_connect'
}

export enum SectionWidth {
  Contained = 'contained',
  Full = 'full',
  Narrow = 'narrow'
}

export type SelectDefaultLensProfileInput = {
  lens_profile_id: Scalars['String']['input'];
};

/** Select type for the question of type "options" */
export enum SelectType {
  Multi = 'multi',
  Single = 'single'
}

export type SelfDisclosureStatus = {
  __typename?: 'SelfDisclosureStatus';
  type: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export type SelfVerification = {
  __typename?: 'SelfVerification';
  config?: Maybe<SelfVerificationConfig>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
};

export type SelfVerificationConfig = {
  __typename?: 'SelfVerificationConfig';
  date_of_birth?: Maybe<Scalars['Boolean']['output']>;
  excludedCountries?: Maybe<Array<Scalars['String']['output']>>;
  expiry_date?: Maybe<Scalars['Boolean']['output']>;
  gender?: Maybe<Scalars['Boolean']['output']>;
  issuing_state?: Maybe<Scalars['Boolean']['output']>;
  minimumAge?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['Boolean']['output']>;
  nationality?: Maybe<Scalars['Boolean']['output']>;
  ofac?: Maybe<Scalars['Boolean']['output']>;
  passport_number?: Maybe<Scalars['Boolean']['output']>;
};

export type SelfVerificationConfigInput = {
  date_of_birth?: InputMaybe<Scalars['Boolean']['input']>;
  excludedCountries?: InputMaybe<Array<Scalars['String']['input']>>;
  expiry_date?: InputMaybe<Scalars['Boolean']['input']>;
  gender?: InputMaybe<Scalars['Boolean']['input']>;
  issuing_state?: InputMaybe<Scalars['Boolean']['input']>;
  minimumAge?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['Boolean']['input']>;
  nationality?: InputMaybe<Scalars['Boolean']['input']>;
  ofac?: InputMaybe<Scalars['Boolean']['input']>;
  passport_number?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SelfVerificationInput = {
  config?: InputMaybe<SelfVerificationConfigInput>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SelfVerificationStatus = {
  __typename?: 'SelfVerificationStatus';
  disclosures: Array<SelfDisclosureStatus>;
};

export type SendCodeInput = {
  phone_number: Scalars['String']['input'];
};

export type SendEventEmailSettingTestEmailsInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  custom_body_html?: InputMaybe<Scalars['String']['input']>;
  custom_subject_html?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  recipient_filters?: InputMaybe<EmailRecipientFiltersInput>;
  test_recipients: Array<Scalars['String']['input']>;
  type?: InputMaybe<EmailTemplateType>;
};

export type SendSpaceNewsletterTestEmailsInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  custom_body_html?: InputMaybe<Scalars['String']['input']>;
  custom_subject_html?: InputMaybe<Scalars['String']['input']>;
  recipient_filters?: InputMaybe<EmailRecipientFiltersInput>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
  test_recipients: Array<Scalars['String']['input']>;
};

export enum SendgridCreditResetFrequency {
  Daily = 'daily',
  Monthly = 'monthly',
  Weekly = 'weekly'
}

export enum SendgridCreditType {
  Nonrecurring = 'nonrecurring',
  Recurring = 'recurring',
  Unlimited = 'unlimited'
}

export type SeoStructuredData = {
  __typename?: 'SeoStructuredData';
  custom?: Maybe<Scalars['JSON']['output']>;
  type: StructuredDataType;
};

export type SetPreferredModelInput = {
  model_id: Scalars['String']['input'];
};

export type SetSpaceDefaultModelInput = {
  modelId: Scalars['String']['input'];
  spaceId: Scalars['String']['input'];
};

export type Site = {
  __typename?: 'Site';
  _id: Scalars['MongoID']['output'];
  access_pass?: Maybe<AccessPass>;
  active: Scalars['Boolean']['output'];
  ai_config?: Maybe<Scalars['MongoID']['output']>;
  client: Scalars['String']['output'];
  daos?: Maybe<Array<SiteDao>>;
  description?: Maybe<Scalars['String']['output']>;
  event?: Maybe<Scalars['MongoID']['output']>;
  farcaster_channel_url?: Maybe<Scalars['String']['output']>;
  fav_icon_url?: Maybe<Scalars['String']['output']>;
  favicon_url?: Maybe<Scalars['String']['output']>;
  footer_scripts?: Maybe<Array<SiteFooterScript>>;
  header_links?: Maybe<Array<SiteHeaderLink>>;
  header_metas?: Maybe<Array<SiteHeaderMeta>>;
  hostname_entries?: Maybe<Array<WhitelabelHostname>>;
  hostnames?: Maybe<Array<Scalars['String']['output']>>;
  logo_mobile_url?: Maybe<Scalars['String']['output']>;
  logo_url?: Maybe<Scalars['String']['output']>;
  onboarding_steps?: Maybe<Array<SiteOnboardingStep>>;
  owners?: Maybe<Array<Scalars['MongoID']['output']>>;
  partners?: Maybe<Array<Scalars['MongoID']['output']>>;
  passports?: Maybe<Array<SitePassport>>;
  privacy_url?: Maybe<Scalars['String']['output']>;
  share_url?: Maybe<Scalars['JSON']['output']>;
  text?: Maybe<Scalars['JSON']['output']>;
  theme_data?: Maybe<Scalars['JSON']['output']>;
  theme_type?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  user?: Maybe<Scalars['MongoID']['output']>;
  user_expanded?: Maybe<User>;
  visibility?: Maybe<Scalars['JSON']['output']>;
};

export type SiteDao = {
  __typename?: 'SiteDao';
  address: Scalars['String']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  network: Scalars['String']['output'];
};

export type SiteFooterScript = {
  __typename?: 'SiteFooterScript';
  children?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  src?: Maybe<Scalars['String']['output']>;
  strategy?: Maybe<SiteFooterScriptStrategy>;
};

export type SiteFooterScriptInput = {
  children?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  src?: InputMaybe<Scalars['String']['input']>;
  strategy?: InputMaybe<SiteFooterScriptStrategy>;
};

export enum SiteFooterScriptStrategy {
  AfterInteractive = 'AfterInteractive',
  BeforeInteractive = 'BeforeInteractive',
  LazyOnload = 'LazyOnload'
}

export type SiteHeaderLink = {
  __typename?: 'SiteHeaderLink';
  href?: Maybe<Scalars['String']['output']>;
  rel?: Maybe<SiteHeaderLinkRel>;
};

export type SiteHeaderLinkInput = {
  href?: InputMaybe<Scalars['String']['input']>;
  rel?: InputMaybe<SiteHeaderLinkRel>;
};

export enum SiteHeaderLinkRel {
  Icon = 'Icon',
  Stylesheet = 'Stylesheet'
}

export type SiteHeaderMeta = {
  __typename?: 'SiteHeaderMeta';
  content?: Maybe<Scalars['String']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  property?: Maybe<Scalars['String']['output']>;
};

export type SiteHeaderMetaInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  property?: InputMaybe<Scalars['String']['input']>;
};

export type SiteOnboardingStep = {
  __typename?: 'SiteOnboardingStep';
  data?: Maybe<Scalars['JSON']['output']>;
  name: SiteOnboardingStepName;
};

export type SiteOnboardingStepInput = {
  data?: InputMaybe<Scalars['JSON']['input']>;
  name: SiteOnboardingStepName;
};

export enum SiteOnboardingStepName {
  About = 'About',
  AdultCheck = 'AdultCheck',
  Biography = 'Biography',
  ConditionsCheck = 'ConditionsCheck',
  Custom = 'Custom',
  DisplayName = 'DisplayName',
  Done = 'Done',
  Feeds = 'Feeds',
  Interests = 'Interests',
  Job = 'Job',
  Photo = 'Photo',
  SocialHandles = 'SocialHandles',
  Username = 'Username',
  Wallet = 'Wallet',
  WalletInput = 'WalletInput'
}

export type SitePassport = {
  __typename?: 'SitePassport';
  baseV1Address: Scalars['String']['output'];
  baseV1ChainId: Scalars['Float']['output'];
  crowdfundAddress?: Maybe<Scalars['JSON']['output']>;
  image: Scalars['String']['output'];
  logo: Scalars['String']['output'];
  name: Scalars['String']['output'];
  passportV1AxelarAddress?: Maybe<Scalars['JSON']['output']>;
  passportV1CallAddress: Scalars['String']['output'];
  ssiGroup: Scalars['String']['output'];
};

export type SitePassportInput = {
  baseV1Address: Scalars['String']['input'];
  baseV1ChainId: Scalars['Float']['input'];
  crowdfundAddress?: InputMaybe<Scalars['JSON']['input']>;
  image: Scalars['String']['input'];
  logo: Scalars['String']['input'];
  name: Scalars['String']['input'];
  passportV1AxelarAddress?: InputMaybe<Scalars['JSON']['input']>;
  passportV1CallAddress: Scalars['String']['input'];
  ssiGroup: Scalars['String']['input'];
};

export type SlashInfo = {
  __typename?: 'SlashInfo';
  account_info?: Maybe<NewPaymentAccount>;
  payouts: Array<SlashPayout>;
  slashable_payments: Array<Scalars['MongoID']['output']>;
  vault: Scalars['String']['output'];
};

export type SlashPayout = {
  __typename?: 'SlashPayout';
  currency: Scalars['String']['output'];
  formatted_amount: Scalars['String']['output'];
};

export type SolanaAccount = {
  __typename?: 'SolanaAccount';
  address: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
  network: Scalars['String']['output'];
};

export type SortInput = {
  field: Scalars['String']['input'];
  /**
   *
   *     - 1 for increasing
   *     - -1 for descreasing
   */
  order?: Scalars['Int']['input'];
};

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

export type Space = {
  __typename?: 'Space';
  _id: Scalars['MongoID']['output'];
  address?: Maybe<Address>;
  admins?: Maybe<Array<User>>;
  council_members?: Maybe<Array<SpaceCouncilMember>>;
  creator: Scalars['MongoID']['output'];
  creator_expanded?: Maybe<User>;
  credits?: Maybe<Scalars['Float']['output']>;
  credits_high_water_mark?: Maybe<Scalars['Float']['output']>;
  daos?: Maybe<SpaceDao>;
  dark_theme_image?: Maybe<Scalars['MongoID']['output']>;
  dark_theme_image_expanded?: Maybe<File>;
  default_model?: Maybe<Scalars['String']['output']>;
  default_model_provider?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  fav_icon_url?: Maybe<Scalars['String']['output']>;
  featured?: Maybe<Scalars['Boolean']['output']>;
  followed?: Maybe<Scalars['Boolean']['output']>;
  /** List of registered account followers */
  followers?: Maybe<Array<Scalars['MongoID']['output']>>;
  followers_count?: Maybe<Scalars['Float']['output']>;
  handle_instagram?: Maybe<Scalars['String']['output']>;
  handle_linkedin?: Maybe<Scalars['String']['output']>;
  handle_tiktok?: Maybe<Scalars['String']['output']>;
  handle_twitter?: Maybe<Scalars['String']['output']>;
  handle_youtube?: Maybe<Scalars['String']['output']>;
  hostname_entries?: Maybe<Array<WhitelabelHostname>>;
  hostnames?: Maybe<Array<Scalars['String']['output']>>;
  image_avatar?: Maybe<Scalars['MongoID']['output']>;
  image_avatar_expanded?: Maybe<File>;
  image_cover?: Maybe<Scalars['MongoID']['output']>;
  image_cover_expanded?: Maybe<File>;
  is_ambassador?: Maybe<Scalars['Boolean']['output']>;
  is_crypto_subscription?: Maybe<Scalars['Boolean']['output']>;
  lens_feed_id?: Maybe<Scalars['String']['output']>;
  light_theme_image?: Maybe<Scalars['MongoID']['output']>;
  light_theme_image_expanded?: Maybe<File>;
  /** External events are listed on this space */
  listed_events?: Maybe<Array<Scalars['MongoID']['output']>>;
  nft_enabled?: Maybe<Scalars['Boolean']['output']>;
  page_config?: Maybe<Scalars['MongoID']['output']>;
  /** Payment accounts attached to this space */
  payment_accounts?: Maybe<Array<Scalars['MongoID']['output']>>;
  /** One user is provided with one personal community where he can manage his own events. The personal community is not meant to be publicly visible and featured. */
  personal?: Maybe<Scalars['Boolean']['output']>;
  /** If true then the community is private, else the community is public. A private community requires moderation for membership. */
  private?: Maybe<Scalars['Boolean']['output']>;
  purchased_credits?: Maybe<Scalars['Float']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  state: SpaceState;
  sub_spaces?: Maybe<Array<Scalars['MongoID']['output']>>;
  sub_spaces_expanded?: Maybe<Array<Space>>;
  subscription_annual?: Maybe<Scalars['Boolean']['output']>;
  subscription_credits?: Maybe<Scalars['Float']['output']>;
  subscription_renewal_date?: Maybe<Scalars['DateTimeISO']['output']>;
  subscription_status?: Maybe<Scalars['String']['output']>;
  subscription_tier?: Maybe<Scalars['String']['output']>;
  theme_data?: Maybe<Scalars['JSON']['output']>;
  theme_name?: Maybe<Scalars['String']['output']>;
  tint_color?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  website?: Maybe<Scalars['String']['output']>;
};


export type SpaceSub_Spaces_ExpandedArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type SpaceCategory = {
  __typename?: 'SpaceCategory';
  description?: Maybe<Scalars['String']['output']>;
  image_url?: Maybe<Scalars['String']['output']>;
  listed_events_count?: Maybe<Scalars['Int']['output']>;
  space: Scalars['MongoID']['output'];
  space_expanded?: Maybe<Space>;
  title: Scalars['String']['output'];
};

export type SpaceCouncilMember = {
  __typename?: 'SpaceCouncilMember';
  user?: Maybe<BasicUserInfo>;
  wallet: Scalars['String']['output'];
};

export type SpaceDao = {
  __typename?: 'SpaceDao';
  address: Scalars['String']['output'];
  name: Scalars['String']['output'];
  network: Scalars['String']['output'];
};

export type SpaceEventAttendee = {
  __typename?: 'SpaceEventAttendee';
  attended_event_count: Scalars['Float']['output'];
  non_login_user?: Maybe<UserWithEmail>;
  user_expanded?: Maybe<UserWithEmail>;
};

export type SpaceEventHost = {
  __typename?: 'SpaceEventHost';
  hosted_event_count: Scalars['Float']['output'];
  space_member?: Maybe<SpaceMemberBase>;
  user_expanded: UserWithEmail;
};

export type SpaceEventInsight = {
  __typename?: 'SpaceEventInsight';
  _id?: Maybe<Scalars['MongoID']['output']>;
  accepted?: Maybe<Array<Scalars['MongoID']['output']>>;
  accepted_store_promotion?: Maybe<Scalars['MongoID']['output']>;
  accepted_user_fields_required?: Maybe<Array<Scalars['String']['output']>>;
  access_pass?: Maybe<AccessPass>;
  active: Scalars['Boolean']['output'];
  address?: Maybe<Address>;
  address_directions?: Maybe<Array<Scalars['String']['output']>>;
  alert_payments?: Maybe<Array<Scalars['MongoID']['output']>>;
  alert_tickets?: Maybe<Scalars['JSON']['output']>;
  application_form_url?: Maybe<Scalars['String']['output']>;
  application_profile_fields?: Maybe<Array<ApplicationProfileField>>;
  application_required?: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated To be removed */
  application_self_verification?: Maybe<Scalars['Boolean']['output']>;
  application_self_verification_required?: Maybe<Scalars['Boolean']['output']>;
  approval_required?: Maybe<Scalars['Boolean']['output']>;
  approved?: Maybe<Scalars['Boolean']['output']>;
  /** Number of users who have tickets */
  attending_count?: Maybe<Scalars['Float']['output']>;
  button_icon?: Maybe<Scalars['String']['output']>;
  button_text?: Maybe<Scalars['String']['output']>;
  button_url?: Maybe<Scalars['String']['output']>;
  /** @deprecated No longer in use and will be removed in a future release. */
  checkin_count?: Maybe<Scalars['Float']['output']>;
  checkin_menu_text?: Maybe<Scalars['String']['output']>;
  checkins: Scalars['Float']['output'];
  cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  comments?: Maybe<Scalars['String']['output']>;
  cost?: Maybe<Scalars['Float']['output']>;
  cover?: Maybe<Scalars['String']['output']>;
  cta_button_text?: Maybe<Scalars['String']['output']>;
  /** Show secondary CTA button text */
  cta_secondary_visible?: Maybe<Scalars['Boolean']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  dark_theme_image?: Maybe<Scalars['MongoID']['output']>;
  declined?: Maybe<Array<Scalars['MongoID']['output']>>;
  description?: Maybe<Scalars['String']['output']>;
  description_plain_text?: Maybe<Scalars['String']['output']>;
  donation_enabled?: Maybe<Scalars['Boolean']['output']>;
  donation_show_history?: Maybe<Scalars['Boolean']['output']>;
  donation_vaults?: Maybe<Array<Scalars['MongoID']['output']>>;
  end: Scalars['DateTimeISO']['output'];
  eventbrite_enabled?: Maybe<Scalars['Boolean']['output']>;
  eventbrite_event_id?: Maybe<Scalars['String']['output']>;
  eventbrite_tickets_imported?: Maybe<Scalars['Boolean']['output']>;
  eventbrite_token?: Maybe<Scalars['String']['output']>;
  events?: Maybe<Array<Scalars['MongoID']['output']>>;
  external_hostname?: Maybe<Scalars['String']['output']>;
  external_url?: Maybe<Scalars['String']['output']>;
  frequent_questions?: Maybe<Array<FrequentQuestion>>;
  guest_directory_enabled?: Maybe<Scalars['Boolean']['output']>;
  guest_limit?: Maybe<Scalars['Float']['output']>;
  guest_limit_per?: Maybe<Scalars['Float']['output']>;
  guests?: Maybe<Scalars['Int']['output']>;
  hide_attending?: Maybe<Scalars['Boolean']['output']>;
  hide_chat_action?: Maybe<Scalars['Boolean']['output']>;
  hide_cohosts?: Maybe<Scalars['Boolean']['output']>;
  hide_creators?: Maybe<Scalars['Boolean']['output']>;
  hide_invite_action?: Maybe<Scalars['Boolean']['output']>;
  hide_lounge?: Maybe<Scalars['Boolean']['output']>;
  hide_question_box?: Maybe<Scalars['Boolean']['output']>;
  hide_rooms_action?: Maybe<Scalars['Boolean']['output']>;
  hide_session_guests?: Maybe<Scalars['Boolean']['output']>;
  hide_speakers?: Maybe<Scalars['Boolean']['output']>;
  hide_stories_action?: Maybe<Scalars['Boolean']['output']>;
  highlight?: Maybe<Scalars['Boolean']['output']>;
  host: Scalars['MongoID']['output'];
  inherited_cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  insider_enabled?: Maybe<Scalars['Boolean']['output']>;
  insider_token?: Maybe<Scalars['String']['output']>;
  invited?: Maybe<Array<Scalars['MongoID']['output']>>;
  invited_count?: Maybe<Scalars['Float']['output']>;
  invited_email_map?: Maybe<Scalars['JSON']['output']>;
  invited_emails?: Maybe<Array<Scalars['String']['output']>>;
  invited_phone_map?: Maybe<Scalars['JSON']['output']>;
  invited_user_map?: Maybe<Scalars['JSON']['output']>;
  inviter_email_map?: Maybe<Scalars['JSON']['output']>;
  inviter_phone_map?: Maybe<Scalars['JSON']['output']>;
  inviter_user_map?: Maybe<Scalars['JSON']['output']>;
  inviters?: Maybe<Array<Scalars['MongoID']['output']>>;
  latitude?: Maybe<Scalars['Float']['output']>;
  layout_sections?: Maybe<Array<LayoutSection>>;
  light_theme_image?: Maybe<Scalars['MongoID']['output']>;
  listing_spaces?: Maybe<Array<Scalars['MongoID']['output']>>;
  location?: Maybe<Point>;
  longitude?: Maybe<Scalars['Float']['output']>;
  matrix_event_room_id?: Maybe<Scalars['String']['output']>;
  new_new_photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  new_photos?: Maybe<Array<FileInline>>;
  offers?: Maybe<Array<EventOffer>>;
  page_config?: Maybe<Scalars['MongoID']['output']>;
  payment_accounts_new?: Maybe<Array<Scalars['MongoID']['output']>>;
  payment_donation?: Maybe<Scalars['Boolean']['output']>;
  payment_donation_amount_includes_tickets?: Maybe<Scalars['Boolean']['output']>;
  payment_donation_amount_increment?: Maybe<Scalars['Float']['output']>;
  payment_donation_message?: Maybe<Scalars['String']['output']>;
  payment_donation_target?: Maybe<Scalars['Float']['output']>;
  payment_enabled?: Maybe<Scalars['Boolean']['output']>;
  payment_fee: Scalars['Float']['output'];
  payment_optional?: Maybe<Scalars['Boolean']['output']>;
  payment_ticket_count?: Maybe<Scalars['Float']['output']>;
  payment_ticket_external_message?: Maybe<Scalars['String']['output']>;
  payment_ticket_external_url?: Maybe<Scalars['String']['output']>;
  payment_ticket_purchase_title?: Maybe<Scalars['String']['output']>;
  payment_ticket_unassigned_count?: Maybe<Scalars['Float']['output']>;
  pending?: Maybe<Array<Scalars['MongoID']['output']>>;
  photos?: Maybe<Array<Scalars['String']['output']>>;
  private?: Maybe<Scalars['Boolean']['output']>;
  /** If this is true then the event is published, otherwise the event is unpublished. */
  published?: Maybe<Scalars['Boolean']['output']>;
  rating?: Maybe<Scalars['Float']['output']>;
  registration_disabled?: Maybe<Scalars['Boolean']['output']>;
  reviews?: Maybe<Scalars['Float']['output']>;
  reward_uses?: Maybe<Scalars['JSON']['output']>;
  rewards?: Maybe<Array<EventReward>>;
  rsvp_wallet_platforms?: Maybe<Array<ApplicationBlokchainPlatform>>;
  self_verification?: Maybe<SelfVerification>;
  session_guests?: Maybe<Scalars['JSON']['output']>;
  sessions?: Maybe<Array<EventSessionBase>>;
  shortid: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  /** MongoId of the community (aka space) that this event is organized to. */
  space?: Maybe<Scalars['MongoID']['output']>;
  speaker_emails?: Maybe<Array<Scalars['String']['output']>>;
  speaker_users?: Maybe<Array<Scalars['MongoID']['output']>>;
  stamp: Scalars['DateTimeISO']['output'];
  start: Scalars['DateTimeISO']['output'];
  state: EventState;
  stores?: Maybe<Array<Scalars['MongoID']['output']>>;
  stories?: Maybe<Array<Scalars['MongoID']['output']>>;
  stories_eponym?: Maybe<Scalars['Boolean']['output']>;
  subevent_enabled?: Maybe<Scalars['Boolean']['output']>;
  subevent_parent?: Maybe<Scalars['MongoID']['output']>;
  subevent_settings?: Maybe<SubeventSettings>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  telegram_channels?: Maybe<Array<TelegramChannel>>;
  terms_accepted?: Maybe<Array<Scalars['MongoID']['output']>>;
  terms_accepted_with_email_permission?: Maybe<Array<Scalars['MongoID']['output']>>;
  terms_email_permission_text?: Maybe<Scalars['Boolean']['output']>;
  terms_link?: Maybe<Scalars['String']['output']>;
  terms_text?: Maybe<Scalars['String']['output']>;
  theme_data?: Maybe<Scalars['JSON']['output']>;
  /** The number of tickets available per user for this event */
  ticket_limit_per?: Maybe<Scalars['Float']['output']>;
  tickets_count: Scalars['Float']['output'];
  timezone?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  unlisted?: Maybe<Scalars['Boolean']['output']>;
  unsure?: Maybe<Array<Scalars['MongoID']['output']>>;
  url?: Maybe<Scalars['String']['output']>;
  url_go?: Maybe<Scalars['String']['output']>;
  videos?: Maybe<Array<Video>>;
  virtual?: Maybe<Scalars['Boolean']['output']>;
  virtual_url?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use data from event cohost requests table */
  visible_cohosts?: Maybe<Array<Scalars['MongoID']['output']>>;
  welcome_text?: Maybe<Scalars['String']['output']>;
  welcome_video?: Maybe<Video>;
  zones_menu_text?: Maybe<Scalars['String']['output']>;
};

export type SpaceEventInsightResponse = {
  __typename?: 'SpaceEventInsightResponse';
  /** The paginated response */
  items: Array<SpaceEventInsight>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export type SpaceEventLocationLeaderboard = {
  __typename?: 'SpaceEventLocationLeaderboard';
  city?: Maybe<Scalars['String']['output']>;
  country: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type SpaceEventRequest = {
  __typename?: 'SpaceEventRequest';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  created_by?: Maybe<Scalars['MongoID']['output']>;
  created_by_expanded?: Maybe<User>;
  decided_at?: Maybe<Scalars['DateTimeISO']['output']>;
  decided_by?: Maybe<Scalars['MongoID']['output']>;
  decided_by_expanded?: Maybe<User>;
  event: Scalars['MongoID']['output'];
  event_expanded?: Maybe<Event>;
  space: Scalars['MongoID']['output'];
  state: SpaceEventRequestState;
  tags?: Maybe<Array<Scalars['MongoID']['output']>>;
};

export enum SpaceEventRequestState {
  Approved = 'approved',
  Declined = 'declined',
  Pending = 'pending'
}

export type SpaceEventSummary = {
  __typename?: 'SpaceEventSummary';
  all_events?: Maybe<Scalars['Float']['output']>;
  irl_events?: Maybe<Scalars['Float']['output']>;
  live_events?: Maybe<Scalars['Float']['output']>;
  past_events?: Maybe<Scalars['Float']['output']>;
  upcoming_events?: Maybe<Scalars['Float']['output']>;
  virtual_events?: Maybe<Scalars['Float']['output']>;
};

export type SpaceInput = {
  address?: InputMaybe<AddressInput>;
  dark_theme_image?: InputMaybe<Scalars['MongoID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fav_icon_url?: InputMaybe<Scalars['String']['input']>;
  handle_instagram?: InputMaybe<Scalars['String']['input']>;
  handle_linkedin?: InputMaybe<Scalars['String']['input']>;
  handle_tiktok?: InputMaybe<Scalars['String']['input']>;
  handle_twitter?: InputMaybe<Scalars['String']['input']>;
  handle_youtube?: InputMaybe<Scalars['String']['input']>;
  hostnames?: InputMaybe<Array<Scalars['String']['input']>>;
  image_avatar?: InputMaybe<Scalars['MongoID']['input']>;
  image_cover?: InputMaybe<Scalars['MongoID']['input']>;
  lens_feed_id?: InputMaybe<Scalars['String']['input']>;
  light_theme_image?: InputMaybe<Scalars['MongoID']['input']>;
  nft_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** If true then the community is private, else the community is public. A private community requires moderation for membership. */
  private?: InputMaybe<Scalars['Boolean']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<SpaceState>;
  theme_data?: InputMaybe<Scalars['JSON']['input']>;
  theme_name?: InputMaybe<Scalars['String']['input']>;
  tint_color?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type SpaceMember = {
  __typename?: 'SpaceMember';
  _id?: Maybe<Scalars['MongoID']['output']>;
  checkin_count?: Maybe<Scalars['Float']['output']>;
  deleted_at?: Maybe<Scalars['DateTimeISO']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  event_count?: Maybe<Scalars['Float']['output']>;
  role?: Maybe<SpaceRole>;
  role_changed_at?: Maybe<Scalars['DateTimeISO']['output']>;
  space?: Maybe<Scalars['MongoID']['output']>;
  state?: Maybe<SpaceMembershipState>;
  tags?: Maybe<Array<SpaceTag>>;
  user?: Maybe<Scalars['MongoID']['output']>;
  user_expanded?: Maybe<UserWithEmail>;
  user_name?: Maybe<Scalars['String']['output']>;
  visible?: Maybe<Scalars['Boolean']['output']>;
};

export type SpaceMemberAmountByDate = {
  __typename?: 'SpaceMemberAmountByDate';
  _id: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type SpaceMemberBase = {
  __typename?: 'SpaceMemberBase';
  _id: Scalars['MongoID']['output'];
  decided_by?: Maybe<Scalars['MongoID']['output']>;
  deleted_at?: Maybe<Scalars['DateTimeISO']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  role: SpaceRole;
  role_changed_at?: Maybe<Scalars['DateTimeISO']['output']>;
  space: Scalars['MongoID']['output'];
  state: SpaceMembershipState;
  user?: Maybe<Scalars['MongoID']['output']>;
  user_name?: Maybe<Scalars['String']['output']>;
  visible?: Maybe<Scalars['Boolean']['output']>;
};

export type SpaceMemberLeaderboard = {
  __typename?: 'SpaceMemberLeaderboard';
  _id: Scalars['MongoID']['output'];
  attended_count: Scalars['Float']['output'];
  decided_by?: Maybe<Scalars['MongoID']['output']>;
  deleted_at?: Maybe<Scalars['DateTimeISO']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  hosted_event_count: Scalars['Float']['output'];
  non_user_login?: Maybe<UserWithEmail>;
  role: SpaceRole;
  role_changed_at?: Maybe<Scalars['DateTimeISO']['output']>;
  space: Scalars['MongoID']['output'];
  state: SpaceMembershipState;
  submitted_event_count: Scalars['Float']['output'];
  user?: Maybe<Scalars['MongoID']['output']>;
  user_expanded?: Maybe<UserWithEmail>;
  user_name?: Maybe<Scalars['String']['output']>;
  visible?: Maybe<Scalars['Boolean']['output']>;
};

export type SpaceMemberRecipientFilter = {
  __typename?: 'SpaceMemberRecipientFilter';
  include_untagged?: Maybe<Scalars['Boolean']['output']>;
  space_tags?: Maybe<Array<Scalars['MongoID']['output']>>;
};

export type SpaceMemberRecipientFilterInput = {
  include_untagged?: InputMaybe<Scalars['Boolean']['input']>;
  space_tags?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export type SpaceMembersLeaderboardResponse = {
  __typename?: 'SpaceMembersLeaderboardResponse';
  /** The paginated response */
  items: Array<SpaceMemberLeaderboard>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export enum SpaceMembershipState {
  Invited = 'invited',
  Joined = 'joined',
  Rejected = 'rejected',
  Requested = 'requested'
}

export type SpaceNft = {
  __typename?: 'SpaceNFT';
  _id: Scalars['MongoID']['output'];
  content_url?: Maybe<Scalars['String']['output']>;
  contracts: Array<SpaceNftContract>;
  cover_image_url: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  space: Scalars['MongoID']['output'];
  symbol: Scalars['String']['output'];
  /** Zero for no limit */
  token_limit: Scalars['Float']['output'];
};

export type SpaceNftContract = {
  __typename?: 'SpaceNFTContract';
  _id: Scalars['MongoID']['output'];
  currency_address?: Maybe<Scalars['String']['output']>;
  deployed_contract_address?: Maybe<Scalars['String']['output']>;
  /** Zero for free mint */
  mint_price?: Maybe<Scalars['String']['output']>;
  network_id: Scalars['String']['output'];
  space_nft: Scalars['MongoID']['output'];
};

export enum SpaceNftKind {
  MusicTrack = 'music_track'
}

export type SpaceNewsletterStatistics = {
  __typename?: 'SpaceNewsletterStatistics';
  delivered_count: Scalars['Int']['output'];
  open_count: Scalars['Int']['output'];
  sent_count: Scalars['Int']['output'];
};

export type SpaceRewardSetting = {
  __typename?: 'SpaceRewardSetting';
  claims_count?: Maybe<Scalars['Int']['output']>;
  event?: Maybe<EventBase>;
  recipients_count?: Maybe<Scalars['Int']['output']>;
  setting: BaseTokenRewardSetting;
  type: ClaimType;
};

export type SpaceRewardSettings = {
  __typename?: 'SpaceRewardSettings';
  settings: Array<SpaceRewardSetting>;
};

export type SpaceRewardStatistics = {
  __typename?: 'SpaceRewardStatistics';
  checkin_settings_count: Scalars['Float']['output'];
  events_count: Scalars['Float']['output'];
  ticket_settings_count: Scalars['Float']['output'];
  unique_recipients_count: Scalars['Float']['output'];
};

export enum SpaceRole {
  Admin = 'admin',
  Ambassador = 'ambassador',
  Creator = 'creator',
  Subscriber = 'subscriber',
  Unsubscriber = 'unsubscriber'
}

export type SpaceSendingQuota = {
  __typename?: 'SpaceSendingQuota';
  remain?: Maybe<Scalars['Int']['output']>;
  reset_frequency?: Maybe<SendgridCreditResetFrequency>;
  total?: Maybe<Scalars['Int']['output']>;
  type: SendgridCreditType;
  used?: Maybe<Scalars['Int']['output']>;
};

export enum SpaceState {
  Active = 'active',
  Archived = 'archived'
}

export type SpaceStatisticResponse = {
  __typename?: 'SpaceStatisticResponse';
  admins: Scalars['Float']['output'];
  ambassadors: Scalars['Float']['output'];
  avg_event_rating?: Maybe<Scalars['Float']['output']>;
  created_events: Scalars['Float']['output'];
  event_attendees: Scalars['Float']['output'];
  submitted_events: Scalars['Float']['output'];
  subscribers: Scalars['Float']['output'];
};

export type SpaceTag = {
  __typename?: 'SpaceTag';
  _id: Scalars['MongoID']['output'];
  color: Scalars['String']['output'];
  space: Scalars['MongoID']['output'];
  tag: Scalars['String']['output'];
  targets?: Maybe<Array<Scalars['String']['output']>>;
  targets_count?: Maybe<Scalars['Float']['output']>;
  type: SpaceTagType;
};

export type SpaceTagInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  color: Scalars['String']['input'];
  space: Scalars['MongoID']['input'];
  tag: Scalars['String']['input'];
  type: SpaceTagType;
};

export enum SpaceTagType {
  Event = 'event',
  Member = 'member'
}

export type SpaceTokenGate = {
  __typename?: 'SpaceTokenGate';
  _id: Scalars['MongoID']['output'];
  /** Decimal places of this token, for display purpose only */
  decimals: Scalars['Float']['output'];
  /** List of ERC1155 token ids to check, which are bigint */
  erc1155_token_ids?: Maybe<Array<Scalars['Int']['output']>>;
  /** ERC721 if true, else ERC20 */
  is_nft?: Maybe<Scalars['Boolean']['output']>;
  max_value?: Maybe<Scalars['String']['output']>;
  min_value?: Maybe<Scalars['String']['output']>;
  /** Display name of the token */
  name: Scalars['String']['output'];
  network: Scalars['String']['output'];
  passed?: Maybe<Scalars['Boolean']['output']>;
  roles?: Maybe<Array<SpaceRole>>;
  space: Scalars['MongoID']['output'];
  token_address: Scalars['String']['output'];
};

export type SpaceTokenGateInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  /** Decimal places of this token, for display purpose only */
  decimals?: InputMaybe<Scalars['Float']['input']>;
  /** List of ERC1155 token ids to check, which are bigint */
  erc1155_token_ids?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** ERC721 if true, else ERC20 */
  is_nft?: InputMaybe<Scalars['Boolean']['input']>;
  max_value?: InputMaybe<Scalars['String']['input']>;
  min_value?: InputMaybe<Scalars['String']['input']>;
  /** Display name of the token */
  name?: InputMaybe<Scalars['String']['input']>;
  network?: InputMaybe<Scalars['String']['input']>;
  roles?: InputMaybe<Array<SpaceRole>>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
  token_address?: InputMaybe<Scalars['String']['input']>;
};

export type SpaceTokenRewardClaim = {
  __typename?: 'SpaceTokenRewardClaim';
  _id: Scalars['MongoID']['output'];
  claimed_tokens: Array<ClaimedToken>;
  created_at: Scalars['DateTimeISO']['output'];
  event?: Maybe<EventBase>;
  user_expanded?: Maybe<User>;
  wallet_id?: Maybe<Scalars['String']['output']>;
};

export type SpaceTokenRewardClaims = {
  __typename?: 'SpaceTokenRewardClaims';
  /** The paginated response */
  items: Array<SpaceTokenRewardClaim>;
  /** Number of the records that match the filter */
  total: Scalars['Int']['output'];
};

export enum SpaceVerificationState {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type SpaceVerificationSubmission = {
  __typename?: 'SpaceVerificationSubmission';
  confirmation_1?: Maybe<Scalars['Boolean']['output']>;
  confirmation_2?: Maybe<Scalars['Boolean']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  event_info: Scalars['String']['output'];
  guests_info: Scalars['String']['output'];
  number_of_recipients: Scalars['Float']['output'];
  space: Scalars['MongoID']['output'];
  space_expanded?: Maybe<Space>;
  state: SpaceVerificationState;
  updated_at: Scalars['DateTimeISO']['output'];
};

export type SpaceVerificationSubmissionInput = {
  confirmation_1?: InputMaybe<Scalars['Boolean']['input']>;
  confirmation_2?: InputMaybe<Scalars['Boolean']['input']>;
  event_info?: InputMaybe<Scalars['String']['input']>;
  guests_info?: InputMaybe<Scalars['String']['input']>;
  number_of_recipients?: InputMaybe<Scalars['Float']['input']>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
};

export type StakePaymentStateStatistic = {
  __typename?: 'StakePaymentStateStatistic';
  count: Scalars['Int']['output'];
  state: StakeState;
};

export type StakePaymentStatistics = {
  __typename?: 'StakePaymentStatistics';
  slash_infos: Array<SlashInfo>;
  slash_states: Array<StakePaymentStateStatistic>;
  total: Scalars['Int']['output'];
};

export enum StakeState {
  Defaulted = 'defaulted',
  Locked = 'locked',
  Slashed = 'slashed',
  Unlocked = 'unlocked',
  Unstaked = 'unstaked'
}

export type StakeUser = {
  __typename?: 'StakeUser';
  _id?: Maybe<Scalars['MongoID']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  /** This field contains the name of the user in a short version */
  name?: Maybe<Scalars['String']['output']>;
  wallet: Scalars['String']['output'];
};

export type StandCreditsInfo = {
  __typename?: 'StandCreditsInfo';
  credits: Scalars['Float']['output'];
  credits_high_water_mark: Scalars['Float']['output'];
  estimated_depletion_date?: Maybe<Scalars['DateTimeISO']['output']>;
  purchased_credits: Scalars['Float']['output'];
  subscription_credits: Scalars['Float']['output'];
  subscription_renewal_date?: Maybe<Scalars['DateTimeISO']['output']>;
  subscription_status: Scalars['String']['output'];
  subscription_tier: Scalars['String']['output'];
};

export type StockPhoto = {
  __typename?: 'StockPhoto';
  alt_text?: Maybe<Scalars['String']['output']>;
  height: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  photographer?: Maybe<Scalars['String']['output']>;
  photographer_url?: Maybe<Scalars['String']['output']>;
  source: StockPhotoSource;
  thumbnail_url: Scalars['String']['output'];
  url: Scalars['String']['output'];
  width: Scalars['Int']['output'];
};

export enum StockPhotoSource {
  Pexels = 'pexels',
  Unsplash = 'unsplash'
}

export type Store = {
  __typename?: 'Store';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  address?: Maybe<Address>;
  age_restriction_min?: Maybe<Scalars['Float']['output']>;
  age_restriction_reason?: Maybe<Scalars['String']['output']>;
  api_secret?: Maybe<Scalars['String']['output']>;
  approved?: Maybe<Scalars['Boolean']['output']>;
  currency: Scalars['String']['output'];
  delivery_options?: Maybe<Array<DeliveryOption>>;
  easyship_company_id?: Maybe<Scalars['String']['output']>;
  easyship_enabled?: Maybe<Scalars['Boolean']['output']>;
  easyship_secret_key?: Maybe<Scalars['String']['output']>;
  easyship_token?: Maybe<Scalars['String']['output']>;
  fulfillment_addresses: Array<Address>;
  managers: Array<Scalars['MongoID']['output']>;
  managers_expanded?: Maybe<Array<Maybe<User>>>;
  new_photos: Array<Scalars['MongoID']['output']>;
  new_photos_expanded?: Maybe<Array<Maybe<File>>>;
  order_count?: Maybe<Scalars['Float']['output']>;
  payment_fee_store: Scalars['Float']['output'];
  payment_fee_user: Scalars['Float']['output'];
  photos?: Maybe<Array<FileInline>>;
  pickup_addresses?: Maybe<Array<Address>>;
  promotions?: Maybe<Array<Maybe<StorePromotion>>>;
  sales_taxes?: Maybe<Array<SalesTax>>;
  stamp: Scalars['DateTimeISO']['output'];
  tags?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
};


export type StoreManagers_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type StoreNew_Photos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type StoreBucketItem = {
  __typename?: 'StoreBucketItem';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  count: Scalars['Float']['output'];
  product: Scalars['MongoID']['output'];
  product_expanded?: Maybe<StoreProduct>;
  product_groups: Scalars['JSON']['output'];
  product_variant: Scalars['MongoID']['output'];
  stamp: Scalars['DateTimeISO']['output'];
  store: Scalars['MongoID']['output'];
  store_expanded?: Maybe<Store>;
  user: Scalars['MongoID']['output'];
};

export type StoreBucketItemInput = {
  count: Scalars['Float']['input'];
  product: Scalars['MongoID']['input'];
  product_groups: Scalars['JSON']['input'];
  product_variant: Scalars['MongoID']['input'];
};

export type StoreCategory = {
  __typename?: 'StoreCategory';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  description?: Maybe<Scalars['String']['output']>;
  parents?: Maybe<Array<Scalars['MongoID']['output']>>;
  stamp: Scalars['DateTimeISO']['output'];
  store: Scalars['MongoID']['output'];
  title: Scalars['String']['output'];
};

export type StoreCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  parents?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type StoreInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  age_restriction_min?: InputMaybe<Scalars['Float']['input']>;
  age_restriction_reason?: InputMaybe<Scalars['String']['input']>;
  api_secret?: InputMaybe<Scalars['String']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  delivery_options?: InputMaybe<Array<DeliveryOptionInput>>;
  easyship_company_id?: InputMaybe<Scalars['String']['input']>;
  easyship_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  easyship_secret_key?: InputMaybe<Scalars['String']['input']>;
  easyship_token?: InputMaybe<Scalars['String']['input']>;
  managers?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  new_photos?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  photos?: InputMaybe<Array<FileInlineInput>>;
  sales_taxes?: InputMaybe<Array<SalesTaxInput>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type StoreOrder = {
  __typename?: 'StoreOrder';
  _id?: Maybe<Scalars['MongoID']['output']>;
  active: Scalars['Boolean']['output'];
  address: Address;
  amount: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  delivery_cost: Scalars['Float']['output'];
  delivery_option: DeliveryOption;
  delivery_option_cost_waived?: Maybe<Scalars['Boolean']['output']>;
  easyship_courier_id?: Maybe<Scalars['String']['output']>;
  easyship_rates?: Maybe<Array<Scalars['JSON']['output']>>;
  easyship_selected_courier?: Maybe<Scalars['JSON']['output']>;
  easyship_shipment_id?: Maybe<Scalars['String']['output']>;
  fulfillment_address?: Maybe<Address>;
  history?: Maybe<Array<StoreOrderHistoryItem>>;
  items: Array<StoreOrderItem>;
  label_error?: Maybe<Scalars['String']['output']>;
  label_state?: Maybe<Scalars['String']['output']>;
  label_url?: Maybe<Scalars['String']['output']>;
  order_nr: Scalars['Float']['output'];
  pickup_address?: Maybe<Address>;
  promotion?: Maybe<Scalars['MongoID']['output']>;
  sales_tax?: Maybe<SalesTax>;
  stamp: Scalars['DateTimeISO']['output'];
  stamp_created: Scalars['DateTimeISO']['output'];
  state: StoreOrderState;
  store: Scalars['MongoID']['output'];
  store_expanded?: Maybe<Store>;
  tracking_url?: Maybe<Scalars['String']['output']>;
  user: Scalars['MongoID']['output'];
  user_expanded?: Maybe<User>;
  value: Scalars['Float']['output'];
};

export type StoreOrderHistoryItem = {
  __typename?: 'StoreOrderHistoryItem';
  stamp: Scalars['DateTimeISO']['output'];
  state: Scalars['String']['output'];
  user?: Maybe<Scalars['MongoID']['output']>;
  user_expanded?: Maybe<User>;
};

export type StoreOrderInput = {
  items: Array<StoreOrderItemInput>;
  state: StoreOrderState;
};

export type StoreOrderItem = {
  __typename?: 'StoreOrderItem';
  _id: Scalars['MongoID']['output'];
  amount: Scalars['Float']['output'];
  count: Scalars['Float']['output'];
  delivery_cost?: Maybe<Scalars['Float']['output']>;
  delivery_option?: Maybe<DeliveryOption>;
  delivery_option_cost_waived?: Maybe<Scalars['Boolean']['output']>;
  fee?: Maybe<Scalars['Float']['output']>;
  inventory?: Maybe<Scalars['Float']['output']>;
  product: StoreProduct;
  product_groups: Scalars['JSON']['output'];
  product_variant: Scalars['MongoID']['output'];
  promotion?: Maybe<Scalars['Float']['output']>;
  promotion_amount?: Maybe<Scalars['Float']['output']>;
  state: StoreOrderItemState;
  tax?: Maybe<Scalars['Float']['output']>;
  tracking_url?: Maybe<Scalars['String']['output']>;
  value: Scalars['Float']['output'];
};

export type StoreOrderItemInput = {
  _id: Scalars['MongoID']['input'];
  amount: Scalars['Float']['input'];
  delivery_cost?: InputMaybe<Scalars['Float']['input']>;
  delivery_option?: InputMaybe<DeliveryOptionInput>;
  delivery_option_cost_waived?: InputMaybe<Scalars['Boolean']['input']>;
  inventory?: InputMaybe<Scalars['Float']['input']>;
  state: StoreOrderItemState;
  tax?: InputMaybe<Scalars['Float']['input']>;
  tracking_url?: InputMaybe<Scalars['String']['input']>;
};

export enum StoreOrderItemState {
  Accepted = 'accepted',
  Declined = 'declined',
  Pending = 'pending'
}

export enum StoreOrderState {
  Accepted = 'accepted',
  AwaitingPickup = 'awaiting_pickup',
  Cancelled = 'cancelled',
  Created = 'created',
  Declined = 'declined',
  Delivered = 'delivered',
  DeliveryConfirmed = 'delivery_confirmed',
  InTransit = 'in_transit',
  Pending = 'pending',
  Preparing = 'preparing'
}

export type StoreOrderStateFilterInput = {
  eq?: InputMaybe<StoreOrderState>;
  in?: InputMaybe<Array<StoreOrderState>>;
  nin?: InputMaybe<Array<StoreOrderState>>;
};

export type StoreProduct = {
  __typename?: 'StoreProduct';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  categories?: Maybe<Array<Scalars['MongoID']['output']>>;
  delivery_options?: Maybe<Array<DeliveryOption>>;
  description: Scalars['String']['output'];
  easyship_category?: Maybe<EasyshipCategory>;
  groups?: Maybe<Scalars['JSON']['output']>;
  highlight?: Maybe<Scalars['Boolean']['output']>;
  order: Scalars['Float']['output'];
  primary_group?: Maybe<Scalars['String']['output']>;
  sales_tax_tag?: Maybe<Scalars['String']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  store: Scalars['MongoID']['output'];
  store_expanded?: Maybe<Store>;
  title: Scalars['String']['output'];
  variants: Array<StoreProductVariant>;
};

export type StoreProductInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  categories?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  delivery_options?: InputMaybe<Array<DeliveryOptionInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  easyship_category?: InputMaybe<EasyshipCategory>;
  highlight?: InputMaybe<Scalars['Boolean']['input']>;
  order?: InputMaybe<Scalars['Float']['input']>;
  primary_group?: InputMaybe<Scalars['String']['input']>;
  sales_tax_tag?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type StoreProductVariant = {
  __typename?: 'StoreProductVariant';
  _id: Scalars['MongoID']['output'];
  cost: Scalars['Float']['output'];
  groups: Scalars['JSON']['output'];
  height: Scalars['Float']['output'];
  inventory?: Maybe<Scalars['Float']['output']>;
  length: Scalars['Float']['output'];
  new_photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  new_photos_expanded?: Maybe<Array<Maybe<File>>>;
  photos?: Maybe<Array<FileInline>>;
  title: Scalars['String']['output'];
  weight: Scalars['Float']['output'];
  width: Scalars['Float']['output'];
};


export type StoreProductVariantNew_Photos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type StoreProductVariantInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  cost?: InputMaybe<Scalars['Float']['input']>;
  groups?: InputMaybe<Scalars['JSON']['input']>;
  height?: InputMaybe<Scalars['Float']['input']>;
  inventory?: InputMaybe<Scalars['Float']['input']>;
  length?: InputMaybe<Scalars['Float']['input']>;
  new_photos?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  photos?: InputMaybe<Array<FileInlineInput>>;
  title?: InputMaybe<Scalars['String']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
  width?: InputMaybe<Scalars['Float']['input']>;
};

export type StorePromotion = {
  __typename?: 'StorePromotion';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  event?: Maybe<Scalars['MongoID']['output']>;
  products?: Maybe<Array<Scalars['MongoID']['output']>>;
  products_expanded?: Maybe<Array<Maybe<StoreProduct>>>;
  ratio: Scalars['Float']['output'];
  title: Scalars['String']['output'];
  type: StorePromotionType;
  use_count?: Maybe<Scalars['Float']['output']>;
  use_count_map?: Maybe<Scalars['JSON']['output']>;
  use_limit?: Maybe<Scalars['Float']['output']>;
  use_limit_per?: Maybe<Scalars['Float']['output']>;
  waive_delivery_option_cost?: Maybe<Scalars['Boolean']['output']>;
};


export type StorePromotionProducts_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type StorePromotionInput = {
  event?: InputMaybe<Scalars['MongoID']['input']>;
  products?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  ratio?: InputMaybe<Scalars['Float']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<StorePromotionType>;
  use_limit?: InputMaybe<Scalars['Float']['input']>;
  use_limit_per?: InputMaybe<Scalars['Float']['input']>;
};

export enum StorePromotionType {
  Event = 'event'
}

export type StripeAccount = {
  __typename?: 'StripeAccount';
  account_id: Scalars['String']['output'];
  currencies: Array<Scalars['String']['output']>;
  currency_map?: Maybe<Scalars['JSON']['output']>;
  publishable_key: Scalars['String']['output'];
};

export type StripeAccountCapability = {
  __typename?: 'StripeAccountCapability';
  capabilities: Array<Capability>;
  id: Scalars['String']['output'];
};

export enum StripeAccountCapabilityDisplayPreferencePreference {
  None = 'none',
  Off = 'off',
  On = 'on'
}

export enum StripeAccountCapabilityDisplayPreferenceValue {
  Off = 'off',
  On = 'on'
}

export enum StripeCapabilityType {
  ApplePay = 'apple_pay',
  Card = 'card',
  GooglePay = 'google_pay'
}

export type StripeCard = {
  __typename?: 'StripeCard';
  _id: Scalars['MongoID']['output'];
  active: Scalars['Boolean']['output'];
  brand: Scalars['String']['output'];
  last4: Scalars['String']['output'];
  name: Scalars['String']['output'];
  provider_id: Scalars['String']['output'];
  stamp: Scalars['DateTimeISO']['output'];
  user: Scalars['MongoID']['output'];
};

export type StripeCardInfo = {
  __typename?: 'StripeCardInfo';
  brand?: Maybe<Scalars['String']['output']>;
  last4?: Maybe<Scalars['String']['output']>;
};

export type StripeConnectedAccount = {
  __typename?: 'StripeConnectedAccount';
  account_id: Scalars['String']['output'];
  connected?: Maybe<Scalars['Boolean']['output']>;
};

export type StripeOnrampSession = {
  __typename?: 'StripeOnrampSession';
  client_secret: Scalars['String']['output'];
  publishable_key: Scalars['String']['output'];
};

export type StripePaymentInfo = {
  __typename?: 'StripePaymentInfo';
  card?: Maybe<StripeCardInfo>;
  payment_intent: Scalars['String']['output'];
};

export enum StructuredDataType {
  Event = 'Event',
  Organization = 'Organization',
  WebPage = 'WebPage'
}

export type SubeventSettings = {
  __typename?: 'SubeventSettings';
  ticket_required_for_creation?: Maybe<Scalars['Boolean']['output']>;
  ticket_required_for_purchase?: Maybe<Scalars['Boolean']['output']>;
};

export type SubeventSettingsInput = {
  ticket_required_for_creation?: InputMaybe<Scalars['Boolean']['input']>;
  ticket_required_for_purchase?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SubmitApiKeyInput = {
  apiKey: Scalars['String']['input'];
  connectionId: Scalars['String']['input'];
};

export type SubmitEventFeedbackInput = {
  /** The feedback comment */
  comment?: InputMaybe<Scalars['String']['input']>;
  /** Rate value from 1 (bad) to 5 (good) */
  rate_value: Scalars['Float']['input'];
  token: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  cryptoSubscriptionActivated: SubscriptionResponse;
  notificationCreated: Notification;
  poapDropReady: PoapDrop;
  postCreated: Post;
  subscribeEventLatestViews: Track;
  votingUpdated: Scalars['MongoID']['output'];
};


export type SubscriptionCryptoSubscriptionActivatedArgs = {
  subscription_id: Scalars['MongoID']['input'];
};


export type SubscriptionPoapDropReadyArgs = {
  _id: Scalars['MongoID']['input'];
};


export type SubscriptionSubscribeEventLatestViewsArgs = {
  event: Scalars['MongoID']['input'];
};


export type SubscriptionVotingUpdatedArgs = {
  _id: Scalars['MongoID']['input'];
};

export type SubscriptionCryptoPrice = {
  __typename?: 'SubscriptionCryptoPrice';
  amount?: Maybe<Scalars['String']['output']>;
  amount_annual?: Maybe<Scalars['String']['output']>;
  chain_id: Scalars['String']['output'];
  token_address: Scalars['String']['output'];
};

export type SubscriptionDetail = {
  __typename?: 'SubscriptionDetail';
  active?: Maybe<Scalars['Boolean']['output']>;
  type: SubscriptionItemType;
};

export type SubscriptionFeatureConfig = {
  __typename?: 'SubscriptionFeatureConfig';
  description: Scalars['String']['output'];
  display_label?: Maybe<Scalars['String']['output']>;
  feature_code: Scalars['String']['output'];
  feature_type: FeatureType;
  tiers: Scalars['JSON']['output'];
};

export type SubscriptionItem = {
  __typename?: 'SubscriptionItem';
  credits_per_month?: Maybe<Scalars['Int']['output']>;
  crypto_prices?: Maybe<Array<SubscriptionCryptoPrice>>;
  pricing?: Maybe<SubscriptionPricing>;
  title: Scalars['String']['output'];
  type: SubscriptionItemType;
  weekly_email_limit?: Maybe<Scalars['Int']['output']>;
};

export enum SubscriptionItemType {
  Enterprise = 'enterprise',
  Free = 'free',
  Max = 'max',
  Plus = 'plus',
  Pro = 'pro'
}

export type SubscriptionPayment = {
  __typename?: 'SubscriptionPayment';
  client_secret: Scalars['String']['output'];
  publishable_key: Scalars['String']['output'];
};

export enum SubscriptionPaymentMethod {
  Crypto = 'crypto',
  Stripe = 'stripe'
}

export type SubscriptionPricing = {
  __typename?: 'SubscriptionPricing';
  annual_price: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  decimals: Scalars['Float']['output'];
  price: Scalars['String']['output'];
};

export type SubscriptionRecord = {
  __typename?: 'SubscriptionRecord';
  _id: Scalars['MongoID']['output'];
  cancel_at_period_end?: Maybe<Scalars['Boolean']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  crypto_subscription_amount?: Maybe<Scalars['String']['output']>;
  crypto_subscription_chain_id?: Maybe<Scalars['String']['output']>;
  crypto_subscription_reference?: Maybe<Scalars['String']['output']>;
  crypto_subscription_token_address?: Maybe<Scalars['String']['output']>;
  crypto_subscription_tx_hash?: Maybe<Scalars['String']['output']>;
  current_period_end: Scalars['DateTimeISO']['output'];
  current_period_start: Scalars['DateTimeISO']['output'];
  payment_method?: Maybe<SubscriptionPaymentMethod>;
  space: Scalars['MongoID']['output'];
  status: SubscriptionStatus;
};

export type SubscriptionResponse = {
  __typename?: 'SubscriptionResponse';
  items: Array<SubscriptionDetail>;
  payment?: Maybe<SubscriptionPayment>;
  subscription: SubscriptionRecord;
};

export enum SubscriptionStatus {
  Active = 'active',
  Incomplete = 'incomplete',
  PastDue = 'past_due'
}

export type SyncFarcasterConnectionStatusResponse = {
  __typename?: 'SyncFarcasterConnectionStatusResponse';
  accepted: Scalars['Boolean']['output'];
  userFid: Scalars['Float']['output'];
};

export type SyncSpaceTokenGateAccessResponse = {
  __typename?: 'SyncSpaceTokenGateAccessResponse';
  roles: Array<SpaceRole>;
};

export type SystemFile = {
  __typename?: 'SystemFile';
  _id?: Maybe<Scalars['MongoID']['output']>;
  bucket: Scalars['String']['output'];
  category: FileCategory;
  description?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  size?: Maybe<Scalars['Float']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  type: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type TelegramChannel = {
  __typename?: 'TelegramChannel';
  accessHash?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  inviteLink?: Maybe<Scalars['String']['output']>;
  joined?: Maybe<Array<Scalars['MongoID']['output']>>;
  photo?: Maybe<Scalars['MongoID']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type TelegramChannelInput = {
  accessHash?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  inviteLink?: InputMaybe<Scalars['String']['input']>;
  joined?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  photo?: InputMaybe<Scalars['MongoID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type Template = {
  __typename?: 'Template';
  _id: Scalars['MongoID']['output'];
  category?: Maybe<TemplateCategory>;
  changelog?: Maybe<Array<TemplateChangelog>>;
  config?: Maybe<Scalars['JSON']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  creator_id?: Maybe<Scalars['MongoID']['output']>;
  creator_type: TemplateCreatorType;
  currency?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  featured?: Maybe<Scalars['Boolean']['output']>;
  install_count: Scalars['Float']['output'];
  marketplace_listed?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  preview_urls?: Maybe<Array<Scalars['String']['output']>>;
  preview_video_url?: Maybe<Scalars['String']['output']>;
  price_cents?: Maybe<Scalars['Float']['output']>;
  published_at?: Maybe<Scalars['DateTimeISO']['output']>;
  rating_average: Scalars['Float']['output'];
  rating_count: Scalars['Float']['output'];
  review_notes?: Maybe<Scalars['String']['output']>;
  review_status?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  structure_data?: Maybe<Scalars['JSON']['output']>;
  subscription_tier_min: SubscriptionItemType;
  tags: Array<Scalars['String']['output']>;
  target: TemplateTarget;
  thumbnail_url?: Maybe<Scalars['String']['output']>;
  version: Scalars['String']['output'];
  visibility: TemplateVisibility;
};

export enum TemplateCategory {
  Brand = 'brand',
  Community = 'community',
  Concert = 'concert',
  Conference = 'conference',
  Custom = 'custom',
  Dao = 'dao',
  Festival = 'festival',
  Meetup = 'meetup',
  Minimal = 'minimal',
  Networking = 'networking',
  Portfolio = 'portfolio',
  Premium = 'premium',
  Workshop = 'workshop'
}

export type TemplateChangelog = {
  __typename?: 'TemplateChangelog';
  breaking_changes?: Maybe<Scalars['Boolean']['output']>;
  date: Scalars['DateTimeISO']['output'];
  summary: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export enum TemplateCreatorType {
  Community = 'community',
  Designer = 'designer'
}

export enum TemplateTarget {
  Event = 'event',
  Space = 'space',
  Universal = 'universal'
}

export type TemplateUpdateInfo = {
  __typename?: 'TemplateUpdateInfo';
  available: Scalars['Boolean']['output'];
  breaking_changes?: Maybe<Scalars['Boolean']['output']>;
  changelog_summary?: Maybe<Scalars['String']['output']>;
  current_version?: Maybe<Scalars['String']['output']>;
  latest_version?: Maybe<Scalars['String']['output']>;
};

export type TemplateUpdateInput = {
  breaking_changes?: InputMaybe<Scalars['Boolean']['input']>;
  changelog_summary: Scalars['String']['input'];
  config: Scalars['JSON']['input'];
};

export enum TemplateVisibility {
  Private = 'private',
  Public = 'public',
  Unlisted = 'unlisted'
}

export type TgUser = {
  __typename?: 'TgUser';
  accessHash: Scalars['String']['output'];
  applyMinPhoto?: Maybe<Scalars['Boolean']['output']>;
  attachMenuEnabled?: Maybe<Scalars['Boolean']['output']>;
  contact?: Maybe<Scalars['Boolean']['output']>;
  deleted?: Maybe<Scalars['Boolean']['output']>;
  fake?: Maybe<Scalars['Boolean']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  langCode?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  min?: Maybe<Scalars['Boolean']['output']>;
  mutualContact?: Maybe<Scalars['Boolean']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  restricted?: Maybe<Scalars['Boolean']['output']>;
  scam?: Maybe<Scalars['Boolean']['output']>;
  self?: Maybe<Scalars['Boolean']['output']>;
  support?: Maybe<Scalars['Boolean']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
};

export type ThemeInput = {
  background?: InputMaybe<PageThemeBackgroundInput>;
  colors?: InputMaybe<PageThemeColorsInput>;
  css_variables?: InputMaybe<Scalars['JSON']['input']>;
  effects?: InputMaybe<PageThemeEffectsInput>;
  fonts?: InputMaybe<PageThemeFontsInput>;
  mode?: InputMaybe<ThemeMode>;
  type?: InputMaybe<ThemeType>;
};

export enum ThemeMode {
  Auto = 'auto',
  Dark = 'dark',
  Light = 'light'
}

export enum ThemeType {
  Custom = 'custom',
  Image = 'image',
  Minimal = 'minimal',
  Pattern = 'pattern',
  Shader = 'shader'
}

export type Ticket = {
  __typename?: 'Ticket';
  _id: Scalars['MongoID']['output'];
  accepted?: Maybe<Scalars['Boolean']['output']>;
  acquired_by?: Maybe<Scalars['MongoID']['output']>;
  acquired_by_email?: Maybe<Scalars['String']['output']>;
  acquired_expanded?: Maybe<UserWithEmail>;
  acquired_tickets?: Maybe<Array<Ticket>>;
  assigned_email?: Maybe<Scalars['String']['output']>;
  assigned_to?: Maybe<Scalars['MongoID']['output']>;
  assigned_to_expanded?: Maybe<User>;
  assigned_to_info?: Maybe<ConfidentialUserInfo>;
  /** This object includes the email when compared to the `assigned_to_expanded` field. */
  assignee_expanded?: Maybe<UserWithEmail>;
  cancelled_at?: Maybe<Scalars['DateTimeISO']['output']>;
  cancelled_by?: Maybe<Scalars['MongoID']['output']>;
  cancelled_by_expanded?: Maybe<User>;
  checkin?: Maybe<EventCheckin>;
  /** Date time when the ticket is created */
  created_at: Scalars['DateTimeISO']['output'];
  event: Scalars['MongoID']['output'];
  event_expanded?: Maybe<Event>;
  invited_by?: Maybe<Scalars['MongoID']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  payment_id?: Maybe<Scalars['MongoID']['output']>;
  shortid: Scalars['String']['output'];
  /** Id of the ticket type */
  type: Scalars['MongoID']['output'];
  type_expanded?: Maybe<EventTicketType>;
  upgrade_history?: Maybe<Array<TicketUpgradeHistory>>;
};

export type TicketAssignee = {
  email?: InputMaybe<Scalars['String']['input']>;
  ticket: Scalars['MongoID']['input'];
  user?: InputMaybe<Scalars['MongoID']['input']>;
};

export type TicketAssignment = {
  count: Scalars['Float']['input'];
  email: Scalars['String']['input'];
};

export type TicketBase = {
  __typename?: 'TicketBase';
  _id: Scalars['MongoID']['output'];
  accepted?: Maybe<Scalars['Boolean']['output']>;
  acquired_by?: Maybe<Scalars['MongoID']['output']>;
  acquired_by_email?: Maybe<Scalars['String']['output']>;
  assigned_email?: Maybe<Scalars['String']['output']>;
  assigned_to?: Maybe<Scalars['MongoID']['output']>;
  assigned_to_info?: Maybe<ConfidentialUserInfo>;
  cancelled_at?: Maybe<Scalars['DateTimeISO']['output']>;
  cancelled_by?: Maybe<Scalars['MongoID']['output']>;
  /** Date time when the ticket is created */
  created_at: Scalars['DateTimeISO']['output'];
  event: Scalars['MongoID']['output'];
  invited_by?: Maybe<Scalars['MongoID']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  payment_id?: Maybe<Scalars['MongoID']['output']>;
  shortid: Scalars['String']['output'];
  /** Id of the ticket type */
  type: Scalars['MongoID']['output'];
};

export type TicketDiscount = {
  __typename?: 'TicketDiscount';
  discount: Scalars['String']['output'];
  limit: Scalars['Float']['output'];
  ratio: Scalars['Float']['output'];
};

export type TicketExport = {
  __typename?: 'TicketExport';
  _id: Scalars['MongoID']['output'];
  active?: Maybe<Scalars['Boolean']['output']>;
  assigned_email?: Maybe<Scalars['String']['output']>;
  assigned_to?: Maybe<Scalars['MongoID']['output']>;
  assignee_email?: Maybe<Scalars['String']['output']>;
  buyer_avatar?: Maybe<Scalars['String']['output']>;
  buyer_email?: Maybe<Scalars['String']['output']>;
  buyer_first_name?: Maybe<Scalars['String']['output']>;
  buyer_id?: Maybe<Scalars['MongoID']['output']>;
  buyer_last_name?: Maybe<Scalars['String']['output']>;
  buyer_name?: Maybe<Scalars['String']['output']>;
  buyer_username?: Maybe<Scalars['String']['output']>;
  buyer_wallet?: Maybe<Scalars['String']['output']>;
  cancelled_by?: Maybe<Scalars['String']['output']>;
  checkin_date?: Maybe<Scalars['DateTimeISO']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  discount_amount?: Maybe<Scalars['String']['output']>;
  discount_code?: Maybe<Scalars['String']['output']>;
  is_assigned?: Maybe<Scalars['Boolean']['output']>;
  is_claimed?: Maybe<Scalars['Boolean']['output']>;
  is_issued?: Maybe<Scalars['Boolean']['output']>;
  issued_by?: Maybe<Scalars['String']['output']>;
  payment_amount?: Maybe<Scalars['String']['output']>;
  payment_id?: Maybe<Scalars['MongoID']['output']>;
  payment_provider?: Maybe<Scalars['String']['output']>;
  purchase_date: Scalars['DateTimeISO']['output'];
  quantity: Scalars['Float']['output'];
  shortid: Scalars['String']['output'];
  ticket_category?: Maybe<Scalars['String']['output']>;
  ticket_type?: Maybe<Scalars['String']['output']>;
  ticket_type_id?: Maybe<Scalars['MongoID']['output']>;
};

export type TicketSoldChartData = {
  __typename?: 'TicketSoldChartData';
  items: Array<TicketSoldItem>;
};

export type TicketSoldItem = {
  __typename?: 'TicketSoldItem';
  /** Date time when the ticket is created */
  created_at: Scalars['DateTimeISO']['output'];
  /** Id of the ticket type */
  type: Scalars['MongoID']['output'];
};

export type TicketStatisticPerTier = {
  __typename?: 'TicketStatisticPerTier';
  count: Scalars['Float']['output'];
  ticket_type: Scalars['MongoID']['output'];
  ticket_type_title: Scalars['String']['output'];
};

export type TicketStatistics = {
  __typename?: 'TicketStatistics';
  all: Scalars['Float']['output'];
  applicants: Array<JoinRequestStatistic>;
  cancelled: Scalars['Float']['output'];
  checked_in: Scalars['Float']['output'];
  invited: Scalars['Float']['output'];
  issued: Scalars['Float']['output'];
  not_checked_in: Scalars['Float']['output'];
  ticket_types: Array<TicketStatisticPerTier>;
};

export type TicketTokenRewardSetting = {
  __typename?: 'TicketTokenRewardSetting';
  _id: Scalars['MongoID']['output'];
  currency_address: Scalars['String']['output'];
  event: Scalars['MongoID']['output'];
  photo?: Maybe<Scalars['MongoID']['output']>;
  photo_expanded?: Maybe<File>;
  rewards: Array<TicketTypeReward>;
  title: Scalars['String']['output'];
  user: Scalars['MongoID']['output'];
  vault: Scalars['MongoID']['output'];
  vault_expanded?: Maybe<TokenRewardVault>;
};

export type TicketTokenRewardSettingInput = {
  currency_address?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  photo?: InputMaybe<Scalars['MongoID']['input']>;
  rewards?: InputMaybe<Array<TicketTypeRewardInput>>;
  title?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['MongoID']['input']>;
};

export type TicketTypeReward = {
  __typename?: 'TicketTypeReward';
  reward_id: Scalars['String']['output'];
  reward_per_ticket: Scalars['String']['output'];
  ticket_type: Scalars['MongoID']['output'];
  ticket_type_expanded?: Maybe<EventTicketType>;
};

export type TicketTypeRewardInput = {
  reward_per_ticket: Scalars['String']['input'];
  ticket_type: Scalars['MongoID']['input'];
};

export type TicketUpgradeHistory = {
  __typename?: 'TicketUpgradeHistory';
  from_type: Scalars['MongoID']['output'];
  from_type_expanded?: Maybe<EventTicketType>;
  to_type: Scalars['MongoID']['output'];
  to_type_expanded?: Maybe<EventTicketType>;
  updated_at: Scalars['DateTimeISO']['output'];
  updated_by: Scalars['MongoID']['output'];
  updated_by_expanded?: Maybe<User>;
};

export type ToggleBlockUserInput = {
  block: Scalars['Boolean']['input'];
  user: Scalars['MongoID']['input'];
};

export type Token = {
  __typename?: 'Token';
  /** Whether the token is active and can be used */
  active?: Maybe<Scalars['Boolean']['output']>;
  /** The contract address of the ERC20 token */
  contract: Scalars['String']['output'];
  /** Number of decimal places, from 0 to 18 */
  decimals: Scalars['Float']['output'];
  /** Whether this currency is the native currency of the chain */
  is_native?: Maybe<Scalars['Boolean']['output']>;
  /** The URL of the token logo */
  logo_url?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  /** Symbol of the currency token */
  symbol: Scalars['String']['output'];
};

export type TokenRewardClaim = {
  __typename?: 'TokenRewardClaim';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
};

export type TokenRewardSignature = {
  __typename?: 'TokenRewardSignature';
  /** The args that will be supplied to the contract */
  args: Array<Scalars['JSON']['output']>;
  claimId: Scalars['String']['output'];
  signature: Scalars['String']['output'];
};

export type TokenRewardVault = {
  __typename?: 'TokenRewardVault';
  _id: Scalars['MongoID']['output'];
  address: Scalars['String']['output'];
  network: Scalars['String']['output'];
  settings_count?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
  tokens?: Maybe<Array<RewardToken>>;
  user: Scalars['MongoID']['output'];
};

export type TokenRewardVaultInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  network?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  tokens?: InputMaybe<Array<RewardTokenInput>>;
};

export type TopUser = {
  __typename?: 'TopUser';
  credits: Scalars['Float']['output'];
  percentage: Scalars['Float']['output'];
  requests: Scalars['Int']['output'];
  user_id: Scalars['String']['output'];
};

export type Track = {
  __typename?: 'Track';
  date: Scalars['DateTimeISO']['output'];
  geoip_city?: Maybe<Scalars['String']['output']>;
  geoip_country?: Maybe<Scalars['String']['output']>;
  geoip_region?: Maybe<Scalars['String']['output']>;
  user_agent?: Maybe<Scalars['String']['output']>;
};

export type UnsubscribeSpaceInput = {
  reason?: InputMaybe<Scalars['String']['input']>;
  space: Scalars['MongoID']['input'];
  /** The unsubscribe token from the email */
  token: Scalars['String']['input'];
};

export type UpdateApiKeyInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  scopes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateBadgeInput = {
  contract?: InputMaybe<Scalars['String']['input']>;
  network?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBadgeListInput = {
  image_url?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDonationInput = {
  _id: Scalars['MongoID']['input'];
  from_wallet?: InputMaybe<Scalars['String']['input']>;
  tx_hash?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEventCheckinInput = {
  active: Scalars['Boolean']['input'];
  /** @deprecated use shortIds instead */
  event?: InputMaybe<Scalars['MongoID']['input']>;
  /** @deprecated Prefer using `shortids` along with `updateEventCheckins` mutation instead */
  shortid?: InputMaybe<Scalars['String']['input']>;
  shortids?: InputMaybe<Array<Scalars['String']['input']>>;
  /** @deprecated use shortIds instead */
  user?: InputMaybe<Scalars['MongoID']['input']>;
};

export type UpdateEventEmailSettingInput = {
  _id: Scalars['MongoID']['input'];
  cc?: InputMaybe<Array<Scalars['String']['input']>>;
  custom_body_html?: InputMaybe<Scalars['String']['input']>;
  custom_subject_html?: InputMaybe<Scalars['String']['input']>;
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  recipient_filters?: InputMaybe<EmailRecipientFiltersInput>;
  recipient_types?: InputMaybe<Array<EmailRecipientType>>;
  scheduled_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
};

export type UpdateEventRewardUseInput = {
  active: Scalars['Boolean']['input'];
  event: Scalars['MongoID']['input'];
  reward_id: Scalars['MongoID']['input'];
  reward_number: Scalars['Float']['input'];
  user: Scalars['MongoID']['input'];
};

export type UpdateEventTicketDiscountInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  ticket_limit?: InputMaybe<Scalars['Float']['input']>;
  ticket_limit_per?: InputMaybe<Scalars['Float']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  use_limit?: InputMaybe<Scalars['Float']['input']>;
  use_limit_per?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateMyLemonheadInvitationsResponse = {
  __typename?: 'UpdateMyLemonheadInvitationsResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  /** Wallets that are already invited */
  wallets?: Maybe<Array<Scalars['String']['output']>>;
};

export type UpdateNewPaymentAccountInput = {
  _id: Scalars['MongoID']['input'];
  account_info: Scalars['JSON']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePageConfigInput = {
  custom_code?: InputMaybe<CustomCodeInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sections?: InputMaybe<Array<PageSectionInput>>;
  theme?: InputMaybe<ThemeInput>;
};

export type UpdatePaymentInput = {
  _id: Scalars['MongoID']['input'];
  payment_secret?: InputMaybe<Scalars['String']['input']>;
  transfer_params?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePoapInput = {
  /** Requested poap amount */
  amount?: InputMaybe<Scalars['Int']['input']>;
  claim_mode?: InputMaybe<PoapClaimMode>;
  description?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  minting_network?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
};

export type UpdatePostInput = {
  published?: InputMaybe<Scalars['Boolean']['input']>;
  visibility?: InputMaybe<PostVisibility>;
};

export type UpdateSiteInput = {
  access_pass?: InputMaybe<AccessPassInput>;
  active?: InputMaybe<Scalars['Boolean']['input']>;
  ai_config?: InputMaybe<Scalars['MongoID']['input']>;
  client?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  event?: InputMaybe<Scalars['MongoID']['input']>;
  favicon_url?: InputMaybe<Scalars['String']['input']>;
  footer_scripts?: InputMaybe<Array<SiteFooterScriptInput>>;
  header_links?: InputMaybe<Array<SiteHeaderLinkInput>>;
  header_metas?: InputMaybe<Array<SiteHeaderMetaInput>>;
  hostnames?: InputMaybe<Array<Scalars['String']['input']>>;
  logo_mobile_url?: InputMaybe<Scalars['String']['input']>;
  logo_url?: InputMaybe<Scalars['String']['input']>;
  onboarding_steps?: InputMaybe<Array<SiteOnboardingStepInput>>;
  owners?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  partners?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  passports?: InputMaybe<Array<SitePassportInput>>;
  privacy_url?: InputMaybe<Scalars['String']['input']>;
  share_url?: InputMaybe<Scalars['JSON']['input']>;
  text?: InputMaybe<Scalars['JSON']['input']>;
  theme_data?: InputMaybe<Scalars['JSON']['input']>;
  theme_type?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateSpaceMemberInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  role?: InputMaybe<SpaceRole>;
  visible?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateSpaceNewsletterInput = {
  _id: Scalars['MongoID']['input'];
  cc?: InputMaybe<Array<Scalars['String']['input']>>;
  custom_body_html?: InputMaybe<Scalars['String']['input']>;
  custom_subject_html?: InputMaybe<Scalars['String']['input']>;
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  recipient_filters?: InputMaybe<EmailRecipientFiltersInput>;
  recipient_types?: InputMaybe<Array<EmailRecipientType>>;
  scheduled_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
};

export type UpdateSpaceRoleFeaturesInput = {
  codes: Array<FeatureCode>;
  role: Scalars['String']['input'];
  space: Scalars['MongoID']['input'];
};

export type UpdateStoreBucketItemInput = {
  count: Scalars['Float']['input'];
};

export type UpdateStripeConnectedAccountCapabilityInput = {
  capabilities: Array<CapabilityInput>;
  id: Scalars['String']['input'];
};

export type UpdateSubscriptionInput = {
  items?: InputMaybe<Array<SubscriptionItemType>>;
  payment_method_id?: InputMaybe<Scalars['String']['input']>;
  space?: InputMaybe<Scalars['MongoID']['input']>;
};

export type UpdateTemplateInput = {
  category?: InputMaybe<TemplateCategory>;
  config?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  preview_urls?: InputMaybe<Array<Scalars['String']['input']>>;
  preview_video_url?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  structure_data?: InputMaybe<Scalars['JSON']['input']>;
  subscription_tier_min?: InputMaybe<SubscriptionItemType>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  target?: InputMaybe<TemplateTarget>;
  thumbnail_url?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<TemplateVisibility>;
};

export type UpdateTicketTypeCategoryInput = {
  _id: Scalars['MongoID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['MongoID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  ticket_types?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  title: Scalars['String']['input'];
};

export type UpdateTokenRewardClaimInput = {
  _id: Scalars['MongoID']['input'];
  from_wallet: Scalars['String']['input'];
  network: Scalars['String']['input'];
  tx_hash: Scalars['String']['input'];
};

export type UpgradeTicketInput = {
  event: Scalars['MongoID']['input'];
  ticket: Scalars['MongoID']['input'];
  to_type: Scalars['MongoID']['input'];
};

export type UploadFolderFileCountItem = {
  __typename?: 'UploadFolderFileCountItem';
  count: Scalars['Int']['output'];
  folder_id: Scalars['String']['output'];
};

export type UploadFolderFileItem = {
  __typename?: 'UploadFolderFileItem';
  key: Scalars['String']['output'];
  last_modified: Scalars['DateTimeISO']['output'];
  size: Scalars['Int']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type UploadFolderFilesResult = {
  __typename?: 'UploadFolderFilesResult';
  items: Array<UploadFolderFileItem>;
  next_token?: Maybe<Scalars['String']['output']>;
  total: Scalars['Int']['output'];
};

export type UploadFolderPresignedUrlResult = {
  __typename?: 'UploadFolderPresignedUrlResult';
  key: Scalars['String']['output'];
  presigned_url: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type UsageAnalytics = {
  __typename?: 'UsageAnalytics';
  by_model: Array<ModelUsageBreakdown>;
  daily_usage: Array<DailyUsage>;
  top_users: Array<TopUser>;
  totals: UsageTotals;
};

export type UsageTotals = {
  __typename?: 'UsageTotals';
  avg_credits_per_request: Scalars['Float']['output'];
  credits: Scalars['Float']['output'];
  requests: Scalars['Int']['output'];
};

export type User = {
  __typename?: 'User';
  _id?: Maybe<Scalars['MongoID']['output']>;
  active: Scalars['Boolean']['output'];
  addresses?: Maybe<Array<Address>>;
  admin_access?: Maybe<AdminAccess>;
  age?: Maybe<Scalars['Float']['output']>;
  attended?: Maybe<Scalars['Float']['output']>;
  blocked?: Maybe<Array<Scalars['MongoID']['output']>>;
  blocked_expanded?: Maybe<Array<Maybe<User>>>;
  calendly_url?: Maybe<Scalars['String']['output']>;
  company_address?: Maybe<Address>;
  company_name?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  cover?: Maybe<Scalars['MongoID']['output']>;
  cover_expanded?: Maybe<File>;
  created_at: Scalars['DateTimeISO']['output'];
  currency?: Maybe<Scalars['String']['output']>;
  daos?: Maybe<Array<UserDao>>;
  data?: Maybe<Scalars['JSON']['output']>;
  date_of_birth?: Maybe<Scalars['DateTimeISO']['output']>;
  /** This is the biography of the user */
  description?: Maybe<Scalars['String']['output']>;
  discord_user_info?: Maybe<Scalars['JSON']['output']>;
  discovery?: Maybe<UserDiscoverySettings>;
  display_name?: Maybe<Scalars['String']['output']>;
  education_title?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  email_marketing?: Maybe<Scalars['Boolean']['output']>;
  email_verified?: Maybe<Scalars['Boolean']['output']>;
  ethnicity?: Maybe<Scalars['String']['output']>;
  eventbrite_user_info?: Maybe<Scalars['JSON']['output']>;
  events?: Maybe<Array<Scalars['MongoID']['output']>>;
  events_expanded?: Maybe<Array<Maybe<Event>>>;
  expertise?: Maybe<Array<Scalars['MongoID']['output']>>;
  expertise_expanded?: Maybe<Array<Maybe<UserExpertise>>>;
  farcaster_fid?: Maybe<Scalars['Float']['output']>;
  farcaster_user_info?: Maybe<FarcasterUserInfo>;
  fcm_tokens?: Maybe<Array<Scalars['String']['output']>>;
  first_name?: Maybe<Scalars['String']['output']>;
  followers?: Maybe<Scalars['Float']['output']>;
  following?: Maybe<Scalars['Float']['output']>;
  frequent_questions?: Maybe<Array<FrequentQuestion>>;
  friends?: Maybe<Scalars['Float']['output']>;
  google_user_info?: Maybe<Scalars['JSON']['output']>;
  handle_facebook?: Maybe<Scalars['String']['output']>;
  handle_farcaster?: Maybe<Scalars['String']['output']>;
  handle_github?: Maybe<Scalars['String']['output']>;
  handle_instagram?: Maybe<Scalars['String']['output']>;
  handle_lens?: Maybe<Scalars['String']['output']>;
  handle_linkedin?: Maybe<Scalars['String']['output']>;
  handle_mirror?: Maybe<Scalars['String']['output']>;
  handle_twitter?: Maybe<Scalars['String']['output']>;
  hosted?: Maybe<Scalars['Float']['output']>;
  icebreakers?: Maybe<Array<UserIcebreaker>>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  industry?: Maybe<Scalars['String']['output']>;
  interests?: Maybe<Array<Scalars['String']['output']>>;
  job_title?: Maybe<Scalars['String']['output']>;
  kratos_farcaster_fid?: Maybe<Scalars['String']['output']>;
  kratos_unicorn_wallet_address?: Maybe<Scalars['String']['output']>;
  kratos_wallet_address?: Maybe<Scalars['String']['output']>;
  languages?: Maybe<Array<Scalars['String']['output']>>;
  last_name?: Maybe<Scalars['String']['output']>;
  layout_sections?: Maybe<Array<LayoutSection>>;
  lemon_amount: Scalars['Float']['output'];
  lemon_cap: Scalars['Float']['output'];
  lemon_refresh_at?: Maybe<Scalars['DateTimeISO']['output']>;
  lemonhead_inviter_wallet?: Maybe<Scalars['String']['output']>;
  lens_profile_id?: Maybe<Scalars['String']['output']>;
  lens_profile_synced?: Maybe<Scalars['Boolean']['output']>;
  location_line?: Maybe<Scalars['String']['output']>;
  matrix_localpart?: Maybe<Scalars['String']['output']>;
  music?: Maybe<Array<Scalars['String']['output']>>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
  new_gender?: Maybe<Scalars['String']['output']>;
  new_photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  new_photos_expanded?: Maybe<Array<Maybe<File>>>;
  notification_filters?: Maybe<Array<NotificationFilter>>;
  oauth2_allow_creation?: Maybe<Scalars['Boolean']['output']>;
  oauth2_clients?: Maybe<Array<Scalars['String']['output']>>;
  oauth2_max_clients?: Maybe<Scalars['Int']['output']>;
  offers?: Maybe<Array<UserOffer>>;
  payment_verification?: Maybe<UserPaymentVerification>;
  phone?: Maybe<Scalars['String']['output']>;
  phone_verified?: Maybe<Scalars['Boolean']['output']>;
  posts?: Maybe<Scalars['Float']['output']>;
  preferred_network?: Maybe<Scalars['String']['output']>;
  pronoun?: Maybe<Scalars['String']['output']>;
  quest_points?: Maybe<Scalars['Float']['output']>;
  razorpay_customer?: Maybe<Scalars['String']['output']>;
  search_range?: Maybe<Scalars['Float']['output']>;
  service_offers?: Maybe<Array<Scalars['MongoID']['output']>>;
  service_offers_expanded?: Maybe<Array<Maybe<UserServiceOffer>>>;
  settings?: Maybe<Scalars['JSON']['output']>;
  shopify_user_info?: Maybe<Scalars['JSON']['output']>;
  stripe_connected_account?: Maybe<StripeConnectedAccount>;
  stripe_user_info?: Maybe<Scalars['JSON']['output']>;
  tag_recommended?: Maybe<Scalars['Boolean']['output']>;
  tag_site?: Maybe<Scalars['Boolean']['output']>;
  tag_timeline?: Maybe<Scalars['Boolean']['output']>;
  tag_verified?: Maybe<Scalars['Boolean']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  telegram_user_info?: Maybe<Scalars['JSON']['output']>;
  terms_accepted_adult?: Maybe<Scalars['Boolean']['output']>;
  terms_accepted_conditions?: Maybe<Scalars['Boolean']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  twitch_user_info?: Maybe<Scalars['JSON']['output']>;
  twitter2_user_info?: Maybe<Scalars['JSON']['output']>;
  twitter_user_info?: Maybe<Scalars['JSON']['output']>;
  type?: Maybe<UserType>;
  updated_at: Scalars['DateTimeISO']['output'];
  url?: Maybe<Scalars['String']['output']>;
  url_go?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
  wallet_custodial?: Maybe<Scalars['String']['output']>;
  wallets?: Maybe<Array<Scalars['String']['output']>>;
  wallets_new?: Maybe<Scalars['JSON']['output']>;
  website?: Maybe<Scalars['String']['output']>;
  zoom_user_info?: Maybe<Scalars['JSON']['output']>;
};


export type UserEvents_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type UserNew_Photos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type UserContact = {
  __typename?: 'UserContact';
  _id: Scalars['MongoID']['output'];
  contact?: Maybe<Scalars['MongoID']['output']>;
  contact_expanded?: Maybe<User>;
  converted_at?: Maybe<Scalars['DateTimeISO']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  email?: Maybe<Scalars['String']['output']>;
  first_name?: Maybe<Scalars['String']['output']>;
  invited_at?: Maybe<Scalars['DateTimeISO']['output']>;
  invited_count?: Maybe<Scalars['Float']['output']>;
  last_name?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  user: Scalars['MongoID']['output'];
};

export type UserDao = {
  __typename?: 'UserDao';
  address: Scalars['String']['output'];
  network: Scalars['String']['output'];
};

export type UserDaoInput = {
  address: Scalars['String']['input'];
  network: Scalars['String']['input'];
};

export type UserDiscovery = {
  __typename?: 'UserDiscovery';
  _id: Scalars['MongoID']['output'];
  event?: Maybe<Scalars['MongoID']['output']>;
  max_age: Scalars['Float']['output'];
  min_age: Scalars['Float']['output'];
  search_range: Scalars['Float']['output'];
  selected: Array<Scalars['MongoID']['output']>;
  selected_expanded?: Maybe<Array<Maybe<User>>>;
  stamp: Scalars['DateTimeISO']['output'];
  user: Scalars['MongoID']['output'];
};

export type UserDiscoverySettings = {
  __typename?: 'UserDiscoverySettings';
  enabled: Scalars['Boolean']['output'];
  max_age: Scalars['Float']['output'];
  min_age: Scalars['Float']['output'];
};

export type UserDiscoverySettingsInput = {
  enabled: Scalars['Boolean']['input'];
  max_age: Scalars['Float']['input'];
  min_age: Scalars['Float']['input'];
};

export type UserDiscoverySwipe = {
  __typename?: 'UserDiscoverySwipe';
  _id: Scalars['MongoID']['output'];
  decision1?: Maybe<UserDiscoverySwipeDecision>;
  decision2?: Maybe<UserDiscoverySwipeDecision>;
  message?: Maybe<Scalars['String']['output']>;
  other?: Maybe<Scalars['MongoID']['output']>;
  other_expanded?: Maybe<User>;
  source: UserDiscoverySwipeSource;
  stamp: Scalars['DateTimeISO']['output'];
  state: UserDiscoverySwipeState;
  user1: Scalars['MongoID']['output'];
  user2: Scalars['MongoID']['output'];
};

export enum UserDiscoverySwipeDecision {
  Accept = 'accept',
  Decline = 'decline'
}

export enum UserDiscoverySwipeSource {
  Discovery = 'discovery',
  Live = 'live'
}

export enum UserDiscoverySwipeState {
  Declined = 'declined',
  Matched = 'matched',
  Pending = 'pending',
  Undecided = 'undecided'
}

export type UserExpertise = {
  __typename?: 'UserExpertise';
  _id: Scalars['MongoID']['output'];
  title: Scalars['String']['output'];
};

export type UserFollow = {
  __typename?: 'UserFollow';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  followee: Scalars['MongoID']['output'];
  followee_expanded?: Maybe<User>;
  follower: Scalars['MongoID']['output'];
  follower_expanded?: Maybe<User>;
};

export type UserFriendship = {
  __typename?: 'UserFriendship';
  _id: Scalars['MongoID']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  other?: Maybe<Scalars['MongoID']['output']>;
  other_expanded?: Maybe<User>;
  state: UserFriendshipState;
  type?: Maybe<UserFriendshipType>;
  types?: Maybe<Scalars['JSON']['output']>;
  user1: Scalars['MongoID']['output'];
  user2: Scalars['MongoID']['output'];
};

export enum UserFriendshipState {
  Accepted = 'accepted',
  Pending = 'pending'
}

export enum UserFriendshipType {
  Crew = 'crew',
  Tribe = 'tribe'
}

export type UserIcebreaker = {
  __typename?: 'UserIcebreaker';
  _id?: Maybe<Scalars['MongoID']['output']>;
  question: Scalars['MongoID']['output'];
  question_expanded?: Maybe<UserIcebreakerQuestion>;
  value: Scalars['String']['output'];
};

export type UserIcebreakerInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  question: Scalars['MongoID']['input'];
  value: Scalars['String']['input'];
};

export type UserIcebreakerQuestion = {
  __typename?: 'UserIcebreakerQuestion';
  _id: Scalars['MongoID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type UserInput = {
  addresses?: InputMaybe<Array<AddressInput>>;
  calendly_url?: InputMaybe<Scalars['String']['input']>;
  company_address?: InputMaybe<AddressInput>;
  company_name?: InputMaybe<Scalars['String']['input']>;
  cover?: InputMaybe<Scalars['MongoID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  daos?: InputMaybe<Array<UserDaoInput>>;
  data?: InputMaybe<Scalars['JSON']['input']>;
  date_of_birth?: InputMaybe<Scalars['DateTimeISO']['input']>;
  /** This is the biography of the user */
  description?: InputMaybe<Scalars['String']['input']>;
  discovery?: InputMaybe<UserDiscoverySettingsInput>;
  display_name?: InputMaybe<Scalars['String']['input']>;
  education_title?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  email_marketing?: InputMaybe<Scalars['Boolean']['input']>;
  ethnicity?: InputMaybe<Scalars['String']['input']>;
  events?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  expertise?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  frequent_questions?: InputMaybe<Array<FrequentQuestionInput>>;
  handle_facebook?: InputMaybe<Scalars['String']['input']>;
  handle_farcaster?: InputMaybe<Scalars['String']['input']>;
  handle_github?: InputMaybe<Scalars['String']['input']>;
  handle_instagram?: InputMaybe<Scalars['String']['input']>;
  handle_lens?: InputMaybe<Scalars['String']['input']>;
  handle_linkedin?: InputMaybe<Scalars['String']['input']>;
  handle_mirror?: InputMaybe<Scalars['String']['input']>;
  handle_twitter?: InputMaybe<Scalars['String']['input']>;
  icebreakers?: InputMaybe<Array<UserIcebreakerInput>>;
  image_avatar?: InputMaybe<Scalars['String']['input']>;
  industry?: InputMaybe<Scalars['String']['input']>;
  interests?: InputMaybe<Array<Scalars['String']['input']>>;
  job_title?: InputMaybe<Scalars['String']['input']>;
  languages?: InputMaybe<Array<Scalars['String']['input']>>;
  layout_sections?: InputMaybe<Array<LayoutSectionInput>>;
  lens_profile_synced?: InputMaybe<Scalars['Boolean']['input']>;
  music?: InputMaybe<Array<Scalars['String']['input']>>;
  /** This field contains the name of the user in a short version */
  name?: InputMaybe<Scalars['String']['input']>;
  new_gender?: InputMaybe<Scalars['String']['input']>;
  new_photos?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  offers?: InputMaybe<Array<UserOfferInput>>;
  phone?: InputMaybe<Scalars['String']['input']>;
  preferred_network?: InputMaybe<Scalars['String']['input']>;
  pronoun?: InputMaybe<Scalars['String']['input']>;
  search_range?: InputMaybe<Scalars['Float']['input']>;
  service_offers?: InputMaybe<Array<Scalars['MongoID']['input']>>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  tagline?: InputMaybe<Scalars['String']['input']>;
  terms_accepted_adult?: InputMaybe<Scalars['Boolean']['input']>;
  terms_accepted_conditions?: InputMaybe<Scalars['Boolean']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type UserOffer = {
  __typename?: 'UserOffer';
  _id?: Maybe<Scalars['MongoID']['output']>;
  auto?: Maybe<Scalars['Boolean']['output']>;
  position?: Maybe<Scalars['Float']['output']>;
  provider: OfferProvider;
  provider_id: Scalars['String']['output'];
  provider_network: Scalars['String']['output'];
};

export type UserOfferInput = {
  _id?: InputMaybe<Scalars['MongoID']['input']>;
  auto?: InputMaybe<Scalars['Boolean']['input']>;
  position?: InputMaybe<Scalars['Float']['input']>;
  provider: OfferProvider;
  provider_id: Scalars['String']['input'];
  provider_network: Scalars['String']['input'];
};

export type UserPaymentVerification = {
  __typename?: 'UserPaymentVerification';
  reason?: Maybe<Scalars['String']['output']>;
  stamp: Scalars['DateTimeISO']['output'];
  state: UserPaymentVerificationState;
  verified_by?: Maybe<Scalars['MongoID']['output']>;
};

export type UserPaymentVerificationCondition = {
  __typename?: 'UserPaymentVerificationCondition';
  prop: Scalars['String']['output'];
  satisfied: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
};

export type UserPaymentVerificationInfo = {
  __typename?: 'UserPaymentVerificationInfo';
  conditions: Array<UserPaymentVerificationCondition>;
  eligible: Scalars['Boolean']['output'];
  verified: Scalars['Boolean']['output'];
};

export enum UserPaymentVerificationState {
  Completed = 'completed',
  Declined = 'declined',
  Pending = 'pending'
}

export type UserSelfRequest = {
  __typename?: 'UserSelfRequest';
  endpoint: Scalars['String']['output'];
  endpoint_type: Scalars['String']['output'];
  scope: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type UserServiceOffer = {
  __typename?: 'UserServiceOffer';
  _id: Scalars['MongoID']['output'];
  title: Scalars['String']['output'];
};

export enum UserType {
  Admin = 'Admin'
}

export type UserWalletRequest = {
  __typename?: 'UserWalletRequest';
  message: Scalars['String']['output'];
  token: Scalars['String']['output'];
};

export type UserWithEmail = {
  __typename?: 'UserWithEmail';
  _id?: Maybe<Scalars['MongoID']['output']>;
  active: Scalars['Boolean']['output'];
  addresses?: Maybe<Array<Address>>;
  admin_access?: Maybe<AdminAccess>;
  age?: Maybe<Scalars['Float']['output']>;
  attended?: Maybe<Scalars['Float']['output']>;
  blocked?: Maybe<Array<Scalars['MongoID']['output']>>;
  blocked_expanded?: Maybe<Array<Maybe<User>>>;
  calendly_url?: Maybe<Scalars['String']['output']>;
  company_address?: Maybe<Address>;
  company_name?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  cover?: Maybe<Scalars['MongoID']['output']>;
  cover_expanded?: Maybe<File>;
  created_at: Scalars['DateTimeISO']['output'];
  currency?: Maybe<Scalars['String']['output']>;
  daos?: Maybe<Array<UserDao>>;
  data?: Maybe<Scalars['JSON']['output']>;
  date_of_birth?: Maybe<Scalars['DateTimeISO']['output']>;
  /** This is the biography of the user */
  description?: Maybe<Scalars['String']['output']>;
  discord_user_info?: Maybe<Scalars['JSON']['output']>;
  discovery?: Maybe<UserDiscoverySettings>;
  display_name?: Maybe<Scalars['String']['output']>;
  education_title?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  email_marketing?: Maybe<Scalars['Boolean']['output']>;
  email_verified?: Maybe<Scalars['Boolean']['output']>;
  ethnicity?: Maybe<Scalars['String']['output']>;
  eventbrite_user_info?: Maybe<Scalars['JSON']['output']>;
  events?: Maybe<Array<Scalars['MongoID']['output']>>;
  events_expanded?: Maybe<Array<Maybe<Event>>>;
  expertise?: Maybe<Array<Scalars['MongoID']['output']>>;
  expertise_expanded?: Maybe<Array<Maybe<UserExpertise>>>;
  farcaster_fid?: Maybe<Scalars['Float']['output']>;
  farcaster_user_info?: Maybe<FarcasterUserInfo>;
  fcm_tokens?: Maybe<Array<Scalars['String']['output']>>;
  first_name?: Maybe<Scalars['String']['output']>;
  followers?: Maybe<Scalars['Float']['output']>;
  following?: Maybe<Scalars['Float']['output']>;
  frequent_questions?: Maybe<Array<FrequentQuestion>>;
  friends?: Maybe<Scalars['Float']['output']>;
  google_user_info?: Maybe<Scalars['JSON']['output']>;
  handle_facebook?: Maybe<Scalars['String']['output']>;
  handle_farcaster?: Maybe<Scalars['String']['output']>;
  handle_github?: Maybe<Scalars['String']['output']>;
  handle_instagram?: Maybe<Scalars['String']['output']>;
  handle_lens?: Maybe<Scalars['String']['output']>;
  handle_linkedin?: Maybe<Scalars['String']['output']>;
  handle_mirror?: Maybe<Scalars['String']['output']>;
  handle_twitter?: Maybe<Scalars['String']['output']>;
  hosted?: Maybe<Scalars['Float']['output']>;
  icebreakers?: Maybe<Array<UserIcebreaker>>;
  image_avatar?: Maybe<Scalars['String']['output']>;
  industry?: Maybe<Scalars['String']['output']>;
  interests?: Maybe<Array<Scalars['String']['output']>>;
  job_title?: Maybe<Scalars['String']['output']>;
  kratos_farcaster_fid?: Maybe<Scalars['String']['output']>;
  kratos_unicorn_wallet_address?: Maybe<Scalars['String']['output']>;
  kratos_wallet_address?: Maybe<Scalars['String']['output']>;
  languages?: Maybe<Array<Scalars['String']['output']>>;
  last_name?: Maybe<Scalars['String']['output']>;
  layout_sections?: Maybe<Array<LayoutSection>>;
  lemon_amount: Scalars['Float']['output'];
  lemon_cap: Scalars['Float']['output'];
  lemon_refresh_at?: Maybe<Scalars['DateTimeISO']['output']>;
  lemonhead_inviter_wallet?: Maybe<Scalars['String']['output']>;
  lens_profile_id?: Maybe<Scalars['String']['output']>;
  lens_profile_synced?: Maybe<Scalars['Boolean']['output']>;
  location_line?: Maybe<Scalars['String']['output']>;
  matrix_localpart?: Maybe<Scalars['String']['output']>;
  music?: Maybe<Array<Scalars['String']['output']>>;
  /** This field contains the name of the user in a short version */
  name: Scalars['String']['output'];
  new_gender?: Maybe<Scalars['String']['output']>;
  new_photos?: Maybe<Array<Scalars['MongoID']['output']>>;
  new_photos_expanded?: Maybe<Array<Maybe<File>>>;
  notification_filters?: Maybe<Array<NotificationFilter>>;
  oauth2_allow_creation?: Maybe<Scalars['Boolean']['output']>;
  oauth2_clients?: Maybe<Array<Scalars['String']['output']>>;
  oauth2_max_clients?: Maybe<Scalars['Int']['output']>;
  offers?: Maybe<Array<UserOffer>>;
  payment_verification?: Maybe<UserPaymentVerification>;
  phone?: Maybe<Scalars['String']['output']>;
  phone_verified?: Maybe<Scalars['Boolean']['output']>;
  posts?: Maybe<Scalars['Float']['output']>;
  preferred_network?: Maybe<Scalars['String']['output']>;
  pronoun?: Maybe<Scalars['String']['output']>;
  quest_points?: Maybe<Scalars['Float']['output']>;
  razorpay_customer?: Maybe<Scalars['String']['output']>;
  search_range?: Maybe<Scalars['Float']['output']>;
  service_offers?: Maybe<Array<Scalars['MongoID']['output']>>;
  service_offers_expanded?: Maybe<Array<Maybe<UserServiceOffer>>>;
  settings?: Maybe<Scalars['JSON']['output']>;
  shopify_user_info?: Maybe<Scalars['JSON']['output']>;
  stripe_connected_account?: Maybe<StripeConnectedAccount>;
  stripe_user_info?: Maybe<Scalars['JSON']['output']>;
  tag_recommended?: Maybe<Scalars['Boolean']['output']>;
  tag_site?: Maybe<Scalars['Boolean']['output']>;
  tag_timeline?: Maybe<Scalars['Boolean']['output']>;
  tag_verified?: Maybe<Scalars['Boolean']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  telegram_user_info?: Maybe<Scalars['JSON']['output']>;
  terms_accepted_adult?: Maybe<Scalars['Boolean']['output']>;
  terms_accepted_conditions?: Maybe<Scalars['Boolean']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  twitch_user_info?: Maybe<Scalars['JSON']['output']>;
  twitter2_user_info?: Maybe<Scalars['JSON']['output']>;
  twitter_user_info?: Maybe<Scalars['JSON']['output']>;
  type?: Maybe<UserType>;
  updated_at: Scalars['DateTimeISO']['output'];
  url?: Maybe<Scalars['String']['output']>;
  url_go?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
  wallet_custodial?: Maybe<Scalars['String']['output']>;
  wallets?: Maybe<Array<Scalars['String']['output']>>;
  wallets_new?: Maybe<Scalars['JSON']['output']>;
  website?: Maybe<Scalars['String']['output']>;
  zoom_user_info?: Maybe<Scalars['JSON']['output']>;
};


export type UserWithEmailEvents_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type UserWithEmailNew_Photos_ExpandedArgs = {
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};

export type UserXmtpAddressResponse = {
  __typename?: 'UserXmtpAddressResponse';
  xmtpAddress: Scalars['String']['output'];
};

export type UserXmtpAddressWithInfo = {
  __typename?: 'UserXmtpAddressWithInfo';
  image_avatar?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
  xmtpAddress: Scalars['String']['output'];
};

export type UsernameAvailability = {
  __typename?: 'UsernameAvailability';
  available?: Maybe<Scalars['Boolean']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['String']['output']>;
};

export type ValidatePreviewLinkResult = {
  __typename?: 'ValidatePreviewLinkResult';
  password_protected: Scalars['Boolean']['output'];
  resource_id?: Maybe<Scalars['MongoID']['output']>;
  resource_type?: Maybe<PreviewLinkType>;
  valid: Scalars['Boolean']['output'];
};

export type VerifyCodeInput = {
  password_2fa?: InputMaybe<Scalars['String']['input']>;
  phone_code: Scalars['String']['input'];
  phone_code_hash: Scalars['String']['input'];
  phone_number: Scalars['String']['input'];
};

export type Video = {
  __typename?: 'Video';
  provider: Scalars['String']['output'];
  provider_id: Scalars['String']['output'];
  thumbnail?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type VideoInput = {
  provider: Scalars['String']['input'];
  provider_id: Scalars['String']['input'];
  thumbnail?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type VotingOption = {
  __typename?: 'VotingOption';
  option_id: Scalars['String']['output'];
  voters: Array<User>;
};

export type WhitelabelHostname = {
  __typename?: 'WhitelabelHostname';
  challenge_token: Scalars['String']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  hostname: Scalars['String']['output'];
  last_check_error?: Maybe<Scalars['String']['output']>;
  last_checked_at?: Maybe<Scalars['DateTimeISO']['output']>;
  verified: Scalars['Boolean']['output'];
  verified_at?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type WhitelistUserInfo = {
  __typename?: 'WhitelistUserInfo';
  _id?: Maybe<Scalars['MongoID']['output']>;
  email: Scalars['String']['output'];
};

export type XmtpActivationInfoResponse = {
  __typename?: 'XmtpActivationInfoResponse';
  has_activation: Scalars['Boolean']['output'];
  salt?: Maybe<Scalars['String']['output']>;
};

export type XmtpActivationInput = {
  encrypted_key: Scalars['String']['input'];
  pin_verification_hash: Scalars['String']['input'];
  salt: Scalars['String']['input'];
};

export type XmtpPinChangeResponse = {
  __typename?: 'XmtpPINChangeResponse';
  success: Scalars['Boolean']['output'];
};

export type XmtpRecoveryResponse = {
  __typename?: 'XmtpRecoveryResponse';
  encrypted_key?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type GetEventCheckinsQueryVariables = Exact<{
  input: GetEventCheckinsInput;
  skip?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetEventCheckinsQuery = { __typename?: 'Query', getEventCheckins: Array<{ __typename?: 'EventCheckin', _id: any, created_at: any, email?: string | null, ticket: any, login_user?: { __typename?: 'UserWithEmail', _id?: any | null, name: string, email?: string | null } | null, non_login_user?: { __typename?: 'NonloginUser', name?: string | null, email?: string | null } | null }> };

export type GetTicketsByIdsQueryVariables = Exact<{
  ids?: InputMaybe<Array<Scalars['MongoID']['input']> | Scalars['MongoID']['input']>;
}>;


export type GetTicketsByIdsQuery = { __typename?: 'Query', getTickets: Array<{ __typename?: 'Ticket', _id: any, type_expanded?: { __typename?: 'EventTicketType', _id: any, title: string } | null }> };

export type ListLaunchpadCoinsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  owned?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ListLaunchpadCoinsQuery = { __typename?: 'Query', listLaunchpadCoins: { __typename?: 'ListLaunchpadCoinsResponse', total: number, items: Array<{ __typename?: 'LaunchpadCoin', _id: any, address?: string | null, name?: string | null, ticker?: string | null, description?: string | null, website?: string | null }> } };

export type AddLaunchpadCoinMutationVariables = Exact<{
  input: LaunchpadCoinInput;
}>;


export type AddLaunchpadCoinMutation = { __typename?: 'Mutation', addLaunchpadCoin: { __typename?: 'LaunchpadCoin', _id: any, address?: string | null, name?: string | null, ticker?: string | null, description?: string | null, website?: string | null } };

export type UpdateLaunchpadCoinMutationVariables = Exact<{
  input: LaunchpadCoinInput;
}>;


export type UpdateLaunchpadCoinMutation = { __typename?: 'Mutation', updateLaunchpadCoin?: { __typename?: 'LaunchpadCoin', _id: any, address?: string | null, name?: string | null, ticker?: string | null, description?: string | null, website?: string | null } | null };

export type GetNotificationFiltersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNotificationFiltersQuery = { __typename?: 'Query', getNotificationFilters: Array<{ __typename?: 'NotificationFilter', _id?: any | null, mode: NotificationFilterMode, notification_type?: NotificationType | null, notification_category?: NotificationCategory | null, ref_type?: NotificationRefType | null, ref_id?: any | null, space_scoped?: any | null }> };

export type SetNotificationFilterMutationVariables = Exact<{
  input: NotificationFilterInput;
}>;


export type SetNotificationFilterMutation = { __typename?: 'Mutation', setNotificationFilter: { __typename?: 'NotificationFilter', _id?: any | null, mode: NotificationFilterMode, notification_type?: NotificationType | null, notification_category?: NotificationCategory | null, ref_type?: NotificationRefType | null, ref_id?: any | null, space_scoped?: any | null } };

export type DeleteNotificationFilterMutationVariables = Exact<{
  filterId: Scalars['MongoID']['input'];
}>;


export type DeleteNotificationFilterMutation = { __typename?: 'Mutation', deleteNotificationFilter: boolean };

export type GetNotificationUnreadCountQueryVariables = Exact<{
  category?: InputMaybe<NotificationCategory>;
}>;


export type GetNotificationUnreadCountQuery = { __typename?: 'Query', getNotificationUnreadCount: number };

export type ReadAllNotificationsMutationVariables = Exact<{
  category?: InputMaybe<NotificationCategory>;
}>;


export type ReadAllNotificationsMutation = { __typename?: 'Mutation', readAllNotifications: number };

export type ReadNotificationsMutationVariables = Exact<{
  _id?: InputMaybe<Array<Scalars['MongoID']['input']> | Scalars['MongoID']['input']>;
}>;


export type ReadNotificationsMutation = { __typename?: 'Mutation', readNotifications: boolean };

export type ActiveSessionFieldsFragment = { __typename?: 'ActiveSession', _id: string, kratos_identity_id: string, kratos_session_id?: string | null, device_name?: string | null, device_model?: string | null, os?: string | null, app_version?: string | null, client_type: string, ip_address: string, is_current: boolean, has_active_websocket: boolean, last_active: any };

export type GetMyActiveSessionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyActiveSessionsQuery = { __typename?: 'Query', getMyActiveSessions: Array<{ __typename?: 'ActiveSession', _id: string, kratos_identity_id: string, kratos_session_id?: string | null, device_name?: string | null, device_model?: string | null, os?: string | null, app_version?: string | null, client_type: string, ip_address: string, is_current: boolean, has_active_websocket: boolean, last_active: any }> };

export type RevokeMySessionMutationVariables = Exact<{
  session_id: Scalars['String']['input'];
}>;


export type RevokeMySessionMutation = { __typename?: 'Mutation', revokeMySession: boolean };

export type RequestStepUpVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestStepUpVerificationMutation = { __typename?: 'Mutation', requestStepUpVerification: boolean };

export type VerifyStepUpVerificationMutationVariables = Exact<{
  code: Scalars['String']['input'];
}>;


export type VerifyStepUpVerificationMutation = { __typename?: 'Mutation', verifyStepUpVerification: string };

export type RevokeAllOtherSessionsMutationVariables = Exact<{
  step_up_token: Scalars['String']['input'];
}>;


export type RevokeAllOtherSessionsMutation = { __typename?: 'Mutation', revokeAllOtherSessions: number };

export type GetPageConfigQueryVariables = Exact<{
  id: Scalars['MongoID']['input'];
}>;


export type GetPageConfigQuery = { __typename?: 'Query', getPageConfig?: { __typename?: 'PageConfig', _id: any, owner_type: PageConfigOwnerType, owner_id: any, name?: string | null, description?: string | null, status: PageConfigStatus, version: number, published_version?: number | null, template_id?: any | null, thumbnail_url?: string | null, sections?: Array<{ __typename?: 'PageSection', id: string, type: SectionType, order: number, hidden: boolean, props: any }> | null } | null };

export type PublishPageConfigMutationVariables = Exact<{
  id: Scalars['MongoID']['input'];
}>;


export type PublishPageConfigMutation = { __typename?: 'Mutation', publishPageConfig: { __typename?: 'PageConfig', _id: any, status: PageConfigStatus, published_version?: number | null } };

export type ListMySpacesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListMySpacesQuery = { __typename?: 'Query', listMySpaces: { __typename?: 'SearchSpacesResponse', items: Array<{ __typename?: 'Space', _id: any, title: string, slug?: string | null, description?: string | null }> } };

export type CreateSpaceMutationVariables = Exact<{
  input: SpaceInput;
}>;


export type CreateSpaceMutation = { __typename?: 'Mutation', createSpace: { __typename?: 'Space', _id: any, title: string, slug?: string | null, description?: string | null, private?: boolean | null } };

export type UpdateSpaceMutationVariables = Exact<{
  id: Scalars['MongoID']['input'];
  input: SpaceInput;
}>;


export type UpdateSpaceMutation = { __typename?: 'Mutation', updateSpace?: { __typename?: 'Space', _id: any, title: string, slug?: string | null, description?: string | null, private?: boolean | null } | null };

export type GetSpaceSubscriptionQueryVariables = Exact<{
  space: Scalars['MongoID']['input'];
}>;


export type GetSpaceSubscriptionQuery = { __typename?: 'Query', getSpaceSubscription?: { __typename?: 'SubscriptionResponse', subscription: { __typename?: 'SubscriptionRecord', _id: any, space: any, status: SubscriptionStatus, current_period_start: any, current_period_end: any, cancel_at_period_end?: boolean | null }, items: Array<{ __typename?: 'SubscriptionDetail', active?: boolean | null, type: SubscriptionItemType }>, payment?: { __typename?: 'SubscriptionPayment', client_secret: string, publishable_key: string } | null } | null };

export const ActiveSessionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveSessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActiveSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"kratos_identity_id"}},{"kind":"Field","name":{"kind":"Name","value":"kratos_session_id"}},{"kind":"Field","name":{"kind":"Name","value":"device_name"}},{"kind":"Field","name":{"kind":"Name","value":"device_model"}},{"kind":"Field","name":{"kind":"Name","value":"os"}},{"kind":"Field","name":{"kind":"Name","value":"app_version"}},{"kind":"Field","name":{"kind":"Name","value":"client_type"}},{"kind":"Field","name":{"kind":"Name","value":"ip_address"}},{"kind":"Field","alias":{"kind":"Name","value":"last_active"},"name":{"kind":"Name","value":"last_active_at"}},{"kind":"Field","name":{"kind":"Name","value":"is_current"}},{"kind":"Field","name":{"kind":"Name","value":"has_active_websocket"}}]}}]} as unknown as DocumentNode<ActiveSessionFieldsFragment, unknown>;
export const GetEventCheckinsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventCheckins"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEventCheckinsInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEventCheckins"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"ticket"}},{"kind":"Field","name":{"kind":"Name","value":"login_user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"non_login_user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<GetEventCheckinsQuery, GetEventCheckinsQueryVariables>;
export const GetTicketsByIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTicketsByIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MongoID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTickets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"type_expanded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]} as unknown as DocumentNode<GetTicketsByIdsQuery, GetTicketsByIdsQueryVariables>;
export const ListLaunchpadCoinsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListLaunchpadCoins"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"owned"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listLaunchpadCoins"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}},{"kind":"Argument","name":{"kind":"Name","value":"owned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"owned"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ticker"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"website"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<ListLaunchpadCoinsQuery, ListLaunchpadCoinsQueryVariables>;
export const AddLaunchpadCoinDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddLaunchpadCoin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LaunchpadCoinInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addLaunchpadCoin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ticker"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"website"}}]}}]}}]} as unknown as DocumentNode<AddLaunchpadCoinMutation, AddLaunchpadCoinMutationVariables>;
export const UpdateLaunchpadCoinDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLaunchpadCoin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LaunchpadCoinInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLaunchpadCoin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ticker"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"website"}}]}}]}}]} as unknown as DocumentNode<UpdateLaunchpadCoinMutation, UpdateLaunchpadCoinMutationVariables>;
export const GetNotificationFiltersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNotificationFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getNotificationFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"notification_type"}},{"kind":"Field","name":{"kind":"Name","value":"notification_category"}},{"kind":"Field","name":{"kind":"Name","value":"ref_type"}},{"kind":"Field","name":{"kind":"Name","value":"ref_id"}},{"kind":"Field","name":{"kind":"Name","value":"space_scoped"}}]}}]}}]} as unknown as DocumentNode<GetNotificationFiltersQuery, GetNotificationFiltersQueryVariables>;
export const SetNotificationFilterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetNotificationFilter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationFilterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setNotificationFilter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"notification_type"}},{"kind":"Field","name":{"kind":"Name","value":"notification_category"}},{"kind":"Field","name":{"kind":"Name","value":"ref_type"}},{"kind":"Field","name":{"kind":"Name","value":"ref_id"}},{"kind":"Field","name":{"kind":"Name","value":"space_scoped"}}]}}]}}]} as unknown as DocumentNode<SetNotificationFilterMutation, SetNotificationFilterMutationVariables>;
export const DeleteNotificationFilterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotificationFilter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MongoID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotificationFilter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filterId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterId"}}}]}]}}]} as unknown as DocumentNode<DeleteNotificationFilterMutation, DeleteNotificationFilterMutationVariables>;
export const GetNotificationUnreadCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNotificationUnreadCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"category"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCategory"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getNotificationUnreadCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"category"},"value":{"kind":"Variable","name":{"kind":"Name","value":"category"}}}]}]}}]} as unknown as DocumentNode<GetNotificationUnreadCountQuery, GetNotificationUnreadCountQueryVariables>;
export const ReadAllNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReadAllNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"category"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCategory"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readAllNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"category"},"value":{"kind":"Variable","name":{"kind":"Name","value":"category"}}}]}]}}]} as unknown as DocumentNode<ReadAllNotificationsMutation, ReadAllNotificationsMutationVariables>;
export const ReadNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReadNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"_id"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MongoID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"_id"}}}]}]}}]} as unknown as DocumentNode<ReadNotificationsMutation, ReadNotificationsMutationVariables>;
export const GetMyActiveSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyActiveSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMyActiveSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActiveSessionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveSessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActiveSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"kratos_identity_id"}},{"kind":"Field","name":{"kind":"Name","value":"kratos_session_id"}},{"kind":"Field","name":{"kind":"Name","value":"device_name"}},{"kind":"Field","name":{"kind":"Name","value":"device_model"}},{"kind":"Field","name":{"kind":"Name","value":"os"}},{"kind":"Field","name":{"kind":"Name","value":"app_version"}},{"kind":"Field","name":{"kind":"Name","value":"client_type"}},{"kind":"Field","name":{"kind":"Name","value":"ip_address"}},{"kind":"Field","alias":{"kind":"Name","value":"last_active"},"name":{"kind":"Name","value":"last_active_at"}},{"kind":"Field","name":{"kind":"Name","value":"is_current"}},{"kind":"Field","name":{"kind":"Name","value":"has_active_websocket"}}]}}]} as unknown as DocumentNode<GetMyActiveSessionsQuery, GetMyActiveSessionsQueryVariables>;
export const RevokeMySessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeMySession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeMySession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session_id"}}}]}]}}]} as unknown as DocumentNode<RevokeMySessionMutation, RevokeMySessionMutationVariables>;
export const RequestStepUpVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestStepUpVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestStepUpVerification"}}]}}]} as unknown as DocumentNode<RequestStepUpVerificationMutation, RequestStepUpVerificationMutationVariables>;
export const VerifyStepUpVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyStepUpVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyStepUpVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}]}]}}]} as unknown as DocumentNode<VerifyStepUpVerificationMutation, VerifyStepUpVerificationMutationVariables>;
export const RevokeAllOtherSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeAllOtherSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"step_up_token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeAllOtherSessions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stepUpToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"step_up_token"}}}]}]}}]} as unknown as DocumentNode<RevokeAllOtherSessionsMutation, RevokeAllOtherSessionsMutationVariables>;
export const GetPageConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPageConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MongoID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPageConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"owner_type"}},{"kind":"Field","name":{"kind":"Name","value":"owner_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"published_version"}},{"kind":"Field","name":{"kind":"Name","value":"template_id"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail_url"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"hidden"}},{"kind":"Field","name":{"kind":"Name","value":"props"}}]}}]}}]}}]} as unknown as DocumentNode<GetPageConfigQuery, GetPageConfigQueryVariables>;
export const PublishPageConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishPageConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MongoID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishPageConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"published_version"}}]}}]}}]} as unknown as DocumentNode<PublishPageConfigMutation, PublishPageConfigMutationVariables>;
export const ListMySpacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListMySpaces"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listMySpaces"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<ListMySpacesQuery, ListMySpacesQueryVariables>;
export const CreateSpaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSpace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SpaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSpace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"private"}}]}}]}}]} as unknown as DocumentNode<CreateSpaceMutation, CreateSpaceMutationVariables>;
export const UpdateSpaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSpace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MongoID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SpaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSpace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"private"}}]}}]}}]} as unknown as DocumentNode<UpdateSpaceMutation, UpdateSpaceMutationVariables>;
export const GetSpaceSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSpaceSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"space"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MongoID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSpaceSubscription"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"space"},"value":{"kind":"Variable","name":{"kind":"Name","value":"space"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subscription"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"space"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"current_period_start"}},{"kind":"Field","name":{"kind":"Name","value":"current_period_end"}},{"kind":"Field","name":{"kind":"Name","value":"cancel_at_period_end"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"client_secret"}},{"kind":"Field","name":{"kind":"Name","value":"publishable_key"}}]}}]}}]}}]} as unknown as DocumentNode<GetSpaceSubscriptionQuery, GetSpaceSubscriptionQueryVariables>;