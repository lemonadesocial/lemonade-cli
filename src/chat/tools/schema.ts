import { ToolParam, ParamType } from '../providers/interface.js';
import { validateTimezone, validateCurrency, validateISODate, validateDateRange } from './validators/index.js';

interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  description?: string;
  enum?: string[];
  default?: string | number | boolean;
}

function paramTypeToJsonSchema(param: ToolParam): JsonSchema {
  const schema: JsonSchema = { type: 'string' };

  if (typeof param.type === 'object') {
    schema.type = 'object';
    schema.properties = {};
    const required: string[] = [];
    for (const [key, subParam] of Object.entries(param.type.properties)) {
      schema.properties[key] = paramTypeToJsonSchema(subParam);
      if (subParam.required) required.push(key);
    }
    if (required.length > 0) schema.required = required;
    return schema;
  }

  switch (param.type as string) {
    case 'string':
      schema.type = 'string';
      break;
    case 'number':
      schema.type = 'number';
      break;
    case 'boolean':
      schema.type = 'boolean';
      break;
    case 'string[]':
      schema.type = 'array';
      schema.items = { type: 'string' };
      break;
    case 'number[]':
      schema.type = 'array';
      schema.items = { type: 'number' };
      break;
    case 'object[]':
      schema.type = 'array';
      schema.items = { type: 'object' };
      break;
    default:
      schema.type = 'string';
  }

  if (param.description) schema.description = param.description;
  if (param.enum) schema.enum = param.enum;
  if (param.default !== undefined) schema.default = param.default;

  return schema;
}

export function buildJsonSchema(params: ToolParam[]): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const param of params) {
    properties[param.name] = paramTypeToJsonSchema(param);
    if (param.required) required.push(param.name);
  }

  const schema: JsonSchema = {
    type: 'object',
    properties,
  };

  if (required.length > 0) schema.required = required;

  return schema;
}

export function validateArgs(
  args: Record<string, unknown>,
  params: ToolParam[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const param of params) {
    if (param.required && !(param.name in args)) {
      errors.push(`Missing required parameter: ${param.name}`);
    }
  }

  for (const [key, value] of Object.entries(args)) {
    const param = params.find((p) => p.name === key);
    if (!param) {
      errors.push(`Unknown parameter: ${key}`);
      continue;
    }
    if (!validateParamType(value, param.type)) {
      errors.push(`Invalid type for ${key}: expected ${JSON.stringify(param.type)}`);
    }
    if (param.enum && value !== null && value !== undefined && !param.enum.includes(String(value))) {
      errors.push(`Invalid value for ${key}: "${value}". Must be one of: ${param.enum.join(', ')}`);
    }
  }

  // Semantic validation
  for (const [key, value] of Object.entries(args)) {
    if (typeof value !== 'string') continue;
    const param = params.find((p) => p.name === key);
    if (!param || (typeof param.type === 'object') || param.type !== 'string') continue;

    // Match 'timezone' exactly — substring matching (e.g. 'timezone_offset') is too broad
    if (key.toLowerCase() === 'timezone') {
      const err = validateTimezone(value);
      if (err) errors.push(err);
    }
    if (key === 'currency') {
      const err = validateCurrency(value);
      if (err) errors.push(err);
    }
    // Match 'start'/'end' only for string-typed params — avoids false positives on numeric fields
    if ((key === 'start' || key === 'end') && param.type === 'string') {
      const err = validateISODate(value);
      if (err) errors.push(err);
    }
  }

  // Date range validation
  if (typeof args['start'] === 'string' && typeof args['end'] === 'string') {
    const err = validateDateRange(args['start'], args['end']);
    if (err) errors.push(err);
  }

  return { valid: errors.length === 0, errors };
}

function validateParamType(value: unknown, type: ParamType): boolean {
  if (value === null || value === undefined) return true;

  if (typeof type === 'object') {
    return typeof value === 'object' && !Array.isArray(value);
  }

  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'string[]':
      return Array.isArray(value) && value.every((v) => typeof v === 'string');
    case 'number[]':
      return Array.isArray(value) && value.every((v) => typeof v === 'number');
    case 'object[]':
      return Array.isArray(value) && value.every((v) => typeof v === 'object' && v !== null);
    default:
      return true;
  }
}
