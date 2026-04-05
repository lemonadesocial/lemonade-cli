import { createServer } from 'http';
import { createServer as createNetServer } from 'net';
import { randomBytes, createHash } from 'crypto';
import open from 'open';
import { getHydraUrl, setTokens, clearTokens } from './store.js';

const CLIENT_ID = '0dd89e27-0c2d-4434-bafd-a9bcf369f1a2';
const BASE_REDIRECT_PORT = 9876;
const MAX_PORT_ATTEMPTS = 10;
const SCOPES = ['openid', 'offline_access'];

/**
 * Attempt to refresh the access token using the stored refresh_token.
 * Returns the new access_token on success, or null if refresh fails
 * (expired refresh token, revoked, network error, etc.).
 * On failure, stale tokens are cleared so subsequent calls fall through
 * to api_key or return unauthenticated.
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const hydraUrl = getHydraUrl();

  try {
    const response = await fetch(`${hydraUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const tokens = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    setTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
    return tokens.access_token;
  } catch {
    // Network error, timeout, etc. — don't clear tokens on transient failures
    // so the user can retry without re-logging in.
    return null;
  }
}

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
  const hydraUrl = getHydraUrl();
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
        const tokenResponse = await fetch(`${hydraUrl}/oauth2/token`, {
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
      const authUrl = new URL(`${hydraUrl}/oauth2/auth`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', SCOPES.join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      open(authUrl.toString());
    });

    const timeout = setTimeout(() => {
      server.close();
      resolve({ success: false, error: 'Login timed out (120s)' });
    }, 120_000);
    timeout.unref();
  });
}
