import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';

const REWARDS_UNAVAILABLE_MESSAGE =
  'Rewards are temporarily unavailable because the Atlas GraphQL endpoints are not exposed on the live backend schema.';

function rewardsUnavailable(): never {
  throw new Error(REWARDS_UNAVAILABLE_MESSAGE);
}

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
    backendType: 'none',
    backendResolver: 'atlasRewardSummary',
    backendService: 'atlas',
    requiresEvent: false,
    execute: async () => rewardsUnavailable(),
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
    backendType: 'none',
    backendResolver: 'atlasRewardHistory',
    backendService: 'atlas',
    requiresEvent: false,
    execute: async () => rewardsUnavailable(),
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
    backendType: 'none',
    backendResolver: 'atlasPayoutHistory',
    backendService: 'atlas',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => rewardsUnavailable(),
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
    backendType: 'none',
    backendResolver: 'atlasGenerateReferralCode',
    backendService: 'atlas',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => rewardsUnavailable(),
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
    backendType: 'none',
    backendResolver: 'atlasUpdatePayoutSettings',
    backendService: 'atlas',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => rewardsUnavailable(),
  }),
];
