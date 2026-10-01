import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { afterEach, expect, it, vi } from 'vitest';
import { shadcnRenderers, shadcnCells } from '../src';
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
      />
    )
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
    1
  );
  expect(container.querySelectorAll('[role=radio]')).toHaveLength(2);
  act(() =>
    (container.querySelectorAll('[role=radio]')[1] as HTMLElement).click()
  );
  act(() => vi.runAllTimers());
  expect(data()).toBe(2);
});
it('removes only the chosen duplicate chip', () => {
  const { container, data } = mount(
    { type: 'array', items: { type: 'string' } },
    { variant: 'chips' },
    ['a', 'b', 'a']
  );
  act(() =>
    (
      container.querySelectorAll('[aria-label="Remove a"]')[1] as HTMLElement
    ).click()
  );
  act(() => vi.runAllTimers());
  expect(data()).toEqual(['a', 'b']);
});
it('honors minimum item restriction on chip removal', () => {
  const { container } = mount(
    { type: 'array', items: { type: 'string' }, minItems: 1 },
    { variant: 'chips', restrict: true },
    ['a']
  );
  expect(
    (container.querySelector('[aria-label="Remove a"]') as HTMLButtonElement)
      .disabled
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
    ['a']
  );
  expect(container.querySelectorAll('[role=checkbox]')).toHaveLength(2);
  act(() =>
    (container.querySelectorAll('[role=checkbox]')[1] as HTMLElement).click()
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
    ['Email', 'Post']
  );
  expect(container.querySelector('button button')).toBeNull();
  const remove = container.querySelector(
    '[aria-label="Remove Email"]'
  ) as HTMLButtonElement;
  expect(remove).not.toBeNull();
  act(() => remove.click());
  act(() => vi.runAllTimers());
  expect(data()).toEqual(['Post']);
});

it('renders empty and dotted property values without resolving the containing object', () => {
  const view = mount(
    { type: 'object', additionalProperties: { type: 'string' } },
    { allowEmptyPropertyNames: true },
    { '': 'unnamed label', 'literal.key': 'literal value' }
  );
  const inputs = Array.from(view.container.querySelectorAll('input')).map(
    (input) => input.value
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
    { weekly: 40 }
  );
  expect(
    Array.from(
      view.container.querySelectorAll('.shadcn-jsonforms-group-title')
    ).filter((node) => node.textContent === 'Quota')
  ).toHaveLength(1);
  const group = view.container.querySelector('.shadcn-jsonforms-group')!;
  expect(group).not.toBeNull();
  expect(group.querySelector('.shadcn-jsonforms-layout')).toBeNull();
  const additional = group.querySelector<HTMLElement>(
    '.jsonforms-additional-properties'
  )!;
  expect(additional).not.toBeNull();
  expect(additional.style.boxShadow).toBe('none');
  expect(
    view.container.querySelector<HTMLInputElement>('input[value="40"]')
  ).not.toBeNull();
});

it('renders fields from every matching dynamic property pattern', () => {
  const view = mount({ type: 'object', patternProperties: {
    '^sensor-': { type: 'object', properties: { reading: { type: 'number' } } },
    '-room$': { type: 'object', properties: { location: { type: 'string' } } },
  }, additionalProperties: false }, {}, { 'sensor-room': { reading: 12, location: 'Office' } });
  expect(view.container.querySelector('input[value="12"]')).not.toBeNull();
  expect(view.container.querySelector('input[value="Office"]')).not.toBeNull();
});
