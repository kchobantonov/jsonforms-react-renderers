import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import { CompositeDetailDialog } from '../../src/cells/CompositeDetailDialog';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps Apply unavailable while the nested code editor has an invalid draft', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const paint = (invalid: boolean) =>
    act(() =>
      root.render(
        <JsonFormsContext.Provider
          value={
            {
              core: {
                data: { details: { title: 'Current' } },
                additionalErrors: invalid
                  ? [
                      {
                        instancePath: '/details/title',
                        keyword: 'parse',
                        params: { source: 'monaco' },
                        schemaPath: '#',
                      },
                    ]
                  : [],
              },
            } as any
          }
        >
          <CompositeDetailDialog
            open
            title='Details'
            label='Details'
            path='details'
            schema={{ type: 'object' }}
            enabled
            options={{}}
            t={(_key, fallback) => fallback}
            onClose={() => undefined}
            onApply={() => undefined}
          >
            <span>Editor</span>
          </CompositeDetailDialog>
        </JsonFormsContext.Provider>,
      ),
    );
  try {
    paint(false);
    const apply = () =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
        (button) => button.textContent === 'Apply',
      )!;
    expect(apply().disabled).toBe(false);
    paint(true);
    expect(apply().disabled).toBe(true);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
