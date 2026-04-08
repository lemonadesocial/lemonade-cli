import { ToolDef } from '../chat/providers/interface.js';
import { CanonicalCapability } from './types.js';

export function toToolDef(cap: CanonicalCapability): ToolDef {
  return {
    name: cap.name,
    category: cap.category,
    displayName: cap.displayName,
    description: cap.description,
    params: cap.params,
    destructive: cap.destructive,
    execute: cap.execute,
    ...(cap.formatResult ? { formatResult: cap.formatResult } : {}),
    backendType: cap.backendType,
    ...(cap.sessionUpdates ? { sessionUpdates: cap.sessionUpdates } : {}),
  };
}

export function capabilitiesToRegistry(capabilities: CanonicalCapability[]): Record<string, ToolDef> {
  const registry: Record<string, ToolDef> = {};
  for (const cap of capabilities) {
    if (registry[cap.name]) {
      throw new Error(`Duplicate capability name: "${cap.name}"`);
    }
    registry[cap.name] = toToolDef(cap);
  }
  return registry;
}
