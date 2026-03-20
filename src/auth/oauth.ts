import { createServer } from 'http';
import { createServer as createNetServer } from 'net';
import { randomBytes, createHash } from 'crypto';
import open from 'open';
import { getApiUrl, setTokens } from './store';

const CLIENT_ID = 'lemonade-cli';
const BASE_REDIRECT_PORT = 9876;
const MAX_PORT_ATTEMPTS = 10;
const SCOPES = ['claudeai'];

async function findAvailablePort(): Promise<number> {
  for (let port = BASE_REDIRECT_PORT; port < BASE_REDIRECT_PORT + MAX_PORT_ATTEMPTS; port++) {
    const available = await new Promise<boolean>((resolve) => {
      const tester = createNetServer()
        .once('error', () => resolve(false))
        .once('listening', () => { tester.close(); resolve(true); })
        .listen(port);
    });
    if (available) return port;
  }
  throw new Error(`No available port in range ${BASE_REDIRECT_PORT}-${BASE_REDIRECT_PORT + MAX_PORT_ATTEMPTS - 1}`);
}

function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export async function loginWithBrowser(): Promise<{ success: boolean; error?: string }> {
  const apiUrl = getApiUrl();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = randomBytes(16).toString('hex');
  const port = await findAvailablePort();
  const redirectUri = `http://localhost:${port}/callback`;

  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Login failed</h2><p>You can close this tab.</p></body></html>');
        server.close();
        resolve({ success: false, error });
        return;
      }

      if (!code || returnedState !== state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Invalid callback</h2></body></html>');
        server.close();
        resolve({ success: false, error: 'Invalid state or missing code' });
        return;
      }

      try {
        const tokenResponse = await fetch(`${apiUrl}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: CLIENT_ID,
            code_verifier: codeVerifier,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }

        const tokens = await tokenResponse.json() as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };

        setTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Login successful!</h2><p>You can close this tab and return to the terminal.</p></body></html>');
        server.close();
        resolve({ success: true });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Token exchange failed</h2></body></html>');
        server.close();
        resolve({ success: false, error: (err as Error).message });
      }
    });

    server.listen(port, () => {
      const authUrl = new URL(`${apiUrl}/oauth2/auth`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', SCOPES.join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      open(authUrl.toString());
    });

    setTimeout(() => {
      server.close();
      resolve({ success: false, error: 'Login timed out (120s)' });
    }, 120_000);
  });
}
