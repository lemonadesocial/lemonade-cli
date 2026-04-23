import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest, graphqlRequestDocument } from '../../../api/graphql.js';
import { GetSpaceSubscriptionDocument } from '../../../graphql/generated/backend/graphql.js';

export const subscriptionTools: CanonicalCapability[] = [
  buildCapability({
    name: 'subscription_status',
    category: 'subscription',
    displayName: 'subscription status',
    description: 'Get current subscription status for a community, including subscription record, detail items, and pending payment info.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
    ],
    whenToUse: 'when user wants to check subscription plan status',
    searchHint: 'subscription status plan tier billing active',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceSubscription',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequestDocument(
        GetSpaceSubscriptionDocument,
        { space: args.space_id },
      );
      return result.getSpaceSubscription;
    },
  }),
  buildCapability({
    name: 'subscription_features',
    category: 'subscription',
    displayName: 'subscription features',
    description: 'List all subscription features and their tier-level configuration.',
    params: [],
    whenToUse: 'when user wants to see subscription feature matrix',
    searchHint: 'subscription features tiers comparison matrix',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listSubscriptionFeatureConfigs',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequest<{ listSubscriptionFeatureConfigs: unknown }>(
        `query {
          listSubscriptionFeatureConfigs {
            feature_code feature_type description display_label tiers
          }
        }`,
      );
      return result.listSubscriptionFeatureConfigs;
    },
  }),
  buildCapability({
    name: 'subscription_plans',
    category: 'subscription',
    displayName: 'subscription plans',
    description: 'List available subscription plans with pricing and AI credit allocations.',
    params: [],
    whenToUse: 'when user wants to see available plans and pricing',
    searchHint: 'subscription plans pricing tiers options cost',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listSubscriptionItems',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequest<{ listSubscriptionItems: unknown }>(
        `query {
          listSubscriptionItems {
            type title pricing { price annual_price currency decimals } credits_per_month
          }
        }`,
      );
      return result.listSubscriptionItems;
    },
  }),
  buildCapability({
    name: 'subscription_upgrade',
    category: 'subscription',
    displayName: 'subscription upgrade',
    description: 'Purchase or upgrade a community subscription tier. Returns a Stripe checkout URL.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
      { name: 'tier', type: 'string', description: 'Subscription tier', required: true,
        enum: ['pro', 'plus', 'max'] },
      { name: 'annual', type: 'boolean', description: 'Annual billing if true', required: false },
    ],
    whenToUse: 'when user wants to upgrade subscription tier',
    searchHint: 'upgrade subscription plan tier purchase pro',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'purchaseSubscription',
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        stand_id: args.stand_id,
        tier: args.tier,
      };
      if (args.annual !== undefined) input.annual = args.annual;

      const result = await graphqlRequest<{ purchaseSubscription: unknown }>(
        `mutation($input: PurchaseSubscriptionInput!) {
          purchaseSubscription(input: $input) {
            checkout_url session_id
          }
        }`,
        { input },
      );
      return result.purchaseSubscription;
    },
  }),
  buildCapability({
    name: 'subscription_cancel',
    category: 'subscription',
    displayName: 'subscription cancel',
    description: 'Cancel an AI credit subscription for a community.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
    ],
    whenToUse: 'when user wants to cancel their subscription',
    searchHint: 'cancel subscription downgrade stop billing',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'cancelSubscription',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ cancelSubscription: unknown }>(
        `mutation($input: CancelSubscriptionInput!) {
          cancelSubscription(input: $input) {
            success effective_date
          }
        }`,
        { input: { stand_id: args.stand_id } },
      );
      return result.cancelSubscription;
    },
  }),
];
