import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { JsonForms } from '@jsonforms/react';
import { shadcnCells, shadcnRenderers } from '../../src';
import { validateAdditionalPropertyName } from '@chobantonov/jsonforms-react-renderer-common/objects/additionalPropertyName';

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
    'value',
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
      <React.Fragment>
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
          renderers={shadcnRenderers}
          cells={shadcnCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </React.Fragment>,
    ),
  );

  const nameField = () =>
    container.querySelector<HTMLInputElement>(
      'input[aria-label^="Add property"]',
    )!;
  const addButton = () =>
    Array.from(container.querySelectorAll('button')).find((button) =>
      button.getAttribute('aria-label')?.startsWith('Add property'),
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
    const heading = container.querySelector('[data-property-name-label=""]');
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
      container.querySelectorAll<HTMLInputElement>('input'),
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
      'required',
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

describe('a dotted property name', () => {
  it('is editable, and the edit lands on the key rather than a nested path', async () => {
    const { container, stored, unmount } = render({
      data: { labels: { 'sdf.sdf': 'dotted', other: 'kept' } },
    });
    await settle(30);
    const fields = Array.from(
      container.querySelectorAll<HTMLInputElement>('input'),
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
      container.querySelector('[data-property-name-label="sdf.sdf"]'),
    ).toBeTruthy();
    unmount();
  });
});
