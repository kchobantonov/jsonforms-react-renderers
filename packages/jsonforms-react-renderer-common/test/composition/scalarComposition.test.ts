import { expect, it } from 'vite-plus/test';
import {
  scalarCompositionSchema,
  scalarCompositionType,
} from '../../src/composition/scalarComposition';
it.each(['oneOf', 'anyOf', 'allOf'])(
  'recognizes scalar constraints in %s without replacing validation',
  (keyword) => {
    for (const type of ['string', 'number', 'integer', 'boolean']) {
      const schema = {
        type,
        [keyword]: [{ title: 'annotation' }, { type, minimum: 2 }],
      };
      expect(scalarCompositionType(schema)).toBe(type);
      expect(scalarCompositionSchema(schema)).toMatchObject({ type });
      expect(schema[keyword]).toHaveLength(2);
    }
  },
);
it.each([
  undefined,
  true,
  {},
  { anyOf: [] },
  { anyOf: [{}] },
  { type: 'object', anyOf: [{}] },
  { type: ['string', 'number'], anyOf: [{}] },
  { type: 'string', anyOf: [{ type: 'number' }] },
  { type: 'string', anyOf: [{ properties: {} }] },
  { type: 'string', anyOf: [false] },
  { type: 'string', anyOf: [{ $ref: '#/missing' }] },
  { type: 'string', anyOf: [{}], allOf: [{}] },
  { type: 'string', anyOf: [{}], enum: ['a'] },
  { type: 'number', anyOf: [{}], const: 0 },
])(
  'leaves ambiguous and finite-choice schemas to their renderers %j',
  (schema) => expect(scalarCompositionType(schema as any)).toBeUndefined(),
);
it('resolves referenced scalar constraints and preserves outer annotations', () => {
  const root = {
    definitions: { bounded: { type: 'integer', minimum: 0, title: 'Branch' } },
  };
  const schema = {
    allOf: [{ $ref: '#/definitions/bounded' }, { default: 0 }],
    title: 'Outer',
  };
  expect(scalarCompositionType(schema, root)).toBe('integer');
  expect(scalarCompositionSchema(schema, root)).toEqual({
    type: 'integer',
    minimum: 0,
    default: 0,
    title: 'Outer',
  });
  expect(
    scalarCompositionType({ allOf: [{ $ref: '#/missing' }] }, root),
  ).toBeUndefined();
  expect(
    scalarCompositionSchema({ allOf: [{ $ref: '#/missing' }] }, root),
  ).toEqual({});
});
it('keeps alternative bounds on the validator and intersection bounds on one editor', () => {
  expect(
    scalarCompositionSchema({
      type: 'integer',
      anyOf: [{ maximum: 10 }, { minimum: 20 }],
    }),
  ).toEqual({ type: 'integer' });
  expect(
    scalarCompositionSchema({
      type: 'integer',
      minimum: 5,
      allOf: [{ minimum: 0, maximum: 10 }],
    }),
  ).toEqual({ type: 'integer', minimum: 5, maximum: 10 });
});
