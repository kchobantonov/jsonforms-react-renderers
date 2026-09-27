import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

const render = (schema: any, uischema: any, data: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema}
        uischema={uischema}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={() => undefined}
      />
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

const schemaFor = (property: any) => ({
  type: 'object',
  properties: { agreed: property },
});
const control = (options?: Record<string, unknown>) => ({
  type: 'Control',
  scope: '#/properties/agreed',
  ...(options ? { options } : {}),
});

const checkbox = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
const switchEl = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('button[role="switch"]')!;

/**
 * Text of everything an element points at with aria-describedby.
 *
 * getElementById rather than a selector: a control's id contains
 * '#/properties/…', which is not valid CSS.
 */
const describedTexts = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '');

/** antd marks an indeterminate checkbox on the wrapper, not the input. */
const isIndeterminate = (container: HTMLElement) =>
  Boolean(container.querySelector('.ant-checkbox-indeterminate'));

describe('checkbox control', () => {
  it('reflects a real boolean', () => {
    const on = render(schemaFor({ type: 'boolean' }), control(), {
      agreed: true,
    });
    expect(checkbox(on.container).checked).toBe(true);
    expect(isIndeterminate(on.container)).toBe(false);
    on.unmount();

    const off = render(schemaFor({ type: 'boolean' }), control(), {
      agreed: false,
    });
    expect(checkbox(off.container).checked).toBe(false);
    // false is an answer, not an absence.
    expect(isIndeterminate(off.container)).toBe(false);
    off.unmount();
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('shows %s as indeterminate rather than unchecked', (_l, value) => {
    const { container, unmount } = render(
      schemaFor({ type: 'boolean' }),
      control(),
      { agreed: value }
    );
    expect(checkbox(container).checked).toBe(false);
    expect(isIndeterminate(container)).toBe(true);
    unmount();
  });

  it.each([
    ['the string "false"', 'false'],
    ['the string "true"', 'true'],
    ['zero', 0],
    ['one', 1],
    ['an empty string', ''],
    ['an object', {}],
  ])('does not present %s as a selection', (_l, value) => {
    // The case the specification names: `!!data` made 'false' render checked.
    const { container, unmount } = render(
      schemaFor({ type: 'boolean' }),
      control(),
      { agreed: value }
    );
    expect(checkbox(container).checked).toBe(false);
    expect(isIndeterminate(container)).toBe(true);
    unmount();
  });

  it('does not write anything merely by rendering missing data', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const seen: any[] = [];
    act(() =>
      root.render(
        <JsonForms
          data={{}}
          schema={schemaFor({ type: 'boolean' })}
          uischema={control()}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data }) => seen.push(data)}
        />
      )
    );
    expect(seen.every((d) => d.agreed === undefined)).toBe(true);
    act(() => root.unmount());
  });
});

describe('switch control', () => {
  const toggle = control({ toggle: true });

  it('reflects a real boolean', () => {
    const on = render(schemaFor({ type: 'boolean' }), toggle, { agreed: true });
    expect(switchEl(on.container).getAttribute('aria-checked')).toBe('true');
    on.unmount();
    const off = render(schemaFor({ type: 'boolean' }), toggle, {
      agreed: false,
    });
    expect(switchEl(off.container).getAttribute('aria-checked')).toBe('false');
    // A committed false needs no extra explanation.
    expect(off.container.textContent).not.toContain('Not set');
    off.unmount();
  });

  it('announces missing data as Not set, since a switch has no third state', () => {
    const { container, unmount } = render(
      schemaFor({ type: 'boolean' }),
      toggle,
      {}
    );
    const el = switchEl(container);
    expect(el.getAttribute('aria-checked')).toBe('false');
    expect(describedTexts(el)).toContain('Not set');
    unmount();
  });

  it('does not show the string "false" as on', () => {
    const { container, unmount } = render(
      schemaFor({ type: 'boolean' }),
      toggle,
      {
        agreed: 'false',
      }
    );
    const el = switchEl(container);
    expect(el.getAttribute('aria-checked')).toBe('false');
    // aria-describedby is a list: the control's help text plus our state note.
    expect(describedTexts(el)).toContain('Not a true or false value');
    unmount();
  });
});

describe('boolean cells in a table', () => {
  const arraySchema = {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            active: { type: 'boolean' },
            notify: { type: 'boolean' },
          },
        },
      },
    },
  };
  const table = {
    type: 'Control',
    scope: '#/properties/rows',
    options: { table: true, cells: { notify: { toggle: true } } },
  };

  it('applies the same rules inside a cell', () => {
    const { container, unmount } = render(arraySchema, table, {
      rows: [{ active: 'false', notify: true }],
    });
    const boxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    // The string 'false' must not read as checked in a cell either.
    expect(Array.from(boxes).every((b) => !b.checked)).toBe(true);
    expect(isIndeterminate(container)).toBe(true);
    unmount();
  });
});

describe('enum array checkboxes', () => {
  it('are driven by membership, not by truthiness of the item', () => {
    const { container, unmount } = render(
      {
        type: 'object',
        properties: {
          channels: {
            type: 'array',
            uniqueItems: true,
            items: { type: 'string', enum: ['Email', 'SMS'] },
          },
        },
      },
      { type: 'Control', scope: '#/properties/channels' },
      { channels: ['SMS'] }
    );
    const boxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    );
    expect(boxes.map((b) => b.checked)).toEqual([false, true]);
    unmount();
  });
});
