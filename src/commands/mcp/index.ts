import { Command } from 'commander';

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start MCP server for Claude Code integration')
    .option('--watch', 'Subscribe to real-time notifications')
    .action(async (opts: { watch?: boolean }) => {
      const { startMcpServer } = await import('../../mcp/server.js');
      await startMcpServer({ watch: opts.watch });
    });
}
