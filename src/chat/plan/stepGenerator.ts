import { ToolParam } from '../providers/interface.js';

export type StepInputType = 'choice' | 'text' | 'multiline';

const FRIENDLY_LABELS: Record<string, string> = {
  title: 'Title',
  start: 'Date & Time',
  end: 'Duration',
  description: 'Description',
  space: 'Space',
  address: 'Location',
  virtual: 'Event Type',
  private: 'Visibility',
  name: 'Name',
  quantity: 'Quantity',
  price: 'Price',
  event_id: 'Event',
  space_id: 'Space',
  ticket_type: 'Ticket Type',
};

function humanize(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface WizardStepDef {
  paramName: string;
  label: string;
  friendlyLabel: string;
  inputType: StepInputType;
  options?: string[];
  required: boolean;
  defaultValue?: string;
  merged?: boolean;
}

export function generateSteps(params: ToolParam[]): WizardStepDef[] {
  const sorted = [...params].sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));

  const steps = sorted.map((param): WizardStepDef => {
    const friendlyLabel = FRIENDLY_LABELS[param.name] || humanize(param.name);

    // Boolean -> choice Yes/No
    if (param.type === 'boolean') {
      return {
        paramName: param.name,
        label: param.description || param.name,
        friendlyLabel,
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
        friendlyLabel,
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
        friendlyLabel,
        inputType: 'multiline' as const,
        required: param.required,
        defaultValue: param.default !== undefined ? String(param.default) : undefined,
      };
    }

    // Everything else -> text
    return {
      paramName: param.name,
      label: param.description || param.name,
      friendlyLabel,
      inputType: 'text' as const,
      required: param.required,
      defaultValue: param.default !== undefined ? String(param.default) : undefined,
    };
  });

  // Merge end into start for date compound step
  const startIdx = steps.findIndex((s) => s.paramName === 'start');
  const endIdx = steps.findIndex((s) => s.paramName === 'end');
  if (startIdx >= 0 && endIdx >= 0) {
    steps[endIdx].merged = true;
  }

  return steps;
}
