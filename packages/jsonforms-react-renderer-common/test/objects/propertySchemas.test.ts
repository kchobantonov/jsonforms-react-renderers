import { describe, expect, it } from 'vite-plus/test';
import {
  getMatchingAdditionalPropertySchema,
  toAdditionalPropertyItem,
  hasAdditionalProperties,
  toObjectSchema,
} from '../../src/objects/additionalProperties';
import {
  resolveItemSchema,
  hasStringItems,
  asArrayValue,
  arrayChoicesOf,
  isChipsControl,
  isMultiSelectControl,
  arrayChoiceItemErrors,
} from '../../src/collections/arrayChoices';

describe('dynamic property schema combinations', () => {
  it.each([true, false])('normalizes boolean object schemas %s', (schema) => {
    expect(toObjectSchema(schema as any)).toEqual({});
    expect(hasAdditionalProperties(schema as any)).toBe(false);
  });
  it.each([
    [{ additionalProperties: true }, false],
    [{}, true],
    [{ additionalProperties: false }, false],
    [{ patternProperties: { '^x': { type: 'number' } } }, false],
    [
      { patternProperties: { '^a': { type: 'number' }, z$: { minimum: 0 } } },
      false,
    ],
  ])(
    'resolves patterns and fallback without inventing constraints %#',
    (schema: any, allow) => {
      const result: any = getMatchingAdditionalPropertySchema(
        'az',
        schema,
        {},
        allow,
      );
      if (
        schema.patternProperties &&
        Object.keys(schema.patternProperties).length === 2
      )
        expect(result.allOf).toEqual([{ type: 'number' }, { minimum: 0 }]);
      else expect(result.type).toContain('string');
    },
  );
  it('resolves referenced property schemas', () => {
    const root = { definitions: { value: { type: 'integer', minimum: 2 } } };
    expect(
      getMatchingAdditionalPropertySchema(
        'x',
        { additionalProperties: { $ref: '#/definitions/value' } },
        root,
        false,
      ),
    ).toEqual({ type: 'integer', minimum: 2 });
  });
  it.each([
    { type: 'object' },
    { type: 'object', additionalProperties: false },
    { type: 'object', additionalProperties: { type: 'integer' } },
    { type: 'array' },
    { type: 'array', items: { type: 'integer' }, title: 'Values' },
  ])('builds editable property metadata %#', (candidate) => {
    const result: any = toAdditionalPropertyItem(
      'literal',
      'parent',
      { additionalProperties: candidate as any },
      {},
      false,
    );
    expect(result.schema.title).toBe('literal');
    expect(result.path).toBe('parent.literal');
    if (candidate.type === 'array') {
      expect(result.uischema.type).toBe('Group');
      expect(result.schema.items).toBeDefined();
    } else
      expect(result.schema.additionalProperties).toEqual(
        candidate.additionalProperties ?? true,
      );
  });
});

describe('array-choice schema boundaries', () => {
  it.each([undefined, {}, { items: true }, { items: false }, { items: [] }])(
    'rejects unsupported item schema %j',
    (schema) => expect(resolveItemSchema(schema as any, {})).toBeUndefined(),
  );
  it('resolves referenced items and preserves unresolved references', () => {
    const root: any = { definitions: { item: { type: 'string' } } };
    expect(
      resolveItemSchema({ items: { $ref: '#/definitions/item' } }, root),
    ).toEqual({ type: 'string' });
    expect(
      resolveItemSchema({ items: { $ref: '#/definitions/missing' } }, root),
    ).toEqual({ $ref: '#/definitions/missing' });
  });
  it.each([
    undefined,
    {},
    { type: ['string', 'number'] },
    { type: ['number'] },
    { type: [] },
  ])('rejects nonhomogeneous string item %j', (schema) =>
    expect(hasStringItems(schema as any)).toBe(false),
  );
  it('accepts exactly one string type and keeps typed finite-choice boundaries', () => {
    expect(hasStringItems({ type: ['string'] })).toBe(true);
    expect(arrayChoicesOf({ oneOf: [] })).toBeUndefined();
    expect(arrayChoicesOf({ oneOf: [{ const: 3 }] })).toBeUndefined();
    expect(asArrayValue(undefined)).toEqual([]);
    const array = ['x'];
    expect(asArrayValue(array)).toBe(array);
  });
  it.each(['chips', 'multi-select'])(
    'handles absent, malformed and unresolved scopes for %s',
    (variant) => {
      const tester =
        variant === 'chips' ? isChipsControl : isMultiSelectControl;
      const schema: any = {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', enum: ['x'] },
      };
      expect(
        tester({ type: 'Control', options: { variant } }, schema, {
          rootSchema: schema,
          config: {},
        }),
      ).toBe(true);
      expect(
        tester(
          { type: 'Control', scope: '#/missing', options: { variant } } as any,
          schema,
          { rootSchema: schema, config: {} },
        ),
      ).toBe(true);
      expect(
        tester(
          { type: 'Control', scope: 'invalid', options: { variant } } as any,
          schema,
          { rootSchema: schema, config: {} },
        ),
      ).toBe(true);
    },
  );
  it('attributes only direct in-range numeric item errors at the root', () => {
    const errors = ['/0', '/00', '/2', '/1/name', '/other'].map(
      (instancePath) => ({
        instancePath,
        keyword: 'enum',
        params: {},
        schemaPath: '#',
      }),
    );
    expect(arrayChoiceItemErrors(errors, '', 2)).toEqual([[errors[0]], []]);
  });
});
