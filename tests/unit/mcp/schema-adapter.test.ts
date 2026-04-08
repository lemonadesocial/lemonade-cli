import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { toolParamToZod, capabilityToInputSchema, capabilityToAnnotations } from '../../../src/mcp/schema-adapter.js';
import type { ToolParam } from '../../../src/chat/providers/interface.js';
import type { CanonicalCapability } from '../../../src/capabilities/types.js';

describe('toolParamToZod', () => {
  it('converts string type', () => {
    const param: ToolParam = { name: 'test', type: 'string', description: 'A string', required: true };
    const schema = toolParamToZod(param);
    expect(schema.parse('hello')).toBe('hello');
    expect(() => schema.parse(123)).toThrow();
  });

  it('converts number type', () => {
    const param: ToolParam = { name: 'test', type: 'number', description: 'A number', required: true };
    const schema = toolParamToZod(param);
    expect(schema.parse(42)).toBe(42);
    expect(() => schema.parse('not a number')).toThrow();
  });

  it('converts boolean type', () => {
    const param: ToolParam = { name: 'test', type: 'boolean', description: 'A bool', required: true };
    const schema = toolParamToZod(param);
    expect(schema.parse(true)).toBe(true);
    expect(() => schema.parse('yes')).toThrow();
  });

  it('converts string[] type', () => {
    const param: ToolParam = { name: 'test', type: 'string[]', description: 'String array', required: true };
    const schema = toolParamToZod(param);
    expect(schema.parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(() => schema.parse([1, 2])).toThrow();
  });

  it('converts number[] type', () => {
    const param: ToolParam = { name: 'test', type: 'number[]', description: 'Number array', required: true };
    const schema = toolParamToZod(param);
    expect(schema.parse([1, 2])).toEqual([1, 2]);
  });

  it('converts object[] type', () => {
    const param: ToolParam = { name: 'test', type: 'object[]', description: 'Object array', required: true };
    const schema = toolParamToZod(param);
    expect(schema.parse([{ key: 'val' }])).toEqual([{ key: 'val' }]);
  });

  it('converts nested object type', () => {
    const param: ToolParam = {
      name: 'test',
      type: {
        type: 'object',
        properties: {
          name: { name: 'name', type: 'string', description: 'Name field', required: true },
          count: { name: 'count', type: 'number', description: 'Count', required: false },
        },
      },
      description: 'An object',
      required: true,
    };
    const schema = toolParamToZod(param);
    expect(schema.parse({ name: 'test' })).toEqual({ name: 'test' });
  });

  it('converts enum values', () => {
    const param: ToolParam = {
      name: 'test',
      type: 'string',
      description: 'Pick one',
      required: true,
      enum: ['a', 'b', 'c'],
    };
    const schema = toolParamToZod(param);
    expect(schema.parse('a')).toBe('a');
    expect(() => schema.parse('d')).toThrow();
  });

  it('makes non-required params optional', () => {
    const param: ToolParam = { name: 'test', type: 'string', description: 'Optional', required: false };
    const schema = toolParamToZod(param);
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.parse('hello')).toBe('hello');
  });

  it('warns on unknown param type and falls back to string', () => {
    const mockStderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const param: ToolParam = { name: 'test', type: 'date' as any, description: 'A date', required: true };
    const schema = toolParamToZod(param);

    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining('unknown param type "date"'),
    );
    // Falls back to string schema
    expect(schema.parse('2024-01-01')).toBe('2024-01-01');
    expect(() => schema.parse(123)).toThrow();

    mockStderr.mockRestore();
  });
});

describe('capabilityToInputSchema', () => {
  it('builds shape from capability params', () => {
    const cap = {
      params: [
        { name: 'query', type: 'string' as const, description: 'Search query', required: true },
        { name: 'limit', type: 'number' as const, description: 'Max results', required: false },
      ],
    } as CanonicalCapability;

    const shape = capabilityToInputSchema(cap);
    expect(shape).toHaveProperty('query');
    expect(shape).toHaveProperty('limit');
    expect(shape.query.parse('test')).toBe('test');
    expect(shape.limit.parse(undefined)).toBeUndefined();
  });

  it('returns empty shape for no params', () => {
    const cap = { params: [] } as unknown as CanonicalCapability;
    const shape = capabilityToInputSchema(cap);
    expect(Object.keys(shape)).toHaveLength(0);
  });
});

describe('capabilityToAnnotations', () => {
  it('returns destructiveHint for destructive tools', () => {
    const cap = { destructive: true } as CanonicalCapability;
    const annotations = capabilityToAnnotations(cap);
    expect(annotations.destructiveHint).toBe(true);
    expect(annotations.readOnlyHint).toBeUndefined();
  });

  it('returns readOnlyHint for non-destructive tools', () => {
    const cap = { destructive: false } as CanonicalCapability;
    const annotations = capabilityToAnnotations(cap);
    expect(annotations.readOnlyHint).toBe(true);
    expect(annotations.destructiveHint).toBeUndefined();
  });
});
