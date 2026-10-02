import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { JsonSchema, JsonSchema7 } from '@jsonforms/core';
import { narrowMixedComposition } from '../src/mixedComposition';
import { schemaForType } from '../src/mixed';

const ajv = new Ajv({ strict: false });
const values = [
  null,
  false,
  0,
  1,
  10,
  1.5,
  '',
  'ab',
  'abcd',
  {},
  { name: 'A' },
  [],
  [1],
];
describe('mixed composition narrowing', () => {
  for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
    for (const branches of [
      [
        { type: 'string', minLength: 3 },
        { type: 'integer', minimum: 10 },
      ],
      [{ minLength: 3 }, { minimum: 10 }],
      [{ type: 'number' }, { type: 'integer' }],
      [{ type: 'string' }, { type: 'string' }],
    ]) {
      it(`${keyword} preserves matches for ${JSON.stringify(branches)}`, () => {
        const schema = { [keyword]: branches };
        for (const type of [
          'string',
          'integer',
          'number',
          'object',
          'array',
          'null',
          'boolean',
        ]) {
          const original = ajv.compile({ allOf: [schema, { type }] });
          const narrowed = ajv.compile(narrowMixedComposition(schema, type));
          for (const value of values)
            expect(narrowed(value)).toBe(original(value));
        }
      });
    }
  }
  it('does not narrow child values or rewrite conditional and reference schemas', () => {
    const schema = {
      properties: { value: { type: ['string', 'number'] } },
      if: { required: ['x'] },
      then: { required: ['y'] },
      $defs: { x: {} },
    };
    const result = narrowMixedComposition(schema as JsonSchema, 'object');
    expect(result).toMatchObject(schema);
  });
  it('bounds analysis of cyclic inputs', () => {
    const schema: JsonSchema7 = {};
    schema.allOf = [schema];
    const budget = { remaining: 8 };
    expect(() =>
      narrowMixedComposition(schema, 'object', budget)
    ).not.toThrow();
    expect(budget.remaining).toBe(-1);
  });
});

it('preserves boolean items and numeric intersections in the delegated schema', () => {
  expect(
    schemaForType(
      { type: 'array', items: false } as unknown as JsonSchema,
      'array',
      {}
    )
  ).toMatchObject({ items: false });
  expect(schemaForType({ type: 'integer' }, 'number', {})).toMatchObject({
    type: 'integer',
  });
});

it('preserves nested composition semantics across generated branch combinations', () => {
  const leaves: JsonSchema[] = [
    { type: 'string' },
    { type: 'integer' },
    { minLength: 3 },
    { minimum: 10 },
    { const: 'abcd' },
    { not: { type: 'string' } },
  ];
  for (const left of leaves)
    for (const right of leaves) {
      const schema = {
        type: ['string', 'integer'],
        allOf: [
          { anyOf: [left, right] },
          { oneOf: [{ type: 'string' }, { type: 'integer' }] },
        ],
      } as JsonSchema;
      for (const type of ['string', 'integer'] as const) {
        const original = ajv.compile({ allOf: [schema, { type }] });
        const delegated = ajv.compile(schemaForType(schema, type, schema));
        for (const value of values)
          expect(delegated(value)).toBe(original(value));
      }
    }
});

it('does not infer type compatibility from ignored Draft-07 reference siblings', () => {
  const branch = { $ref: '#/definitions/value', type: 'integer' } as JsonSchema;
  expect(narrowMixedComposition(branch, 'string')).toBe(branch);
});
