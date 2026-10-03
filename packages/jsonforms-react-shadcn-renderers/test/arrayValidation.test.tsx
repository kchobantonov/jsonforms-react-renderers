import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnCells, shadcnRenderers } from '../src';
it('renders const choices and both cell and table errors, respecting validation mode', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const schema = {
    type: 'object',
    properties: {
      comments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            message: { type: 'string', maxLength: 5 },
            enum: { type: 'string', const: 'foo' },
          },
        },
      },
    },
  };
  try {
    for (const validationMode of [
      'ValidateAndShow',
      'ValidateAndHide',
    ] as const) {
      act(() =>
        root.render(
          <JsonForms
            schema={schema}
            data={{ comments: [{ message: 'Too long message', enum: 'foo' }] }}
            uischema={{ type: 'Control', scope: '#/properties/comments' }}
            renderers={shadcnRenderers}
            cells={shadcnCells}
            validationMode={validationMode}
          />
        )
      );
      expect(host.querySelector('[role="combobox"]')?.textContent).toBe('foo');
      if (validationMode === 'ValidateAndShow') {
        expect(
          host
            .querySelector('td .shadcn-jsonforms-cell-error')
            ?.getAttribute('aria-label')
        ).toContain('5');
        expect(
          host
            .querySelector('.shadcn-jsonforms-array-errors')
            ?.getAttribute('aria-label')
        ).toBe('Some items contain errors.');
      } else
        expect(
          host.querySelector(
            '.shadcn-jsonforms-cell-error, .shadcn-jsonforms-array-errors'
          )
        ).toBeNull();
    }
  } finally {
    act(() => root.unmount());
  }
});
