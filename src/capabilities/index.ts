export type { CanonicalCapability, BackendService, BackendType, Surface, Permission, ToolCategory } from './types.js';
export type { CapabilityInput } from './factory.js';
export type { CapabilityManifest, CapabilitySummary } from './manifest.js';
export type { CapabilityFilter } from './filter.js';
export { buildCapability } from './factory.js';
export { toToolDef, capabilitiesToRegistry } from './adapter.js';
export { generateManifest, capToSummary } from './manifest.js';
export { filterCapabilities, getCategories, findCapability, getSuggestions } from './filter.js';
