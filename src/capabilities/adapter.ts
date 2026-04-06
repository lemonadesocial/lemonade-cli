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
  };
}

export function capabilitiesToRegistry(capabilities: CanonicalCapability[]): Record<string, ToolDef> {
  const registry: Record<string, ToolDef> = {};
  for (const cap of capabilities) {
    registry[cap.name] = toToolDef(cap);
  }
  return registry;
}
