import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const rewardsTools: CanonicalCapability[] = [
  buildCapability({
    name: 'rewards_balance',
    category: 'rewards',
    displayName: 'rewards balance',
    description: 'View reward balance for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    whenToUse: 'when user wants to check reward earnings',
    searchHint: 'rewards balance earnings cashback accrued',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'atlasRewardSummary',
    backendService: 'atlas',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ atlasRewardSummary: unknown }>(
        `query($space: String!) {
          atlasRewardSummary(space: $space) {
            organizer_accrued_usdc organizer_pending_usdc organizer_paid_out_usdc
            attendee_accrued_usdc attendee_pending_usdc attendee_paid_out_usdc
            volume_tier monthly_gmv_usdc next_tier_threshold_usdc
            next_payout_date is_self_verified verification_cta_extra_usdc
          }
        }`,
        { space: args.space_id },
      );
      return result.atlasRewardSummary;
    },
  }),
  buildCapability({
    name: 'rewards_history',
    category: 'rewards',
    displayName: 'rewards history',
    description: 'View reward transaction history for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'offset', type: 'number', description: 'Skip results', required: false },
    ],
    whenToUse: 'when user wants reward transaction history',
    searchHint: 'rewards history transactions past earnings',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'atlasRewardHistory',
    backendService: 'atlas',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ atlasRewardHistory: unknown }>(
        `query($space: String!, $limit: Int, $offset: Int) {
          atlasRewardHistory(space: $space, limit: $limit, offset: $offset) {
            _id event_id gross_amount_usdc
            organizer_cashback_usdc attendee_cashback_usdc
            organizer_volume_bonus_usdc attendee_discovery_bonus_usdc
            payment_method status created_at
          }
        }`,
        {
          space: args.space_id,
          limit: (args.limit as number) || 20,
          offset: (args.offset as number) || 0,
        },
      );
      return result.atlasRewardHistory;
    },
  }),
  buildCapability({
    name: 'rewards_payouts',
    category: 'rewards',
    displayName: 'rewards payouts',
    description: 'View payout history.',
    params: [
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '20' },
      { name: 'offset', type: 'number', description: 'Skip results', required: false },
    ],
    whenToUse: 'when user wants to see payout history',
    searchHint: 'payouts history withdrawals transfers paid',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'atlasPayoutHistory',
    backendService: 'atlas',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ atlasPayoutHistory: unknown }>(
        `query($limit: Int, $offset: Int) {
          atlasPayoutHistory(limit: $limit, offset: $offset) {
            amount_usdc payout_method tx_hash stripe_transfer_id status processed_at
          }
        }`,
        { limit: (args.limit as number) || 20, offset: (args.offset as number) || 0 },
      );
      return result.atlasPayoutHistory;
    },
  }),
  buildCapability({
    name: 'rewards_referral',
    category: 'rewards',
    displayName: 'rewards referral',
    description: 'Generate, apply, or view referral codes.',
    params: [
      { name: 'action', type: 'string', description: 'Action: generate, apply, or view', required: true,
        enum: ['generate', 'apply', 'view'] },
      { name: 'code', type: 'string', description: 'Referral code (for apply action)', required: false },
    ],
    whenToUse: 'when user wants to manage referral codes',
    searchHint: 'referral code generate apply share invite',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'atlasGenerateReferralCode',
    backendService: 'atlas',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const action = args.action as string;

      if (action === 'generate') {
        const result = await graphqlRequest<{ atlasGenerateReferralCode: unknown }>(
          'mutation { atlasGenerateReferralCode { code } }',
        );
        return result.atlasGenerateReferralCode;
      }

      if (action === 'apply') {
        if (!args.code) throw new Error('Referral code is required for apply action.');
        await graphqlRequest(
          'mutation($code: String!) { atlasApplyReferralCode(code: $code) }',
          { code: args.code },
        );
        return { applied: true };
      }

      const result = await graphqlRequest<{ atlasReferralSummary: unknown }>(
        'query { atlasReferralSummary { code total_referrals total_reward_usdc } }',
      );
      return result.atlasReferralSummary;
    },
  }),
  buildCapability({
    name: 'rewards_settings',
    category: 'rewards',
    displayName: 'rewards settings',
    description: 'View or update payout settings.',
    params: [
      { name: 'wallet_address', type: 'string', description: 'Payout wallet address (0x...)', required: false },
      { name: 'wallet_chain', type: 'string', description: 'Payout chain', required: false },
      { name: 'preferred_method', type: 'string', description: 'Preferred method: stripe|crypto', required: false,
        enum: ['stripe', 'crypto'] },
    ],
    whenToUse: 'when user wants to manage payout wallet settings',
    searchHint: 'rewards settings payout wallet preferences',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'atlasUpdatePayoutSettings',
    backendService: 'atlas',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const hasWrite = args.wallet_address || args.wallet_chain || args.preferred_method;

      if (hasWrite) {
        const input: Record<string, unknown> = {};
        if (args.wallet_address) input.wallet_address = args.wallet_address;
        if (args.wallet_chain) input.wallet_chain = args.wallet_chain;
        if (args.preferred_method) input.preferred_method = args.preferred_method;

        const result = await graphqlRequest<{ atlasUpdatePayoutSettings: unknown }>(
          `mutation($input: AtlasPayoutSettingsInput!) {
            atlasUpdatePayoutSettings(input: $input) {
              wallet_address wallet_chain stripe_connect_account_id preferred_method
            }
          }`,
          { input },
        );
        return result.atlasUpdatePayoutSettings;
      }

      const result = await graphqlRequest<{ atlasGetPayoutSettings: unknown }>(
        `query {
          atlasGetPayoutSettings {
            wallet_address wallet_chain stripe_connect_account_id preferred_method
          }
        }`,
      );
      return result.atlasGetPayoutSettings;
    },
  }),
];
