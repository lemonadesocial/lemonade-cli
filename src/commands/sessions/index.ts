import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { createInterface } from 'readline';

interface ActiveSession {
  _id: string;
  client_type: string;
  device_name: string;
  os: string;
  app_version: string;
  last_active: string;
  is_current: boolean;
  kratos_session_id: string | null;
}

interface ListSessionsResponse {
  getMyActiveSessions: ActiveSession[];
}

interface RevokeSessionResponse {
  revokeMySession: { success: boolean };
}

interface RevokeAllOtherSessionsResponse {
  revokeAllOtherSessions: { revoked_count: number };
}

interface RequestStepUpResponse {
  requestStepUpVerification: { success: boolean };
}

interface VerifyStepUpResponse {
  verifyStepUpVerification: { step_up_token: string };
}

const LIST_SESSIONS_QUERY = `
  query {
    getMyActiveSessions {
      _id
      client_type
      device_name
      os
      app_version
      last_active
      is_current
      kratos_session_id
    }
  }
`;

const REVOKE_SESSION_MUTATION = `
  mutation RevokeMySession($session_id: String!) {
    revokeMySession(session_id: $session_id) {
      success
    }
  }
`;

const REQUEST_STEP_UP_MUTATION = `
  mutation {
    requestStepUpVerification {
      success
    }
  }
`;

const VERIFY_STEP_UP_MUTATION = `
  mutation VerifyStepUp($code: String!) {
    verifyStepUpVerification(code: $code) {
      step_up_token
    }
  }
`;

const REVOKE_ALL_OTHERS_MUTATION = `
  mutation RevokeAllOtherSessions($step_up_token: String!) {
    revokeAllOtherSessions(step_up_token: $step_up_token) {
      revoked_count
    }
  }
`;

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
        const result = await graphqlRequest<ListSessionsResponse>(LIST_SESSIONS_QUERY);
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
        const listResult = await graphqlRequest<ListSessionsResponse>(LIST_SESSIONS_QUERY);
        const targetSession = listResult.getMyActiveSessions.find((s) => s._id === id);
        if (targetSession?.is_current) {
          process.stderr.write('Warning: revoking your current session will invalidate your auth token.\n');
        }

        const result = await graphqlRequest<RevokeSessionResponse>(
          REVOKE_SESSION_MUTATION,
          { session_id: id },
        );

        if (opts.json) {
          console.log(jsonSuccess(result.revokeMySession));
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
        await graphqlRequest<RequestStepUpResponse>(REQUEST_STEP_UP_MUTATION);

        if (!opts.json) {
          process.stderr.write('A verification code has been sent to your email.\n');
        }

        // Step 2: Prompt for 6-digit OTP code
        const code = await promptForInput('Enter 6-digit verification code: ');
        if (!code || !/^\d{6}$/.test(code)) {
          throw new Error('Invalid verification code. Must be 6 digits.');
        }

        // Step 3: Verify the code and get step-up token
        const verifyResult = await graphqlRequest<VerifyStepUpResponse>(
          VERIFY_STEP_UP_MUTATION,
          { code },
        );
        const stepUpToken = verifyResult.verifyStepUpVerification.step_up_token;

        // Step 4: Revoke all other sessions with the step-up token
        const revokeResult = await graphqlRequest<RevokeAllOtherSessionsResponse>(
          REVOKE_ALL_OTHERS_MUTATION,
          { step_up_token: stepUpToken },
        );

        if (opts.json) {
          console.log(jsonSuccess(revokeResult.revokeAllOtherSessions));
        } else {
          console.log(`Revoked ${revokeResult.revokeAllOtherSessions.revoked_count} other session(s).`);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}
