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
  // Redirect all console methods to stderr to prevent MCP stdio protocol corruption.
  // console.warn/error already default to stderr, but we redirect for consistency.
  const stderrWrite = (...args: unknown[]) => { process.stderr.write(args.map(String).join(' ') + '\n'); };
  console.log = stderrWrite;
  console.info = stderrWrite;
  console.warn = stderrWrite;
  console.debug = stderrWrite;

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
          const message = err instanceof Error ? err.message : String(err);
          const isAuthError = message.includes('UNAUTHENTICATED') || message.includes('401') || message.includes('Unauthorized');
          return {
            content: [{
              type: 'text' as const,
              text: isAuthError
                ? 'Authentication expired. Run `lemonade auth login` to re-authenticate.'
                : message,
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
      const newlyRegistered = new Set<string>();
      for (const cap of matches) {
        if (!registeredTools.has(cap.name)) {
          registerCap(cap);
          newlyRegistered.add(cap.name);
        }
      }
      const summary = matches.map(m => ({
        name: m.name,
        description: m.description,
        alreadyLoaded: registeredTools.has(m.name) && !newlyRegistered.has(m.name),
      }));
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(summary, null, 2),
        }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
