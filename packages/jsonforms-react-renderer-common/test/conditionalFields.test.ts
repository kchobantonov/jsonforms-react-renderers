import { createAjv } from '@jsonforms/core';
import { expect, it } from 'vitest';
import {
  conditionalLayout,
  projectConditionalFields,
} from '../src/conditionalFields';
const schema: any = {
  type: 'object',
  properties: { kind: { type: 'string' }, name: { type: 'string' } },
  if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
  then: { properties: { vat: { type: 'string' } }, required: ['vat', 'name'] },
  else: { properties: { nickname: { type: 'string' } } },
  dependencies: {
    card: {
      properties: { billing: { type: 'string' } },
      required: ['billing'],
    },
    name: ['kind'],
  },
};
it('projects conditions and presence dependencies without changing data or the schema', () => {
  const data = { kind: 'business', card: false, name: '' };
  const before = JSON.stringify(schema);
  const result = projectConditionalFields(schema, schema, data, createAjv());
  expect(Object.keys(result.schema.properties!)).toEqual([
    'kind',
    'name',
    'vat',
    'billing',
  ]);
  expect(result.schema.required).toEqual(['vat', 'name', 'billing', 'kind']);
  expect(result.known.has('nickname')).toBe(true);
  expect(JSON.stringify(schema)).toBe(before);
  expect(data).toEqual({ kind: 'business', card: false, name: '' });
});
it('uses else for absent discriminators and filters explicit branch-only bindings', () => {
  const result = projectConditionalFields(schema, schema, {}, createAjv());
  const ui: any = {
    type: 'Group',
    elements: [
      { type: 'Control', scope: '#/properties/vat' },
      { type: 'Control', scope: '#/properties/name' },
      { type: 'Control', scope: '#/properties/nickname' },
    ],
  };
  expect(
    (conditionalLayout(ui, result.schema, result.known) as any).elements.map(
      (e: any) => e.scope
    )
  ).toEqual(['#/properties/name', '#/properties/nickname']);
});
it('retains intersecting constraints and resolves condition references', () => {
  const root: any = {
    type: 'object',
    definitions: {
      business: {
        properties: { kind: { const: 'business' } },
        required: ['kind'],
      },
    },
    properties: { name: { type: 'string', minLength: 2 } },
    allOf: [
      {
        if: { $ref: '#/definitions/business' },
        then: { properties: { name: { maxLength: 5 } } },
      },
    ],
  };
  const result = projectConditionalFields(
    root,
    root,
    { kind: 'business' },
    createAjv()
  );
  expect((result.schema.properties!.name as any).allOf).toEqual([
    { type: 'string', minLength: 2 },
    { maxLength: 5 },
  ]);
});

it('does not mutate data when host AJV uses defaults or coercion', () => {
  const root: any = {
    type: 'object',
    if: { properties: { n: { type: 'number', default: 1 } } },
    then: { properties: { active: { type: 'boolean' } } },
  };
  const data = {};
  projectConditionalFields(
    root,
    root,
    data,
    createAjv({ useDefaults: true, coerceTypes: true, strict: false })
  );
  expect(data).toEqual({});
});

it('reports unresolvable conditions without selecting else', () => {
  const root: any = {
    type: 'object',
    if: { $ref: '#/definitions/missing' },
    then: { properties: { a: { type: 'string' } } },
    else: { properties: { b: { type: 'string' } } },
  };
  const result = projectConditionalFields(root, root, {}, createAjv());
  expect(result.diagnostics).toHaveLength(1);
  expect(result.schema.properties).toEqual({});
});
