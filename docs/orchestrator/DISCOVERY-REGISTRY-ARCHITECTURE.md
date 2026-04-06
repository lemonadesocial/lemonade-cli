# Registry-Architecture Program — Full Surface Mapping Report

Discovery date: 2026-04-06
Discovery subagent: DISCOVERY-SUBAGENT.md (proper prompt)
Program mode: architecture/features (REGISTRY-ARCHITECTURE PROGRAM)

---

## TARGET AREA 1: Command Registry Architecture

### Current State

**Entry point:** `src/index.ts`

Commands use the `commander` library. `index.ts` imports 11 `register*Commands` functions (lines 4-15) and invokes them sequentially (lines 27-37), then loads auto-generated commands via `loadGeneratedCommands()` (line 42).

**Manual command groups (11 directories, each with `index.ts`):**

| Group | Subcommands | File |
|---|---|---|
| auth | 5 | `src/commands/auth/index.ts` |
| config | 4 | `src/commands/config/index.ts` |
| connectors | 3 | `src/commands/connectors/index.ts` |
| doctor | 1 | `src/commands/doctor/index.ts` |
| event | 14 | `src/commands/event/index.ts` |
| rewards | 6 | `src/commands/rewards/index.ts` |
| site | 5 | `src/commands/site/index.ts` |
| space | 11 | `src/commands/space/index.ts` |
| status | 1 | `src/commands/status/index.ts` |
| tickets | 7 | `src/commands/tickets/index.ts` |
| tools | 4 | `src/commands/tools/index.ts` |

**Total manual CLI subcommands: ~61**

**Extensibility infrastructure:**

- `src/commands/loader.ts` (120 lines) — 3-phase loading: manual commands take priority, then MCP-generated (`commands/generated/`), then GraphQL-extended (`commands/extended/`). Uses a `registered` Set keyed by `group:subcommand` to prevent collisions.
- `src/codegen/generate-from-mcp.ts` — generates CLI commands from MCP schema JSON.
- `src/codegen/generate-from-graphql.ts` — generates CLI commands from live GraphQL introspection.
- `src/codegen/tool-resolver-map.ts` — maps MCP tool names to GraphQL resolver names and CLI command group/subcommand pairs.
- **Neither `generated/` nor `extended/` directories currently exist** — codegen has not been run.

### Architecture Issues

1. **Command metadata is scattered.** Each `commands/*/index.ts` defines descriptions and options inline with Commander's fluent API. No central manifest.
2. **No relationship between CLI commands and AI tools.** The 61 CLI commands and 213 AI tools are completely separate codebases with no shared definition.
3. **Help text is duplicated.** CLI `--help` from Commander; AI tool descriptions from `registry.ts`; slash command help from `SlashCommands.ts`. Three independent sources of truth for overlapping operations.

### Missing Capabilities
- No command-level metadata beyond name and description (no category, permission requirements, backend dependency declarations).
- No programmatic command listing that a machine could consume.

### Risks
- Codegen (`generated/`, `extended/`) directories don't exist, meaning the extensibility pipeline is defined but unused. Future activation could create naming conflicts.

---

## TARGET AREA 2: Tool Registry Architecture

### Current State

**File:** `src/chat/tools/registry.ts` — **6,751 lines, 284KB**

**Total tools registered: 213** (via `register()` calls in a single `buildToolRegistry()` function).

**ToolDef interface** (`src/chat/providers/interface.ts`, lines 78-86):
```typescript
interface ToolDef {
  name: string;
  displayName: string;
  description: string;
  params: ToolParam[];
  destructive: boolean;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
  formatResult?: (result: unknown) => string;
}
```

**7 metadata fields total:** `name`, `displayName`, `description`, `params`, `destructive`, `execute`, `formatResult`.

**Category determination:** Each tool now has an explicit `category` field set at registration time (e.g., `category: 'event'`). The old `getToolCategory()` helper that derived categories from tool name prefixes has been removed. Categories are accessed directly via `tool.category`.

**Tools per derived category (48 categories):**

| Category | Count |
|---|---|
| event | 82 |
| space | 36 |
| tickets | 13 |
| page | 10 |
| payment | 7 |
| newsletter | 7 |
| connector | 7 |
| subscription | 5 |
| site | 5 |
| rewards | 5 |
| tempo | 4 |
| credits | 3 |
| file | 3 |
| launchpad | 3 |
| user | 2 |
| template | 2 |
| stripe | 2 |
| notifications | 2 |
| connectors | 2 |
| (misc singletons) | ~20 |

