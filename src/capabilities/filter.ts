import type { CanonicalCapability } from './types.js';

export interface CapabilityFilter {
  category?: string;
  surface?: string;
  backendType?: string;
  destructive?: boolean;
}

/** Filter and sort capabilities. Category matching is case-insensitive. */
export function filterCapabilities(caps: CanonicalCapability[], filter: CapabilityFilter): CanonicalCapability[] {
  let result = caps;

  if (filter.category) {
    const cat = filter.category.toLowerCase();
    result = result.filter(c => c.category === cat);
  }
  if (filter.surface) {
    result = result.filter(c => c.surfaces.includes(filter.surface as 'aiTool'));
  }
  if (filter.backendType) {
    result = result.filter(c => c.backendType === filter.backendType);
  }
  if (filter.destructive) {
    result = result.filter(c => c.destructive);
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/** Get sorted unique categories from capabilities. */
export function getCategories(caps: CanonicalCapability[]): string[] {
  const cats = new Set<string>();
  for (const cap of caps) {
    cats.add(cap.category);
  }
  return [...cats].sort();
}

/** Find a capability by name (case-insensitive fallback). */
export function findCapability(caps: CanonicalCapability[], name: string): CanonicalCapability | undefined {
  return caps.find(c => c.name === name) ??
    caps.find(c => c.name.toLowerCase() === name.toLowerCase());
}

/** Get suggestion names for a partial match. */
export function getSuggestions(caps: CanonicalCapability[], name: string, limit = 5): string[] {
  return caps
    .filter(c => c.name.toLowerCase().includes(name.toLowerCase()))
    .slice(0, limit)
    .map(c => c.name);
}
