import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { createAjv } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import {
  createAdditionalPropertyNameSchema,
  needsIsolatedEditor,
  validateAdditionalPropertyName,
} from '../src/util/additionalPropertyName';

/*
  Dynamic property names with characters that are special to a path grammar.

  Until `@jsonforms/core` 3.9 the reducer set and unset data with lodash, whose
  paths read `a[0]` as an index and `2` as an array position - so a property
  genuinely called `items[0]` was written to the wrong place, or created an
  array where an object belonged. 3.9 replaced that with a walker that treats
  every segment as a plain property name, which leaves exactly one reserved
  character: `.`, the separator itself.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 400) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const setNativeValue = (field: HTMLInputElement, value: string) =>
  Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!.call(field, value);

const mapSchema = {
  type: 'object',
  properties: {
    labels: { type: 'object', additionalProperties: { type: 'string' } },
  },
};

const render = (data: any = { labels: {} }) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={mapSchema as any}
          uischema={{ type: 'Control', scope: '#/properties/labels' } as any}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );

  const nameField = () =>
    container.querySelector<HTMLInputElement>(
      'input[placeholder="Property name"]'
    )!;
  const addButton = () =>
    Array.from(container.querySelectorAll('button')).find((button) =>
      button.getAttribute('aria-label')?.startsWith('Add property')
    ) as HTMLButtonElement | undefined;

  const typeName = async (name: string) => {
    const field = nameField();
    setNativeValue(field, name);
    act(() => {
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle(30);
  };

  const add = async () => {
    act(() => addButton()?.click());
    // The control commits, then JsonForms reports; effects flush per act block.
    await settle();
    await settle();
  };

  return {
    container,
    typeName,
    add,
    addDisabled: () => Boolean(addButton()?.disabled),
    error: () =>
      container.querySelector('.jsonforms-additional-properties-error')
        ?.textContent,
    stored: () => latest.labels,
    unmount: () => act(() => root.unmount()),
  };
};

describe('naming a dynamic property', () => {
  it('accepts a name with brackets and writes it as one key', async () => {
    const { typeName, add, stored, unmount } = render();
    await typeName('items[0]');
    await add();
    // One property literally called `items[0]` - not an array, not `items.0`.
    expect(Object.keys(stored())).toEqual(['items[0]']);
    unmount();
  });

  it('accepts a purely numeric name without making an array', async () => {
    const { typeName, add, stored, unmount } = render();
    await typeName('2024');
    await add();
    expect(Array.isArray(stored())).toBe(false);
    expect(Object.keys(stored())).toEqual(['2024']);
    unmount();
  });

  it.each([
    ['a$b', 'a dollar sign'],
    ['a-b', 'a hyphen'],
    ['a b', 'a space'],
    ['a/b', 'a slash'],
    ['a~b', 'a tilde'],
    ["a'b", 'a quote'],
  ])('accepts %s (%s)', async (name) => {
    const { typeName, add, stored, unmount } = render();
    await typeName(name);
    await add();
    expect(Object.keys(stored())).toEqual([name]);
    unmount();
  });

  /*
    A dot used to be refused. It is not any more: the property is created and
    edited in a form of its own, because a name a data path cannot address is
    still perfectly legal data. See Adjustment 14.
  */
  it('accepts a dotted name and stores it as one key', async () => {
    const { typeName, add, error, stored, unmount } = render();
    await typeName('sdf.sdf');
    expect(error()).toBeUndefined();
    await add();
    // One key called `sdf.sdf`, not a nested `{ sdf: { sdf: ... } }`.
    expect(Object.keys(stored())).toEqual(['sdf.sdf']);
    expect((stored() as any).sdf).toBeUndefined();
    unmount();
  });

  it('refuses a name that is already there', async () => {
    const { typeName, error, addDisabled, unmount } = render({
      labels: { existing: 'a' },
    });
    await typeName('existing');
    expect(error()).toContain('already defined');
    expect(addDisabled()).toBe(true);
    unmount();
  });
});

