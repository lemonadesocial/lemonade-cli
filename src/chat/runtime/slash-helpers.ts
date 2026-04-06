import { getAllCapabilities } from '../tools/registry.js';
import { findCapability } from '../../capabilities/filter.js';
import type { CanonicalCapability } from '../../capabilities/types.js';
import type { ToolDef } from '../providers/interface.js';

/**
 * Execute a capability by name and return the formatted result string.
 * Used by slash commands to delegate data operations to the capability registry.
 *
 * When `registry` is provided, validates the tool exists in the runtime registry first.
 * This ensures tools that are unavailable due to mode/space configuration are caught early.
 */
export async function executeCapability(
  name: string,
  args: Record<string, unknown>,
  registry?: Record<string, ToolDef>,
): Promise<{ result: unknown; formatted: string }> {
  // If a runtime registry is provided, check availability first
  if (registry && !registry[name]) {
    throw new CapabilityNotAvailableError(name);
  }
  const caps = getAllCapabilities();
  const cap = findCapability(caps, name);
  if (!cap) {
    throw new CapabilityNotAvailableError(name);
  }
  const result = await cap.execute(args);
  const formatted = cap.formatResult ? cap.formatResult(result) : JSON.stringify(result, null, 2);
  return { result, formatted };
}

/**
 * Error thrown when a capability is not available in the current runtime context.
 */
export class CapabilityNotAvailableError extends Error {
  constructor(name: string) {
    super(`Tool "${name}" is not available. It may require a different AI mode or space configuration.`);
    this.name = 'CapabilityNotAvailableError';
  }
}

/**
 * Find a capability by name from the global registry.
 */
export function getCapability(name: string): CanonicalCapability | undefined {
  return findCapability(getAllCapabilities(), name);
}
