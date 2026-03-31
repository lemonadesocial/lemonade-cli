import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { TOOL_TO_RESOLVER, TOOL_TO_COMMAND } from './tool-resolver-map.js';

interface JsonSchemaProperty {
  type?: string;
  description?: string;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  nullable?: boolean;
}

interface McpToolSchema {
  name: string;
  description: string;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
  inputSchema: JsonSchemaProperty;
  outputSchema?: JsonSchemaProperty;
}

interface McpSchema {
  version: string;
  exported_at: string;
  tools: McpToolSchema[];
}

function toolToCommand(toolName: string): { group: string; subcommand: string } {
  if (TOOL_TO_COMMAND[toolName]) return TOOL_TO_COMMAND[toolName];

  // Fallback: derive from tool name
  const parts = toolName.split('_');
  return { group: parts[0], subcommand: parts.slice(1).join('-') };
}

function flagName(name: string): string {
  return name.replace(/_/g, '-');
}

function generateFlags(inputSchema: JsonSchemaProperty): string {
  const props = inputSchema.properties || {};
  const required = new Set(inputSchema.required || []);

  const lines: string[] = [];

  for (const [name, prop] of Object.entries(props)) {
    const flag = flagName(name);
    const desc = (prop.description || name).replace(/'/g, "\\'");
    const isRequired = required.has(name);

    if (prop.type === 'boolean') {
      lines.push(`    .option('--${flag}', '${desc}')`);
    } else if (prop.type === 'number') {
      if (isRequired) {
        lines.push(`    .requiredOption('--${flag} <number>', '${desc}', parseFloat)`);
      } else {
        lines.push(`    .option('--${flag} <number>', '${desc}', parseFloat)`);
      }
    } else if (prop.type === 'array') {
      lines.push(`    .option('--${flag} <values...>', '${desc}')`);
    } else {
      if (isRequired) {
        lines.push(`    .requiredOption('--${flag} <value>', '${desc}')`);
      } else {
        lines.push(`    .option('--${flag} <value>', '${desc}')`);
      }
    }
  }

  return lines.join('\n');
}


function generateOutputFields(outputSchema?: JsonSchemaProperty): string[] {
  if (!outputSchema) return [];

  // Walk the output schema to find leaf field names for the GraphQL selection
  const fields: string[] = [];
  const props = outputSchema.properties || {};

  for (const [name, prop] of Object.entries(props)) {
    if (prop.type === 'object' && prop.properties) {
      const subFields = Object.keys(prop.properties).join(' ');
      fields.push(`${name} { ${subFields} }`);
    } else if (prop.type === 'array' && prop.items?.properties) {
      const subFields = Object.keys(prop.items.properties).join(' ');
      fields.push(`${name} { ${subFields} }`);
    } else {
      fields.push(name);
    }
  }

  return fields;
}

function buildGraphqlQuery(tool: McpToolSchema, resolverName: string): string {
  const inputProps = tool.inputSchema.properties || {};
  const required = new Set(tool.inputSchema.required || []);
  const isReadOnly = tool.annotations?.readOnlyHint !== false;
  const opType = isReadOnly ? 'query' : 'mutation';

  // Build variable declarations
  const varDecls: string[] = [];
  const argPasses: string[] = [];

  for (const [name, prop] of Object.entries(inputProps)) {
    const gqlType = jsonSchemaTypeToGraphql(prop, required.has(name));
    varDecls.push(`$${name}: ${gqlType}`);
    argPasses.push(`${name}: $${name}`);
  }

  const outputFields = generateOutputFields(tool.outputSchema);
  const selectionSet = outputFields.length > 0
    ? ` {\n    ${outputFields.join('\n    ')}\n  }`
    : '';

  const varsStr = varDecls.length > 0 ? `(${varDecls.join(', ')})` : '';
  const argsStr = argPasses.length > 0 ? `(${argPasses.join(', ')})` : '';

  return `${opType}${varsStr} {\n  ${resolverName}${argsStr}${selectionSet}\n}`;
}

function jsonSchemaTypeToGraphql(prop: JsonSchemaProperty, isRequired: boolean): string {
  let base: string;

  switch (prop.type) {
    case 'string':
      base = 'String';
      break;
    case 'number':
      base = 'Float';
      break;
    case 'boolean':
      base = 'Boolean';
      break;
    case 'array':
      if (prop.items?.type === 'string') {
        base = '[String]';
      } else {
        base = '[JSON]';
      }
      break;
    default:
      base = 'JSON';
  }

  return isRequired ? `${base}!` : base;
}

function generateCommandFile(tool: McpToolSchema): string {
  const { group, subcommand } = toolToCommand(tool.name);
  const resolverName = TOOL_TO_RESOLVER[tool.name] || tool.name;
  const flags = generateFlags(tool.inputSchema);
  const query = buildGraphqlQuery(tool, resolverName);
  const desc = tool.description.replace(/'/g, "\\'");

  const inputProps = tool.inputSchema.properties || {};
  const optKeys = Object.keys(inputProps);

  // Build variables object from opts
  const varsLines = optKeys.map((name) => {
    const optKey = flagName(name).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return `      ${name}: opts.${optKey},`;
  }).join('\n');

  return `// Auto-generated from mcp-schema.json -- do not edit manually
// MCP tool: ${tool.name} -> GraphQL resolver: ${resolverName}
// Override by creating a manual command in src/commands/${group}/

import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';

export const group = '${group}';
export const subcommand = '${subcommand}';
export const description = '${desc}';

const QUERY = \`${query}\`;

export function register(parent: Command): void {
  parent
    .command('${subcommand}')
    .description('${desc}')
${flags}
    .option('--api-key <key>', 'API key override')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const result = await graphqlRequest<Record<string, unknown>>(QUERY, {
${varsLines}
        });

        setFlagApiKey(undefined);

        const data = result.${resolverName};

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

function main() {
  const schemaPath = process.argv[2] || 'mcp-schema.json';

  let schemaData: string;
  try {
    schemaData = readFileSync(schemaPath, 'utf-8');
  } catch {
    console.error(`Cannot read schema file: ${schemaPath}`);
    console.error('Usage: ts-node src/codegen/generate-from-mcp.ts [path-to-mcp-schema.json]');
    process.exit(1);
  }

  const schema: McpSchema = JSON.parse(schemaData);

  const outDir = join(import.meta.dirname, '..', 'commands', 'generated');
  mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (const tool of schema.tools) {
    const fileName = `${tool.name.replace(/_/g, '-')}.ts`;
    writeFileSync(join(outDir, fileName), generateCommandFile(tool));
    count++;
  }

  // Write schema version marker
  writeFileSync(
    join(outDir, '_schema-version.json'),
    JSON.stringify({
      version: schema.version,
      generated_at: new Date().toISOString(),
      tool_count: count,
    }, null, 2),
  );

  console.log(`Generated ${count} command files from MCP schema v${schema.version}`);
}

main();
