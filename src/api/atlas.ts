import { getApiUrl, getAuthHeader } from '../auth/store.js';

const ATLAS_AGENT_ID = 'cli:lemonade-cli';
const ATLAS_VERSION = '1.0';

export class AtlasError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AtlasError';
  }
}

export interface AtlasResponse<T> {
  status: number;
  data: T;
}

export async function atlasRequest<T>(options: {
  method?: 'GET' | 'POST';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  authenticated?: boolean;
  timeoutMs?: number;
}): Promise<AtlasResponse<T>> {
  const { method = 'GET', path, body, query, authenticated = false, timeoutMs = 10_000 } = options;
  const apiUrl = getApiUrl();

  const headers: Record<string, string> = {
    'Atlas-Agent-Id': ATLAS_AGENT_ID,
    'Atlas-Version': ATLAS_VERSION,
    'Content-Type': 'application/json',
  };

  if (authenticated) {
    const auth = getAuthHeader();
    if (!auth) {
      throw new AtlasError('Not authenticated', 401);
    }
    headers['Authorization'] = auth;
  }

  const qs = query
    ? '?' + Object.entries(query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const url = `${apiUrl}${path}${qs}`;

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  };

  if (body && method === 'POST') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const data = (await response.json()) as T;

  if (response.status === 402) {
    return { status: 402, data };
  }

  if (!response.ok) {
    throw new AtlasError(
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : `Atlas API returned ${response.status}`,
      response.status,
    );
  }

  return { status: response.status, data };
}
