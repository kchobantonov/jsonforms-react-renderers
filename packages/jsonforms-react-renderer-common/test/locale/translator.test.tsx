import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import { useTranslator } from '../../src/locale/translate';

it('uses locale defaults for owned keys while preserving authored messages and interpolation', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const Probe = () => {
    const t = useTranslator();
    return (
      <div>
        <span>{t('oneOf.chooseKind', 'Choose a kind.')}</span>
        <span>
          {t('image.scopeNotString', 'English', { scope: '#/properties/raw' })}
        </span>
        <span>{t('host.label', 'Authored {name}', { name: 'raw value' })}</span>
        <span data-absent>{t('missing', undefined)}</span>
      </div>
    );
  };
  const render = async (
    locale: string,
    translate?: (key: string, fallback?: string) => string | undefined,
  ) =>
    act(async () =>
      root.render(
        <JsonFormsContext.Provider
          value={{ i18n: { locale, translate } } as any}
        >
          <Probe />
        </JsonFormsContext.Provider>,
      ),
    );
  try {
    await render('bg-BG');
    expect(host.textContent).toContain('Изберете вид.');
    expect(host.textContent).toContain(
      'Схемата при #/properties/raw не допуска низове.',
    );
    expect(host.textContent).toContain('Authored {name}');
    expect(host.querySelector('[data-absent]')!.textContent).toBe('');
    await render('bg', (key) =>
      key === 'oneOf.chooseKind' ? 'Host choice' : undefined,
    );
    expect(host.textContent).toContain('Host choice');
    expect(host.textContent).toContain('Схемата при');
    await render('en');
    expect(host.textContent).toContain('Choose a kind.');
  } finally {
    await act(async () => root.unmount());
  }
});
