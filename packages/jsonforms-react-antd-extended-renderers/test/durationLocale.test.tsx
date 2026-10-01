import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import {
  antdRenderers,
  antdCells,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

/*
  The temporal-controls example's own catalog, near enough: error keys and
  nothing else. That is the case that matters - a form's catalog is authored
  for the form's own labels, so the picker's unit names have to come from the
  locale bundle or they stay English.
*/
const catalog: Record<string, Record<string, string>> = {
  bg: { 'error.required': 'Задължително' },
  en: { 'error.required': 'Required' },
};

const open = async (locale: string) => {
  document.body.innerHTML = '';
  const c = document.createElement('div');
  document.body.appendChild(c);
  await act(async () => {
    createRoot(c).render(
      <JsonForms
        data={{ span: 'PT1H30M' }}
        schema={
          {
            type: 'object',
            properties: { span: { type: 'string', format: 'duration' } },
          } as any
        }
        uischema={{ type: 'Control', scope: '#/properties/span' } as any}
        renderers={[...antdRenderers, ...antdExtendedRenderers]}
        cells={antdCells}
        i18n={{
          locale,
          translate: createTranslator(
            (id, def) => catalog[locale]?.[id] ?? def
          ),
        }}
        onChange={() => undefined}
      />
    );
  });
  const trigger = c.querySelector<HTMLElement>(
    '[aria-label="Choose a duration"], .anticon-clock-circle'
  );
  await act(async () => {
    trigger!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 200));
  });
  const panel = document.querySelector('.ant-popover') as HTMLElement;
  return Array.from(panel.querySelectorAll('.ant-space-addon')).map((e) =>
    e.textContent?.trim()
  );
};

describe('the duration picker follows the locale', () => {
  it('names its units in the locale, with no duration keys in the catalog', async () => {
    expect(await open('en')).toEqual(['Hours', 'Minutes']);
    expect(await open('bg')).toEqual(['Часове', 'Минути']);
    expect(await open('de')).toEqual(['Hours', 'Minutes']);
  });

  /*
    A language no bundle carries degrades to English rather than to blank
    labels - the same answer antd gives for a locale it does not ship.
  */
  it('falls back to English for a language no bundle carries', async () => {
    expect(await open('ja')).toEqual(['Hours', 'Minutes']);
  });
});
