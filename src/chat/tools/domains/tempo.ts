import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';

export const tempoTools: CanonicalCapability[] = [
  buildCapability({
    name: 'tempo_status',
    category: 'tempo',
    displayName: 'tempo status',
    description: 'Check Tempo wallet status — installation, address, balances, key readiness.',
    params: [],
    whenToUse: 'to check whether the Tempo wallet is connected and funded',
    searchHint: 'tempo wallet status balance address connected',
    shouldDefer: true,
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
    whenToUse: 'when user wants to send USDC via Tempo',
    searchHint: 'tempo transfer send usdc payment wallet',
    shouldDefer: true,
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
    name: 'tempo_services',
    category: 'tempo',
    displayName: 'tempo services',
    description: 'Discover MPP-registered services that accept Tempo payments.',
    params: [
      { name: 'search', type: 'string', description: 'Search query', required: false },
    ],
    whenToUse: 'when user wants to discover Tempo payment services',
    searchHint: 'tempo services discover mpp marketplace',
    shouldDefer: true,
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
