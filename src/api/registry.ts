import { getRegistryUrl } from '../auth/store.js';

const ATLAS_AGENT_ID = 'cli:lemonade-cli';
const ATLAS_VERSION = '1.0';

export interface RegistrySearchResult {
  items: Array<{
    id: string;
    title: string;
    description: string;
    start: string;
    end?: string;
    location: {
      name: string;
      address?: string;
      lat: number;
      lng: number;
      city?: string;
      country?: string;
    };
    categories: string[];
    organizer: { name: string; verified: boolean; atlas_id: string };
    price: { amount: number; currency: string; display: string } | null;
    source: { platform: string; url: string };
    availability: 'available' | 'limited' | 'sold_out' | 'not_on_sale';
    image_url?: string;
    payment_methods: string[];
  }>;
  cursor: string | null;
  total: number;
  sources: Array<{ platform: string; count: number }>;
}

export async function registrySearch(
  query: Record<string, string | number | boolean | undefined>,
): Promise<RegistrySearchResult> {
  const registryUrl = getRegistryUrl();

  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  const url = `${registryUrl}/atlas/v1/search${qs ? '?' + qs : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Atlas-Agent-Id': ATLAS_AGENT_ID,
      'Atlas-Version': ATLAS_VERSION,
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Registry search failed: ${response.status}`);
  }

  return (await response.json()) as RegistrySearchResult;
}