**Comment-based sections in registry.ts: 48** (e.g., `// --- Event ---`, `// --- Tickets ---`).

**Destructive tools: 39** (out of 213).

**Backend connections:**
- 209 `graphqlRequest()` calls
- 4 `atlasRequest()` calls (for ticket purchasing)
- 1 `registrySearch()` call (for event search)

**Execution pipeline** (`src/chat/tools/executor.ts`, 213 lines):
- Validates args against ToolParam definitions
- Handles destructive action confirmation (TTY and non-TTY)
- Supports "plan mode" for missing required params
- Classifies errors (GraphQL, Atlas, network, rate limit)
- Emits `tool_start`/`tool_done` events to ChatEngine

**Schema conversion** (`src/chat/tools/schema.ts`, 133 lines):
- Converts ToolParam[] to JSON Schema for AI providers
- Runtime validation of args against param types

### Architecture Issues

1. **Single-file monolith.** 6,751 lines / 284KB in one file. Exceeds the Read tool's 256KB limit.
2. **`category` field now explicit on ToolDef.** Previously derived from naming convention (misclassifying tools like `accept_event`, `get_me`). Now each tool declares its category at registration.
3. **Inline execute functions.** Every tool's business logic (GraphQL query strings, response mapping) is embedded in the registration call.
4. **No shared patterns extracted.** Many tools follow identical patterns but each reimplements.

### Missing Metadata

- ~~`category` (explicit, not derived)~~ — DONE: added as explicit field
- `audience` / `mode` constraints (some tools only work in BYOK mode)
- Backend dependency info (which GraphQL resolver/mutation backs it)
- Surface exposure metadata (which surfaces expose this tool)
- Deprecation status
- Rate limit info
- Permission requirements (space admin vs member vs public)
- Tags/labels for discoverability

### Risks
- File grows linearly with every new capability. At 48 sections, 213 tools, increasingly difficult to review, test, or refactor.
- Name-based categorization produces more miscategorized tools as capabilities diversify.

---

## TARGET AREA 3: Slash-Command / Command / Tool Parity

### Current State

**Slash commands defined:** 20 (`src/chat/ui/SlashCommands.ts`, lines 8-30)

**Slash commands:** `/help`, `/clear`, `/model`, `/provider`, `/space`, `/exit`, `/quit`, `/mode`, `/name`, `/plan`, `/btw`, `/version`, `/status`, `/events`, `/spaces`, `/credits`, `/history`, `/export`, `/connectors`, `/tempo`, `/tools`

**Slash command router:** `src/chat/runtime/SlashCommandRouter.ts` — 945 lines.

### Parity Matrix

**Operations available across all three surfaces (CLI + Tool + Slash):**

| Operation | CLI Command | AI Tool | Slash Command |
|---|---|---|---|
| List events | `event list` | `event_list` | `/events` |
| List spaces | `space list` | `space_list` | `/spaces` |
| Switch space | — | `space_switch` | `/spaces <n>` |
| Export guests | — | `event_export_guests` | `/export guests` |
| Export apps | — | `event_application_export` | `/export apps` |
| Connector list | `connectors list` | `connectors_list` | `/connectors` |
| Connector sync | `connectors sync` | `connectors_sync` | `/connectors run` |
| Credits balance | — | `credits_balance` | `/credits` |
| Tool list/info | `tools list/info` | — | `/tools` |

**Operations as slash command only (no CLI, no AI tool):**
`/help`, `/clear`, `/model`, `/provider`, `/mode`, `/name`, `/plan`, `/btw`, `/version`, `/status`, `/history`, `/tempo install/login/logout/fund`

**AI-only tools (no CLI command, no slash command): 152+**

### Drift and Duplication

1. `/events` duplicates `event_list` tool logic (SlashCommandRouter.ts lines 287-314)
2. `/spaces` duplicates `space_list` + `space_switch` logic (lines 317-380)
3. `/credits` duplicates `credits_balance` logic (lines 382-406)
4. `/connectors` reimplements 6 sub-operations with 200+ lines inline (lines 508-701)
5. `/tempo` reimplements 7 sub-operations with 160+ lines (lines 704-867)
6. `/export` reimplements CSV generation inline (lines 426-505)
7. `/tools` reimplements tool listing/info/categories inline (lines 869-937), duplicating `commands/tools/index.ts`

