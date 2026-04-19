import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { getActiveSubscription } from '../../api/subscriptions.js';
import { jsonSuccess } from '../../output/json.js';
import { renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { clearAuth, setApiKey, setFlagApiKey } from '../../auth/store.js';
import { loginWithBrowser } from '../../auth/oauth.js';

interface MeResponse {
  getMe: {
    _id: string;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Max time we wait for the backend `revokeCurrentSession` mutation before
 * giving up and proceeding with local teardown. Mirrors
 * `web-new/lib/hooks/useLogout.ts:12` (`REVOKE_TIMEOUT_MS = 2000`).
 *
 * The timer leg of the race MUST resolve (not reject) to a sentinel — see
 * US-1.2b + IMPL § Phase 2 Contracts. The losing promise is allowed to leak
 * (process exits shortly after logout per PRD Non-Goal 7).
 */
const REVOKE_TIMEOUT_MS = 2000;

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
          'query { getMe { _id name email first_name last_name } }',
        );
        setFlagApiKey(undefined);

        setApiKey(apiKey);

        const me = result.getMe;
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
          'query { getMe { _id name email first_name last_name } }',
        );
        setFlagApiKey(undefined);

        const me = result.getMe;
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
        // Ordered logout teardown per IMPL § Phase 2 / US-1.1c / US-1.4:
        //   1. revokeCurrentSession (raced against a 2s timer)
        //   2. dispose() any live WS subscription
        //   3. clearAuth() local credentials
        //
        // Mirror of `web-new/lib/hooks/useLogout.ts:29-66`. Reversing the
        // dispose → clearAuth order would race the close-code handler against
        // cleared tokens (IMPL Anti-Pattern 7).
        let revokeTimedOut = false;
        try {
          const revokePromise = graphqlRequest<{
            revokeCurrentSession: boolean;
          }>('mutation { revokeCurrentSession }');
          // Timer MUST resolve (not reject) to a sentinel per US-1.2b +
          // web-new useLogout.ts:31-37 pattern.
          const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => {
            setTimeout(
              () => resolve({ timedOut: true }),
              REVOKE_TIMEOUT_MS,
            );
          });
          const raceResult = await Promise.race([
            revokePromise,
            timeoutPromise,
          ]);
          revokeTimedOut =
            typeof raceResult === 'object' &&
            raceResult !== null &&
            'timedOut' in raceResult &&
            (raceResult as { timedOut: boolean }).timedOut === true;
          if (revokeTimedOut) {
            // Stderr breadcrumb per US-6.1 — ops observability for timeouts.
            process.stderr.write(
              '[lemonade-cli] revokeCurrentSession timeout flow=logout\n',
            );
          }
        } catch {
          // Best-effort: if the server is unreachable, auth ctx missing, or
          // token already invalid, proceed with dispose + local logout
          // (US-1.7a / US-1.7b). Not a timeout — do NOT emit the timeout
          // breadcrumb, do NOT set revoke_timed_out in --json output.
        }

        // Dispose BEFORE clearAuth (US-1.1c / US-1.4 / IMPL Anti-Pattern 7).
        // Safe no-op when no subscription is registered in this process
        // (US-1.8). Option A registry: see src/api/subscriptions.ts.
        getActiveSubscription()?.dispose();

        clearAuth();

        if (opts.json) {
          console.log(
            jsonSuccess({
              logged_out: true,
              ...(revokeTimedOut ? { revoke_timed_out: true } : {}),
            }),
          );
        } else {
          // Exit 0 even on timeout or revoke error in non-`--json` mode
          // (US-1.7c). The local teardown succeeded, which is what the
          // user asked for.
          console.log('Logged out. Lemonade auth tokens cleared.');
        }
        process.exit(0);
      } catch (error) {
        handleError(error, opts.json);
        process.exit(1);
      }
    });
}
