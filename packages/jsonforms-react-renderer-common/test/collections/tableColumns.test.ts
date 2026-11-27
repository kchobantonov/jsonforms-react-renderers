import { expect, it } from 'vite-plus/test';
import {
  tableColumnFields,
  tableColumnStyle,
} from '../../src/collections/tableColumns';
import { compositeCellTester } from '../../src/cells/compositeCellTester';
import {
  extendedConfig,
  resolveExtendedOption,
} from '../../src/core/configNamespaces';
it('resolves whole-row columns, declared fields, deduplication and explicit empty lists', () => {
  const properties = { name: {}, amount: {} };
  expect(tableColumnFields(properties, undefined, ['amount'])).toEqual([
    'amount',
  ]);
  expect(tableColumnFields(properties, [], ['amount'])).toEqual([]);
  expect(
    tableColumnFields(
      properties,
      [
        { field: 'name' },
        { field: 'name' },
        { field: 'missing' },
        { field: 'row', scope: '#' },
      ],
      [],
    ),
  ).toEqual(['name', 'row']);
});
it.each([
  undefined,
  { field: 'x', width: 0, minWidth: -1, maxWidth: NaN },
  { field: 'x', width: 120, minWidth: 40, maxWidth: 200 },
  { field: 'x', width: Infinity },
])('retains only usable column dimensions %j', (definition) => {
  const style = tableColumnStyle(definition);
  expect(
    Object.values(style).every((value) => Number.isFinite(value) && value > 0),
  ).toBe(true);
  if (definition?.width === 120)
    expect(style).toEqual({ width: 120, minWidth: 40, maxWidth: 200 });
  else expect(style).toEqual({});
});
it.each([
  [{ type: 'string' }, {}, -1],
  [{ type: 'object' }, {}, 1],
  [{ type: 'array' }, {}, 1],
  [{ oneOf: [{}] }, {}, 1],
  [{ anyOf: [{}] }, {}, 1],
  [{ allOf: [{}] }, {}, 1],
  [{ type: ['number', 'string'] }, {}, 1],
  [{ type: 'string' }, { summary: { type: 'Label' } }, 6],
])('ranks composite cell presentation %j', (schema, options, expected) =>
  expect(
    compositeCellTester(
      { type: 'Control', scope: '#', options } as any,
      schema as any,
      { rootSchema: schema } as any,
    ),
  ).toBe(expected),
);
it.each([
  undefined,
  null,
  1,
  'config',
  {},
  { jsonformsExtended: null },
  { jsonformsExtended: 1 },
])('ignores absent or malformed config namespaces %j', (config) => {
  expect(extendedConfig(config)).toBeUndefined();
  expect(resolveExtendedOption(undefined, config, 'x', 'fallback')).toBe(
    'fallback',
  );
});
it('keeps explicit false, zero and empty-string options above config defaults', () => {
  const config = { jsonformsExtended: { x: true }, product: { x: 'global' } };
  for (const x of [false, 0, ''])
    expect(resolveExtendedOption({ x }, config, 'x', 'fallback')).toBe(x);
  expect(resolveExtendedOption({}, config, 'x', false)).toBe(true);
  expect(resolveExtendedOption({}, config, 'x', 'fallback', 'product')).toBe(
    'global',
  );
  expect(extendedConfig(config)).toEqual({ x: true });
});
