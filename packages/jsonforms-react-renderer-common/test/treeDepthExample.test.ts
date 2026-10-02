import { createDefaultValue } from '@jsonforms/core';
import { clearedBranchValue } from '../src/combinators';
import { createAjv } from '@jsonforms/core';
import { expect, it } from 'vitest';
import schema from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/data.json';
import recursive from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/schema.json';

it('permits five levels and rejects a sixth without mutating file nodes', () => {
  const ajv = createAjv({ useDefaults: true });
  const validate = ajv.compile(schema);
  const value = JSON.parse(JSON.stringify(data));
  expect(validate(value)).toBe(true);
  let leaf = value.tree;
  for (let i = 1; i < 5; i++) leaf = leaf.children[0];
  leaf.children.push({ kind: 'file', name: 'Too deep' });
  expect(validate(value)).toBe(false);
  expect(validate.errors?.some((error) => error.keyword === 'maxItems')).toBe(
    true
  );
  const file = { populated: { kind: 'file', name: 'New file' } };
  expect(ajv.compile(recursive)(file)).toBe(true);
  expect(file.populated).toEqual({ kind: 'file', name: 'New file' });
});

it('starts nodes empty and keeps object-only array slots on clear', () => {
  expect(
    createDefaultValue(recursive.definitions.node as any, recursive as any)
  ).toEqual({});
  expect(
    clearedBranchValue(true, [{ type: 'object' }, { type: 'object' }])
  ).toEqual({});
  expect(clearedBranchValue(false, [{ type: 'object' }])).toBeUndefined();
  expect(
    clearedBranchValue(true, [{ type: 'object' }, { type: 'null' }])
  ).toBeUndefined();
});
