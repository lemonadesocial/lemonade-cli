import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';
import { getDefaultSpace } from '../../../auth/store.js';

export const tempoTools: CanonicalCapability[] = [
  buildCapability({
    name: 'tempo_status',
    category: 'tempo',
    displayName: 'tempo status',
    description: 'Check Tempo wallet status — installation, address, balances, key readiness.',
    params: [],
    destructive: false,
    backendType: 'none',
    backendService: 'local',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'slashCommand'],
    execute: async () => {
      const { getWalletInfo } = await import('../../tempo/index.js');
      return getWalletInfo();
    },
    formatResult: (result) => {
      const r = result as { installed: boolean; loggedIn: boolean; address?: string; ready?: boolean; balances?: Record<string, string> };
      if (!r.installed) return 'Tempo CLI not installed. Use /tempo install.';
      if (!r.loggedIn) return 'Tempo wallet not connected. Use /tempo login.';
      const bal = r.balances ? Object.entries(r.balances).map(([k, v]) => `${v} ${k}`).join(', ') : 'checking...';
      return `Tempo wallet: ${r.address} — ${bal} — ${r.ready ? 'ready' : 'not ready'}`;
    },
  }),
  buildCapability({
    name: 'tempo_transfer',
    category: 'tempo',
    displayName: 'tempo transfer',
    description: 'Send USDC to an address via Tempo wallet.',
    params: [
      { name: 'amount', type: 'string', description: 'Amount (e.g., "10.00")', required: true },
      { name: 'token', type: 'string', description: 'Token symbol (e.g., USDC)', required: true, default: 'USDC' },
      { name: 'to', type: 'string', description: 'Recipient 0x address', required: true },
    ],
    destructive: true,
    backendType: 'none',
    backendService: 'local',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const { tempoExec, isTempoInstalled } = await import('../../tempo/index.js');
      if (!isTempoInstalled()) throw new Error('Tempo CLI not installed. Use /tempo install.');
      const output = tempoExec(['wallet', 'transfer', String(args.amount), String(args.token || 'USDC'), String(args.to)]);
      return { success: true, output };
    },
    formatResult: (result) => {
      const r = result as { success: boolean; output: string };
      return r.success ? `Transfer sent. ${r.output}` : 'Transfer failed.';
    },
  }),
  buildCapability({
    name: 'tempo_setup_payouts',
    category: 'tempo',
    displayName: 'tempo setup payouts',
    description: 'Configure your Tempo wallet as the reward payout destination. Auto-detects wallet address.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendService: 'atlas',
    backendResolver: 'atlasUpdatePayoutSettings',
    requiresEvent: false,
    execute: async (args) => {
      const { getWalletInfo } = await import('../../tempo/index.js');
      const info = getWalletInfo();
      if (!info.loggedIn || !info.address) {
        throw new Error('Tempo wallet not connected. Use /tempo login first.');
      }
      const spaceId = (args.space_id as string) || getDefaultSpace();
      if (!spaceId) throw new Error('No space specified. Use /spaces to select one.');

      const result = await graphqlRequest<{ atlasUpdatePayoutSettings: unknown }>(
        `mutation($input: AtlasPayoutSettingsInput!) {
          atlasUpdatePayoutSettings(input: $input) { wallet_address wallet_chain preferred_method }
        }`,
        { input: { wallet_address: info.address, wallet_chain: 'tempo', preferred_method: 'tempo_usdc' } },
      );
      return result.atlasUpdatePayoutSettings;
    },
    formatResult: (result) => {
      const r = result as { wallet_address: string; preferred_method: string };
      return `Payouts configured: ${r.wallet_address} via Tempo USDC.`;
    },
  }),
  buildCapability({
    name: 'tempo_services',
    category: 'tempo',
    displayName: 'tempo services',
    description: 'Discover MPP-registered services that accept Tempo payments.',
    params: [
      { name: 'search', type: 'string', description: 'Search query', required: false },
    ],
    destructive: false,
    backendType: 'none',
    backendService: 'local',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const { tempoExec, isTempoInstalled } = await import('../../tempo/index.js');
      if (!isTempoInstalled()) throw new Error('Tempo CLI not installed. Use /tempo install.');
      const serviceArgs = ['wallet', 'services'];
      if (args.search) serviceArgs.push('--search', String(args.search));
      const output = tempoExec(serviceArgs);
      return { output };
    },
  }),
];
