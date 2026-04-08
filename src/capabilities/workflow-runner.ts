import type { CanonicalCapability, ExecutionContext } from './types.js';
import type { Workflow } from './workflows.js';

// ── Result Types ──────────────────────────────────────────────────────

export interface WorkflowStepResult {
  stepIndex: number;
  toolName: string;
  description: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface WorkflowResult {
  workflow: string;
  success: boolean;
  steps: WorkflowStepResult[];
  summary: string;
}

// ── Arg Resolution ────────────────────────────────────────────────────

/**
 * Resolve an argMapping against workflow input and previous step results.
 *
 * Supported references:
 *   "$input.fieldName"            -> input[fieldName]
 *   "$steps.N.result.field.sub"   -> stepResults[N].result.field.sub
 *
 * Literal values (number, boolean, or strings not starting with "$") pass through.
 */
export function resolveArgs(
  mapping: Record<string, string | number | boolean> | undefined,
  input: Record<string, unknown>,
  stepResults: WorkflowStepResult[],
): Record<string, unknown> {
  if (!mapping) return {};

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (typeof value !== 'string' || !value.startsWith('$')) {
      resolved[key] = value;
      continue;
    }

    if (value.startsWith('$input.')) {
      const field = value.slice('$input.'.length);
      resolved[key] = input[field];
    } else if (value.startsWith('$steps.')) {
      // Format: $steps.N.result.field1.field2...
      const parts = value.slice('$steps.'.length).split('.');
      const stepIdx = parseInt(parts[0], 10);
      const stepResult = stepResults[stepIdx];
      if (!stepResult || !stepResult.success) {
        resolved[key] = undefined;
        continue;
      }
      // Walk remaining path: parts[1] should be "result", then nested fields
      let current: unknown = stepResult;
      for (let i = 1; i < parts.length; i++) {
        if (current == null || typeof current !== 'object') {
          current = undefined;
          break;
        }
        current = (current as Record<string, unknown>)[parts[i]];
      }
      resolved[key] = current;
    } else {
      // Unknown $ prefix — pass through as literal
      resolved[key] = value;
    }
  }

  return resolved;
}

// ── Workflow Executor ─────────────────────────────────────────────────

export async function executeWorkflow(
  workflow: Workflow,
  input: Record<string, unknown>,
  capabilities: CanonicalCapability[],
  context?: ExecutionContext,
): Promise<WorkflowResult> {
  const stepResults: WorkflowStepResult[] = [];
  let allSuccess = true;

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const resolvedArgs = resolveArgs(step.argMapping, input, stepResults);

    const capability = capabilities.find((c) => c.name === step.toolName);
    if (!capability) {
      const stepResult: WorkflowStepResult = {
        stepIndex: i,
        toolName: step.toolName,
        description: step.description,
        success: false,
        error: `Capability "${step.toolName}" not found`,
      };
      stepResults.push(stepResult);
      allSuccess = false;
      if (!step.optional) break;
      continue;
    }

    try {
      const result = await capability.execute(resolvedArgs, context);
      stepResults.push({
        stepIndex: i,
        toolName: step.toolName,
        description: step.description,
        success: true,
        result,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const stepResult: WorkflowStepResult = {
        stepIndex: i,
        toolName: step.toolName,
        description: step.description,
        success: false,
        error: errorMsg,
      };
      stepResults.push(stepResult);
      allSuccess = false;
      if (!step.optional) break;
    }
  }

  const completedSteps = stepResults.filter((s) => s.success);
  const failedSteps = stepResults.filter((s) => !s.success);

  let summary: string;
  if (allSuccess) {
    summary = `Workflow "${workflow.displayName}" completed successfully (${completedSteps.length}/${workflow.steps.length} steps).`;
  } else {
    summary = `Workflow "${workflow.displayName}" failed at step ${failedSteps[failedSteps.length - 1].stepIndex}: ${failedSteps[failedSteps.length - 1].error}. Completed ${completedSteps.length}/${workflow.steps.length} steps.`;
  }

  return {
    workflow: workflow.name,
    success: allSuccess,
    steps: stepResults,
    summary,
  };
}
