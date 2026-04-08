import { z } from 'zod';
import type { ToolParam, ParamType } from '../chat/providers/interface.js';
import type { CanonicalCapability } from '../capabilities/types.js';

/**
 * Convert a CanonicalCapability ToolParam to a Zod schema for MCP tool registration.
 */
export function toolParamToZod(param: ToolParam): z.ZodTypeAny {
  let schema = paramTypeToZod(param.type);

  // If enum values are specified, override with z.enum
  if (param.enum && param.enum.length > 0) {
    const [first, ...rest] = param.enum;
    schema = z.enum([first, ...rest]);
  }

  // Apply description
  if (param.description) {
    schema = schema.describe(param.description);
  }

  // Non-required params become optional
  if (!param.required) {
    schema = schema.optional();
  }

  return schema;
}

function paramTypeToZod(type: ParamType): z.ZodTypeAny {
  if (typeof type === 'string') {
    switch (type) {
      case 'string': return z.string();
      case 'number': return z.number();
      case 'boolean': return z.boolean();
      case 'string[]': return z.array(z.string());
      case 'number[]': return z.array(z.number());
      case 'object[]': return z.array(z.record(z.string(), z.unknown()));
      default: return z.string(); // fallback
    }
  }

  // Object type with nested properties
  if (type.type === 'object' && type.properties) {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, prop] of Object.entries(type.properties)) {
      shape[key] = toolParamToZod(prop);
    }
    return z.object(shape);
  }

  return z.string(); // fallback
}

/**
 * Build the Zod shape object (Record<string, ZodTypeAny>) for an MCP tool's input schema.
 * Returns the raw shape — McpServer.tool() accepts this directly.
 */
export function capabilityToInputSchema(cap: CanonicalCapability): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const param of cap.params) {
    shape[param.name] = toolParamToZod(param);
  }
  return shape;
}

/**
 * Build MCP ToolAnnotations from a CanonicalCapability.
 */
export function capabilityToAnnotations(cap: CanonicalCapability): {
  destructiveHint?: boolean;
  readOnlyHint?: boolean;
} {
  return {
    destructiveHint: cap.destructive || undefined,
    readOnlyHint: !cap.destructive || undefined,
  };
}
