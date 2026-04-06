import { CanonicalCapability } from './types.js';

// Fail-closed defaults: assume the most restrictive settings
const DEFAULTS = {
  backendType: 'mutation' as const,
  backendService: 'graphql' as const,
  requiresSpace: false,
  requiresEvent: false,
  deprecated: false,
  experimental: false,
  surfaces: ['aiTool'] as const,
} satisfies Partial<CanonicalCapability>;

type RequiredFields = 'name' | 'displayName' | 'description' | 'category' | 'params' | 'destructive' | 'execute';

export type CapabilityInput = Pick<CanonicalCapability, RequiredFields> & Partial<Omit<CanonicalCapability, RequiredFields>>;

export function buildCapability(input: CapabilityInput): CanonicalCapability {
  return {
    ...DEFAULTS,
    ...input,
    surfaces: input.surfaces ?? [...DEFAULTS.surfaces],
  };
}
