import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/data.json';
import ui from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/uischema.json';

it('renders mixed table cells from the spec example', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    const category = ui.elements[0].elements.find(
      (c) => c.i18n === 'mixedCells.navigation'
    ) as any;
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema as any}
          data={data}
          uischema={category.elements[0]}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    expect(host.querySelector('table')).not.toBeNull();
    expect(host.textContent).not.toContain('No applicable renderer');
    expect(host.querySelectorAll('tbody tr').length).toBeGreaterThanOrEqual(8);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
