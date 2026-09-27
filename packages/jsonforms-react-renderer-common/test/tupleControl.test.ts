import { describe, expect, it } from 'vitest';
import {
  tupleControlTester,
  tupleDefinition,
  tupleEmptyValue,
  tupleInitialValue,
  tupleRenderSchema,
} from '../src/tuple';
const pairSchema = {
  type: 'array',
  items: [
    { type: 'string', title: 'Product code' },
    { type: 'integer', title: 'Quantity', minimum: 1 },
  ],
  additionalItems: false,
};

describe('recognizing a tuple schema', () => {
  const context = (root: any) => ({ rootSchema: root, config: {} });
  const control = (options?: Record<string, unknown>) =>
    ({ type: 'Control', scope: '#/properties/pair', options } as any);

  it('takes a draft-07 positional array with no variant asked for', () => {
    const root = { type: 'object', properties: { pair: pairSchema } };
    expect(tupleControlTester(control(), root as any, context(root))).toBe(25);
  });

  it('takes a 2020-12 prefixItems array, and reads items as the tail', () => {
    const schema = {
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }],
      items: { type: 'string' },
    };
    const definition = tupleDefinition(schema as any)!;
    expect(definition.prefix).toHaveLength(2);
    // Read the other way round, one position would become every position.
    expect(definition.tail).toEqual({ type: 'string' });
  });

  it('defaults an absent tail to open in both dialects', () => {
    expect(
      tupleDefinition({ type: 'array', items: [{ type: 'string' }] } as any)!
        .tail
    ).toBe(true);
    expect(
      tupleDefinition({
        type: 'array',
        prefixItems: [{ type: 'string' }],
      } as any)!.tail
    ).toBe(true);
  });

  it('closes the tail when the schema forbids one', () => {
    expect(tupleDefinition(pairSchema as any)!.tail).toBe(false);
  });

  /*
    Section 18: equal bounds alone "do not change the presentation of existing
    uniform-array controls".
  */
  it('leaves a uniform fixed-length array alone unless asked', () => {
    const uniform = {
      type: 'array',
      items: { type: 'number' },
      minItems: 3,
      maxItems: 3,
    };
    expect(tupleDefinition(uniform as any)).toBeUndefined();
    const root = { type: 'object', properties: { pair: uniform } };
    expect(tupleControlTester(control(), root as any, context(root))).toBe(-1);
  });

  it('expands a uniform fixed-length array when the variant asks', () => {
    const definition = tupleDefinition(
      {
        type: 'array',
        items: { type: 'number' },
        minItems: 3,
        maxItems: 3,
      } as any,
      true
    )!;
    expect(definition.prefix).toHaveLength(3);
    expect(definition.prefix[0]).toEqual({ type: 'number' });
    // A uniform tuple is exactly as long as it declares.
    expect(definition.tail).toBe(false);
  });

  it('refuses to guess a count from unequal or missing bounds', () => {
    for (const bounds of [
      { minItems: 2, maxItems: 3 },
      { minItems: 2 },
      { maxItems: 2 },
      {},
      { minItems: -1, maxItems: -1 },
      { minItems: 1.5, maxItems: 1.5 },
    ]) {
      expect(
        tupleDefinition(
          { type: 'array', items: { type: 'number' }, ...bounds } as any,
          true
        )
      ).toBeUndefined();
    }
  });

  it('is not a tuple if it is not an array', () => {
    expect(tupleDefinition({ type: 'object' } as any, true)).toBeUndefined();
  });

  /*
    The renderer must still win for an unsupported configuration, because
    section 18 requires a diagnostic and something has to render it.
  */
  it('still claims a control that asked for the variant it cannot have', () => {
    const uniform = { type: 'array', items: { type: 'number' } };
    const root = { type: 'object', properties: { pair: uniform } };
    expect(
      tupleControlTester(
        control({ variant: 'tuple' }),
        root as any,
        context(root)
      )
    ).toBe(25);
  });

  it('ignores anything that is not a control', () => {
    const root = { type: 'object', properties: { pair: pairSchema } };
    expect(
      tupleControlTester(
        { type: 'VerticalLayout' } as any,
        root as any,
        context(root)
      )
    ).toBe(-1);
  });
});

// ------------------------------------------------------- initial and empty

describe('what a position starts and ends life as', () => {
  const root = { type: 'object' } as any;

  it('uses the supported type initial value', () => {
    expect(tupleInitialValue({ type: 'string' }, root)).toBe('');
    expect(tupleInitialValue({ type: 'number' }, root)).toBe(0);
    expect(tupleInitialValue({ type: 'integer' }, root)).toBe(0);
    expect(tupleInitialValue({ type: 'boolean' }, root)).toBe(false);
    expect(tupleInitialValue({ type: 'null' }, root)).toBeNull();
    expect(tupleInitialValue({ type: 'array' }, root)).toEqual([]);
  });

  it('prefers an explicit default, deep-copied', () => {
    const schema = { type: 'object', default: { a: [1] } } as any;
    const first = tupleInitialValue(schema, root) as any;
    const second = tupleInitialValue(schema, root) as any;
    expect(first).toEqual({ a: [1] });
    // Two positions sharing a schema must not share its default object.
    expect(first.a).not.toBe(second.a);
  });

  it('gives no answer where the schema has none', () => {
    expect(tupleInitialValue(true, root)).toBeUndefined();
    expect(tupleInitialValue({}, root)).toBeUndefined();
    expect(
      tupleInitialValue({ type: ['string', 'number'] } as any, root)
    ).toBeUndefined();
  });

  /*
    "Absence and emptiness are distinct." Clearing is not the same question as
    initializing: a number initializes to 0 but has no empty value at all.
  */
  it('distinguishes an empty value from an initial one', () => {
    expect(tupleEmptyValue({ type: 'string' }, root)).toBe('');
    expect(tupleEmptyValue({ type: 'object' }, root)).toEqual({});
    expect(tupleEmptyValue({ type: 'array' }, root)).toEqual([]);
    expect(tupleEmptyValue({ type: 'number' }, root)).toBeUndefined();
    expect(tupleEmptyValue({ type: 'integer' }, root)).toBeUndefined();
    expect(tupleEmptyValue({ type: 'boolean' }, root)).toBeUndefined();
    expect(
      tupleEmptyValue({ type: ['string', 'null'] } as any, root)
    ).toBeNull();
  });

  it('names every type for an unconstrained position, so the mixed control takes it', () => {
    expect(tupleRenderSchema(true).type).toContain('object');
    expect(tupleRenderSchema({}).type).toContain('null');
    expect(tupleRenderSchema({ type: 'string' })).toEqual({ type: 'string' });
  });
});
