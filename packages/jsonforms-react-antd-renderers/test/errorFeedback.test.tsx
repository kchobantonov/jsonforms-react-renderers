import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import { ErrorFeedback } from '../src/complex/ErrorFeedback';
it.each([1, 4])(
  'uses the appropriate feedback for %i structured errors',
  async (count) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const errors = Array.from({ length: count }, () => ({
      instancePath: '/value',
      schemaPath: '#',
      keyword: 'custom',
      params: {},
      message: 'Please check this value',
    }));
    try {
      act(() =>
        root.render(
          <JsonFormsContext.Provider value={{ core: { errors } } as any}>
            <ErrorFeedback errors='The usual control message' path='value'>
              <button>Errors</button>
            </ErrorFeedback>
          </JsonFormsContext.Provider>
        )
      );
      await act(async () => {
        host.querySelector('button')!.focus();
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
      if (count === 1) {
        expect(
          document.querySelector('.ant-tooltip [role="tooltip"]')?.textContent
        ).toBe('The usual control message');
        expect(document.querySelector('.ant-popover')).toBeNull();
      } else {
        expect(
          document.querySelector('.ant-popover-content')?.textContent
        ).toContain('4 errors');
        expect(
          document.querySelector('.ant-popover-content')?.textContent
        ).toContain('Show 1 more');
      }
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
