import { Command } from 'commander';
import open from 'open';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey, getApiUrl } from '../../auth/store.js';

export function registerSiteCommands(program: Command): void {
  const site = program
    .command('site')
    .description('Manage event/space pages');

  site
    .command('generate <owner-id>')
    .description('Generate a page from description')
    .requiredOption('--type <type>', 'Owner type: event|space')
    .requiredOption('--description <text>', 'Page description')
    .option('--style <text>', 'Style hints')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (ownerId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const input: Record<string, unknown> = {
          owner_id: ownerId,
          owner_type: opts.type,
          description: opts.description,
        };
        if (opts.style) input.style = opts.style;

        const result = await graphqlRequest<{ aiGeneratePageFromDescription: Record<string, unknown> }>(
          `mutation($input: AiGeneratePageInput!) {
            aiGeneratePageFromDescription(input: $input) {
              _id name status version
              sections { id type order hidden }
              theme { type mode colors { text_primary accent background } }
            }
          }`,
          { input },
        );
        setFlagApiKey(undefined);

        const page = result.aiGeneratePageFromDescription;
        if (opts.json) {
          console.log(jsonSuccess(page));
        } else {
          const sections = page.sections as Array<Record<string, unknown>> || [];
          console.log(renderKeyValue([
            ['Page ID', String(page._id)],
            ['Name', String(page.name || '')],
            ['Status', String(page.status)],
            ['Version', String(page.version)],
            ['Sections', String(sections.length)],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  site
    .command('preview <page-id>')
    .description('Preview a page in browser')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (pageId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        await graphqlRequest<{ getPageConfig: Record<string, unknown> }>(
          `query($id: MongoID!) {
            getPageConfig(id: $id) { _id status }
          }`,
          { id: pageId },
        );
        setFlagApiKey(undefined);

        const apiUrl = getApiUrl();
        const previewUrl = `${apiUrl}/preview/${pageId}`;

        if (opts.json) {
          console.log(jsonSuccess({ preview_url: previewUrl }));
        } else {
          console.log('Opening preview in browser...');
          await open(previewUrl);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  site
    .command('deploy <page-id>')
    .description('Publish a page')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (pageId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ publishPageConfig: Record<string, unknown> }>(
          `mutation($id: MongoID!) {
            publishPageConfig(id: $id) {
              _id status published_version
            }
          }`,
          { id: pageId },
        );
        setFlagApiKey(undefined);

        const page = result.publishPageConfig;
        if (opts.json) {
          console.log(jsonSuccess(page));
        } else {
          console.log(`Page deployed (version ${page.published_version})`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  site
    .command('templates')
    .description('List page templates')
    .option('--type <type>', 'Owner type: event|space')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ aiSuggestSections: Array<Record<string, unknown>> }>(
          `query($ownerType: String!) {
            aiSuggestSections(ownerType: $ownerType) {
              id name description preview_url
            }
          }`,
          { ownerType: opts.type || 'event' },
        );
        setFlagApiKey(undefined);

        const items = result.aiSuggestSections;
        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          console.log(renderTable(
            ['ID', 'Name', 'Description'],
            items.map((t) => [
              String(t.id),
              String(t.name),
              String(t.description || ''),
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
