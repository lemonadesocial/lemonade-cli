import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { TOOL_TO_RESOLVER } from './tool-resolver-map.js';

interface IntrospectionType {
  kind: string;
  name: string | null;
  ofType?: IntrospectionType | null;
  fields?: IntrospectionField[] | null;
  inputFields?: IntrospectionInputField[] | null;
  enumValues?: Array<{ name: string }> | null;
}

interface IntrospectionField {
  name: string;
  description?: string | null;
  args: IntrospectionInputField[];
  type: IntrospectionType;
}

interface IntrospectionInputField {
  name: string;
  description?: string | null;
  type: IntrospectionType;
  defaultValue?: string | null;
}

interface IntrospectionSchema {
  queryType: { name: string };
  mutationType?: { name: string } | null;
  types: IntrospectionType[];
}

interface IntrospectionResult {
  __schema: IntrospectionSchema;
}

const INTROSPECTION_QUERY = `{
  __schema {
    queryType { name }
    mutationType { name }
    types {
      kind
      name
      fields {
        name
        description
        args {
          name
          description
          type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
          defaultValue
        }
        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
      }
      inputFields {
        name
        description
        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
        defaultValue
      }
      enumValues { name }
    }
  }
}`;

// Resolver names already covered by MCP tools or manual commands
const mcpResolverNames = new Set(Object.values(TOOL_TO_RESOLVER));

// Manual command resolvers (from existing src/commands/ that won't be generated)
const MANUAL_RESOLVERS = new Set([
  // Auth commands
  'getMe',
  // Space commands
  'createSpace', 'listMySpaces', 'updateSpace', 'aiGetSpaceStats',
  'connectPlatform', 'submitApiKey', 'spaceConnections',
  // Event commands
  'createEvent', 'getHostingEvents', 'aiSearchEvents', 'getEvent',
  'updateEvent', 'aiPublishEvent', 'cancelEvent',
  'aiGetEventGuests', 'inviteEvent', 'aiDecideEventJoinRequests',
  'aiGetEventFeedbackSummary', 'aiListEventFeedbacks', 'aiGetEventCheckins',
  // Ticket commands
  'listEventTicketTypes', 'createEventTicketType', 'updateEventTicketType',
  'aiCalculateTicketPrice', 'aiBuyTickets',
  // Reward commands
  'atlasRewardSummary', 'atlasRewardHistory',
  // Site commands
  'aiGeneratePageFromDescription', 'aiCreatePageConfig',
  'aiUpdatePageConfigSection', 'aiSuggestSections',
  'getPageConfig', 'updatePageConfig', 'getPublishedConfig',
  'generatePreviewLink', 'createPageConfig',
  // Payment accounts
  'listNewPaymentAccounts',
  'createNewPaymentAccount',
  'updateNewPaymentAccount',
  'disconnectStripeAccount',
  'getStripeConnectedAccountCapability',
  'getSafeFreeLimit',
  // Config/system
  'aiGetBackendVersion',
  // Ticket lifecycle
  'createTickets', 'cancelTickets', 'assignTickets', 'upgradeTicket',
  'mailEventTicket', 'mailTicketPaymentReceipt',
  // Payment operations
  'listEventPayments', 'getEventPayment', 'getEventPaymentSummary', 'getEventPaymentStatistics',
  // Newsletter operations
  'listSpaceNewsletters', 'getSpaceNewsletter', 'createSpaceNewsletter',
  'updateSpaceNewsletter', 'deleteSpaceNewsletter', 'sendSpaceNewsletterTestEmails',
  'getSpaceNewsletterStatistics',
  // Space event moderation & quota
  'getSpaceEventRequests', 'decideSpaceEventRequests', 'getSpaceEventSummary',
  'getSpaceSendingQuota', 'getMySpaceEventRequests',
  // Space role permissions
  'listSpaceRoleFeatures', 'updateSpaceRoleFeatures',
  // Advanced analytics
  'getSpaceMemberAmountByDate', 'getTopSpaceEventAttendees', 'getSpaceEventLocationsLeaderboard',
  'generateCubejsToken', 'getSpaceRewardStatistics', 'getEventLatestViews',
  // File upload & image management
  'createFileUploads', 'confirmFileUploads', 'createFile',
  // Event session & voting
  'getEventSessionReservations', 'getEventSessionReservationSummary',
  'createEventSessionReservation', 'deleteEventSessionReservation',
  'listEventVotings', 'castVote',
]);