### Missing Parity
- 152+ AI tools have no CLI command equivalent (only ~40 bridged via TOOL_TO_COMMAND)
- No slash command for broadcasting, newsletters, analytics charts, token gates, etc.
- CLI commands with no tool equivalent: `auth login`, `auth token`, `auth logout`, `config init`, `config set`, `config get`, `doctor`, `status`

---

## TARGET AREA 4: Metadata-First Capability Model

### Current State

| Metadata Field | Status | Notes |
|---|---|---|
| `name` | EXISTS | Internal identifier |
| `displayName` | EXISTS | Human-readable name |
| `description` | EXISTS | Free-text description |
| `params` | EXISTS | Full param definitions with types |
| `destructive` | EXISTS | Boolean flag |
| `execute` | EXISTS | Implementation function |
| `formatResult` | EXISTS (optional) | Result formatter |
| `category` | MISSING | Derived from name prefix — unreliable |
| `audience`/`mode` | MISSING | No credits vs BYOK constraints |
| `backendDependency` | MISSING | No GraphQL resolver declaration |
| `surfaceExposure` | MISSING | No surface metadata |
| `deprecation` | MISSING | No deprecation status |
| `rateLimit` | MISSING | No rate limit info |
| `permissions` | MISSING | No permission requirements |
| `examples` | MISSING | No usage examples |
| `relatedTools` | MISSING | No relationship graph |
| `tags` | MISSING | No freeform tags |

### Canonical Capability Definition Shape (Target)

```
CanonicalCapability {
  // Identity
  id: string;
  displayName: string;
  description: string;
  category: string;
  tags: string[];

  // Contract
  backendResolver: string;
  backendType: 'query' | 'mutation';
  params: CanonicalParam[];
  
  // Constraints
  destructive: boolean;
  permissions: string[];
  modeConstraints: ('credits' | 'byok')[];
  deprecated: boolean;
  deprecationNote?: string;
  
  // Surface exposure
  surfaces: {
    aiTool: boolean;
    cliCommand?: { group: string; subcommand: string };
    slashCommand?: string;
  };
  
  // Implementation (separate from definition)
  execute: Function;
  formatResult?: Function;
}
```

---

## TARGET AREA 5: Backend-to-CLI Capability Mapping

### Current State

- **TOOL_TO_RESOLVER map** (`src/codegen/tool-resolver-map.ts`): **97 entries**
- **TOOL_TO_COMMAND map**: **40 entries**
- **MANUAL_RESOLVERS set** (`generate-from-graphql.ts`, lines 71-124): **~95 resolver names**
- **Backend APIs used:** 209 graphqlRequest(), 4 atlasRequest(), 1 registrySearch()

### Coverage Gaps

213 tools but TOOL_TO_RESOLVER only maps 97. The remaining ~116 tools use inline GraphQL queries without tracking.

1. **No single source of truth for backend dependencies.** Must read 6,751 lines to find what resolver backs a tool.
2. **Schema drift is undetectable.** If backend renames a resolver, no automated way to find which tools break.
3. **Codegen pipeline dormant.** `generated/` and `extended/` dirs don't exist.

### Unmapped Tool Categories (no resolver tracking)
- All broadcasting tools (`event_broadcast_create/update/delete`)
- All email workflow tools (`event_email_create/update/delete/toggle/test`)
- All analytics chart tools (`event_sales_chart`, `event_checkin_chart`, `event_views_chart`)
- All token gate tools
- All POAP tools
- Newsletter tools (in resolver map but not in TOOL_TO_COMMAND)

---

## TARGET AREA 6: Discoverability and Introspection

### Current State

**CLI discovery** (`src/commands/tools/index.ts`, 203 lines):
- `lemonade tools list` — all 213 tools in table
- `lemonade tools list -c event` — filter by category
- `lemonade tools info <name>` — detailed tool info with params
- `lemonade tools categories` — category list with counts
- Supports `--json` output

**Slash command discovery** (`/tools` in SlashCommandRouter.ts, lines 869-937):
- `/tools` — categories with counts
- `/tools <category>` — tools in category
- `/tools info <name>` — tool details
- Duplicates `commands/tools/index.ts` logic independently

**System prompt** (`src/chat/session/cache.ts`, 52 lines):
- Builds system messages with personality, guidelines, session context
- Skills loaded from 8 markdown files (416 lines total) in `src/chat/skills/`
- Skills are hand-written prose describing tool names and workflows
- No auto-generated tool documentation in system prompt

