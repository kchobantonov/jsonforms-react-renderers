import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
it.each([false, true])('renders arrays without items (table=%s)', (table) => {
  expect(() =>
    act(() =>
      root.render(
        <JsonForms
          schema={{ type: 'array' }}
          data={[]}
          uischema={{ type: 'Control', scope: '#', options: { table } } as any}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    )
  ).not.toThrow();
  expect(container.querySelector('[aria-label="Add"]')).toBeTruthy();
});
it('preserves existing untyped array data on mount', async () => {
  const onChange = vi.fn();
  const data = ['Ada', 42, { city: 'London' }];
  act(() =>
    root.render(
      <JsonForms
        schema={{ type: 'array' }}
        data={data}
        uischema={{ type: 'Control', scope: '#' } as any}
        renderers={shadcnRenderers}
        cells={shadcnCells}
        onChange={onChange}
      />
    )
  );
  await vi.waitFor(() =>
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ data }))
  );
});
it('uses the resolved nested array schema for restrictions', () => {
  const schema = {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 1,
            },
          },
        },
      },
    },
  };
  const ui = {
    type: 'Control',
    scope: '#/properties/rows',
    options: {
      detail: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/tags',
            options: { restrict: true },
          },
        ],
      },
    },
  };
  act(() =>
    root.render(
      <JsonForms
        schema={schema as any}
        data={{ rows: [{ tags: ['one'] }] }}
        uischema={ui as any}
        renderers={shadcnRenderers}
        cells={shadcnCells}
      />
    )
  );
  const adds = Array.from(
    container.querySelectorAll<HTMLButtonElement>('[aria-label="Add"]')
  );
  const removes = Array.from(
    container.querySelectorAll<HTMLButtonElement>('[aria-label="Remove"]')
  );
  expect(adds).toHaveLength(2);
  expect(adds[1].disabled).toBe(true);
  // The outer item's header action precedes the nested array actions.
  expect(removes[1].disabled).toBe(true);
});
