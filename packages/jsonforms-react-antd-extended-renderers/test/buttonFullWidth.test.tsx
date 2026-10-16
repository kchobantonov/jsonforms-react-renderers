import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { antdExtendedRenderers } from '../src';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
it('updates native full-width presentation without changing the element allocation', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    for (const fullWidth of [true, false, undefined]) {
      const options = { fullWidth, layout: { span: 6 } };
      act(() =>
        root.render(
          <JsonForms
            schema={{}}
            data={{}}
            uischema={{ type: 'Button', label: 'Save', options } as any}
            renderers={antdExtendedRenderers}
          />
        )
      );
      expect(
        host.querySelector('button')!.classList.contains('ant-btn-block')
      ).toBe(fullWidth === true);
      expect(options.layout.span).toBe(6);
    }
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
