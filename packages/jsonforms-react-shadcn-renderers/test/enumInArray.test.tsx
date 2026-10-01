import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnCells, shadcnRenderers } from '../src';
const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      plainEnum: { type: 'string', enum: ['foo', 'bar'] },
      oneOfEnum: {
        type: 'string',
        oneOf: [
          { const: 'foo', title: 'Foo' },
          { const: 'bar', title: 'Bar' },
          { const: 'foobar', title: 'FooBar' },
        ],
      },
    },
  },
};
it.each([{}, { table: false }])(
  'renders enum arrays with the requested presentation %j',
  (options) => {
    const host = document.createElement('div');
    const root = createRoot(host);
    const onChange = vi.fn();
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={schema}
            data={[{ plainEnum: 'bar', oneOfEnum: 'foobar' }]}
            uischema={{ type: 'Control', scope: '#', options }}
            renderers={shadcnRenderers}
            cells={shadcnCells}
            onChange={onChange}
          />
        )
      );
      expect(Boolean(host.querySelector('table'))).toBe(
        options.table !== false
      );
      const selects = Array.from(
        (host.querySelector('table') ?? host).querySelectorAll(
          '[role="combobox"]'
        )
      );
      expect(selects.map((s) => s.textContent)).toEqual(['bar', 'FooBar']);
      expect(host.textContent).not.toContain('No applicable cell');
    } finally {
      act(() => root.unmount());
    }
  }
);

it('humanizes property names while preserving explicit column titles', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name_noDefault: { type: 'string' },
                firstName: { type: 'string' },
                custom_title: { type: 'string', title: 'Exact schema title' },
              },
            },
          }}
          data={[]}
          uischema={{ type: 'Control', scope: '#' }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    expect(
      Array.from(host.querySelectorAll('th')).map((th) => th.textContent)
    ).toEqual([
      'Name No Default',
      'First Name',
      'Exact schema title',
      'Actions',
    ]);
  } finally {
    act(() => root.unmount());
  }
});
