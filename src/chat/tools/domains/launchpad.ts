import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequestDocument } from '../../../api/graphql.js';
import {
  AddLaunchpadCoinDocument,
  ListLaunchpadCoinsDocument,
  UpdateLaunchpadCoinDocument,
} from '../../../graphql/generated/backend/graphql.js';

export const launchpadTools: CanonicalCapability[] = [
  buildCapability({
    name: 'launchpad_list_coins',
    category: 'launchpad',
    displayName: 'launchpad list-coins',
    description: 'List launchpad coins.',
    params: [],
    whenToUse: 'when user wants to see launchpad tokens',
    searchHint: 'launchpad coins tokens list crypto',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listLaunchpadCoins',
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequestDocument(
        ListLaunchpadCoinsDocument,
        { owned: true },
      );
      return result.listLaunchpadCoins;
    },
  }),
  buildCapability({
    name: 'launchpad_add_coin',
    category: 'launchpad',
    displayName: 'launchpad add-coin',
    description: 'Add a new launchpad coin.',
    params: [
      { name: 'name', type: 'string', description: 'Coin name', required: true },
      { name: 'ticker', type: 'string', description: 'Coin ticker', required: true },
      { name: 'description', type: 'string', description: 'Coin description', required: false },
    ],
    whenToUse: 'when user wants to add a new launchpad token',
    searchHint: 'add create launchpad coin token new',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'addLaunchpadCoin',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequestDocument(
        AddLaunchpadCoinDocument,
        {
          input: {
            name: String(args.name),
            ticker: String(args.ticker),
            description: args.description ? String(args.description) : undefined,
          },
        },
      );
      return result.addLaunchpadCoin;
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
      { name: 'ticker', type: 'string', description: 'New ticker', required: false },
      { name: 'description', type: 'string', description: 'New description', required: false },
    ],
    whenToUse: 'when user wants to update a launchpad token',
    searchHint: 'update edit launchpad coin token modify',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'updateLaunchpadCoin',
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { _id: args.coin_id };
      if (args.name) input.name = String(args.name);
      if (args.ticker) input.ticker = String(args.ticker);
      if (args.description) input.description = String(args.description);

      const result = await graphqlRequestDocument(
        UpdateLaunchpadCoinDocument,
        { input },
      );
      return result.updateLaunchpadCoin;
    },
  }),
];
