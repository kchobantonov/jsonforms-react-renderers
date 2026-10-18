import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { PrimeIconButton } from '../../src/prime-controls/PrimeIconButton';

it('updates translated icon actions and never submits the enclosing form', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const click = vi.fn();
  const Action = () => {
    const t = useI18n();
    return (
      <PrimeIconButton
        icon='pi pi-plus'
        aria-label={t('additionalProperties.add')}
        onClick={click}
      />
    );
  };
  const renderers = [{ tester: () => 10, renderer: Action }];
  const render = (label: string, disabled = false) =>
    act(() =>
      root.render(
        <form onSubmit={submit}>
          {disabled ? (
            <PrimeIconButton
              icon='pi pi-plus'
              aria-label={label}
              disabled
              onClick={click}
            />
          ) : (
            <JsonForms
              schema={{ type: 'string' }}
              data=''
              uischema={{ type: 'Control', scope: '#' }}
              renderers={renderers}
              i18n={{ translate: (_key, fallback) => label || fallback }}
            />
          )}
        </form>,
      ),
    );
  try {
    render('Add property');
    const button = container.querySelector('button')!;
    expect(button.type).toBe('button');
    expect(button.textContent?.trim()).toBe('');
    expect(button.classList.contains('p-button-icon-only')).toBe(true);
    act(() => button.click());
    expect(click).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
    render('Добавяне на свойство');
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Добавяне на свойство',
    );
    render('Добавяне на свойство', true);
    act(() => container.querySelector('button')!.click());
    expect(click).toHaveBeenCalledTimes(1);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