**Skill files** (`src/chat/skills/`):

| File | Lines | Content |
|---|---|---|
| `personality.md` | 72 | Agent persona |
| `events-core.md` | 62 | Event/ticket workflows |
| `events-analytics.md` | 43 | Analytics tools |
| `events-advanced.md` | 70 | Broadcasting, emails, cloning |
| `community.md` | 59 | Space management |
| `billing.md` | 29 | Credits and subscriptions |
| `connectors.md` | 31 | Connector workflows |
| `tempo.md` | 28 | Tempo wallet |

### Architecture Issues

1. Skills are hand-maintained prose that drifts from actual tools
2. No machine-readable capability catalog
3. Tool discoverability for AI is implicit (via formatTools())
4. Duplicate discovery UIs (`/tools` slash + `lemonade tools` CLI)

### Missing Capabilities
- No capability manifest file (e.g., `capabilities.json`)
- No programmatic query "what tools require space admin permissions?"
- No way to ask "what backend resolver does tool X use?"
- No tool relationship graph

---

## TARGET AREA 7: Migration Strategy Assessment

### Current State

Single `buildToolRegistry()` in `registry.ts` with local `register()` helper.

**Shared infrastructure:**
- `register()` — trivial: `tools[t.name] = t`
- `parseJsonObject()` / `parseJsonArray()` — utility functions
- Imports: `graphqlRequest`, `atlasRequest`, `registrySearch`, `getDefaultSpace`

### What Would Break If Tools Were Split Into Modules

1. Closure over utility functions — each module needs its own imports
2. `register()` captures `tools` dictionary via closure — modules need to export ToolDef arrays or accept register function
3. No existing module boundaries (only comment-based sections)
4. Consumers expect flat `Record<string, ToolDef>` — this contract is stable and can remain

### Migration Path

1. Split tools into category-based files (e.g., `tools/event.ts`, `tools/space.ts`)
2. Each file exports an array of ToolDef objects
3. Central `registry.ts` imports all modules and aggregates into `Record<string, ToolDef>`
4. Public API (`buildToolRegistry()` returning `Record<string, ToolDef>`) stays identical
5. **Non-breaking internal refactor** — no consumer changes needed

---

## CONSOLIDATED FINDINGS

### Top Architectural Issues (Ranked by Impact)

1. **CRITICAL — Single-file tool monolith (284KB, 6,751 lines).** Blocks all other improvements.
2. **HIGH — No explicit metadata on tools.** Prevents automated discovery, drift detection, cross-surface consistency.
3. **HIGH — Three independent surfaces with no shared definition.** CLI/tools/slash duplicate logic and drift.
4. **MEDIUM-HIGH — Backend dependency mapping incomplete.** 97/213 tracked. Schema drift undetectable.
5. **MEDIUM — Discoverability hand-maintained and duplicated.** Skill files drift. Two independent tool-listing UIs.

### Recommended Initiative Order

| Phase | Initiative | Depends On | Justification |
|-------|-----------|------------|---------------|
| 1 | Explicit Category Metadata | None | Prerequisite for modularization. Fixes misclassification. |
| 2 | Registry Modular Split | Phase 1 | Breaks monolith into reviewable/testable modules. Unblocks all subsequent work. |
| 3 | ToolDef Metadata Enrichment | Phase 1 | Adds backendResolver, permissions, surfaces, tags. Foundation for capability model. |
| 4 | Capability Manifest + Auto-Discovery | Phase 3 | Auto-generate manifest, skill files, deduplicate UIs. |
| 5 | Backend Dependency Tracking | Phase 3 | Complete resolver map, activate codegen, add CI drift check. |
| 6 | Surface Unification | Phase 3, 4 | Generate slash/CLI from capability definitions, eliminate duplication. |

**Dependency graph:** Phase 1 → Phase 2 → Phase 3 → (Phase 4, 5, 6 in parallel)

### Highest-Leverage First Branch

**Phase 1: Add explicit `category` field to ToolDef, populate on all 213 tools.**

Justification: Every downstream initiative needs tools to have an explicit category. Without it, modularization has no organizing principle and the capability model has no taxonomy. Fixes the name-prefix-derivation problem for `accept_event`, `decline_event`, `get_me`, `list_chains`, etc.
