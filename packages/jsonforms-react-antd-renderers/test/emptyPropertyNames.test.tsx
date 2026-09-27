import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import {
  assignOwnProperty,
  needsIsolatedEditor,
  validateAdditionalPropertyName,
} from '../src/util/additionalPropertyName';
import { literalPropertySchema } from '../src/util/literalPropertySchema';

/*
  `allowEmptyPropertyNames`, and the two things it drags in with it.

  An empty key cannot be addressed by a data path - composing an empty segment
  yields the parent's own path - so permitting one without an isolated editor
  would give it a control that edits the whole containing object. And once
  whitespace-only names are legal, trimming the name before storing it would
  erase the key entirely, so names have to be preserved exactly.
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

const schema = {
  type: 'object',
  properties: {
    labels: { type: 'object', additionalProperties: { type: 'string' } },
  },
};

const render = ({
  data = { labels: {} } as any,
  options,
  config,
}: {
  data?: any;
  options?: Record<string, unknown>;
  config?: Record<string, unknown>;
} = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={
            {
              type: 'Control',
              scope: '#/properties/labels',
              ...(options ? { options } : {}),
            } as any
          }
          config={config}
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

describe('an empty property name', () => {
  it('is refused by default', async () => {
    const { add, addDisabled, stored, unmount } = render();
    await add();
    expect(addDisabled()).toBe(true);
    expect(stored()).toEqual({});
    unmount();
  });

  it('is accepted when the option is on', async () => {
    const { add, addDisabled, stored, unmount } = render({
      options: { allowEmptyPropertyNames: true },
    });
    expect(addDisabled()).toBe(false);
    await add();
    expect(Object.keys(stored())).toEqual(['']);
    unmount();
  });

  it('can be switched on from global config', async () => {
    const { addDisabled, unmount } = render({
      config: { allowEmptyPropertyNames: true },
    });
    expect(addDisabled()).toBe(false);
    unmount();
  });

  /*
    Section 18: "an explicitly supplied UI-schema option overrides global
    config, including `false` overriding `true`" - the case a truthiness merge
    would silently get wrong.
  */
  it('lets an element option of false override a config of true', async () => {
    const { addDisabled, unmount } = render({
      config: { allowEmptyPropertyNames: true },
      options: { allowEmptyPropertyNames: false },
    });
    expect(addDisabled()).toBe(true);
    unmount();
  });

  it('shows no inline error while the name box is exactly empty', async () => {
    // Even with an empty key already present, which would be a collision.
    const { error, addDisabled, unmount } = render({
      data: { labels: { '': 'existing' } },
      options: { allowEmptyPropertyNames: true },
    });
    expect(error()).toBeUndefined();
    // Suppressing the message must not suppress the judgement.
    expect(addDisabled()).toBe(true);
    unmount();
  });

  it('shows a blank label rather than the literal quotes', async () => {
    const { container, unmount } = render({
      data: { labels: { '': 'existing' } },
      options: { allowEmptyPropertyNames: true },
    });
    await settle(30);
    const heading = container.querySelector('[data-property-name=""]');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).not.toContain('"');
    expect(heading!.textContent!.trim()).toBe('');
    unmount();
  });

  it('is editable through an isolated form, not a control on the parent path', async () => {
    const { container, stored, unmount } = render({
      data: { labels: { '': 'existing', other: 'kept' } },
      options: { allowEmptyPropertyNames: true },
    });
    await settle(30);
    const fields = Array.from(
      container.querySelectorAll<HTMLInputElement>('input')
    ).filter((input) => input.value === 'existing');
    expect(fields).toHaveLength(1);

    setNativeValue(fields[0], 'edited');
    act(() => {
      fields[0].dispatchEvent(new Event('input', { bubbles: true }));
    });
    /*
      Three flushes, not two. The isolated editor is a form of its own, so an
      edit crosses three boundaries before the outer form reports it: the
      control's debounce, the inner form's onChange, then the outer form's.
      Effects run when an act block ends, so each hop needs its own.
    */
    await settle();
    await settle();
    await settle();

    // The edit landed on the empty key, and left the object around it alone.
    expect(stored()).toEqual({ '': 'edited', other: 'kept' });
    unmount();
  });
});

describe('a name is stored exactly as typed', () => {
  it('keeps surrounding whitespace', async () => {
    const { typeName, add, stored, unmount } = render();
    await typeName('  spaced  ');
    await add();
    expect(Object.keys(stored())).toEqual(['  spaced  ']);
    unmount();
  });

  it('treats a whitespace-only name as empty unless empty names are allowed', () => {
    const base = {
      schema: { type: 'object', additionalProperties: true } as any,
      rootSchema: {} as any,
      data: {},
    };
    expect(validateAdditionalPropertyName({ ...base, name: '   ' }).error).toBe(
      'required'
    );
    const permitted = validateAdditionalPropertyName({
      ...base,
      name: '   ',
      allowEmptyName: true,
    });
    expect(permitted.error).toBeUndefined();
    // and it is still three spaces, not ''
    expect(permitted.name).toBe('   ');
  });
});

