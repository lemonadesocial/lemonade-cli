import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { clearAuth, setApiKey, setFlagApiKey } from '../../auth/store.js';
import { loginWithBrowser } from '../../auth/oauth.js';

interface MeResponse {
  aiGetMe: {
    user: {
      _id: string;
      name: string;
      email: string;
      first_name: string;
      last_name: string;
    };
  };
}

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command('auth')
    .description('Authentication commands');

  auth
    .command('login')
    .description('Log in via browser (OAuth)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const result = await loginWithBrowser();
        if (!result.success) {
          throw new Error(result.error || 'Login failed');
        }

        if (opts.json) {
          console.log(jsonSuccess({ logged_in: true }));
        } else {
          console.log('Logged in successfully.');
        }
        process.exit(0);
      } catch (error) {
        handleError(error, opts.json);
        process.exit(1);
      }
    });

  auth
    .command('token <api-key>')
    .description('Authenticate with an API key')
    .option('--json', 'Output as JSON')
    .action(async (apiKey: string, opts) => {
      try {
        setFlagApiKey(apiKey);
        const result = await graphqlRequest<MeResponse>(
          'query { aiGetMe { user { _id name email first_name last_name } } }',
        );
        setFlagApiKey(undefined);

        setApiKey(apiKey);

        const me = result.aiGetMe.user;
        if (opts.json) {
          console.log(jsonSuccess({ name: me.name, email: me.email }));
        } else {
          console.log(`API key saved. Authenticated as ${me.name}`);
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  auth
    .command('whoami')
    .description('Show current authenticated user')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<MeResponse>(
          'query { aiGetMe { user { _id name email first_name last_name } } }',
        );
        setFlagApiKey(undefined);

        const me = result.aiGetMe.user;
        if (opts.json) {
          console.log(jsonSuccess(me));
        } else {
          console.log(renderKeyValue([
            ['Name', me.name],
            ['Email', me.email],
            ['User ID', me._id],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  auth
    .command('logout')
    .description('Clear stored credentials')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        clearAuth();
        if (opts.json) {
          console.log(jsonSuccess({ logged_out: true }));
        } else {
          console.log('Logged out. Lemonade auth tokens cleared.');
        }
        process.exit(0);
      } catch (error) {
        handleError(error, opts.json);
        process.exit(1);
      }
    });
}
