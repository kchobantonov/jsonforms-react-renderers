import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnCells, shadcnRenderers } from '../src';
it.each(['string', 'number', 'integer', 'boolean'])(
  'defaults %s arrays to compact table rows',
  (type) => {
    const host = document.createElement('div');
    const root = createRoot(host);
    const value =
      type === 'string' ? 'long string' : type === 'boolean' ? false : 12;
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={{
              type: 'array',
              items: { type, ...(type === 'string' ? { maxLength: 5 } : {}) },
            }}
            data={[value]}
            uischema={{ type: 'Control', scope: '#' }}
            cells={shadcnCells}
            renderers={shadcnRenderers}
          />
        )
      );
      expect(host.querySelector('table')).not.toBeNull();
      expect(host.querySelector('thead')).toBeNull();
      expect(
        host.querySelector('tbody tr [aria-label="Select row 1"]')
      ).not.toBeNull();
      if (type === 'string') {
        expect(
          host.querySelector('td input')?.getAttribute('aria-invalid')
        ).toBe('true');
        expect(
          host.querySelector('td .shadcn-jsonforms-cell-error')
        ).not.toBeNull();
      }
    } finally {
      act(() => root.unmount());
    }
  }
);
