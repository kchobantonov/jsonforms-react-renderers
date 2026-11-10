// @vitest-environment jsdom
import React, { act, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect, vi } from 'vite-plus/test';
import { DemoFormPanel } from '../src/app/DemoFormPanel';
import { createAdditionalErrorStore } from '@chobantonov/jsonforms-react-extended-renderers';

vi.mock('@chobantonov/jsonforms-react-extended-renderers', async (original) => {
  const module = await original<Record<string, unknown>>();
  return {
    ...module,
    ExtendedJsonForms: (props: any) => {
      const [initial] = useState(props);
      useEffect(() => {
        initial.onChange?.({ data: initial.data, errors: [] });
      }, [initial]);
      return (
        <button
          data-config={!props.external || undefined}
          onClick={() =>
            props.onChange({
              data: { ...props.data, readonly: true },
              errors: [],
            })
          }
        >
          {JSON.stringify(props.external ?? props.data)}
        </button>
      );
    },
  };
});

it('shares configuration state, preserves namespaces and does not overwrite a retained invalid draft on mount', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const previewChange = vi.fn();
  const store = createAdditionalErrorStore();
  function Harness() {
    const [external, setExternal] = useState({
      settings: { readonly: false },
      host: { keep: true },
    });
    const [draft, setDraft] = useState('{');
    return (
      <>
        <output>{draft}</output>
        <DemoFormPanel
          {...({
            jsonFormsProps: {
              schema: { type: 'object' },
              uischema: { type: 'VerticalLayout', elements: [] },
              data: { name: 'Ada' },
            },
            configuration: {
              schema: { type: 'object' },
              uischema: { type: 'VerticalLayout', elements: [] },
              data: { readonly: false },
            },
            external,
            setExternal: (value: any) => {
              setExternal(value);
              setDraft(JSON.stringify(value));
            },
            formKey: 1,
            errorStore: store,
            setData: previewChange,
            setErrors: vi.fn(),
            onAction: vi.fn(),
            onFormContext: vi.fn(),
            useWebComponent: false,
            dark: false,
            mode: 'light',
            rtl: false,
            locale: 'en',
            validationMode: 'ValidateAndShow',
            rendererSettings: {},
          } as any)}
        />
      </>
    );
  }
  try {
    act(() => root.render(<Harness />));
    expect(host.querySelector('output')!.textContent).toBe('{');
    previewChange.mockClear();
    act(() => host.querySelector<HTMLButtonElement>('[data-config]')!.click());
    expect(JSON.parse(host.querySelector('output')!.textContent!)).toEqual({
      settings: { readonly: true },
      host: { keep: true },
    });
    expect(previewChange).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
