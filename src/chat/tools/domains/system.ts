import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const systemTools: CanonicalCapability[] = [
  buildCapability({
    name: 'tool_search',
    displayName: 'Tool Search',
    description: 'Search for and load additional tools by name or keyword. Use this when you need a tool that is listed in deferred-tools but not currently loaded.',
    category: 'system',
    backendType: 'none',
    backendService: 'local',
    requiresSpace: false,
    requiresEvent: false,
    alwaysLoad: true,
    shouldDefer: false,
    searchHint: 'find search load tools capabilities',
    whenToUse: 'when you need a tool listed in deferred-tools that is not currently loaded',
    surfaces: ['aiTool'],
    destructive: false,
    params: [
      { name: 'query', type: 'string', required: true, description: 'Tool name, keyword, or category to search for. Examples: "event_broadcast_create", "ticket assign", "payment refund"' },
      { name: 'max_results', type: 'number', required: false, description: 'Maximum results to return (default: 5)' },
    ],
    execute: async (args) => {
      const query = String(args.query).trim().toLowerCase();
      if (!query) {
        return { results: [], total_matches: 0, error: 'Please provide a search query' };
      }
      const maxResults = Number(args.max_results) || 5;
      const { getAllCapabilities } = await import('../registry.js');
      const caps = getAllCapabilities();

      const scored = caps.map(cap => {
        let score = 0;
        const name = cap.name.toLowerCase();
        const hint = (cap.searchHint?.length ? cap.searchHint : cap.description).toLowerCase();
        const desc = cap.description.toLowerCase();
        const whenToUse = (cap.whenToUse || '').toLowerCase();

        // Exact name match
        if (name === query) score += 100;
        // Name contains query
        else if (name.includes(query)) score += 50;

        // Query words match name parts (snake_case splitting)
        const queryWords = query.split(/[\s_]+/);
        const nameParts = name.split('_');
        for (const qw of queryWords) {
          if (nameParts.some(np => np.startsWith(qw))) score += 20;
          if (hint.includes(qw)) score += 10;
          if (desc.includes(qw)) score += 5;
          if (whenToUse.includes(qw)) score += 5;
        }

        // Category match
        if (cap.category === query) score += 30;

        // Prioritize deferred tools (the primary use case for tool_search)
        // Only apply bonus if there's already a text match
        if (score > 0 && cap.shouldDefer && !cap.alwaysLoad) score += 5;

        return { cap, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

      const totalMatches = scored.length;
      const topResults = scored.slice(0, maxResults);

      return {
        results: topResults.map(s => ({
          name: s.cap.name,
          displayName: s.cap.displayName,
          description: s.cap.description,
          category: s.cap.category,
          whenToUse: s.cap.whenToUse,
          params: s.cap.params.map(p => ({ name: p.name, type: p.type, required: p.required, description: p.description })),
          destructive: s.cap.destructive,
          loaded: !!(s.cap.alwaysLoad || !s.cap.shouldDefer),
        })),
        total_matches: totalMatches,
      };
    },
    formatResult: (result: unknown) => {
      const r = result as { results: Array<{ name: string; category: string; description: string; params: Array<{ name: string; required: boolean }> }>; total_matches: number };
      if (!r.results?.length) return 'No matching tools found.';
      return r.results.map((t) =>
        `**${t.name}** (${t.category})\n  ${t.description}\n  Params: ${t.params.map((p) => `${p.name}${p.required ? '*' : ''}`).join(', ')}`,
      ).join('\n\n');
    },
  }),
  buildCapability({
    name: 'get_backend_version',
    category: 'system',
    displayName: 'backend version',
    description: 'Get the backend API version.',
    params: [],
    whenToUse: 'to verify the backend API is reachable and check its version',
    searchHint: 'backend version api health ping status',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiGetBackendVersion',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async () => {
      const result = await graphqlRequest<{ aiGetBackendVersion: string }>(
        'query { aiGetBackendVersion }',
      );
      return { version: result.aiGetBackendVersion };
    },
    formatResult: (result) => {
      const r = result as { version: string };
      return `Backend version: ${r.version}`;
    },
  }),
  buildCapability({
    name: 'cli_version',
    category: 'system',
    displayName: 'CLI version',
    description: 'Check the current CLI version and whether an update is available from npm.',
    params: [],
    whenToUse: 'when user wants to check CLI version or updates',
    searchHint: 'cli version update check current latest',
    destructive: false,
    backendType: 'none',
    backendService: 'local',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => {
      const { VERSION } = await import('../../version.js');
      try {
        const response = await fetch('https://registry.npmjs.org/@lemonade-social/cli/latest');
        const data = await response.json() as { version: string };
        const latest = data.version;
        if (VERSION === latest) {
          return { current: VERSION, latest, up_to_date: true };
        }
        return {
          current: VERSION,
          latest,
          up_to_date: false,
          update_command: 'npm install -g @lemonade-social/cli',
          hint: `Update available: v${VERSION} → v${latest}. Run /version to update.`,
        };
      } catch {
        return { current: VERSION, latest: 'unknown', up_to_date: 'unknown', error: 'Could not check npm registry' };
      }
    },
    formatResult: (result) => {
      const r = result as { current: string; latest: string; up_to_date: boolean };
      if (r.up_to_date) return `You're on the latest CLI version (v${r.current}).`;
      return `Update available: v${r.current} \u2192 v${r.latest}. Run /version to install.`;
    },
  }),
  buildCapability({
    name: 'list_chains',
    category: 'system',
    displayName: 'list chains',
    description: 'List supported blockchain networks.',
    params: [],
    whenToUse: 'when user wants to see supported blockchains',
    searchHint: 'chains networks blockchain supported crypto',
    destructive: false,
    backendType: 'query',
    backendResolver: 'listChains',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async () => {
      const result = await graphqlRequest<{ listChains: unknown }>(
        'query { listChains { id name symbol } }',
      );
      return result.listChains;
    },
  }),
  buildCapability({
    name: 'credits_balance',
    category: 'system',
    displayName: 'credits balance',
    description: 'Check AI credit balance for a community, including subscription tier, purchased credits, and renewal date.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
    ],
    whenToUse: 'to check how many AI credits remain for a community',
    searchHint: 'credits balance remaining quota subscription tier',
    alwaysLoad: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getStandCredits',
    requiresEvent: false,
    surfaces: ['aiTool', 'slashCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ getStandCredits: unknown }>(
        `query($stand_id: String!) {
          getStandCredits(stand_id: $stand_id) {
            credits subscription_tier subscription_credits purchased_credits subscription_renewal_date subscription_status credits_high_water_mark estimated_depletion_date
          }
        }`,
        { stand_id: args.stand_id },
      );
      return result.getStandCredits;
    },
  }),
  buildCapability({
    name: 'credits_usage',
    category: 'system',
    displayName: 'credits usage',
    description: 'Get usage analytics for a community over a date range: daily usage, breakdown by model, top users, and totals.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
      { name: 'start_date', type: 'string', description: 'Start date ISO 8601', required: true },
      { name: 'end_date', type: 'string', description: 'End date ISO 8601', required: true },
    ],
    whenToUse: 'when user wants AI credit usage analytics',
    searchHint: 'credits usage analytics consumption daily model',
    destructive: false,
    backendType: 'query',
    backendResolver: 'getUsageAnalytics',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getUsageAnalytics: unknown }>(
        `query($stand_id: String!, $start_date: DateTime!, $end_date: DateTime!) {
          getUsageAnalytics(stand_id: $stand_id, start_date: $start_date, end_date: $end_date) {
            daily_usage { date requests credits }
            by_model { model tier requests credits percentage }
            top_users { user_id requests credits percentage }
            totals { requests credits avg_credits_per_request }
          }
        }`,
        { stand_id: args.stand_id, start_date: args.start_date, end_date: args.end_date },
      );
      return result.getUsageAnalytics;
    },
  }),
  buildCapability({
    name: 'credits_buy',
    category: 'system',
    displayName: 'credits buy',
    description: 'Purchase a credit top-up package. Returns a Stripe checkout URL.',
    params: [
      { name: 'stand_id', type: 'string', description: 'Community/stand ObjectId', required: true },
      { name: 'package', type: 'string', description: 'Credit package', required: true,
        enum: ['5', '10', '25', '50', '100'] },
    ],
    whenToUse: 'when user wants to purchase more AI credits',
    searchHint: 'credits buy purchase top-up package stripe',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'purchaseCredits',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ purchaseCredits: unknown }>(
        `mutation($input: PurchaseCreditInput!) {
          purchaseCredits(input: $input) {
            checkout_url session_id
          }
        }`,
        { input: { stand_id: args.stand_id, package: args.package } },
      );
      return result.purchaseCredits;
    },
  }),
  buildCapability({
    name: 'available_models',
    category: 'system',
    displayName: 'available models',
    description: 'List AI models available for the current subscription tier.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId (optional for tier filtering)', required: false },
    ],
    whenToUse: 'when user wants to see available AI models',
    searchHint: 'models available ai llm list capabilities',
    destructive: false,
    backendType: 'query',
    backendResolver: 'getAvailableModels',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = {};
      if (args.space_id) vars.spaceId = args.space_id;

      const result = await graphqlRequest<{ getAvailableModels: unknown }>(
        `query($spaceId: String) {
          getAvailableModels(spaceId: $spaceId) {
            id provider name tier minimum_credits_per_request capabilities is_default
          }
        }`,
        vars,
      );
      return result.getAvailableModels;
    },
  }),
  buildCapability({
    name: 'set_preferred_model',
    category: 'system',
    displayName: 'set preferred model',
    description: 'Set the current user preferred AI model.',
    params: [
      { name: 'model_id', type: 'string', description: 'Model ID string (from available_models)', required: true },
    ],
    whenToUse: 'when user wants to change their default AI model',
    searchHint: 'set preferred model default ai change',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'setPreferredModel',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ setPreferredModel: unknown }>(
        `mutation($input: SetPreferredModelInput!) {
          setPreferredModel(input: $input) {
            id provider name tier minimum_credits_per_request capabilities is_default
          }
        }`,
        { input: { model_id: args.model_id } },
      );
      return result.setPreferredModel;
    },
  }),
  buildCapability({
    name: 'set_space_default_model',
    category: 'system',
    displayName: 'set space default model',
    description: 'Set a community default AI model.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ObjectId', required: true },
      { name: 'model_id', type: 'string', description: 'Model ID string', required: true },
    ],
    whenToUse: 'when user wants to set community default AI model',
    searchHint: 'set space default model community ai',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'setSpaceDefaultModel',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ setSpaceDefaultModel: unknown }>(
        `mutation($input: SetSpaceDefaultModelInput!) {
          setSpaceDefaultModel(input: $input) {
            id provider name tier minimum_credits_per_request capabilities is_default
          }
        }`,
        { input: { spaceId: args.space_id, modelId: args.model_id } },
      );
      return result.setSpaceDefaultModel;
    },
  }),
  buildCapability({
    name: 'cubejs_token',
    category: 'system',
    displayName: 'cubejs token',
    description: 'Generate a CubeJS analytics token for external BI dashboard access.',
    params: [
      { name: 'events', type: 'string', description: 'Comma-separated event IDs to scope the token', required: false },
      { name: 'site_id', type: 'string', description: 'Site ID to scope the token', required: false },
      { name: 'user_id', type: 'string', description: 'User ID to scope the token', required: false },
    ],
    whenToUse: 'when user needs a CubeJS analytics token',
    searchHint: 'cubejs token analytics bi dashboard access',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'generateCubejsToken',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      if (args.events === undefined && args.site_id === undefined && args.user_id === undefined) {
        throw new Error('At least one scope parameter is required (events, site_id, or user_id)');
      }
      const variables: Record<string, unknown> = {};
      if (args.events !== undefined) {
        variables.events = (args.events as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      if (args.site_id !== undefined) variables.site = args.site_id;
      if (args.user_id !== undefined) variables.user = args.user_id;
      const result = await graphqlRequest<{ generateCubejsToken: unknown }>(
        `mutation($events: [MongoID!], $site: MongoID, $user: MongoID) {
          generateCubejsToken(events: $events, site: $site, user: $user)
        }`,
        variables,
      );
      return result.generateCubejsToken;
    },
    formatResult: (result) => {
      const token = String(result);
      if (token.length > 16) {
        return `CubeJS token generated: ${token.substring(0, 8)}...${token.substring(token.length - 4)} (${token.length} chars)`;
      }
      return `CubeJS token generated (${token.length} chars). Use the raw result to access the full token.`;
    },
  }),
];
