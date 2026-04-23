import { hostname, platform, release } from 'os';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { getApiUrl, ensureAuthHeader } from '../auth/store.js';
import { getPackageVersion } from '../config/version.js';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

let clientType = 'cli';

export function setClientType(type: 'cli' | 'mcp'): void {
  clientType = type;
}

export function getClientHeaders(): Record<string, string> {
  // Implements parent-PRD US-15.2 on the HTTP path: when the MCP server is the
  // caller, prefix the device name so operators can distinguish MCP-originated
  // sessions from raw CLI sessions in `getMyActiveSessions`.
  const deviceName =
    clientType === 'mcp' ? `Lemonade MCP (${hostname()})` : hostname();
  return {
    'X-Client-Type': clientType,
    'X-Client-Device-Name': deviceName,
    'X-Client-OS': platform() + ' ' + release(),
    'X-Client-App-Version': getPackageVersion(),
    'X-Client-Locale': process.env.LANG || 'en-US',
  };
}

export class GraphQLError extends Error {
  constructor(
    message: string,
    public code: string | undefined,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'GraphQLError';
  }
}

export async function graphqlRequest<T>(
  operation: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const apiUrl = getApiUrl();

  if (apiUrl && !apiUrl.startsWith('https://') && !apiUrl.startsWith('http://localhost')) {
    throw new GraphQLError('API URL must use HTTPS for security. Set LEMONADE_API_URL to an https:// URL.', 'INSECURE_URL', 400);
  }

  const auth = await ensureAuthHeader();

  if (!auth) {
    throw new GraphQLError('Not authenticated. Run "lemonade auth login" or set LEMONADE_API_KEY.', 'UNAUTHENTICATED', 401);
  }

  const response = await fetch(`${apiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
      ...getClientHeaders(),
    },
    body: JSON.stringify({ query: operation, variables }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new GraphQLError('Authentication failed', 'UNAUTHENTICATED', response.status);
    }
    let body: GraphQLResponse<T>;
    try {
      body = (await response.json()) as GraphQLResponse<T>;
    } catch {
      throw new GraphQLError(
        `Backend returned ${response.status}`,
        'INTERNAL',
        response.status,
      );
    }
    if (body.errors && body.errors.length > 0) {
      const first = body.errors[0];
      throw new GraphQLError(first.message, first.extensions?.code, response.status);
    }
    throw new GraphQLError(
      `Backend returned ${response.status}`,
      'INTERNAL',
      response.status,
    );
  }

  const body = (await response.json()) as GraphQLResponse<T>;

  if (body.errors && body.errors.length > 0) {
    const first = body.errors[0];
    throw new GraphQLError(first.message, first.extensions?.code, 400);
  }

  if (!body.data) {
    throw new GraphQLError('Empty response from backend', 'INTERNAL', 500);
  }

  return body.data;
}

export async function graphqlRequestDocument<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables,
): Promise<TResult> {
  return graphqlRequest<TResult>(
    print(document),
    variables as Record<string, unknown> | undefined,
  );
}