describe('which names need an isolated editor', () => {
  it('is the ones a dotted path cannot address', () => {
    expect(needsIsolatedEditor('')).toBe(true);
    expect(needsIsolatedEditor('a.b')).toBe(true);
    for (const name of ['a', 'items[0]', '2024', '   ', '__proto__']) {
      expect(needsIsolatedEditor(name)).toBe(false);
    }
  });
});

describe('writing a property whose name the prototype also has', () => {
  it('creates an own property rather than assigning through it', () => {
    const target: Record<string, unknown> = {};
    assignOwnProperty(target, '__proto__', { injected: true });
    expect(Object.prototype.hasOwnProperty.call(target, '__proto__')).toBe(
      true
    );
    expect(Object.keys(target)).toEqual(['__proto__']);
    // The prototype chain is untouched.
    expect(({} as any).injected).toBeUndefined();
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
  });
});

describe('a dotted property name', () => {
  it('is editable, and the edit lands on the key rather than a nested path', async () => {
    const { container, stored, unmount } = render({
      data: { labels: { 'sdf.sdf': 'dotted', other: 'kept' } },
    });
    await settle(30);
    const fields = Array.from(
      container.querySelectorAll<HTMLInputElement>('input')
    ).filter((input) => input.value === 'dotted');
    expect(fields).toHaveLength(1);

    setNativeValue(fields[0], 'edited');
    act(() => {
      fields[0].dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    await settle();
    await settle();

    // A composed path would have produced `{ sdf: { sdf: 'edited' } }`.
    expect(stored()).toEqual({ 'sdf.sdf': 'edited', other: 'kept' });
    unmount();
  });

  it('keeps its own heading, so it can still be renamed or deleted', async () => {
    const { container, unmount } = render({
      data: { labels: { 'sdf.sdf': 'dotted' } },
    });
    await settle(30);
    expect(
      container.querySelector('[data-property-name="sdf.sdf"]')
    ).toBeTruthy();
    unmount();
  });
});

describe('rebundling a schema for an isolated form', () => {
  const rootSchema = {
    definitions: { code: { type: 'string', minLength: 2 } },
    type: 'object',
    properties: { bag: { type: 'object' } },
  } as any;

  it('rewrites a local $ref to point into the carried root', () => {
    const bundled = literalPropertySchema(
      { $ref: '#/definitions/code' } as any,
      rootSchema
    ) as any;
    expect(bundled.$ref).toBe(
      '#/definitions/__jsonforms_root/definitions/code'
    );
    // and the whole original document travels with it
    expect(bundled.definitions.__jsonforms_root.definitions.code).toEqual({
      type: 'string',
      minLength: 2,
    });
  });

  it('rewrites a bare # and refs nested inside keywords', () => {
    const bundled = literalPropertySchema(
      {
        type: 'object',
        properties: { self: { $ref: '#' } },
        items: [{ $ref: '#/definitions/code' }],
        allOf: [{ $ref: '#/definitions/code' }],
      } as any,
      rootSchema
    ) as any;
    expect(bundled.properties.self.$ref).toBe('#/definitions/__jsonforms_root');
    expect(bundled.items[0].$ref).toBe(
      '#/definitions/__jsonforms_root/definitions/code'
    );
    expect(bundled.allOf[0].$ref).toBe(
      '#/definitions/__jsonforms_root/definitions/code'
    );
  });

  it('leaves data alone, where a $ref key means nothing', () => {
    const bundled = literalPropertySchema(
      {
        type: 'object',
        // A default value that happens to contain the word - not a reference.
        default: { $ref: '#/not/a/reference' },
        enum: [{ $ref: '#' }],
      } as any,
      rootSchema
    ) as any;
    expect(bundled.default).toEqual({ $ref: '#/not/a/reference' });
    expect(bundled.enum[0]).toEqual({ $ref: '#' });
  });

  it('does not carry the original document identifier in', () => {
    const bundled = literalPropertySchema({ type: 'string' } as any, {
      ...rootSchema,
      $id: 'https://example.test/schema.json',
    }) as any;
    expect(bundled.definitions.__jsonforms_root.$id).toBeUndefined();
  });

  it('leaves an external reference alone', () => {
    const bundled = literalPropertySchema(
      { $ref: 'https://example.test/other.json#/definitions/x' } as any,
      rootSchema
    ) as any;
    expect(bundled.$ref).toBe('https://example.test/other.json#/definitions/x');
  });
});
