import { ToolParam, type ToolCategory } from '../chat/providers/interface.js';

// Re-export ToolCategory from interface.ts (don't duplicate)
export type { ToolCategory } from '../chat/providers/interface.js';

export type BackendService = 'graphql' | 'atlas' | 'local' | 'external';
export type BackendType = 'query' | 'mutation' | 'none';
export type Surface = 'aiTool' | 'cliCommand' | 'slashCommand';
export type Permission = 'space_admin' | 'space_member' | 'event_host' | 'public';

export interface CanonicalCapability {
  // Identity (same as ToolDef)
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;

  // Schema (same as ToolDef)
  params: ToolParam[];

  // Behavior (same as ToolDef)
  destructive: boolean;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
  formatResult?: (result: unknown) => string;

  // Backend Contract (NEW)
  backendResolver?: string;
  backendType: BackendType;
  backendService: BackendService;

  // Constraints (NEW)
  requiresSpace: boolean;
  requiresEvent: boolean;
  permissions?: Permission[];

  // Lifecycle (NEW)
  deprecated?: boolean;
  experimental?: boolean;

  // Discoverability (NEW)
  whenToUse?: string;
  tags?: string[];

  // Surface Exposure (NEW)
  surfaces: Surface[];
}