function unwrapType(type: IntrospectionType): {
  name: string;
  isRequired: boolean;
  isList: boolean;
  kind: string;
} {
  let current = type;
  let isRequired = false;
  let isList = false;

  if (current.kind === 'NON_NULL') {
    isRequired = true;
    current = current.ofType!;
  }

  if (current.kind === 'LIST') {
    isList = true;
    current = current.ofType!;
    if (current.kind === 'NON_NULL') {
      current = current.ofType!;
    }
  }

  return {
    name: current.name || 'JSON',
    isRequired,
    isList,
    kind: current.kind,
  };
}

function graphqlTypeToFlag(unwrapped: ReturnType<typeof unwrapType>): string {
  if (unwrapped.isList) return 'values...';
  switch (unwrapped.name) {
    case 'Int':
    case 'Float':
      return 'number';
    case 'Boolean':
      return '';
    default:
      return 'value';
  }
}

function graphqlTypeToGqlStr(type: IntrospectionType): string {
  if (type.kind === 'NON_NULL') {
    return `${graphqlTypeToGqlStr(type.ofType!)}!`;
  }
  if (type.kind === 'LIST') {
    return `[${graphqlTypeToGqlStr(type.ofType!)}]`;
  }
  return type.name || 'JSON';
}

function operationToCommandName(name: string): { group: string; subcommand: string } | null {
  // Strip common prefixes
  let stripped = name;
  if (stripped.startsWith('ai')) {
    stripped = stripped.charAt(2).toLowerCase() + stripped.slice(3);
  } else if (stripped.startsWith('atlas')) {
    stripped = stripped.charAt(5).toLowerCase() + stripped.slice(6);
  }

  // Convert camelCase to kebab-case parts
  const parts = stripped.replace(/([A-Z])/g, '-$1').toLowerCase().split('-').filter(Boolean);

  if (parts.length < 2) return null;

  // Common verb patterns
  const verbs = ['get', 'list', 'create', 'update', 'delete', 'search', 'find', 'remove', 'set', 'add', 'publish', 'cancel', 'accept', 'decline', 'invite', 'decide', 'calculate', 'generate', 'suggest', 'read', 'buy', 'connect', 'disconnect'];

  if (verbs.includes(parts[0])) {
    // "getEvent" -> group: event, subcommand: get
    // "listMySpaces" -> group: space, subcommand: list
    const group = parts[parts.length - 1] === 's'
      ? parts.slice(1).join('-')
      : parts.slice(1).join('-');
    return { group: group.replace(/-s$/, ''), subcommand: parts[0] };
  }

  // Fallback: first part is group, rest is subcommand
  return { group: parts[0], subcommand: parts.slice(1).join('-') };
}

function buildSelectionSet(
  type: IntrospectionType,
  types: Map<string, IntrospectionType>,
  depth: number = 0,
): string {
  if (depth > 2) return '';

  const unwrapped = unwrapType(type);
  const typeDef = types.get(unwrapped.name);

  if (!typeDef || !typeDef.fields) return '';

  const fields: string[] = [];
  for (const field of typeDef.fields) {
    if (field.name.startsWith('__')) continue;

    const fieldType = unwrapType(field.type);
    const childType = types.get(fieldType.name);

    if (childType && childType.fields && depth < 2) {
      const nested = buildSelectionSet(field.type, types, depth + 1);
      if (nested) {
        fields.push(`${field.name} { ${nested} }`);
      }
    } else if (fieldType.kind === 'SCALAR' || fieldType.kind === 'ENUM') {
      fields.push(field.name);
    }
  }

  return fields.join(' ');
}

