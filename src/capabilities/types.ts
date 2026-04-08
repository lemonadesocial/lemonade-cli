import { ToolParam, type ToolCategory } from '../chat/providers/interface.js';
import type { SessionState } from '../chat/session/state.js';

// Re-export ToolCategory from interface.ts (don't duplicate)
export type { ToolCategory } from '../chat/providers/interface.js';

// Context is optional at the call boundary. All fields are optional because
// different callsites have varying levels of session info available.
export interface ExecutionContext {
  defaultSpace?: string;
  currentSpace?: { _id: string; title: string };
  currentEvent?: { _id: string; title: string };
  lastCreatedEvent?: { _id: string; title: string };
  lastCreatedTicketType?: { _id: string; title: string };
  timezone?: string;
}

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
  execute: (args: Record<string, unknown>, context?: ExecutionContext) => Promise<unknown>;
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

  // Deferred Loading (Phase 6)
  shouldDefer?: boolean;     // true = don't send full schema to LLM upfront
  alwaysLoad?: boolean;      // true = never defer, always send full schema
  searchHint?: string;       // 3-10 words for keyword matching when deferred

  // Session Updates (Phase 9)
  sessionUpdates?: {
    field: keyof SessionState;
    extract: (result: unknown) => unknown;
  }[];

  // Surface Exposure (NEW)
  surfaces: Surface[];
}
