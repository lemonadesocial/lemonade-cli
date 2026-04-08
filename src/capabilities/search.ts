/**
 * Reusable tool scoring and search logic.
 * Extracted from system.ts tool_search so both the CLI tool and MCP discover_tools
 * can share the same algorithm.
 */

import type { CanonicalCapability } from './types.js';

type Searchable = Pick<CanonicalCapability, 'name' | 'description' | 'searchHint' | 'whenToUse' | 'category' | 'displayName'>;

/**
 * Score how well a capability matches a search query.
 * Returns 0 if no match.
 */
export function scoreToolMatch(query: string, cap: Searchable): number {
  const q = query.toLowerCase();
  let score = 0;

  const name = cap.name.toLowerCase();
  const hint = (cap.searchHint?.length ? cap.searchHint : cap.description).toLowerCase();
  const desc = cap.description.toLowerCase();
  const whenToUse = (cap.whenToUse || '').toLowerCase();

  // Exact name match
  if (name === q) score += 100;
  // Name contains query
  else if (name.includes(q)) score += 50;

  // Query words match name parts (snake_case splitting)
  const queryWords = q.split(/[\s_]+/);
  const nameParts = name.split('_');
  for (const qw of queryWords) {
    if (nameParts.some(np => np.startsWith(qw))) score += 20;
    if (hint.includes(qw)) score += 10;
    if (desc.includes(qw)) score += 5;
    if (whenToUse.includes(qw)) score += 5;
  }

  // Category match
  if (cap.category.toLowerCase() === q) score += 30;

  return score;
}

/**
 * Search capabilities by query string. Returns matches sorted by relevance, limited to maxResults.
 */
export function searchCapabilities<T extends Searchable>(
  query: string,
  caps: T[],
  maxResults: number = 10,
): T[] {
  const scored = caps
    .map(cap => ({ cap, score: scoreToolMatch(query, cap) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map(s => s.cap);
}
