import { describe, expect, it } from 'vite-plus/test';
import {
  isMixedSchema,
  isMixedControl,
  isDefaultGeneratedUiSchema,
  schemaForType,
  resolveMixedArrayItems,
  getSchemaTypes,
  getJsonDataType,
  ANY_TYPES,
} from '../../src/mixed/mixedSchema';
const ui: any = { type: 'Control', scope: '#' };
describe('mixed schema selection boundaries', () => {
  it.each([null, undefined, 3, 'string', false])(
    'rejects absent or malformed schema %j',
    (schema) => expect(isMixedSchema(ui, schema as any, {} as any)).toBe(false),
  );
  it.each([
    [{}, true],
    [{ type: 'string' }, false],
    [{ type: ['string'] }, false],
    [{ type: ['string', 'number'] }, true],
    [{ allOf: [] }, false],
    [{ anyOf: [] }, false],
    [{ oneOf: [] }, false],
    [{ properties: {} }, false],
    [{ patternProperties: {} }, false],
    [{ additionalProperties: false }, false],
  ])(
    'distinguishes unconstrained and structured schema %#',
    (schema, expected) =>
      expect(
        isMixedSchema(ui, schema as any, { rootSchema: schema, config: {} }),
      ).toBe(expected),
  );
  it('resolves scoped boolean schemas, but never treats a layout as an unconstrained editor', () => {
    const root: any = { type: 'object', properties: { yes: true, no: false } };
    expect(
      isMixedSchema({ ...ui, scope: '#/properties/yes' }, root, {
        rootSchema: root,
        config: {},
      }),
    ).toBe(true);
    expect(
      isMixedSchema({ ...ui, scope: '#/properties/no' }, root, {
        rootSchema: root,
        config: {},
      }),
    ).toBe(false);
    expect(
      isMixedControl({ type: 'Label' }, {}, { rootSchema: {}, config: {} }),
    ).toBe(false);
    expect(
      isMixedSchema({ type: 'Control' } as any, {}, undefined as any),
    ).toBe(false);
  });
  it.each([
    [{ type: 'Group', elements: [{ type: 'Control', scope: '#' }] }, true],
    [
      { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#' }] },
      true,
    ],
    [{ type: 'Group', elements: [] }, false],
    [{ type: 'Group', elements: [{ type: 'Label', scope: '#' }] }, false],
    [
      {
        type: 'Group',
        elements: [{ type: 'Control', scope: '#/properties/x' }],
      },
      false,
    ],
    [{ type: 'HorizontalLayout', elements: [ui] }, false],
  ])(
    'recognizes only a generated root-control layout %#',
    (element, expected) =>
      expect(isDefaultGeneratedUiSchema(element as any)).toBe(expected),
  );
  it.each([true, false])(
    'supports boolean schema type discovery %s',
    (schema) => expect(getSchemaTypes(schema as any)).toBe(ANY_TYPES),
  );
  it('retains only compatible defaults and array item schemas', () => {
    expect(
      schemaForType(
        { type: ['integer', 'string'], default: 'wrong' },
        'integer',
        {},
      ),
    ).not.toHaveProperty('default');
    expect(schemaForType({ default: 2 }, 'number', {}).default).toBe(2);
    expect(schemaForType(false as any, 'string', {})).toMatchObject({
      type: 'string',
      not: {},
    });
    expect(schemaForType({ items: false } as any, 'array', {}).items).toBe(
      false,
    );
    expect(schemaForType({}, 'array', {}).items).toEqual({ type: ANY_TYPES });
    expect(
      schemaForType({ additionalProperties: false }, 'object', {})
        .additionalProperties,
    ).toBe(false);
    expect(resolveMixedArrayItems([{}], {})).toEqual([{}]);
    expect(resolveMixedArrayItems({ $ref: '#/missing' }, {})).toEqual({
      $ref: '#/missing',
    });
    expect(getJsonDataType(undefined)).toBeNull();
  });
});
