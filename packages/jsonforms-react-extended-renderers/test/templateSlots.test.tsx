import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import {
  JsonForms,
  JsonFormsDispatch,
  withJsonFormsLayoutProps,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import { expect, it, vi } from 'vitest';
import {
  TemplateRenderer,
  namedTemplateTester,
} from '../src/renderers/TemplateRenderer';
import {
  SlotRenderer,
  slotRendererTester,
} from '../src/renderers/SlotRenderer';
import schema from '@chobantonov/jsonforms-extended-spec/examples/template-slots/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/template-slots/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/template-slots/data.json';
// @ts-ignore Trusted executable example registry.
import { uischemas } from '@chobantonov/jsonforms-extended-spec/examples/template-slots/uischemas.mjs';

const Layout = withJsonFormsLayoutProps((props: any) => (
  <section>
    {props.uischema.elements.map((ui: any, index: number) => (
      <JsonFormsDispatch key={index} {...props} uischema={ui} />
    ))}
  </section>
));
const Control = withJsonFormsControlProps((props: any) => (
  <output data-path={props.path} data-enabled={String(props.enabled)}>
    {props.label}: {props.data}
  </output>
));
const renderers = [
  { tester: namedTemplateTester, renderer: TemplateRenderer },
  { tester: slotRendererTester, renderer: SlotRenderer },
  {
    tester: (ui: any) =>
      ['VerticalLayout', 'Group'].includes(ui.type) ? 1 : -1,
    renderer: Layout,
  },
  { tester: (ui: any) => (ui.type === 'Control' ? 1 : -1), renderer: Control },
  {
    tester: (ui: any) => (ui.type === 'Label' ? 1 : -1),
    renderer: ({ uischema: ui }: any) => <span>{ui.text}</span>,
  },
];

it('renders the published named-template example with fallback and inherited overrides', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const tester = vi.fn(() => {
    throw new Error('Named lookup must not call testers');
  });
  const registry = uischemas.map((entry: any) => ({ ...entry, tester }));
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema}
          uischema={uischema}
          data={data}
          uischemas={registry}
          renderers={renderers}
          readonly
        />
      )
    );
    expect(tester).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Custom heading');
    expect(host.textContent).toContain('Default heading');
    expect(host.textContent).toContain(
      'Local heading overrides inherited heading'
    );
    expect(host.textContent).toContain('Inherited email: ada@example.org');
    expect(host.querySelectorAll('output[data-path="name"]')).toHaveLength(2);
    expect(host.querySelector('output[data-enabled="true"]')).toBeNull();
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema}
          uischema={uischema}
          data={{ ...data, name: 'Grace' }}
          uischemas={registry}
          renderers={renderers}
        />
      )
    );
    expect(
      [...host.querySelectorAll('output[data-path="name"]')].map(
        (el) => el.textContent
      )
    ).toEqual(['Contact name: Grace', 'Default name: Grace']);
  } finally {
    act(() => root.unmount());
  }
});

it('uses exact model names and the first match; missing templates and empty slots render nothing', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema}
          data={data}
          renderers={renderers}
          uischema={
            {
              type: 'VerticalLayout',
              elements: [
                { type: 'Template', name: 'card' },
                { type: 'Template', name: 'CARD' },
                { type: 'Slot', name: 'empty' },
              ],
            } as any
          }
          uischemas={[
            {
              tester: () => 100,
              name: 'card',
              uischema: { type: 'Label', text: 'Wrong entry name' },
            } as any,
            {
              tester: () => -1,
              uischema: { type: 'Label', name: 'card', text: 'First model' },
            } as any,
            {
              tester: () => 100,
              uischema: {
                type: 'Label',
                name: 'card',
                text: 'Duplicate model',
              },
            } as any,
          ]}
        />
      )
    );
    expect(host.textContent).toBe('First model');
  } finally {
    act(() => root.unmount());
  }
});
