import { useState, useEffect, useCallback } from 'react';
import { ChatEngine } from '../../engine/ChatEngine.js';
import { ToolDef, ToolParam } from '../../providers/interface.js';
import { WizardStepDef, generateSteps } from '../../plan/stepGenerator.js';
import { graphqlRequest } from '../../../api/graphql.js';

export interface PlanModeState {
  active: boolean;
  toolCallId: string;
  toolDef: ToolDef | null;
  toolDisplayName: string;
  providedParams: Record<string, unknown>;
  steps: WizardStepDef[];
  spaces: Array<{ _id: string; title: string }>;
}

async function fetchSpacesIfNeeded(steps: WizardStepDef[]): Promise<Array<{ _id: string; title: string }>> {
  if (steps.some(s => s.inputType === 'space_select')) {
    try {
      const result = await graphqlRequest<{ listMySpaces: { items: Array<{ _id: string; title: string }> } }>(
        'query { listMySpaces(limit: 100, skip: 0) { items { _id title } } }',
      );
      return result.listMySpaces.items;
    } catch {
      // Fall back to text input if fetch fails
    }
  }
  return [];
}

export function usePlanMode(engine: ChatEngine) {
  const [planState, setPlanState] = useState<PlanModeState>({
    active: false,
    toolCallId: '',
    toolDef: null,
    toolDisplayName: '',
    providedParams: {},
    steps: [],
    spaces: [],
  });

  useEffect(() => {
    const onPlanRequest = async (data: {
      toolCallId: string;
      toolName: string;
      toolDef: ToolDef;
      providedParams: Record<string, unknown>;
      missingParams: ToolParam[];
    }) => {
      const steps = generateSteps(data.missingParams);
      const spaces = await fetchSpacesIfNeeded(steps);
      setPlanState({
        active: true,
        toolCallId: data.toolCallId,
        toolDef: data.toolDef,
        toolDisplayName: data.toolDef.displayName,
        providedParams: data.providedParams,
        steps,
        spaces,
      });
    };

    engine.on('plan_request', onPlanRequest);
    return () => {
      engine.off('plan_request', onPlanRequest);
    };
  }, [engine]);

  const completePlan = useCallback(
    async (answers: Record<string, unknown>) => {
      if (!planState.active || !planState.toolDef) return;
      const merged = { ...planState.providedParams, ...answers };

      if (planState.toolCallId.startsWith('manual-')) {
        // Manual plan: execute tool directly
        setPlanState((prev) => ({ ...prev, active: false, steps: [], spaces: [] }));
        try {
          const result = await planState.toolDef!.execute(merged);
          engine.emit('tool_done', {
            id: planState.toolCallId,
            name: planState.toolDisplayName,
            result,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          engine.emit('tool_done', {
            id: planState.toolCallId,
            name: planState.toolDisplayName,
            error: msg,
          });
        }
      } else {
        // Auto plan: resolve the pending Promise in executor
        engine.completePlan(planState.toolCallId, merged);
        setPlanState((prev) => ({ ...prev, active: false, steps: [], spaces: [] }));
      }
    },
    [engine, planState],
  );

  const cancelPlan = useCallback(() => {
    if (!planState.active) return;
    engine.cancelPlan(planState.toolCallId);
    setPlanState((prev) => ({ ...prev, active: false, steps: [], spaces: [] }));
  }, [engine, planState]);

  // For /plan command - manual start
  const startManualPlan = useCallback(
    async (toolDef: ToolDef) => {
      const steps = generateSteps(toolDef.params);
      const spaces = await fetchSpacesIfNeeded(steps);
      setPlanState({
        active: true,
        toolCallId: `manual-${Date.now()}`,
        toolDef,
        toolDisplayName: toolDef.displayName,
        providedParams: {},
        steps,
        spaces,
      });
    },
    [],
  );

  return { planState, completePlan, cancelPlan, startManualPlan };
}
