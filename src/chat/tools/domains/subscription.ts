import { ToolDef } from '../../providers/interface.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const subscriptionTools: ToolDef[] = [
  {
    name: 'subscription_status',
    category: 'subscription',
    displayName: 'subscription status',
    description: 'Get current subscription status for a community, including subscription record, detail items, and pending payment info.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceSubscription: unknown }>(
        `query($space: MongoID!) {
          getSpaceSubscription(space: $space) {
            subscription { _id space status current_period_start current_period_end cancel_at_period_end }
            items { _id type active }
            payment { client_secret publishable_key }
          }
        }`,
        { space: args.space_id },
      );
      return result.getSpaceSubscription;
    },
  },
  {
    name: 'subscription_features',
    category: 'subscription',
    displayName: 'subscription features',
    description: 'List all subscription features and their tier-level configuration.',
    params: [],
    destructive: false,
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
  },
  {
    name: 'subscription_plans',
    category: 'subscription',
    displayName: 'subscription plans',
    description: 'List available subscription plans with pricing and AI credit allocations.',
    params: [],
    destructive: false,
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
  },
  {
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
    destructive: false,
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
  },
  {
    name: 'subscription_cancel',
    category: 'subscription',
    displayName: 'subscription cancel',
    description: 'Cancel an AI credit subscription for a community.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
    ],
    destructive: true,
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
  },
];