function generateExtendedCommand(
  opName: string,
  opType: 'query' | 'mutation',
  field: IntrospectionField,
  types: Map<string, IntrospectionType>,
): string {
  const cmd = operationToCommandName(opName);
  if (!cmd) return '';

  const flagName = (name: string) => name.replace(/_/g, '-');

  // Build flags
  const flagLines: string[] = [];
  const varDecls: string[] = [];
  const argPasses: string[] = [];
  const varMappings: string[] = [];

  for (const arg of field.args) {
    const unwrapped = unwrapType(arg.type);
    const flag = flagName(arg.name);
    const desc = (arg.description || arg.name).replace(/'/g, "\\'");
    const flagType = graphqlTypeToFlag(unwrapped);
    const gqlType = graphqlTypeToGqlStr(arg.type);

    varDecls.push(`$${arg.name}: ${gqlType}`);
    argPasses.push(`${arg.name}: $${arg.name}`);

    const optKey = flag.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    varMappings.push(`      ${arg.name}: opts.${optKey},`);

    if (flagType === '') {
      // Boolean
      if (unwrapped.isRequired) {
        flagLines.push(`    .requiredOption('--${flag}', '${desc}')`);
      } else {
        flagLines.push(`    .option('--${flag}', '${desc}')`);
      }
    } else if (flagType === 'number') {
      if (unwrapped.isRequired) {
        flagLines.push(`    .requiredOption('--${flag} <number>', '${desc}', parseFloat)`);
      } else {
        flagLines.push(`    .option('--${flag} <number>', '${desc}', parseFloat)`);
      }
    } else if (flagType === 'values...') {
      flagLines.push(`    .option('--${flag} <values...>', '${desc}')`);
    } else {
      if (unwrapped.isRequired) {
        flagLines.push(`    .requiredOption('--${flag} <value>', '${desc}')`);
      } else {
        flagLines.push(`    .option('--${flag} <value>', '${desc}')`);
      }
    }
  }

  // Build selection set from return type
  const selectionSet = buildSelectionSet(field.type, types, 0);
  const selection = selectionSet ? ` {\n    ${selectionSet}\n  }` : '';

  const varsStr = varDecls.length > 0 ? `(${varDecls.join(', ')})` : '';
  const argsStr = argPasses.length > 0 ? `(${argPasses.join(', ')})` : '';
  const query = `${opType}${varsStr} {\n  ${opName}${argsStr}${selection}\n}`;

  const desc = field.description
    ? field.description.replace(/'/g, "\\'")
    : `${opType === 'query' ? 'Query' : 'Execute'} ${opName}`;

  return `// Auto-generated from GraphQL introspection -- do not edit manually
// GraphQL ${opType}: ${opName}
// Override by creating a manual command or MCP-generated command

import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';

export const group = '${cmd.group}';
export const subcommand = '${cmd.subcommand}';
export const description = '${desc}';

const QUERY = \`${query}\`;

export function register(parent: Command): void {
  parent
    .command('${cmd.subcommand}')
    .description('${desc}')
${flagLines.join('\n')}
    .option('--api-key <key>', 'API key override')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const result = await graphqlRequest<Record<string, unknown>>(QUERY, {
${varMappings.join('\n')}
        });

        setFlagApiKey(undefined);

        const data = result.${opName};

        if (opts.json) {
          console.log(jsonSuccess(data));
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
`;
}

async function fetchIntrospection(source: string): Promise<IntrospectionResult> {
  // If source is a file path, read from file
  if (existsSync(source)) {
    const data = readFileSync(source, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.data || parsed;
  }

  // Otherwise treat as URL
  const response = await fetch(source, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: INTROSPECTION_QUERY }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Introspection failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.json() as { data: IntrospectionResult };
  return body.data;
}

async function main() {
  const source = process.argv[2]
    || process.env.LEMONADE_API_URL
    || 'graphql-schema.json';

  let introspection: IntrospectionResult;
  try {
    introspection = await fetchIntrospection(source.includes('://') ? `${source}/graphql` : source);
  } catch (err) {
    console.error(`Cannot fetch schema from ${source}: ${(err as Error).message}`);
    console.error('Usage: ts-node src/codegen/generate-from-graphql.ts [url-or-file]');
    process.exit(1);
  }

  const schema = introspection.__schema;
  const types = new Map<string, IntrospectionType>();
  for (const type of schema.types) {
    if (type.name) types.set(type.name, type);
  }

  const outDir = join(import.meta.dirname, '..', 'commands', 'extended');
  mkdirSync(outDir, { recursive: true });

  let count = 0;

  // Process queries
  const queryType = types.get(schema.queryType.name);
  if (queryType?.fields) {
    for (const field of queryType.fields) {
      if (field.name.startsWith('__')) continue;
      if (mcpResolverNames.has(field.name)) continue;
      if (MANUAL_RESOLVERS.has(field.name)) continue;

      const content = generateExtendedCommand(field.name, 'query', field, types);
      if (!content) continue;

      const fileName = `${field.name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}.ts`;
      writeFileSync(join(outDir, fileName), content);
      count++;
    }
  }

  // Process mutations
  if (schema.mutationType) {
    const mutationType = types.get(schema.mutationType.name);
    if (mutationType?.fields) {
      for (const field of mutationType.fields) {
        if (field.name.startsWith('__')) continue;
        if (mcpResolverNames.has(field.name)) continue;
        if (MANUAL_RESOLVERS.has(field.name)) continue;

        const content = generateExtendedCommand(field.name, 'mutation', field, types);
        if (!content) continue;

        const fileName = `${field.name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}.ts`;
        writeFileSync(join(outDir, fileName), content);
        count++;
      }
    }
  }

  // Write version marker
  writeFileSync(
    join(outDir, '_schema-version.json'),
    JSON.stringify({
      source,
      generated_at: new Date().toISOString(),
      command_count: count,
    }, null, 2),
  );

  console.log(`Generated ${count} extended command files from GraphQL introspection`);
}

main();
