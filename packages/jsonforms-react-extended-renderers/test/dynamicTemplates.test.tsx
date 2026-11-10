import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vite-plus/test';
import {
  withJsonFormsControlProps,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import { DynamicJsonForms } from '@chobantonov/jsonforms-react-renderer-common/DynamicUiProvider';
import { loadDynamicUiExpressions } from '@chobantonov/jsonforms-react-renderer-common/dynamicRuntime';
import { TemplateLayoutRenderer } from '../src/renderers/TemplateLayoutRenderer';
import { TsxTemplateLayoutRendererComponent } from '../src/renderers/TsxTemplateLayoutRenderer';

const Field = withJsonFormsControlProps((props: any) => (
  <input aria-label={props.label} value={props.data ?? ''} readOnly />
));
const rowSchema = { type: 'object', properties: { name: { type: 'string' } } };
const elements = [
  {
    type: 'Control',
    scope: '#/properties/name',
    name: 'field',
    $dynamic: {
      label: { bind: 'external.label' },
      name: { literal: 'renamed' },
    },
  },
];
for (const engine of ['jsx', 'tsx']) {
  it(`${engine} exposes effective child properties under authored names and preserves the row path`, async () => {
    await loadDynamicUiExpressions();
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const template =
      engine === 'jsx'
        ? '<section><p data-label>{elements["field"].label}</p>{elements["field"]}</section>'
        : ({ elements: children, Slot }: any) => (
            <section>
              <p data-label>{children.field.label}</p>
              <Slot name='field' />
            </section>
          );
    const ui = { type: 'TemplateLayout', lang: engine, template, elements };
    const Reader = withJsonFormsLayoutProps((props: any) => {
      const Component =
        engine === 'jsx'
          ? TemplateLayoutRenderer
          : TsxTemplateLayoutRendererComponent;
      return (
        <Component
          {...props}
          path='rows.0'
          schema={rowSchema}
          uischema={ui}
          enabled
          visible
        />
      );
    });
    const renderers = [
      { tester: (ui: any) => (ui.type === 'Root' ? 2 : -1), renderer: Reader },
      { tester: () => 1, renderer: Field },
    ];
    const props = {
      data: { rows: [{ name: 'Ada' }] },
      schema: {
        type: 'object',
        properties: { rows: { type: 'array', items: rowSchema } },
      },
      uischema: { type: 'Root' },
      renderers,
      config: {
        jsonformsExtended: {
          dynamic: { enabled: true },
          security: { allowScriptEvaluation: true },
        },
      },
    };
    try {
      await act(async () =>
        root.render(
          <DynamicJsonForms {...props} external={{ label: 'Effective' }} />,
        ),
      );
      await expect
        .poll(() => host.querySelector('[data-label]')?.textContent)
        .toBe('Effective');
      await expect.poll(() => host.querySelector('input')?.value).toBe('Ada');
      const input = host.querySelector('input');
      await act(async () =>
        root.render(
          <DynamicJsonForms {...props} external={{ label: 'Updated' }} />,
        ),
      );
      await expect
        .poll(() => host.querySelector('[data-label]')?.textContent)
        .toBe('Updated');
      expect(host.querySelector('input')).toBe(input);
      expect(input?.getAttribute('aria-label')).toBe('Updated');
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });
}
