import { getAllCapabilities } from '../chat/tools/registry.js';
import { CanonicalCapability } from './types.js';

export interface CapabilityManifest {
  version: string;
  generated: string;
  totalCapabilities: number;
  categories: Record<string, number>;
  backendServiceDistribution: Record<string, number>;
  backendTypeDistribution: Record<string, number>;
  surfaceDistribution: Record<string, number>;
  capabilities: CapabilitySummary[];
}

export interface CapabilitySummary {
  name: string;
  displayName: string;
  description: string;
  category: string;
  backendResolver?: string;
  backendType: string;
  backendService: string;
  destructive: boolean;
  requiresSpace: boolean;
  requiresEvent: boolean;
  surfaces: string[];
  params: { name: string; type: string; required: boolean; description: string }[];
  deprecated?: boolean;
  experimental?: boolean;
  whenToUse?: string;
  tags?: string[];
  shouldDefer?: boolean;
  alwaysLoad?: boolean;
  searchHint?: string;
}

export function generateManifest(version: string, timestamp?: string): CapabilityManifest {
  const capabilities = getAllCapabilities();

  const categories: Record<string, number> = {};
  const backendServiceDistribution: Record<string, number> = {};
  const backendTypeDistribution: Record<string, number> = {};
  const surfaceDistribution: Record<string, number> = {};

  for (const cap of capabilities) {
    categories[cap.category] = (categories[cap.category] || 0) + 1;
    backendServiceDistribution[cap.backendService] = (backendServiceDistribution[cap.backendService] || 0) + 1;
    backendTypeDistribution[cap.backendType] = (backendTypeDistribution[cap.backendType] || 0) + 1;
    for (const surface of cap.surfaces) {
      surfaceDistribution[surface] = (surfaceDistribution[surface] || 0) + 1;
    }
  }

  return {
    version,
    generated: timestamp ?? new Date().toISOString(),
    totalCapabilities: capabilities.length,
    categories,
    backendServiceDistribution,
    backendTypeDistribution,
    surfaceDistribution,
    capabilities: capabilities.map(capToSummary),
  };
}

export function capToSummary(cap: CanonicalCapability): CapabilitySummary {
  return {
    name: cap.name,
    displayName: cap.displayName,
    description: cap.description,
    category: cap.category,
    backendResolver: cap.backendResolver,
    backendType: cap.backendType,
    backendService: cap.backendService,
    destructive: cap.destructive,
    requiresSpace: cap.requiresSpace,
    requiresEvent: cap.requiresEvent,
    surfaces: [...cap.surfaces],
    params: cap.params.map(p => ({
      name: p.name,
      type: typeof p.type === 'object' ? 'object' : p.type,
      required: p.required,
      description: p.description,
    })),
    deprecated: cap.deprecated || undefined,
    experimental: cap.experimental || undefined,
    whenToUse: cap.whenToUse || undefined,
    tags: cap.tags,
    shouldDefer: cap.shouldDefer || undefined,
    alwaysLoad: cap.alwaysLoad || undefined,
    searchHint: cap.searchHint || undefined,
  };
}
