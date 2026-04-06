import { ToolDef } from '../../providers/interface.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const connectorTools: ToolDef[] = [
  {
    name: 'connectors_list',
    category: 'connector',
    displayName: 'connectors list',
    description: 'List available platform integrations.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ availableConnectors: unknown }>(
        'query { availableConnectors { id name category authType capabilities } }',
      );
      return result.availableConnectors;
    },
  },
  {
    name: 'connectors_sync',
    category: 'connector',
    displayName: 'connectors sync',
    description: 'Trigger a connector sync.',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'action', type: 'string', description: 'Action to execute', required: false, default: 'sync-events' },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ executeConnectorAction: unknown }>(
        `mutation($input: ExecuteConnectorActionInput!) {
          executeConnectorAction(input: $input) {
            success data message error recordsProcessed recordsFailed
          }
        }`,
        { input: { connectionId: args.connection_id, actionId: args.action || 'sync-events' } },
      );
      return result.executeConnectorAction;
    },
  },
  {
    name: 'connector_connect',
    category: 'connector',
    displayName: 'connector connect',
    description: 'Initiate connecting a new integration to a space. Returns OAuth URL for OAuth connectors or requiresApiKey for API key connectors.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'connector_type', type: 'string', description: 'Connector type (e.g., google-sheets, luma, eventbrite, airtable, meetup, dice)', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ connectPlatform: { connectionId: string; authUrl?: string; requiresApiKey: boolean } }>(
        `mutation($input: ConnectPlatformInput!) {
          connectPlatform(input: $input) { connectionId authUrl requiresApiKey }
        }`,
        { input: { spaceId: args.space_id, connectorType: args.connector_type } },
      );
      return result.connectPlatform;
    },
  },
  {
    name: 'connector_submit_api_key',
    category: 'connector',
    displayName: 'connector submit API key',
    description: 'Submit an API key for an API-key-based connector (Luma, Dice, etc.).',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID from connector_connect', required: true },
      { name: 'api_key', type: 'string', description: 'API key', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ submitApiKey: unknown }>(
        `mutation($input: SubmitApiKeyInput!) {
          submitApiKey(input: $input) { id connectorType status enabled errorMessage }
        }`,
        { input: { connectionId: args.connection_id, apiKey: args.api_key } },
      );
      return result.submitApiKey;
    },
    formatResult: (result) => {
      const r = result as { connectorType: string; status: string };
      return `API key submitted. ${r.connectorType} is now ${r.status}.`;
    },
  },
  {
    name: 'connector_configure',
    category: 'connector',
    displayName: 'connector configure',
    description: 'Configure a connected integration (set organization, calendar, sync schedule, etc.).',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'config', type: 'string', description: 'Configuration as JSON string', required: true },
      { name: 'sync_schedule', type: 'string', description: 'Cron schedule (e.g., "0 * * * *" for hourly)', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      let config: Record<string, unknown>;
      try {
        config = typeof args.config === 'string' ? JSON.parse(args.config as string) : args.config as Record<string, unknown>;
      } catch {
        throw new Error('Invalid config JSON');
      }
      const input: Record<string, unknown> = { connectionId: args.connection_id, config };
      if (args.sync_schedule) input.syncSchedule = args.sync_schedule;
      const result = await graphqlRequest<{ configureConnection: unknown }>(
        `mutation($input: ConfigureConnectionInput!) {
          configureConnection(input: $input) { id connectorType status config enabled errorMessage }
        }`,
        { input },
      );
      return result.configureConnection;
    },
    formatResult: (result) => {
      const r = result as { connectorType: string; status: string };
      return `${r.connectorType} configured. Status: ${r.status}.`;
    },
  },
  {
    name: 'connector_config_options',
    category: 'connector',
    displayName: 'connector config options',
    description: 'Fetch dropdown options for connector configuration (e.g., list of Airtable bases).',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'option_key', type: 'string', description: 'Config option key to fetch (e.g., baseId, tableId)', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ fetchConnectionConfigOptions: Array<{ value: string; label: string }> }>(
        `query($connectionId: String!, $optionKey: String!) {
          fetchConnectionConfigOptions(connectionId: $connectionId, optionKey: $optionKey) { value label }
        }`,
        { connectionId: args.connection_id, optionKey: args.option_key },
      );
      return { options: result.fetchConnectionConfigOptions };
    },
  },
  {
    name: 'connector_logs',
    category: 'connector',
    displayName: 'connector logs',
    description: 'View sync activity logs for a connection.',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: '10' },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ connectionLogs: Array<Record<string, unknown>> }>(
        `query($connectionId: String!, $limit: Int) {
          connectionLogs(connectionId: $connectionId, limit: $limit) {
            _id actionId triggerType triggeredBy status recordsProcessed recordsFailed duration errorMessage createdAt
          }
        }`,
        { connectionId: args.connection_id, limit: (args.limit as number) || 10 },
      );
      return { logs: result.connectionLogs, count: result.connectionLogs.length };
    },
  },
  {
    name: 'connector_disconnect',
    category: 'connector',
    displayName: 'connector disconnect',
    description: 'Disconnect an integration from a space. This revokes access and removes all credentials.',
    params: [
      { name: 'connection_id', type: 'string', description: 'Connection ID', required: true },
    ],
    destructive: true,
    execute: async (args) => {
      const result = await graphqlRequest<{ disconnectPlatform: boolean }>(
        `mutation($connectionId: String!) {
          disconnectPlatform(connectionId: $connectionId)
        }`,
        { connectionId: args.connection_id },
      );
      return { disconnected: result.disconnectPlatform };
    },
    formatResult: (result) => {
      const r = result as { disconnected: boolean };
      return r.disconnected ? 'Connector disconnected.' : 'Failed to disconnect.';
    },
  },
  {
    name: 'connector_slot_info',
    category: 'connector',
    displayName: 'connector slot info',
    description: 'Check how many connector slots a space has used vs allowed.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ connectorSlotInfo: { used: number; max: number; canAddMore: boolean; currentTier: string } }>(
        `query($spaceId: String!) {
          connectorSlotInfo(spaceId: $spaceId) { used max canAddMore currentTier }
        }`,
        { spaceId: args.space_id },
      );
      return result.connectorSlotInfo;
    },
    formatResult: (result) => {
      const r = result as { used: number; max: number; canAddMore: boolean; currentTier: string };
      return `Connectors: ${r.used}/${r.max} used (${r.currentTier} tier). ${r.canAddMore ? 'Can add more.' : 'At limit.'}`;
    },
  },
];
