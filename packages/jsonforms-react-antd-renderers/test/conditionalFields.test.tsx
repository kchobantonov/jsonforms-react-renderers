import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';
import { expect, it } from 'vitest';
const schema: any = {
  type: 'object',
  properties: { kind: { type: 'string' }, name: { type: 'string' } },
  if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
  then: { properties: { vat: { type: 'string' } }, required: ['vat', 'name'] },
  else: { properties: { nickname: { type: 'string' } } },
};
it.each([false, true])(
  'renders active fields with explicit layout=%s and keeps base fields',
  async (explicit) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const ui: any = {
      type: 'Control',
      scope: '#',
      options: {
        conditionalFields: true,
        ...(explicit
          ? {
              detail: {
                type: 'VerticalLayout',
                elements: [
                  {
                    type: 'Control',
                    scope: '#/properties/vat',
                    label: 'Tax field',
                  },
                  { type: 'Control', scope: '#/properties/name' },
                  { type: 'Control', scope: '#/properties/nickname' },
                ],
              },
            }
          : {}),
      },
    };
    const render = (data: any, enabled = true) =>
      root.render(
        <JsonForms
          schema={schema}
          data={data}
          uischema={{
            ...ui,
            options: { ...ui.options, conditionalFields: enabled },
          }}
          renderers={antdRenderers}
          cells={antdCells}
        />
      );
    try {
      await act(async () =>
        render({ kind: 'business', vat: 'VAT123', nickname: 'Ada' })
      );
      expect(host.querySelector('input[value="VAT123"]')).toBeTruthy();
      expect(host.querySelector('input[value="Ada"]')).toBeNull();
      expect(host.textContent).toContain('Name');
      await act(async () =>
        render({ kind: 'personal', vat: 'VAT123', nickname: 'Ada' })
      );
      expect(host.querySelector('input[value="VAT123"]')).toBeNull();
      expect(host.querySelector('input[value="Ada"]')).toBeTruthy();
      await act(async () =>
        render({ kind: 'business', vat: 'VAT123', nickname: 'Ada' })
      );
      expect(host.querySelector('input[value="VAT123"]')).toBeTruthy();
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
it('enables from config and allows local opt-out', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = (local?: boolean) =>
    root.render(
      <JsonForms
        schema={schema}
        data={{ kind: 'business' }}
        config={{ jsonformsExtended: { conditionalFields: true } }}
        uischema={{
          type: 'Control',
          scope: '#',
          options: { conditionalFields: local },
        }}
        renderers={antdRenderers}
        cells={antdCells}
      />
    );
  try {
    await act(async () => render());
    expect(host.textContent?.includes('Vat')).toBe(true);
    await act(async () => render(false));
    expect(host.textContent?.includes('Vat')).toBe(false);
  } finally {
    act(() => root.unmount());
  }
});

it('renders the published conditional example and schema dependencies', async () => {
  const schema = (
    await import(
      '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/schema.json'
    )
  ).default;
  const data = (
    await import(
      '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/data.json'
    )
  ).default;
  const uischema = (
    await import(
      '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/uischema.json'
    )
  ).default;
  const config = (
    await import(
      '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/config.json'
    )
  ).default;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema}
          data={data}
          uischema={uischema}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    expect(host.querySelector('input[value="VAT123"]')).toBeTruthy();
    expect(host.querySelector('input[value="London"]')).toBeTruthy();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('resolves allOf conditions with validation disabled and respects readonly', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const conditional: any = {
    type: 'object',
    properties: { kind: { type: 'string' } },
    allOf: [
      {
        if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
        then: { properties: { vat: { type: 'string' } }, required: ['vat'] },
      },
    ],
  };
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={conditional}
          data={{ kind: 'business', vat: 'VAT123' }}
          validationMode='NoValidation'
          readonly
          uischema={{
            type: 'Control',
            scope: '#',
            options: { conditionalFields: true },
          }}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    const field = host.querySelector(
      'input[value="VAT123"]'
    ) as HTMLInputElement;
    expect(field).toBeTruthy();
    expect(field.disabled || field.readOnly).toBe(true);
  } finally {
    act(() => root.unmount());
  }
});
