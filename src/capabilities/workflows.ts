import type { ToolParam } from '../chat/providers/interface.js';
import { buildCapability } from './factory.js';
import { CanonicalCapability, ExecutionContext } from './types.js';
import { executeWorkflow } from './workflow-runner.js';

// ── Workflow Type System ──────────────────────────────────────────────

export interface WorkflowStep {
  toolName: string;
  description: string;
  // Maps input field names to either:
  // - a literal value
  // - a reference like "$input.title" (from workflow input)
  // - a reference like "$steps.0.result._id" (from previous step result)
  argMapping?: Record<string, string | number | boolean>;
  optional?: boolean; // If true, failure doesn't stop the workflow
}

export interface Workflow {
  name: string;
  displayName: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
}

// ── Example Workflows ─────────────────────────────────────────────────

export const WORKFLOWS: Workflow[] = [
  {
    name: 'workflow_paid_event',
    displayName: 'Create Paid Event',
    description: 'Create an event with paid tickets: creates event, adds ticket type, then publishes.',
    category: 'workflow',
    steps: [
      { toolName: 'event_create', description: 'Create the event', argMapping: { title: '$input.title', start: '$input.start', space: '$input.space' } },
      { toolName: 'tickets_create_type', description: 'Add ticket type', argMapping: { event_id: '$steps.0.result._id', title: '$input.ticket_title', price: '$input.ticket_price' } },
      { toolName: 'event_publish', description: 'Publish the event', argMapping: { event_id: '$steps.0.result._id' } },
    ],
  },
  {
    name: 'workflow_community_launch',
    displayName: 'Launch Community',
    description: 'Create a new community space and set up the first event.',
    category: 'workflow',
    steps: [
      { toolName: 'space_create', description: 'Create the community space', argMapping: { title: '$input.space_title' } },
      { toolName: 'event_create', description: 'Create welcome event', argMapping: { title: '$input.event_title', start: '$input.start', space: '$steps.0.result._id' } },
    ],
  },
  {
    name: 'workflow_event_health_check',
    displayName: 'Event Health Check',
    description: 'Get a comprehensive overview of an event: guest stats, ticket sales, and page views.',
    category: 'workflow',
    steps: [
      { toolName: 'event_guest_stats', description: 'Get guest statistics', argMapping: { event_id: '$input.event_id' } },
      { toolName: 'event_ticket_sold_insight', description: 'Get ticket sales data', argMapping: { event_id: '$input.event_id' } },
      { toolName: 'event_view_insight', description: 'Get page view analytics', argMapping: { event_id: '$input.event_id' } },
    ],
  },
];

// ── Convert Workflows to Capabilities ─────────────────────────────────

/**
 * Extracts all $input.x references from a workflow's steps to derive
 * the parameter list for the resulting capability.
 */
function deriveParams(workflow: Workflow): ToolParam[] {
  const seen = new Set<string>();
  const params: ToolParam[] = [];

  for (const step of workflow.steps) {
    if (!step.argMapping) continue;
    for (const value of Object.values(step.argMapping)) {
      if (typeof value !== 'string' || !value.startsWith('$input.')) continue;
      const paramName = value.slice('$input.'.length);
      if (seen.has(paramName)) continue;
      seen.add(paramName);
      params.push({ name: paramName, type: 'string', description: `Workflow input: ${paramName}`, required: true });
    }
  }

  return params;
}

export function workflowsToCapabilities(): CanonicalCapability[] {
  return WORKFLOWS.map((wf) =>
    buildCapability({
      name: wf.name,
      displayName: wf.displayName,
      description: wf.description,
      category: 'workflow',
      params: deriveParams(wf),
      destructive: false,
      backendType: 'none',
      backendService: 'local',
      requiresSpace: false,
      requiresEvent: false,
      whenToUse: wf.description,
      searchHint: `workflow ${wf.name.replace('workflow_', '')} multi-step automation`,
      execute: async (args: Record<string, unknown>, context?: ExecutionContext) => {
        // Lazy-import getAllCapabilities to avoid circular dependency at module load
        const { getAllCapabilities } = await import('../chat/tools/registry.js');
        const capabilities = getAllCapabilities();
        return executeWorkflow(wf, args, capabilities, context);
      },
    }),
  );
}
