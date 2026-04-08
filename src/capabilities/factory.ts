import { CanonicalCapability } from './types.js';

// Fail-closed defaults: assume the most restrictive settings
const DEFAULTS = {
  backendService: 'graphql' as const,
  requiresSpace: true,
  requiresEvent: true,
  deprecated: false,
  experimental: false,
  surfaces: ['aiTool'] as const,
  shouldDefer: false,
  alwaysLoad: false,
} satisfies Partial<CanonicalCapability>;

type RequiredFields = 'name' | 'displayName' | 'description' | 'category' | 'params' | 'destructive' | 'execute' | 'backendType';

export type CapabilityInput = Pick<CanonicalCapability, RequiredFields> & Partial<Omit<CanonicalCapability, RequiredFields>>;

export function buildCapability(input: CapabilityInput): CanonicalCapability {
  return {
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    category: input.category,
    params: [...input.params],
    destructive: input.destructive,
    execute: input.execute,
    backendType: input.backendType,
    backendResolver: input.backendResolver,
    backendService: input.backendService ?? DEFAULTS.backendService,
    requiresSpace: input.requiresSpace ?? DEFAULTS.requiresSpace,
    requiresEvent: input.requiresEvent ?? DEFAULTS.requiresEvent,
    permissions: input.permissions,
    deprecated: input.deprecated ?? DEFAULTS.deprecated,
    experimental: input.experimental ?? DEFAULTS.experimental,
    whenToUse: input.whenToUse,
    tags: input.tags ? [...input.tags] : undefined,
    shouldDefer: input.shouldDefer ?? DEFAULTS.shouldDefer,
    alwaysLoad: input.alwaysLoad ?? DEFAULTS.alwaysLoad,
    searchHint: input.searchHint,
    surfaces: input.surfaces ? [...input.surfaces] : [...DEFAULTS.surfaces],
    ...(input.formatResult ? { formatResult: input.formatResult } : {}),
    ...(input.sessionUpdates ? { sessionUpdates: input.sessionUpdates } : {}),
  };
}
