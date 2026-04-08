import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { partitionTools } from '../capabilities/partitioner.js';
import { capabilityToInputSchema, capabilityToAnnotations } from './schema-adapter.js';
import { searchCapabilities } from '../capabilities/search.js';
import { ensureAuthHeader } from '../auth/store.js';
import { getPackageVersion } from '../config/version.js';
import type { CanonicalCapability } from '../capabilities/types.js';

export async function startMcpServer(): Promise<void> {
  // Redirect console.log to stderr so stdout stays clean for MCP JSON-RPC
  console.log = (...args: unknown[]) => process.stderr.write(args.map(String).join(' ') + '\n');

  // Verify authentication
  const auth = await ensureAuthHeader();
  if (!auth) {
    process.stderr.write('Error: Not authenticated. Run `lemonade auth login` first.\n');
    process.exit(1);
  }

  const { alwaysLoad, deferred } = partitionTools();
  const version = getPackageVersion();

  const server = new McpServer({ name: 'lemonade', version });

  const registeredTools = new Set<string>();

  function registerCap(cap: CanonicalCapability) {
    if (registeredTools.has(cap.name)) return;
    const inputSchema = capabilityToInputSchema(cap);
    const annotations = capabilityToAnnotations(cap);
    server.tool(
      cap.name,
      cap.description,
      inputSchema,
      annotations,
      async (args: Record<string, unknown>) => {
        try {
          const result = await cap.execute(args);
          return {
            content: [{
              type: 'text' as const,
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            }],
          };
        } catch (err) {
          return {
            content: [{
              type: 'text' as const,
              text: err instanceof Error ? err.message : String(err),
            }],
            isError: true,
          };
        }
      },
    );
    registeredTools.add(cap.name);
  }

  // Register always-loaded capabilities
  for (const cap of alwaysLoad) {
    registerCap(cap);
  }

  // Register discover_tools meta-tool
  server.tool(
    'discover_tools',
    'Search for additional tools by keyword. Returns matching tools and makes them available for use.',
    { query: z.string().describe('Search query') },
    async (args: Record<string, unknown>) => {
      const matches = searchCapabilities(args.query as string, deferred);
      for (const cap of matches) {
        registerCap(cap);
      }
      // Notify client that tool list changed if we registered new tools
      if (matches.length > 0) {
        try {
          await server.server.sendToolListChanged();
        } catch {
          // Notification failure is non-fatal
        }
      }
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(
            matches.map(m => ({ name: m.name, description: m.description })),
            null,
            2,
          ),
        }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
