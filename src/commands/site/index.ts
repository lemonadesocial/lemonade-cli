import { Command } from 'commander';
import open from 'open';
import { graphqlRequestDocument } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey, getApiUrl } from '../../auth/store.js';
import {
  GetPageConfigDocument,
  PublishPageConfigDocument,
} from '../../graphql/generated/backend/graphql.js';

export function registerSiteCommands(program: Command): void {
  const site = program
    .command('site')
    .description('Manage event/space pages');
  site.addHelpText(
    'after',
    '\nPage generation and template suggestion commands are temporarily disabled because the live backend no longer exposes those AI page endpoints.\n',
  );

  site
    .command('preview <page-id>')
    .description('Preview a page in browser')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (pageId: string, opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        await graphqlRequestDocument(
          GetPageConfigDocument,
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
        const result = await graphqlRequestDocument(
          PublishPageConfigDocument,
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
}
