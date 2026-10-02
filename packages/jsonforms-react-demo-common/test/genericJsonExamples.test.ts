import { demoSchema } from '../src/app/demoSchema';
import { describe, expect, it } from 'vitest';
import { createAjv, Generate } from '@jsonforms/core';
import examples from '../src/examples';

describe('generic JSON examples', () => {
  it('starts the generic editor without data and accepts all JSON types', () => {
    const example = examples.find((e) => e.name === 'spec-json-editor')!;
    expect(example).toBeDefined();
    expect(example.schema).toEqual({});
    expect(example.data).toBeUndefined();
    const validate = createAjv().compile(example.schema);
    for (const value of [{}, [], 'text', 2, 1.5, true, null])
      expect(validate(value)).toBe(true);
  });
  it('preserves an omitted schema and data for core inference', () => {
    const example = examples.find((e) => e.name === 'spec-json-inference')!;
    expect(example).toBeDefined();
    expect(example.schema).toBeUndefined();
    expect(example.data).toBeUndefined();
    const inferred = Generate.jsonSchema({ name: 'Sample', active: true });
    expect(inferred.type).toBe('object');
    expect(inferred.properties?.name.type).toBe('string');
    expect(inferred.properties?.active.type).toBe('boolean');
  });
});

it('infers every root JSON type without writing an authored schema', () => {
  expect(demoSchema(undefined, undefined)).toEqual({});
  for (const [value, type] of [
    [[], 'array'],
    ['text', 'string'],
    [true, 'boolean'],
    [null, 'null'],
    [2, 'integer'],
    [1.5, 'number'],
  ] as const) {
    expect(demoSchema(undefined, value).type).toBe(type);
  }
  const supplied = {};
  expect(demoSchema(supplied, { name: 'Sample' })).toBe(supplied);
});
