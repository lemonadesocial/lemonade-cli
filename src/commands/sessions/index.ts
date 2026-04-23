import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { print } from 'graphql';
import { jsonSuccess } from '../../output/json.js';
import { renderTable } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { createInterface } from 'readline';
import {
  GetMyActiveSessionsDocument,
  RequestStepUpVerificationDocument,
  RevokeAllOtherSessionsDocument,
  RevokeMySessionDocument,
  VerifyStepUpVerificationDocument,
} from '../../graphql/generated/backend/graphql.js';

interface ActiveSession {
  _id: string;
  client_type?: string | null;
  device_name?: string | null;
  os?: string | null;
  app_version?: string | null;
  last_active?: string | null;
  is_current: boolean;
}

interface GetMyActiveSessionsResult {
  getMyActiveSessions: ActiveSession[];
}

interface RevokeMySessionResult {
  revokeMySession: boolean | { success?: boolean | null };
}

interface VerifyStepUpVerificationResult {
  verifyStepUpVerification: string | { step_up_token?: string | null };
}

interface RevokeAllOtherSessionsResult {
  revokeAllOtherSessions: number | { revoked_count?: number | null };
}

function promptForInput(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    rl.on('error', (err) => {
      rl.close();
      reject(err);
    });
  });
}

export function registerSessionsCommands(program: Command): void {
  const sessions = program
    .command('sessions')
    .description('Manage active sessions');

  sessions
    .command('list')
    .description('List active sessions')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const result = await graphqlRequest<GetMyActiveSessionsResult>(print(GetMyActiveSessionsDocument));
        const items = result.getMyActiveSessions;

        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          const rows = items.map((s) => [
            s._id,
            s.client_type || '-',
            s.device_name || '-',
            s.os || '-',
            s.app_version || '-',
            s.last_active || '-',
            s.is_current ? 'Yes' : 'No',
          ]);
          console.log(renderTable(
            ['ID', 'Client', 'Device', 'OS', 'App Version', 'Last Active', 'Current'],
            rows,
          ));
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  sessions
    .command('revoke <id>')
    .description('Revoke a specific session')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts) => {
      try {
        // Check if this is the current session and warn
        const listResult = await graphqlRequest<GetMyActiveSessionsResult>(print(GetMyActiveSessionsDocument));
        const targetSession = listResult.getMyActiveSessions.find((s) => s._id === id);
        if (targetSession?.is_current) {
          process.stderr.write('Warning: revoking your current session will invalidate your auth token.\n');
        }

        const result = await graphqlRequest<RevokeMySessionResult>(
          print(RevokeMySessionDocument),
          { session_id: id },
        );
        const success = typeof result.revokeMySession === 'boolean'
          ? result.revokeMySession
          : Boolean(result.revokeMySession?.success);

        if (opts.json) {
          console.log(jsonSuccess({ success }));
        } else {
          console.log('Session revoked successfully.');
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  sessions
    .command('revoke-others')
    .description('Revoke all other sessions (requires step-up verification)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        // Step 1: Request step-up verification code
        await graphqlRequest<{ requestStepUpVerification: boolean | { success?: boolean | null } }>(
          print(RequestStepUpVerificationDocument),
        );

        if (!opts.json) {
          process.stderr.write('A verification code has been sent to your email.\n');
        }

        // Step 2: Prompt for 6-digit OTP code
        const code = await promptForInput('Enter 6-digit verification code: ');
        if (!code || !/^\d{6}$/.test(code)) {
          throw new Error('Invalid verification code. Must be 6 digits.');
        }

        // Step 3: Verify the code and get step-up token
        const verifyResult = await graphqlRequest<VerifyStepUpVerificationResult>(
          print(VerifyStepUpVerificationDocument),
          { code },
        );
        const stepUpToken = typeof verifyResult.verifyStepUpVerification === 'string'
          ? verifyResult.verifyStepUpVerification
          : String(verifyResult.verifyStepUpVerification?.step_up_token ?? '');

        // Step 4: Revoke all other sessions with the step-up token
        const revokeResult = await graphqlRequest<RevokeAllOtherSessionsResult>(
          print(RevokeAllOtherSessionsDocument),
          { step_up_token: stepUpToken },
        );
        const revokedCount = typeof revokeResult.revokeAllOtherSessions === 'number'
          ? revokeResult.revokeAllOtherSessions
          : Number(revokeResult.revokeAllOtherSessions?.revoked_count ?? 0);

        if (opts.json) {
          console.log(jsonSuccess({ revoked_count: revokedCount }));
        } else {
          console.log(`Revoked ${revokedCount} other session(s).`);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}
