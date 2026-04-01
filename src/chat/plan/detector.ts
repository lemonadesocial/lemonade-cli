import { ToolParam, ToolDef } from '../providers/interface.js';

export function detectMissingParams(
  toolDef: ToolDef,
  providedArgs: Record<string, unknown>,
): ToolParam[] {
  return toolDef.params.filter(
    (p) => p.required && !(p.name in providedArgs),
  );
}
