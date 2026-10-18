import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { PrimeReactProvider } from 'primereact/api';
import {
  PrimeButtonRenderer,
  primeButtonRendererTester,
} from '../../../jsonforms-react-primereact-extended-renderers/src/renderers/PrimeButtonRenderer';

it('maps full width and destructive color onto the native button', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    for (const fullWidth of [true, false, undefined]) {
      act(() =>
        root.render(
          <PrimeReactProvider value={{ unstyled: true }}>
            <JsonForms
              schema={{}}
              data={{}}
              uischema={
                {
                  type: 'Button',
                  label: 'Save',
                  color: 'error',
                  options: { fullWidth },
                } as any
              }
              renderers={[
                {
                  tester: primeButtonRendererTester,
                  renderer: PrimeButtonRenderer,
                },
              ]}
            />
          </PrimeReactProvider>,
        ),
      );
      expect(host.querySelector('button')?.style.width).toBe(
        fullWidth ? '100%' : '',
      );
      expect(host.querySelector('button')?.type).toBe('button');
      expect(host.querySelector('button')?.textContent).toBe('Save');
    }
  } finally {
    act(() => root.unmount());
  }
});
