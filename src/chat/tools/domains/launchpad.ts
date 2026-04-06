import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const launchpadTools: CanonicalCapability[] = [
  buildCapability({
    name: 'launchpad_list_coins',
    category: 'launchpad',
    displayName: 'launchpad list-coins',
    description: 'List launchpad coins.',
    params: [],
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiListLaunchpadCoins',
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiListLaunchpadCoins: unknown }>(
        'query { aiListLaunchpadCoins { items { _id name symbol status } } }',
      );
      return result.aiListLaunchpadCoins;
    },
  }),
  buildCapability({
    name: 'launchpad_add_coin',
    category: 'launchpad',
    displayName: 'launchpad add-coin',
    description: 'Add a new launchpad coin.',
    params: [
      { name: 'name', type: 'string', description: 'Coin name', required: true },
      { name: 'symbol', type: 'string', description: 'Coin symbol', required: true },
      { name: 'description', type: 'string', description: 'Coin description', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiAddLaunchpadCoin',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ aiAddLaunchpadCoin: unknown }>(
        `mutation($input: AddLaunchpadCoinInput!) {
          aiAddLaunchpadCoin(input: $input) { _id name symbol status }
        }`,
        { input: { name: args.name, symbol: args.symbol, description: args.description } },
      );
      return result.aiAddLaunchpadCoin;
    },
  }),
  buildCapability({
    name: 'launchpad_update_coin',
    category: 'launchpad',
    displayName: 'launchpad update-coin',
    description: 'Update a launchpad coin.',
    params: [
      { name: 'coin_id', type: 'string', description: 'Coin ID', required: true },
      { name: 'name', type: 'string', description: 'New name', required: false },
      { name: 'description', type: 'string', description: 'New description', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiUpdateLaunchpadCoin',
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { _id: args.coin_id };
      if (args.name) input.name = args.name;
      if (args.description) input.description = args.description;

      const result = await graphqlRequest<{ aiUpdateLaunchpadCoin: unknown }>(
        `mutation($input: UpdateLaunchpadCoinInput!) {
          aiUpdateLaunchpadCoin(input: $input) { _id name symbol status }
        }`,
        { input },
      );
      return result.aiUpdateLaunchpadCoin;
    },
  }),
];
