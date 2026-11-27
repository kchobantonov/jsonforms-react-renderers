import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import { ShadcnColorControl } from '../../src/renderers/ColorControlRenderer';

it('localizes color-picker accessible names and follows catalog changes without translating its value', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const props: any = {
    visible: true,
    enabled: true,
    label: 'Brand',
    path: 'brand',
    data: '#2255aa',
    errors: '',
    schema: { type: 'string', format: 'color' },
    uischema: { type: 'Control', scope: '#/properties/brand' },
    handleChange: vi.fn(),
  };
  const render = async (
    translate?: (key: string, fallback?: string) => string | undefined,
  ) =>
    act(async () =>
      root.render(
        <JsonFormsContext.Provider
          value={{ i18n: { locale: 'bg', translate } } as any}
        >
          <ShadcnColorControl {...props} />
        </JsonFormsContext.Provider>,
      ),
    );
  try {
    await render();
    const trigger = host.querySelector<HTMLButtonElement>(
      '[aria-label="Избор на Brand"]',
    );
    expect(trigger).not.toBeNull();
    await act(async () => trigger!.click());
    expect(
      document.querySelector('[aria-label="Наситеност и яркост на Brand"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[aria-label="Нюанс на Brand"]'),
    ).not.toBeNull();
    await render((key) => `«${key}»`);
    expect(
      host.querySelector('[aria-label="«color.pickerLabel»"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[aria-label="«color.hueLabel»"]'),
    ).not.toBeNull();
    expect(props.handleChange).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLInputElement>('input')!.value).toBe(
      '#2255aa',
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
