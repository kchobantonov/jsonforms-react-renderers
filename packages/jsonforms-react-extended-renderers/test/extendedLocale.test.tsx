import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { createTranslator, rankWith, scopeEndsWith } from '@jsonforms/core';
import { useExtendedTranslator } from '../src/util/useExtendedTranslator';
import {
  defaultExtendedLocales,
  registerExtendedLocale,
  setExtendedLocales,
} from '../src/util/extendedLocale';

/*
  The strings this package draws - the grid's "Add row", the editor's maximize
  label - fell back to one English table, so they stayed English however
  `i18n.locale` moved. Asserted through the hook rather than through the grid
  or the editor, both of which are loaded lazily and bring a renderer's worth
  of unrelated failure modes with them.
*/

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

afterEach(() => {
  document.body.innerHTML = '';
  setExtendedLocales(defaultExtendedLocales);
});

const Probe = () => {
  const t = useExtendedTranslator();
  return <span data-testid='probe'>{t('array.addRow')}</span>;
};

const renderers = [
  { tester: rankWith(10, scopeEndsWith('note')), renderer: Probe },
];

const draw = async (
  locale: string | undefined,
  catalog?: Record<string, string>
) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(
      <JsonForms
        data={{ note: '' }}
        schema={{ type: 'object', properties: { note: { type: 'string' } } }}
        uischema={{ type: 'Control', scope: '#/properties/note' } as any}
        renderers={renderers}
        i18n={
          locale === undefined
            ? undefined
            : {
                locale,
                translate: createTranslator(
                  (id, defaultMessage) => catalog?.[id] ?? defaultMessage
                ),
              }
        }
        onChange={() => undefined}
      />
    );
  });
  return container.querySelector('[data-testid="probe"]')?.textContent;
};

describe('extended locale bundles', () => {
  it('is English by default', async () => {
    expect(await draw(undefined)).toBe('Add row');
  });

  it('follows the locale into a bundled language', async () => {
    expect(await draw('bg')).toBe('Добавяне на ред');
  });

  it('uses the language bundle for a regional tag', async () => {
    expect(await draw('de-CH')).toBe('Zeile hinzufügen');
  });

  it('lets the form catalog win over the bundle', async () => {
    expect(await draw('bg', { 'array.addRow': 'Нов ред' })).toBe('Нов ред');
  });

  it('falls back to English for an unregistered language', async () => {
    expect(await draw('ja')).toBe('Add row');
  });

  it('takes a language registered at runtime', async () => {
    registerExtendedLocale('ja', { 'array.addRow': '行を追加' });
    expect(await draw('ja')).toBe('行を追加');
  });
});
