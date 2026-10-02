import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

it('marks a collapsed mixed header and respects indicator overrides and validation visibility', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const render = (enabled: boolean, local?: boolean, hidden = false) => {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: {
              value: {
                type: ['object', 'string'],
                properties: { name: { type: 'string' } },
                required: ['name'],
              },
            },
          }}
          data={{ value: {} }}
          uischema={{
            type: 'Control',
            scope: '#/properties/value',
            label: 'Payload',
            options: {
              collapsed: true,
              ...(local === undefined
                ? {}
                : { showValidationIndicator: local }),
            },
          }}
          config={{ jsonformsExtended: { showValidationIndicator: enabled } }}
          validationMode={hidden ? 'ValidateAndHide' : 'ValidateAndShow'}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    return host.querySelector(
      '.jsonforms-mixed-renderer [data-container-validation-indicator]'
    );
  };
  try {
    expect(render(true)).toBeTruthy();
    expect(render(false)).toBeNull();
    expect(render(true, false)).toBeNull();
    expect(render(false, true)).toBeTruthy();
    expect(render(true, undefined, true)).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
