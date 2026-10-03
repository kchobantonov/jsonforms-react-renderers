import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: { name: { type: 'string' }, note: { type: 'string' } },
  },
};
const inline = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Inline name',
};
const registered = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Registered name',
};

it.each([
  ['GENERATE', true, 'generated'],
  ['generate', true, 'generated'],
  ['REGISTERED', true, 'registered'],
  ['registered', false, 'generated'],
  ['GENERATED', true, 'registered'],
  ['custom', true, 'registered'],
  [inline, true, 'inline'],
  ['DEFAULT', true, 'table'],
  ['default', true, 'table'],
  [undefined, true, 'table'],
] as const)(
  'resolves detail %s (registry=%s) as %s',
  async (detail, registry, expected) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema}
            data={[{ name: 'Ada', note: 'Keep' }]}
            uischema={{
              type: 'Control',
              scope: '#',
              options: { detail, collapsed: false },
            }}
            uischemas={
              registry ? [{ tester: () => 10, uischema: registered }] : []
            }
            renderers={antdRenderers}
            cells={antdCells}
          />
        )
      );
      expect(host.textContent).not.toContain('No applicable');
      if (expected === 'table') {
        expect(host.querySelector('table')).not.toBeNull();
      } else {
        expect(host.querySelector('table')).toBeNull();
        const values = Array.from(host.querySelectorAll('input')).map(
          (input) => input.value
        );
        expect(values).toContain('Ada');
        expect(values.includes('Keep')).toBe(expected === 'generated');
        expect(host.textContent?.includes('Registered name')).toBe(
          expected === 'registered'
        );
        expect(host.textContent?.includes('Inline name')).toBe(
          expected === 'inline'
        );
      }
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it('renders the published detail-mode example with its trusted registry', async () => {
  const exampleSchema = await import(
    '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/schema.json'
  );
  const exampleUi = await import(
    '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/uischema.json'
  );
  const exampleData = await import(
    '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/data.json'
  );
  const registry = await import(
    '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/uischemas.mjs'
  );
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={exampleSchema.default as any}
          uischema={exampleUi.default}
          data={exampleData.default}
          uischemas={registry.uischemas}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    expect(host.textContent).not.toContain('No applicable');
    expect(host.querySelectorAll('table').length).toBe(1);
    expect(host.textContent?.match(/Registered name/g)?.length).toBe(2);
    expect(host.textContent).toContain('Inline name');
    const values = Array.from(host.querySelectorAll('input')).map(
      (input) => input.value
    );
    // DEFAULT, GENERATE, registry fallback, and inline all expose the note.
    expect(
      values.filter((value) => value === 'Visible in generated layouts')
    ).toHaveLength(4);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
