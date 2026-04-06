import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAllCapabilities } from '../chat/tools/registry.js';

export interface DriftReport {
  generated: string;
  schemaDate: string;
  totalBackendResolvers: number;
  totalCliResolvers: number;
  coveragePercent: number;
  covered: { resolver: string; tool: string; type: 'query' | 'mutation' }[];
  broken: { resolver: string; tool: string; reason: string }[];
  gaps: { resolver: string; type: 'query' | 'mutation' }[];
}

interface BackendResolvers {
  generated: string;
  source: string;
  queries: string[];
  mutations: string[];
}

/**
 * Strip "ai" prefix to get the canonical resolver name.
 * e.g. "aiCreateEvent" -> "createEvent", "aiGetMe" -> "getMe"
 */
function stripAiPrefix(name: string): string {
  if (name.startsWith('ai') && name.length > 2 && name[2] === name[2].toUpperCase()) {
    return name[2].toLowerCase() + name.slice(3);
  }
  return name;
}

/**
 * Add "ai" prefix to get the AI variant of a resolver name.
 * e.g. "createEvent" -> "aiCreateEvent"
 */
function addAiPrefix(name: string): string {
  return 'ai' + name[0].toUpperCase() + name.slice(1);
}

function loadBackendResolvers(schemaPath?: string): BackendResolvers {
  const path = schemaPath ?? resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../schema/backend-resolvers.json',
  );
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as BackendResolvers;
}

export function checkDrift(schemaPath?: string): DriftReport {
  const backend = loadBackendResolvers(schemaPath);
  const capabilities = getAllCapabilities();

  const allBackendQueries = new Set(backend.queries);
  const allBackendResolvers = new Set([...backend.queries, ...backend.mutations]);

  const covered: DriftReport['covered'] = [];
  const broken: DriftReport['broken'] = [];
  // Tracks resolvers actually mapped by a CLI tool (for coverage %)
  const coveredResolvers = new Set<string>();
  // Tracks resolvers to suppress from gaps (includes ai/non-ai counterparts)
  const suppressedFromGaps = new Set<string>();

  // Check each capability with a backendResolver
  for (const cap of capabilities) {
    if (!cap.backendResolver) continue;

    const resolver = cap.backendResolver;
    const canonical = stripAiPrefix(resolver);
    const aiVariant = addAiPrefix(canonical);

    // Try exact match first, then ai-prefixed variant, then stripped variant
    let matchedResolver: string | null = null;
    if (allBackendResolvers.has(resolver)) {
      matchedResolver = resolver;
    } else if (allBackendResolvers.has(aiVariant)) {
      matchedResolver = aiVariant;
    } else if (allBackendResolvers.has(canonical)) {
      matchedResolver = canonical;
    }

    if (matchedResolver) {
      const type = allBackendQueries.has(matchedResolver) ? 'query' : 'mutation';
      covered.push({ resolver: matchedResolver, tool: cap.name, type });
      coveredResolvers.add(matchedResolver);
      // Suppress ai/non-ai counterparts from appearing as gaps
      suppressedFromGaps.add(matchedResolver);
      if (allBackendResolvers.has(aiVariant)) suppressedFromGaps.add(aiVariant);
      if (allBackendResolvers.has(canonical)) suppressedFromGaps.add(canonical);
    } else {
      broken.push({
        resolver,
        tool: cap.name,
        reason: `Resolver "${resolver}" not found in backend schema (also tried "${aiVariant}" and "${canonical}")`,
      });
    }
  }

  // Find gaps: backend resolvers not covered by any CLI capability
  const gaps: DriftReport['gaps'] = [];
  for (const q of backend.queries) {
    if (!suppressedFromGaps.has(q)) {
      gaps.push({ resolver: q, type: 'query' });
    }
  }
  for (const m of backend.mutations) {
    if (!suppressedFromGaps.has(m)) {
      gaps.push({ resolver: m, type: 'mutation' });
    }
  }

  const totalBackend = allBackendResolvers.size;
  const coveragePercent = totalBackend > 0
    ? Math.round((coveredResolvers.size / totalBackend) * 10000) / 100
    : 0;

  const cliResolverCount = capabilities.filter(c => c.backendResolver).length;

  return {
    generated: new Date().toISOString(),
    schemaDate: backend.generated,
    totalBackendResolvers: totalBackend,
    totalCliResolvers: cliResolverCount,
    coveragePercent,
    covered: covered.sort((a, b) => a.resolver.localeCompare(b.resolver)),
    broken: broken.sort((a, b) => a.resolver.localeCompare(b.resolver)),
    gaps: gaps.sort((a, b) => a.resolver.localeCompare(b.resolver)),
  };
}
