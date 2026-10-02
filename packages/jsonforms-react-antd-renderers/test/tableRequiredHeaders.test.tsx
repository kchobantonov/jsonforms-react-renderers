import './renderers/MatchMediaMock';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { antdRenderers } from '../src';

it('marks required table columns and honors live hide settings and cell overrides', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const render = async (hide: boolean, local?: boolean) => {
    await act(async () =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: {
              rows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    city: { type: 'string' },
                    code: { type: 'string' },
                  },
                  required: ['city'],
                },
              },
            },
          }}
          uischema={{
            type: 'Control',
            scope: '#/properties/rows',
            options: {
              cells: {
                city:
                  local === undefined ? {} : { hideRequiredAsterisk: local },
              },
            },
          }}
          data={{ rows: [{ city: 'Paris', code: 'PAR' }] }}
          config={{ hideRequiredAsterisk: hide }}
          renderers={antdRenderers}
        />
      )
    );
  };
  const headers = () =>
    Array.from(host.querySelectorAll('th')).map((n) => n.textContent);
  try {
    await render(false);
    expect(headers().some((t) => t?.includes('City') && t.includes('*'))).toBe(
      true
    );
    expect(headers().some((t) => t?.includes('Code') && t.includes('*'))).toBe(
      false
    );
    await render(true);
    expect(headers().some((t) => t?.includes('*'))).toBe(false);
    await render(true, false);
    expect(headers().some((t) => t?.includes('City') && t.includes('*'))).toBe(
      true
    );
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
