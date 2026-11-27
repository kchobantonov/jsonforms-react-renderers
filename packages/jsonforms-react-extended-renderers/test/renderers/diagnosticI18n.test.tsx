import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms, JsonFormsContext } from '@jsonforms/react';
import { createExtendedRenderers } from '../../src';
import DynamicJSXRenderer from '../../src/components/DynamicJSXRenderer';
import { TemplateDiagnostic } from '../../src/renderers/templateEngines';
import type { ImageViewElement } from '../../src/renderers/ImageViewRenderer';
import type { TemplateLayoutElement } from '../../src/util/templateLang';

it('localizes image and template policy diagnostics while retaining machine codes', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={{ type: 'object' }}
          data={{}}
          uischema={
            {
              type: 'ImageView',
              src: 'javascript:alert(1)',
              alt: 'Authored alt',
            } as ImageViewElement
          }
          renderers={createExtendedRenderers()}
          i18n={{ locale: 'bg' }}
        />,
      ),
    );
    expect(host.textContent).toContain('Изображението е блокирано');
    expect(
      host.querySelector('[data-image-diagnostic="image.urlRefused"]'),
    ).not.toBeNull();
    await act(async () =>
      host.querySelector<HTMLButtonElement>('button')!.click(),
    );
    expect(host.textContent).toContain(
      'Източникът на изображението е блокиран',
    );
    const render = async (
      translate?: (key: string, fallback?: string) => string | undefined,
    ) =>
      act(async () =>
        root.render(
          <JsonFormsContext.Provider
            value={{ i18n: { locale: 'bg', translate } } as any}
          >
            <TemplateDiagnostic
              uischema={
                { type: 'TemplateLayout', lang: 'jsx' } as TemplateLayoutElement
              }
            />
          </JsonFormsContext.Provider>,
        ),
      );
    await render();
    expect(host.textContent).toContain('Изпълнението на шаблони е изключено');
    await render((key) => `«${key}»`);
    expect(host.textContent).toBe('«template.disabled»');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it.each(['compilation', 'runtime'])(
  'localizes a JSX %s failure and updates its language without changing the raw source',
  async (kind) => {
    const host = document.createElement('div');
    const root = createRoot(host);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const template =
      kind === 'compilation'
        ? 'function Template() { return <broken'
        : 'function Template() { throw new Error("raw failure"); }';
    const onExpectedError = (event: ErrorEvent) => {
      if (event.error instanceof Error && event.error.message === 'raw failure')
        event.preventDefault();
    };
    window.addEventListener('error', onExpectedError);
    const render = async (locale: string) =>
      act(async () =>
        root.render(
          <JsonFormsContext.Provider value={{ i18n: { locale } } as any}>
            <DynamicJSXRenderer
              jsxTemplate={template}
              props={{ raw: 'User input' }}
            />
          </JsonFormsContext.Provider>,
        ),
      );
    try {
      await render('bg');
      expect(host.textContent).toContain(
        kind === 'compilation'
          ? 'Грешка при компилиране на шаблона:'
          : 'Грешка при изпълнение на шаблона',
      );
      expect(host.textContent).toContain(template);
      await render('en');
      expect(host.textContent).toContain(
        kind === 'compilation'
          ? 'Template Compilation Error:'
          : 'Template Runtime Error',
      );
      expect(host.textContent).toContain(template);
    } finally {
      await act(async () => root.unmount());
      window.removeEventListener('error', onExpectedError);
      error.mockRestore();
    }
  },
);
