import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

const CREATE_PAYMENT_ACCOUNT_MUTATION = `mutation($input: CreateNewPaymentAccountInput!) {
    createNewPaymentAccount(input: $input) {
      _id active type title provider created_at
    }
  }`;

export const paymentTools: CanonicalCapability[] = [
  buildCapability({
    name: 'event_payment_stats',
    category: 'payment',
    displayName: 'event payment stats',
    description: 'Get payment statistics for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants revenue totals for an event',
    searchHint: 'payment stats revenue totals summary money',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiGetEventPaymentStats',
    requiresSpace: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async (args) => {
      const result = await graphqlRequest<{ aiGetEventPaymentStats: unknown }>(
        `query($event: MongoID!) {
          aiGetEventPaymentStats(event: $event) {
            total_payments
            total_revenue { currency amount_cents }
            by_provider { provider count amount_cents }
          }
        }`,
        { event: args.event_id },
      );
      return result.aiGetEventPaymentStats;
    },
    formatResult: (result) => {
      const r = result as { total_payments?: number; total_revenue?: Array<{ currency: string; amount_cents: number }>; by_provider?: Array<{ provider: string; count: number; amount_cents: number }> };
      const payments = r.total_payments ?? 0;
      const revenue = r.total_revenue ?? [];
      const revSummary = revenue.length > 0
        ? revenue.map((e) => `${e.currency} ${(e.amount_cents / 100).toFixed(2)}`).join(', ')
        : 'none';
      return `${payments} payments. Revenue: ${revSummary}.`;
    },
  }),
  buildCapability({
    name: 'list_payment_accounts',
    category: 'payment',
    displayName: 'payment accounts list',
    description: 'List payment accounts configured for receiving payments (Stripe, crypto wallets).',
    params: [
      { name: 'type', type: 'string', description: 'Filter by type', required: false, enum: ['ethereum', 'ethereum_escrow', 'ethereum_relay', 'ethereum_stake', 'digital'] },
      { name: 'provider', type: 'string', description: 'Filter by provider', required: false, enum: ['stripe', 'safe'] },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '25' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
      { name: 'account_ids', type: 'string', description: 'Comma-separated account IDs to filter', required: false },
    ],
    whenToUse: 'when user wants to see configured payment methods',
    searchHint: 'payment accounts list stripe crypto wallets',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listNewPaymentAccounts',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      let skip = 0;
      if (args.skip !== undefined) {
        const n = Number(args.skip);
        if (!isNaN(n)) skip = Math.floor(Math.max(0, n));
      }
      let limit = 25;
      if (args.limit !== undefined) {
        const n = Number(args.limit);
        if (!isNaN(n)) limit = Math.floor(Math.max(1, n));
      }
      let idFilter: string[] | undefined;
      if (args.account_ids !== undefined) {
        idFilter = (args.account_ids as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (idFilter.length === 0) idFilter = undefined;
      }
      const result = await graphqlRequest<{ listNewPaymentAccounts: unknown }>(
        `query($type: PaymentAccountType, $provider: NewPaymentProvider, $limit: Int!, $skip: Int!, $_id: [MongoID!]) {
          listNewPaymentAccounts(type: $type, provider: $provider, limit: $limit, skip: $skip, _id: $_id) {
            _id active type title provider created_at
            account_info {
              ... on StripeAccount { currencies }
              ... on SolanaAccount { address network currencies }
              ... on EthereumAccount { currencies }
              ... on DigitalAccount { currencies }
              ... on SafeAccount { currencies }
              ... on EthereumEscrowAccount { currencies }
              ... on EthereumRelayAccount { currencies }
              ... on EthereumStakeAccount { currencies }
            }
          }
        }`,
        {
          type: args.type as string | undefined,
          provider: args.provider as string | undefined,
          limit,
          skip,
          _id: idFilter,
        },
      );
      return result.listNewPaymentAccounts;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const accounts = result as Array<{ _id: string; type: string; title?: string; provider?: string; active: boolean }>;
      if (!accounts.length) return 'No payment accounts configured.';
      const lines = accounts.map(a => {
        const parts = [`[${a._id}]`, a.type];
        if (a.provider) parts.push(`(${a.provider})`);
        if (a.title) parts.push(`"${a.title}"`);
        parts.push(a.active ? '✓ active' : '✗ inactive');
        return `  ${parts.join(' ')}`;
      });
      return `${accounts.length} payment account(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'payment_account_create_wallet',
    category: 'payment',
    displayName: 'payment account create wallet',
    description: 'Create an Ethereum wallet payment account for receiving crypto payments. Use list_chains first to find available networks and tokens.',
    params: [
      { name: 'network', type: 'string', description: "Chain ID (e.g. '8453' for Base, '42161' for Arbitrum). Use list_chains to see available networks.", required: true },
      { name: 'address', type: 'string', description: 'Ethereum wallet address (0x...)', required: true },
      { name: 'currencies', type: 'string', description: "Comma-separated token symbols available on this chain (e.g. 'USDC,ETH')", required: true },
      { name: 'title', type: 'string', description: 'Display name (defaults to address)', required: false },
    ],
    whenToUse: 'when user wants to add a crypto wallet for payments',
    searchHint: 'create wallet ethereum crypto payment account',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createNewPaymentAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const currencies = (args.currencies as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (currencies.length === 0) throw new Error('At least one currency is required');
      const input: Record<string, unknown> = {
        type: 'ethereum',
        account_info: {
          address: args.address,
          network: args.network,
          currencies,
        },
      };
      if (args.title !== undefined) input.title = args.title;
      const result = await graphqlRequest<{ createNewPaymentAccount: unknown }>(
        CREATE_PAYMENT_ACCOUNT_MUTATION,
        { input },
      );
      return result.createNewPaymentAccount;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; type: string; title?: string; active: boolean };
      return `Wallet payment account created: ${r._id}${r.title ? ` "${r.title}"` : ''} (${r.type}, ${r.active ? 'active' : 'inactive'})`;
    },
  }),
  buildCapability({
    name: 'payment_account_create_safe',
    category: 'payment',
    displayName: 'payment account create safe',
    description: 'Create a Safe multisig wallet payment account. Omit address to auto-deploy a new Safe (1 free per user, gasless via Gelato). Provide address to import an existing Safe.',
    params: [
      { name: 'network', type: 'string', description: 'Chain ID', required: true },
      { name: 'owners', type: 'string', description: 'Comma-separated owner wallet addresses', required: true },
      { name: 'threshold', type: 'number', description: 'Number of required confirmations', required: true },
      { name: 'currencies', type: 'string', description: 'Comma-separated token symbols', required: true },
      { name: 'address', type: 'string', description: 'Existing Safe address to import (omit to deploy new)', required: false },
      { name: 'title', type: 'string', description: 'Display name', required: false },
    ],
    whenToUse: 'when user wants to create a Safe multisig wallet',
    searchHint: 'create safe multisig wallet gnosis deploy',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createNewPaymentAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const threshold = Math.floor(Number(args.threshold));
      if (isNaN(threshold) || threshold < 1) {
        throw new Error('threshold must be a positive integer');
      }
      const owners = (args.owners as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (owners.length === 0) throw new Error('At least one owner address is required');
      if (threshold > owners.length) throw new Error(`threshold (${threshold}) cannot exceed number of owners (${owners.length})`);
      const currencies = (args.currencies as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (currencies.length === 0) throw new Error('At least one currency is required');
      const accountInfo: Record<string, unknown> = {
        network: args.network,
        owners,
        threshold,
        currencies,
      };
      if (args.address !== undefined) accountInfo.address = args.address;
      const input: Record<string, unknown> = {
        type: 'ethereum',
        provider: 'safe',
        account_info: accountInfo,
      };
      if (args.title !== undefined) input.title = args.title;
      const result = await graphqlRequest<{ createNewPaymentAccount: unknown }>(
        CREATE_PAYMENT_ACCOUNT_MUTATION,
        { input },
      );
      return result.createNewPaymentAccount;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; type: string; title?: string; provider?: string; active: boolean };
      return `Safe payment account created: ${r._id}${r.title ? ` "${r.title}"` : ''} (${r.type}, provider: ${r.provider || 'safe'}, ${r.active ? 'active' : 'inactive'})`;
    },
  }),
  buildCapability({
    name: 'payment_account_create_escrow',
    category: 'payment',
    displayName: 'payment account create escrow',
    description: 'Create an escrow payment account. Funds are held in escrow until event completion.',
    params: [
      { name: 'network', type: 'string', description: 'Chain ID', required: true },
      { name: 'address', type: 'string', description: 'Escrow contract address (0x...)', required: true },
      { name: 'currencies', type: 'string', description: 'Comma-separated token symbols', required: true },
      { name: 'minimum_deposit_percent', type: 'number', description: 'Minimum deposit percentage (0-100)', required: true },
      { name: 'title', type: 'string', description: 'Display name', required: false },
    ],
    whenToUse: 'when user wants to set up escrow payments',
    searchHint: 'create escrow payment account hold funds',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createNewPaymentAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const minimumDepositPercent = Number(args.minimum_deposit_percent);
      if (isNaN(minimumDepositPercent) || minimumDepositPercent < 0 || minimumDepositPercent > 100) {
        throw new Error('minimum_deposit_percent must be a number between 0 and 100');
      }
      const currencies = (args.currencies as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (currencies.length === 0) throw new Error('At least one currency is required');
      const input: Record<string, unknown> = {
        type: 'ethereum_escrow',
        account_info: {
          address: args.address,
          network: args.network,
          currencies,
          minimum_deposit_percent: minimumDepositPercent,
        },
      };
      if (args.title !== undefined) input.title = args.title;
      const result = await graphqlRequest<{ createNewPaymentAccount: unknown }>(
        CREATE_PAYMENT_ACCOUNT_MUTATION,
        { input },
      );
      return result.createNewPaymentAccount;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; type: string; title?: string; active: boolean };
      return `Escrow payment account created: ${r._id}${r.title ? ` "${r.title}"` : ''} (${r.type}, ${r.active ? 'active' : 'inactive'})`;
    },
  }),
  buildCapability({
    name: 'payment_account_create_relay',
    category: 'payment',
    displayName: 'payment account create relay',
    description: 'Create a relay/payment-splitter payment account. Address is auto-set from chain config.',
    params: [
      { name: 'network', type: 'string', description: 'Chain ID', required: true },
      { name: 'payment_splitter_contract', type: 'string', description: 'Payment splitter contract address (0x...)', required: true },
      { name: 'currencies', type: 'string', description: 'Comma-separated token symbols', required: true },
      { name: 'title', type: 'string', description: 'Display name', required: false },
    ],
    whenToUse: 'when user wants to set up a payment splitter',
    searchHint: 'create relay payment splitter account',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createNewPaymentAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const currencies = (args.currencies as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (currencies.length === 0) throw new Error('At least one currency is required');
      const input: Record<string, unknown> = {
        type: 'ethereum_relay',
        account_info: {
          network: args.network,
          payment_splitter_contract: args.payment_splitter_contract,
          currencies,
        },
      };
      if (args.title !== undefined) input.title = args.title;
      const result = await graphqlRequest<{ createNewPaymentAccount: unknown }>(
        CREATE_PAYMENT_ACCOUNT_MUTATION,
        { input },
      );
      return result.createNewPaymentAccount;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; type: string; title?: string; active: boolean };
      return `Relay payment account created: ${r._id}${r.title ? ` "${r.title}"` : ''} (${r.type}, ${r.active ? 'active' : 'inactive'})`;
    },
  }),
  buildCapability({
    name: 'payment_account_create_stake',
    category: 'payment',
    displayName: 'payment account create stake',
    description: 'Create a stake payment account. Attendees stake tokens. Address is auto-set from chain config.',
    params: [
      { name: 'network', type: 'string', description: 'Chain ID', required: true },
      { name: 'config_id', type: 'string', description: 'Stake configuration ID', required: true },
      { name: 'currencies', type: 'string', description: 'Comma-separated token symbols', required: true },
      { name: 'requirement_checkin_before', type: 'string', description: 'Check-in deadline (ISO 8601)', required: false },
      { name: 'title', type: 'string', description: 'Display name', required: false },
    ],
    whenToUse: 'when user wants to set up token staking for events',
    searchHint: 'create stake payment account token lock',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createNewPaymentAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const currencies = (args.currencies as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (currencies.length === 0) throw new Error('At least one currency is required');
      const accountInfo: Record<string, unknown> = {
        network: args.network,
        config_id: args.config_id,
        currencies,
      };
      if (args.requirement_checkin_before !== undefined) {
        const d = new Date(args.requirement_checkin_before as string);
        if (isNaN(d.getTime())) {
          throw new Error('requirement_checkin_before must be a valid ISO 8601 date');
        }
        accountInfo.requirement_checkin_before = d.toISOString();
      }
      const input: Record<string, unknown> = {
        type: 'ethereum_stake',
        account_info: accountInfo,
      };
      if (args.title !== undefined) input.title = args.title;
      const result = await graphqlRequest<{ createNewPaymentAccount: unknown }>(
        CREATE_PAYMENT_ACCOUNT_MUTATION,
        { input },
      );
      return result.createNewPaymentAccount;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; type: string; title?: string; active: boolean };
      return `Stake payment account created: ${r._id}${r.title ? ` "${r.title}"` : ''} (${r.type}, ${r.active ? 'active' : 'inactive'})`;
    },
  }),
  buildCapability({
    name: 'payment_account_create_stripe',
    category: 'payment',
    displayName: 'payment account create stripe',
    description: 'Create a Stripe payment account for fiat payments. Requires Stripe Connect to be completed first (use space_stripe_connect). No account_info needed — currencies are auto-configured.',
    params: [
      { name: 'title', type: 'string', description: 'Display name', required: false },
    ],
    whenToUse: 'when user wants to add Stripe for fiat payments',
    searchHint: 'create stripe payment account fiat credit card',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createNewPaymentAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        type: 'digital',
        provider: 'stripe',
      };
      if (args.title !== undefined) input.title = args.title;
      const result = await graphqlRequest<{ createNewPaymentAccount: unknown }>(
        CREATE_PAYMENT_ACCOUNT_MUTATION,
        { input },
      );
      return result.createNewPaymentAccount;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; type: string; title?: string; provider?: string; active: boolean };
      return `Stripe payment account created: ${r._id}${r.title ? ` "${r.title}"` : ''} (${r.type}, provider: ${r.provider || 'stripe'}, ${r.active ? 'active' : 'inactive'})`;
    },
  }),
  buildCapability({
    name: 'payment_account_update',
    category: 'payment',
    displayName: 'payment account update',
    description: 'Update a payment account title or configuration.',
    params: [
      { name: 'account_id', type: 'string', description: 'Payment account ID', required: true },
      { name: 'account_info', type: 'string', description: 'Updated account configuration as JSON object (required by backend — send current config if only changing title)', required: true },
      { name: 'title', type: 'string', description: 'New display name', required: false },
    ],
    whenToUse: 'when user wants to modify a payment account',
    searchHint: 'update edit payment account modify config',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'updateNewPaymentAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      let parsedInfo: unknown;
      try {
        parsedInfo = JSON.parse(args.account_info as string);
      } catch {
        throw new Error('account_info must be valid JSON');
      }
      if (typeof parsedInfo !== 'object' || parsedInfo === null || Array.isArray(parsedInfo)) {
        throw new Error('account_info must be a JSON object');
      }
      const input: Record<string, unknown> = {
        _id: args.account_id,
        account_info: parsedInfo,
      };
      if (args.title !== undefined) input.title = args.title;
      const result = await graphqlRequest<{ updateNewPaymentAccount: unknown }>(
        `mutation($input: UpdateNewPaymentAccountInput!) {
          updateNewPaymentAccount(input: $input) {
            _id active type title provider created_at
          }
        }`,
        { input },
      );
      return result.updateNewPaymentAccount;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; type: string; title?: string; active: boolean };
      return `Payment account updated: ${r._id}${r.title ? ` "${r.title}"` : ''} (${r.type}, ${r.active ? 'active' : 'inactive'})`;
    },
  }),
  buildCapability({
    name: 'stripe_disconnect',
    category: 'payment',
    displayName: 'stripe disconnect',
    description: 'Disconnect Stripe payment account. This is irreversible.',
    params: [],
    whenToUse: 'when user wants to disconnect Stripe',
    searchHint: 'disconnect stripe remove revoke payments',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'disconnectStripeAccount',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequest<{ disconnectStripeAccount: boolean }>(
        'mutation { disconnectStripeAccount }',
      );
      return { disconnected: result.disconnectStripeAccount };
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { disconnected: boolean };
      return r.disconnected ? 'Stripe account disconnected successfully.' : 'Failed to disconnect Stripe account.';
    },
  }),
  buildCapability({
    name: 'stripe_capabilities',
    category: 'payment',
    displayName: 'stripe capabilities',
    description: 'View Stripe payment method capabilities (card, Apple Pay, Google Pay).',
    params: [],
    whenToUse: 'when user wants to check Stripe payment methods',
    searchHint: 'stripe capabilities card apple pay google',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getStripeConnectedAccountCapability',
    requiresSpace: false,
    requiresEvent: false,
    execute: async () => {
      const result = await graphqlRequest<{ getStripeConnectedAccountCapability: unknown }>(
        `query {
          getStripeConnectedAccountCapability {
            id
            capabilities {
              type
              detail {
                available
                display_preference { overridable preference value }
              }
            }
          }
        }`,
      );
      return result.getStripeConnectedAccountCapability;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'No Stripe capabilities found. Is Stripe connected?';
      const r = result as { id: string; capabilities: Array<{ type: string; detail: { available: boolean; display_preference: { preference: string; value: string } } }> };
      const lines = r.capabilities.map(c =>
        `  ${c.type}: ${c.detail.available ? 'available' : 'unavailable'}, preference: ${c.detail.display_preference.preference || c.detail.display_preference.value || 'none'}`,
      );
      return `Stripe capabilities (${r.id}):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'safe_free_limit',
    category: 'payment',
    displayName: 'safe free limit',
    description: 'Check Safe wallet deployment eligibility for a network. Each user gets 1 free gasless Safe deployment.',
    params: [
      { name: 'network', type: 'string', description: "Chain ID (numeric string, e.g. '8453' for Base). Use list_chains to find available networks.", required: true },
    ],
    whenToUse: 'when user wants to check Safe deployment eligibility',
    searchHint: 'safe free limit deployment gasless check',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSafeFreeLimit',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSafeFreeLimit: unknown }>(
        `query($network: String!) {
          getSafeFreeLimit(network: $network) {
            current max
          }
        }`,
        { network: args.network },
      );
      return result.getSafeFreeLimit;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { current: number; max: number };
      return `Used ${r.current} of ${r.max} free Safe deployments.`;
    },
  }),
  buildCapability({
    name: 'event_payment_summary',
    category: 'payment',
    displayName: 'event payment summary',
    description: 'Get detailed payment breakdown for an event by currency.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants payment breakdown by currency',
    searchHint: 'payment summary breakdown currency transfers',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventPaymentSummary',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventPaymentSummary: Array<{ currency: string; decimals: number; amount: string; transfer_amount: string; pending_transfer_amount: string }> }>(
        `query($event: MongoID!) {
          getEventPaymentSummary(event: $event) {
            currency decimals amount transfer_amount pending_transfer_amount
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventPaymentSummary;
    },
    formatResult: (result) => {
      const summaries = result as Array<{ currency: string; amount: string; transfer_amount: string; pending_transfer_amount: string }>;
      if (Array.isArray(summaries)) {
        return summaries.map(s => `${s.currency}: ${s.amount} (transfers: ${s.transfer_amount}, pending: ${s.pending_transfer_amount})`).join(', ');
      }
      return JSON.stringify(result);
    },
  }),
  buildCapability({
    name: 'event_payments_list',
    category: 'payment',
    displayName: 'event payments list',
    description: 'List payments for an event with optional filters.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'search', type: 'string', description: 'Search by buyer name or email', required: false },
      { name: 'provider', type: 'string', description: 'Filter by payment provider', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '25' },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'when user wants to see individual event payments',
    searchHint: 'payments list transactions orders buyers',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listEventPayments',
    requiresSpace: false,
    execute: async (args) => {
      let limit = 25;
      if (args.limit !== undefined) {
        const n = Number(args.limit);
        if (!isNaN(n)) limit = Math.max(1, n);
      }
      let skip = 0;
      if (args.skip !== undefined) {
        const n = Number(args.skip);
        if (!isNaN(n)) skip = Math.max(0, n);
      }
      const result = await graphqlRequest<{ listEventPayments: unknown }>(
        `query($event: MongoID!, $search: String, $provider: NewPaymentProvider, $limit: Int!, $skip: Int!) {
          listEventPayments(event: $event, search: $search, provider: $provider, limit: $limit, skip: $skip) {
            total
            records {
              _id amount currency state
              formatted_total_amount formatted_discount_amount formatted_fee_amount
              buyer_info { email first_name last_name }
              tickets { _id type }
            }
          }
        }`,
        {
          event: args.event_id,
          search: args.search as string | undefined,
          provider: args.provider as string | undefined,
          limit,
          skip,
        },
      );
      return result.listEventPayments;
    },
    formatResult: (result) => {
      const r = result as { total: number; records: Array<{ _id: string; amount: number; currency: string; state: string }> };
      if (r && r.records) {
        return `${r.total} payment(s) found. Showing ${r.records.length} record(s).`;
      }
      return JSON.stringify(result);
    },
  }),
  buildCapability({
    name: 'event_payment_detail',
    category: 'payment',
    displayName: 'event payment detail',
    description: 'Get details of a specific payment.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'payment_id', type: 'string', description: 'Payment ID', required: true },
    ],
    whenToUse: 'when user wants details of a specific payment',
    searchHint: 'payment detail specific transaction receipt',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventPayment',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventPayment: unknown }>(
        `query($event: MongoID!, $_id: MongoID!) {
          getEventPayment(event: $event, _id: $_id) {
            _id amount currency state
            formatted_total_amount formatted_discount_amount formatted_fee_amount
            buyer_info { email first_name last_name }
            tickets { _id type }
            stripe_payment_info { payment_intent_id }
          }
        }`,
        { event: args.event_id, _id: args.payment_id },
      );
      return result.getEventPayment;
    },
    formatResult: (result) => {
      const r = result as { _id: string; amount: number; currency: string; state: string; formatted_total_amount: string };
      if (r && r._id) {
        return `Payment ${r._id}: ${r.formatted_total_amount || r.amount} ${r.currency} (${r.state})`;
      }
      return JSON.stringify(result);
    },
  }),
  buildCapability({
    name: 'event_payment_statistics',
    category: 'payment',
    displayName: 'event payment statistics',
    description: 'Get detailed payment statistics by provider (Stripe vs crypto) with network breakdowns. For simple revenue totals, use event_payment_stats.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
    ],
    whenToUse: 'when user wants provider-level payment breakdown',
    searchHint: 'payment statistics provider stripe crypto breakdown',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getEventPaymentStatistics',
    requiresSpace: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getEventPaymentStatistics: unknown }>(
        `query($event: MongoID!) {
          getEventPaymentStatistics(event: $event) {
            total_payments
            stripe_payments { count revenue { currency formatted_total_amount } }
            crypto_payments { count revenue { currency formatted_total_amount } networks { chain_id count } }
          }
        }`,
        { event: args.event_id },
      );
      return result.getEventPaymentStatistics;
    },
    formatResult: (result) => {
      const r = result as { total_payments: number };
      if (r && r.total_payments !== undefined) {
        return `Total payments: ${r.total_payments}`;
      }
      return JSON.stringify(result);
    },
  }),
];
