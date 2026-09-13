import { JsonForms } from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { antdRenderers, listWithDetailTester } from '../../src';
import { runRendererContract } from './rendererContract';

runRendererContract('ListWithDetailRenderer', listWithDetailTester);

describe('ListWithDetailRenderer primitive arrays', () => {
  const uischema = {
    type: 'ListWithDetail',
    scope: '#/properties/values',
  };

  it('claims primitive arrays', () => {
    expect(
      listWithDetailTester(
        uischema,
        {
          type: 'object',
          properties: {
            values: { type: 'array', items: { type: 'number' } },
          },
        },
        undefined
      )
    ).toBe(4);
  });

  it('renders primitive array items without a missing renderer', () => {
    const html = renderToStaticMarkup(
      <JsonForms
        data={{ values: [1, 2, 3] }}
        schema={{
          type: 'object',
          properties: {
            values: { type: 'array', items: { type: 'number' } },
          },
        }}
        uischema={uischema}
        renderers={antdRenderers}
      />
    );

    expect(html).toContain('Values');
    expect(html).not.toContain('No applicable renderer found');
  });
});

describe('ListWithDetailRenderer object schemas', () => {
  it.each([
    { type: 'object', properties: { name: { type: 'string' } } },
    { properties: { name: { type: 'string' } } },
    {
      allOf: [
        { $ref: '#/definitions/entity' },
        { properties: { notes: { type: 'string' } } },
      ],
    },
  ])(
    'keeps object and composed items in the master/detail layout',
    (itemSchema) => {
      const html = renderToStaticMarkup(
        <JsonForms
          data={{ values: [{ name: 'Ada' }, { name: 'Grace' }] }}
          schema={{
            type: 'object',
            definitions: {
              entity: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
              item: itemSchema,
            },
            properties: {
              values: { type: 'array', items: { $ref: '#/definitions/item' } },
            },
          }}
          uischema={{
            type: 'ListWithDetail',
            scope: '#/properties/values',
            options: { elementLabelProp: 'name' },
          }}
          renderers={antdRenderers}
        />
      );
      expect(html).toContain('ant-list-item');
      expect(html).toContain('Ada');
      expect(html).toContain('Grace');
      expect(html).not.toContain('ant-collapse');
      expect(html).not.toContain('No applicable renderer found');
    }
  );
});

it('opens the selected composed item in the detail pane', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  try {
    await act(async () =>
      root.render(
        <JsonForms
          data={{ values: [{ name: 'Ada' }, { name: 'Grace' }] }}
          schema={{
            type: 'object',
            definitions: {
              entity: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
              person: {
                allOf: [
                  { $ref: '#/definitions/entity' },
                  { properties: { notes: { type: 'string' } } },
                ],
              },
            },
            properties: {
              values: {
                type: 'array',
                items: { $ref: '#/definitions/person' },
              },
            },
          }}
          uischema={{
            type: 'ListWithDetail',
            scope: '#/properties/values',
            options: { elementLabelProp: 'name' },
          }}
          renderers={antdRenderers}
        />
      )
    );
    const items = container.querySelectorAll<HTMLElement>('.ant-list-item');
    expect(items).toHaveLength(2);
    await act(async () => items[0].click());
    expect(
      Array.from(container.querySelectorAll('input')).map(
        (input) => input.value
      )
    ).toContain('Ada');
    await act(async () => items[1].click());
    const values = Array.from(container.querySelectorAll('input')).map(
      (input) => input.value
    );
    expect(values).toContain('Grace');
    expect(values).not.toContain('Ada');
    expect(container.textContent).not.toContain('No applicable renderer found');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
