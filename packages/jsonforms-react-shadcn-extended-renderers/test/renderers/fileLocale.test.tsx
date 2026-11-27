import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  shadcnCells,
  shadcnRenderers,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { shadcnExtendedRenderers } from '../../src';

it('translates the file control using the bundled locale without a host catalog', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: {
              doc: { type: 'string', contentEncoding: 'base64' } as any,
            },
          }}
          uischema={{ type: 'Control', scope: '#/properties/doc' }}
          data={{}}
          i18n={{ locale: 'bg' }}
          renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
          cells={shadcnCells}
        />,
      ),
    );
    const labels = Array.from(container.querySelectorAll('button'))
      .map(
        (button) =>
          `${button.textContent} ${button.getAttribute('aria-label')}`,
      )
      .join(' ');
    expect(labels).toContain('Изберете файл');
    expect(labels).not.toContain('Select File');
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
