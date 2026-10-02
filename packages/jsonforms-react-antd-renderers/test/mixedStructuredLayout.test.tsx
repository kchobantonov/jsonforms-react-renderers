import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';
it('defaults to tree and lets local layout override the config', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = (global?: string, local?: string) =>
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: {
              payload: {
                type: ['object', 'string'],
                properties: { name: { type: 'string' } },
              },
            },
          }}
          data={{ payload: { name: 'Ada' } }}
          uischema={{
            type: 'Control',
            scope: '#/properties/payload',
            options: {
              collapsed: false,
              ...(local ? { structuredLayout: local } : {}),
            },
          }}
          config={{
            jsonformsExtended: { mixed: { structuredLayout: global } },
          }}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
  try {
    render('nested');
    expect(host.querySelector('input[value="Ada"]')).toBeTruthy();
    render();
    expect(
      host.querySelector(
        '[role="tree"], .jsonforms-mixed-tree, [data-panel-group]'
      )
    ).toBeTruthy();
    render('tree', 'nested');
    expect(host.querySelector('input[value="Ada"]')).toBeTruthy();
    expect(
      host.querySelector('[role="tree"], .jsonforms-mixed-tree')
    ).toBeNull();
  } finally {
    act(() => root.unmount());
  }
});
