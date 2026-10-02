import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/schema.json';

it.each(['allOf', 'anyOf', 'oneOf'])(
  'uses detail panels for %s by default',
  async (property) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema as any}
            data={{ [property]: [] }}
            uischema={{ type: 'Control', scope: `#/properties/${property}` }}
            renderers={shadcnRenderers}
            cells={shadcnCells}
          />
        )
      );
      expect(host.querySelector('table')).toBeNull();
      expect(host.textContent).not.toContain('No applicable');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it('supports a composed value in an explicitly requested table', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={{
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  anyOf: [
                    { type: 'string', enum: ['string', 'number'] },
                    { type: 'array', items: { type: 'string' } },
                  ],
                },
              },
            },
          }}
          data={[{}]}
          uischema={{ type: 'Control', scope: '#', options: { table: true } }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    expect(host.querySelector('table')).not.toBeNull();
    expect(host.textContent).not.toContain('No applicable');
    expect(host.querySelector('button[aria-label^="Edit"]')).not.toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
