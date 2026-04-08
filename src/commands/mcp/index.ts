import { Command } from 'commander';

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start MCP server for Claude Code integration')
    .action(async () => {
      const { startMcpServer } = await import('../../mcp/server.js');
      await startMcpServer();
    });
}