describe('the property-name schema', () => {
  const ajv = createAjv();
  const check = (schema: any, name: string, rootSchema: any = schema) =>
    validateAdditionalPropertyName({
      name,
      schema,
      rootSchema,
      data: {},
      validate: (nameSchema, value) => ajv.validate(nameSchema, value),
    }).error;

  it('applies the whole of propertyNames, not only its pattern', () => {
    const schema = {
      type: 'object',
      additionalProperties: true,
      propertyNames: { minLength: 4, pattern: '^[a-z]+$' },
    };
    // Matches the pattern but is too short - the old pattern-only check
    // accepted this.
    expect(check(schema, 'abc')).toBe('invalid');
    expect(check(schema, 'abcd')).toBeUndefined();
  });

  it('honours an enum of permitted names', () => {
    const schema = {
      type: 'object',
      additionalProperties: true,
      propertyNames: { enum: ['alpha', 'beta'] },
    };
    expect(check(schema, 'alpha')).toBeUndefined();
    expect(check(schema, 'gamma')).toBe('invalid');
  });

  it('permits nothing when propertyNames is false', () => {
    const schema = {
      type: 'object',
      additionalProperties: true,
      propertyNames: false,
    };
    expect(check(schema, 'anything')).toBe('invalid');
  });

  it('requires a patternProperties match when additionalProperties is false', () => {
    const schema = {
      type: 'object',
      additionalProperties: false,
      patternProperties: { '^x-': { type: 'string' }, '^y-': {} },
    };
    expect(check(schema, 'x-one')).toBeUndefined();
    expect(check(schema, 'y-one')).toBeUndefined();
    expect(check(schema, 'z-one')).toBe('invalid');
  });

  it('permits nothing when additionalProperties is false and no patterns exist', () => {
    const schema = { type: 'object', additionalProperties: false };
    expect(check(schema, 'anything')).toBe('invalid');
  });

  it('resolves a $ref on propertyNames', () => {
    const rootSchema = {
      definitions: { key: { pattern: '^[A-Z]+$' } },
      type: 'object',
      additionalProperties: true,
      propertyNames: { $ref: '#/definitions/key' },
    };
    expect(check(rootSchema, 'ABC', rootSchema)).toBeUndefined();
    expect(check(rootSchema, 'abc', rootSchema)).toBe('invalid');
  });

  it('builds a plain string schema when nothing constrains the name', () => {
    expect(
      createAdditionalPropertyNameSchema(
        { type: 'object', additionalProperties: true } as any,
        {} as any
      )
    ).toEqual({ type: 'string' });
  });
});

describe('names a data path cannot address', () => {
  it('are the empty one and the dotted ones', () => {
    expect(needsIsolatedEditor('')).toBe(true);
    expect(needsIsolatedEditor('a.b')).toBe(true);
    for (const name of [
      'items[0]',
      '2024',
      'a$b',
      'a-b',
      'a b',
      'a/b',
      'a~b',
      '   ',
      '__proto__',
    ]) {
      expect(needsIsolatedEditor(name)).toBe(false);
    }
  });

  it('are accepted, not refused - the editor is what differs', () => {
    expect(
      validateAdditionalPropertyName({
        name: 'a.b',
        schema: { type: 'object', additionalProperties: true } as any,
        rootSchema: {} as any,
        data: {},
      }).error
    ).toBeUndefined();
  });

  it('lets a property keep its own name while renaming', () => {
    expect(
      validateAdditionalPropertyName({
        name: 'items[0]',
        currentName: 'items[0]',
        schema: { type: 'object', additionalProperties: true } as any,
        rootSchema: {} as any,
        data: { 'items[0]': 'a' },
      }).error
    ).toBeUndefined();
  });

  it('refuses a name a declared property already holds', () => {
    expect(
      validateAdditionalPropertyName({
        name: 'declared',
        schema: {
          type: 'object',
          properties: { declared: { type: 'string' } },
          additionalProperties: true,
        } as any,
        rootSchema: {} as any,
        data: {},
      }).error
    ).toBe('already-defined');
  });
});
