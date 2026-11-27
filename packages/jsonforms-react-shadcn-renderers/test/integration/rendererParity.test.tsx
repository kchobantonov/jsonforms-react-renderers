import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { shadcnRenderers, shadcnCells } from '../../src';
let cleanup = () => {};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const mount = (schema: any, options: any, initial: any) => {
  vi.useFakeTimers();
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let data: any;
  act(() =>
    root.render(
      <JsonForms
        schema={{ type: 'object', properties: { value: schema } }}
        uischema={{ type: 'Control', scope: '#/properties/value', options }}
        data={{ value: initial }}
        renderers={shadcnRenderers}
        cells={shadcnCells}
        onChange={(event) => {
          data = event.data;
        }}
      />,
    ),
  );
  act(() => vi.runAllTimers());
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  return { container, data: () => data.value };
};
it('selects radio presentation for oneOf constants and preserves typed values', () => {
  const { container, data } = mount(
    {
      oneOf: [
        { const: 1, title: 'One' },
        { const: 2, title: 'Two' },
      ],
    },
    { format: 'radio' },
    1,
  );
  expect(container.querySelectorAll('[role=radio]')).toHaveLength(2);
  act(() =>
    (container.querySelectorAll('[role=radio]')[1] as HTMLElement).click(),
  );
  act(() => vi.runAllTimers());
  expect(data()).toBe(2);
});
it('removes only the chosen duplicate chip', () => {
  const { container, data } = mount(
    { type: 'array', items: { type: 'string' } },
    { variant: 'chips' },
    ['a', 'b', 'a'],
  );
  act(() =>
    (
      container.querySelectorAll('[aria-label="Remove a"]')[1] as HTMLElement
    ).click(),
  );
  act(() => vi.runAllTimers());
  expect(data()).toEqual(['a', 'b']);
});
it('honors minimum item restriction on chip removal', () => {
  const { container } = mount(
    { type: 'array', items: { type: 'string' }, minItems: 1 },
    { variant: 'chips', restrict: true },
    ['a'],
  );
  expect(
    (container.querySelector('[aria-label="Remove a"]') as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});
it('selects automatic enum checkboxes', () => {
  const { container, data } = mount(
    {
      type: 'array',
      items: { type: 'string', enum: ['a', 'b'] },
      uniqueItems: true,
    },
    {},
    ['a'],
  );
  expect(container.querySelectorAll('[role=checkbox]')).toHaveLength(2);
  act(() =>
    (container.querySelectorAll('[role=checkbox]')[1] as HTMLElement).click(),
  );
  act(() => vi.runAllTimers());
  expect(data()).toEqual(['a', 'b']);
});

it('shows removable pills for multi-select without nesting buttons', () => {
  const { container, data } = mount(
    {
      type: 'array',
      items: { type: 'string', enum: ['Email', 'Post'] },
      uniqueItems: true,
    },
    { variant: 'multi-select' },
    ['Email', 'Post'],
  );
  expect(container.querySelector('button button')).toBeNull();
  const remove = container.querySelector(
    '[aria-label="Remove Email"]',
  ) as HTMLButtonElement;
  expect(remove).not.toBeNull();
  act(() => remove.click());
  act(() => vi.runAllTimers());
  expect(data()).toEqual(['Post']);
});

it('marks an imported invalid multi-select pill and clears its field error on removal', () => {
  const { container, data } = mount(
    {
      type: 'array',
      items: { type: 'string', enum: ['Email', 'SMS'] },
      uniqueItems: true,
    },
    { variant: 'multi-select' },
    ['Email', 'Fax'],
  );
  expect(
    container.querySelector('[aria-invalid="true"]')?.textContent,
  ).toContain('Fax');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    'Fax',
  );
  const invalidPill = container.querySelector('span[aria-invalid="true"]');
  expect(invalidPill?.classList.contains('border')).toBe(true);
  expect(invalidPill?.classList.contains('border-destructive')).toBe(true);
  expect(invalidPill?.classList.contains('ring-1')).toBe(false);
  act(() =>
    (
      container.querySelector('[aria-label="Remove Fax"]') as HTMLButtonElement
    ).click(),
  );
  act(() => vi.runAllTimers());
  expect(data()).toEqual(['Email']);
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

it('renders empty and dotted property values without resolving the containing object', () => {
  const view = mount(
    { type: 'object', additionalProperties: { type: 'string' } },
    { allowEmptyPropertyNames: true },
    { '': 'unnamed label', 'literal.key': 'literal value' },
  );
  const inputs = Array.from(view.container.querySelectorAll('input')).map(
    (input) => input.value,
  );
  expect(inputs).toContain('unnamed label');
  expect(inputs).toContain('literal value');
  expect(inputs).not.toContain('[object Object]');
  expect(view.container.textContent).not.toContain('Enter a property name.');
});

it('shows a dynamic-only object title once without an empty static group', () => {
  const view = mount(
    {
      type: 'object',
      title: 'Quota',
      additionalProperties: { type: 'integer' },
    },
    {},
    { weekly: 40 },
  );
  expect(
    Array.from(
      view.container.querySelectorAll('.shadcn-jsonforms-group-title'),
    ).filter((node) => node.textContent === 'Quota'),
  ).toHaveLength(1);
  const group = view.container.querySelector('.shadcn-jsonforms-group')!;
  expect(group).not.toBeNull();
  expect(group.querySelector('.shadcn-jsonforms-layout')).toBeNull();
  const additional = group.querySelector<HTMLElement>(
    '.jsonforms-additional-properties',
  )!;
  expect(additional).not.toBeNull();
  expect(additional.style.boxShadow).toBe('none');
  expect(
    view.container.querySelector<HTMLInputElement>('input[value="40"]'),
  ).not.toBeNull();
});

it('renders fields from every matching dynamic property pattern', () => {
  const view = mount(
    {
      type: 'object',
      patternProperties: {
        '^sensor-': {
          type: 'object',
          properties: { reading: { type: 'number' } },
        },
        '-room$': {
          type: 'object',
          properties: { location: { type: 'string' } },
        },
      },
      additionalProperties: false,
    },
    {},
    { 'sensor-room': { reading: 12, location: 'Office' } },
  );
  expect(view.container.querySelector('input[value="12"]')).not.toBeNull();
  expect(view.container.querySelector('input[value="Office"]')).not.toBeNull();
});

it.each(
  ['customNote', 'note.with.dot', ''].flatMap((key) =>
    ['clear button', 'delete text'].map((operation) => ({ key, operation })),
  ),
)(
  'keeps additional string property "$key" and its editor after $operation',
  ({ key, operation }) => {
    const { container, data } = mount(
      {
        type: 'object',
        additionalProperties: { type: 'string', default: 'default note' },
      },
      {},
      { [key]: 'written note' },
    );
    const input = container.querySelector<HTMLInputElement>(
      '.jsonforms-additional-property-control input',
    )!;
    if (operation === 'clear button') {
      act(() =>
        container
          .querySelector<HTMLButtonElement>(
            '.jsonforms-additional-property-control button[aria-label="Clear value"]',
          )!
          .click(),
      );
    } else {
      act(() => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )!.set!.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    act(() => vi.runAllTimers());
    act(() => vi.runAllTimers());
    expect(data()).toEqual({ [key]: '' });
    expect(Object.hasOwn(data(), key)).toBe(true);
    expect(
      container.querySelector(`[aria-label="Delete ${key}"]`),
    ).not.toBeNull();
    expect(
      container.querySelector('.jsonforms-additional-property-control input'),
    ).toBe(input);
    expect(input.value).toBe('');
    act(() =>
      container
        .querySelector<HTMLButtonElement>(`[aria-label="Delete ${key}"]`)!
        .click(),
    );
    act(() => vi.runAllTimers());
    expect(data()).toEqual({});
    expect(
      container.querySelector('.jsonforms-additional-property-control'),
    ).toBeNull();
  },
);

it('clears a nested declared field without removing its additional-property parent', () => {
  const { container, data } = mount(
    {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { note: { type: 'string' } },
      },
    },
    {},
    { custom: { note: 'nested note' } },
  );
  act(() =>
    container
      .querySelector<HTMLButtonElement>(
        '.jsonforms-additional-property-control button[aria-label="Clear value"]',
      )!
      .click(),
  );
  act(() => vi.runAllTimers());
  expect(data()).toEqual({ custom: {} });
  expect(
    container.querySelector('[aria-label="Delete custom"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('.jsonforms-additional-property-control input'),
  ).not.toBeNull();
});

it.each([
  { schema: { type: 'number' }, initial: 12, empty: 0, label: 'Clear value' },
  {
    schema: { type: 'string', format: 'date' },
    initial: '2026-11-27',
    empty: '',
    label: 'Clear date',
  },
])(
  'keeps an additional property when clearing $schema',
  ({ schema, initial, empty, label }) => {
    const { container, data } = mount(
      { type: 'object', additionalProperties: schema },
      {},
      { custom: initial },
    );
    act(() =>
      container
        .querySelector<HTMLButtonElement>(
          `.jsonforms-additional-property-control button[aria-label="${label}"]`,
        )!
        .click(),
    );
    act(() => vi.runAllTimers());
    expect(data()).toEqual({ custom: empty });
    expect(
      container.querySelector('[aria-label="Delete custom"]'),
    ).not.toBeNull();
  },
);
