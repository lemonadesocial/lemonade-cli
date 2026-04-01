import { ToolParam } from '../providers/interface.js';

export type StepInputType = 'choice' | 'text' | 'multiline';

export interface WizardStepDef {
  paramName: string;
  label: string;
  inputType: StepInputType;
  options?: string[];
  required: boolean;
  defaultValue?: string;
}

export function generateSteps(params: ToolParam[]): WizardStepDef[] {
  const sorted = [...params].sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));

  return sorted.map((param) => {
    // Boolean -> choice Yes/No
    if (param.type === 'boolean') {
      return {
        paramName: param.name,
        label: param.description || param.name,
        inputType: 'choice' as const,
        options: ['Yes', 'No'],
        required: param.required,
        defaultValue: param.default !== undefined ? String(param.default) : undefined,
      };
    }

    // String with enum -> choice
    if (param.type === 'string' && param.enum && param.enum.length > 0) {
      return {
        paramName: param.name,
        label: param.description || param.name,
        inputType: 'choice' as const,
        options: param.enum,
        required: param.required,
        defaultValue: param.default !== undefined ? String(param.default) : undefined,
      };
    }

    // String with description/note/body/content in name -> multiline
    if (param.type === 'string' && /description|note|body|content/i.test(param.name)) {
      return {
        paramName: param.name,
        label: param.description || param.name,
        inputType: 'multiline' as const,
        required: param.required,
        defaultValue: param.default !== undefined ? String(param.default) : undefined,
      };
    }

    // Everything else -> text
    return {
      paramName: param.name,
      label: param.description || param.name,
      inputType: 'text' as const,
      required: param.required,
      defaultValue: param.default !== undefined ? String(param.default) : undefined,
    };
  });
}
