import { describe, it, expect } from 'vitest';
import { buildJsonSchema, validateArgs } from '../../../src/chat/tools/schema';
import { ToolParam } from '../../../src/chat/providers/interface';

describe('buildJsonSchema', () => {
  it('builds schema for string param', () => {
    const params: ToolParam[] = [
      { name: 'title', type: 'string', description: 'Event title', required: true },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.type).toBe('object');
    expect(schema.properties!.title.type).toBe('string');
    expect(schema.required).toEqual(['title']);
  });

  it('builds schema for number param', () => {
    const params: ToolParam[] = [
      { name: 'price', type: 'number', description: 'Price', required: true },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.properties!.price.type).toBe('number');
  });

  it('builds schema for boolean param', () => {
    const params: ToolParam[] = [
      { name: 'virtual', type: 'boolean', description: 'Virtual', required: false },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.properties!.virtual.type).toBe('boolean');
    expect(schema.required).toBeUndefined();
  });

  it('builds schema for string[] param', () => {
    const params: ToolParam[] = [
      { name: 'emails', type: 'string[]', description: 'Emails', required: true },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.properties!.emails.type).toBe('array');
    expect(schema.properties!.emails.items!.type).toBe('string');
  });

  it('builds schema for object param', () => {
    const params: ToolParam[] = [
      {
        name: 'address',
        type: { type: 'object', properties: {
          city: { name: 'city', type: 'string', description: 'City', required: true },
          country: { name: 'country', type: 'string', description: 'Country', required: false },
        }},
        description: 'Address',
        required: false,
      },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.properties!.address.type).toBe('object');
    expect(schema.properties!.address.properties!.city.type).toBe('string');
    expect(schema.properties!.address.required).toEqual(['city']);
  });

  it('includes enum values', () => {
    const params: ToolParam[] = [
      { name: 'sort', type: 'string', description: 'Sort', required: false, enum: ['asc', 'desc'] },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.properties!.sort.enum).toEqual(['asc', 'desc']);
  });

  it('includes default values', () => {
    const params: ToolParam[] = [
      { name: 'limit', type: 'number', description: 'Limit', required: false, default: '10' },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.properties!.limit.default).toBe('10');
  });

  it('handles mixed required and optional params', () => {
    const params: ToolParam[] = [
      { name: 'title', type: 'string', description: 'Title', required: true },
      { name: 'start', type: 'string', description: 'Start', required: true },
      { name: 'end', type: 'string', description: 'End', required: false },
    ];
    const schema = buildJsonSchema(params);
    expect(schema.required).toEqual(['title', 'start']);
  });
});

describe('validateArgs', () => {
  const params: ToolParam[] = [
    { name: 'title', type: 'string', description: 'Title', required: true },
    { name: 'count', type: 'number', description: 'Count', required: false },
    { name: 'active', type: 'boolean', description: 'Active', required: false },
    { name: 'tags', type: 'string[]', description: 'Tags', required: false },
  ];

  it('validates valid args', () => {
    const result = validateArgs({ title: 'Test', count: 5 }, params);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('catches missing required params', () => {
    const result = validateArgs({}, params);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required parameter: title');
  });

  it('catches unknown params', () => {
    const result = validateArgs({ title: 'Test', unknown: 'foo' }, params);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown parameter: unknown');
  });

  it('catches type mismatches', () => {
    const result = validateArgs({ title: 123 }, params);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid type for title');
  });

  it('validates string arrays', () => {
    const result = validateArgs({ title: 'Test', tags: ['a', 'b'] }, params);
    expect(result.valid).toBe(true);
  });

  it('catches invalid string arrays', () => {
    const result = validateArgs({ title: 'Test', tags: [1, 2] }, params);
    expect(result.valid).toBe(false);
  });
});
