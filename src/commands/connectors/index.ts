import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';

export function registerConnectorCommands(program: Command): void {
  const connectors = program
    .command('connectors')
    .description('Manage platform connectors');

  connectors
    .command('list')
    .description('List available connectors')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ availableConnectors: Array<Record<string, unknown>> }>(
          `query {
            availableConnectors {
              id name category authType capabilities
            }
          }`,
        );
        setFlagApiKey(undefined);

        const items = result.availableConnectors;
        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          console.log(renderTable(
            ['ID', 'Name', 'Category', 'Auth Type'],
            items.map((c) => [
              String(c.id),
              String(c.name),
              String(c.category),
              String(c.authType),
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  connectors
    .command('sync <connection-id>')
    .description('Trigger a connector sync')
    .option('--action <action-id>', 'Action to execute', 'sync-events')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (connectionId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ executeConnectorAction: Record<string, unknown> }>(
          `mutation($input: ExecuteConnectorActionInput!) {
            executeConnectorAction(input: $input) {
              success data message error recordsProcessed recordsFailed
            }
          }`,
          { input: { connectionId, actionId: opts.action } },
        );
        setFlagApiKey(undefined);

        const r = result.executeConnectorAction;
        if (opts.json) {
          console.log(jsonSuccess(r));
        } else {
          console.log(renderKeyValue([
            ['Success', r.success ? 'Yes' : 'No'],
            ['Records Processed', String(r.recordsProcessed || 0)],
            ['Records Failed', String(r.recordsFailed || 0)],
            ['Message', String(r.message || '')],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
