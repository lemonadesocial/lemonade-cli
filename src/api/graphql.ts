import { getApiUrl, getAuthHeader } from '../auth/store';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
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
  const auth = getAuthHeader();

  if (!auth) {
    throw new GraphQLError('Not authenticated. Run "lemonade auth login" or set LEMONADE_API_KEY.', 'UNAUTHENTICATED', 401);
  }

  const response = await fetch(`${apiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
    },
    body: JSON.stringify({ query: operation, variables }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new GraphQLError('Authentication failed', 'UNAUTHENTICATED', response.status);
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
