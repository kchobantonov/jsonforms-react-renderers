import { TsxTemplateLayoutRendererComponent } from '../src/renderers/TsxTemplateLayoutRenderer';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import { expect, it, vi } from 'vite-plus/test';
import { DynamicUiProvider } from '@chobantonov/jsonforms-react-renderer-common/DynamicUiProvider';
import { TemplateLayoutRenderer } from '../src/renderers/TemplateLayoutRenderer';
import { RactiveTemplateLayoutRenderer } from '../src/renderers/RactiveTemplateLayoutRenderer';

for (const lang of ['jsx', 'ractive', 'tsx']) {
  it(`updates ${lang} template context from external without data changes`, async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const Renderer =
      lang === 'jsx'
        ? TemplateLayoutRenderer
        : lang === 'tsx'
          ? TsxTemplateLayoutRendererComponent
          : RactiveTemplateLayoutRenderer;
    const ctx = { core: { data: { value: 'business' }, errors: [] } };
    const props: any = {
      schema: { type: 'object' },
      path: '',
      enabled: true,
      visible: true,
      config: {
        jsonformsExtended: { security: { allowScriptEvaluation: true } },
      },
      renderers: [],
      cells: [],
      uischema: {
        type: 'TemplateLayout',
        lang,
        elements: [],
        template:
          lang === 'jsx'
            ? '<p data-external>{context.external?.branding.title ?? "absent"}</p>'
            : '<p data-external>{{context.external ? context.external.branding.title : "absent"}}</p>',
      },
    };
    if (lang === 'tsx')
      props.uischema.template = ({ context }: any) => (
        <p data-external>{context.external?.branding.title ?? 'absent'}</p>
      );
    try {
      for (const title of ['First', 'Second', undefined]) {
        await act(async () =>
          root.render(
            <DynamicUiProvider
              external={title ? { branding: { title } } : undefined}
            >
              <JsonFormsContext.Provider value={ctx as any}>
                <Renderer {...props} />
              </JsonFormsContext.Provider>
            </DynamicUiProvider>,
          ),
        );
        await vi.waitFor(() =>
          expect(host.querySelector('[data-external]')?.textContent).toBe(
            title ?? 'absent',
          ),
        );
      }
      expect(ctx.core.data).toEqual({ value: 'business' });
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });
}
