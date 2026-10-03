import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import { antdRenderers, antdCells } from '../src';
import {
  defaultRendererLocales,
  registerRendererLocale,
  setRendererLocales,
} from '../src/util/rendererLocale';

/*
  `./locale.ts` already makes antd's own chrome follow the locale. The strings
  *this package* owns did not: they fell back to one English table, so a form
  switched to Bulgarian kept English buttons and units wherever its catalog did
  not happen to carry the key.
*/

class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

afterEach(() => {
  document.body.innerHTML = '';
  setRendererLocales(defaultRendererLocales);
});

/*
  A tuple: `tuple.add` is one of the package's own strings, drawn as soon as
  the control mounts and with nothing in the schema that could supply it.
*/
const schema: any = {
  type: 'object',
  properties: {
    span: {
      type: 'array',
      items: [{ type: 'string' }, { type: 'string' }],
      additionalItems: { type: 'string' },
    },
  },
};
const uischema: any = { type: 'Control', scope: '#/properties/span' };

/** A form catalog for the locale under test, or none at all. */
const draw = async (
  locale: string | undefined,
  catalog?: Record<string, string>
) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <JsonForms
        data={{ span: ['a', 'b'] }}
        schema={schema}
        uischema={uischema}
        renderers={antdRenderers}
        cells={antdCells}
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
  return { container, root };
};

const labels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('button')).map(
    (button) => `${button.textContent} ${button.getAttribute('aria-label')}`
  );

describe('renderer locale bundles', () => {
  it('draws its own strings in English by default', async () => {
    const { container } = await draw(undefined);
    expect(labels(container).join('|')).toContain('Add item');
  });

  it('follows the locale into a bundled language', async () => {
    const { container } = await draw('bg');
    const text = labels(container).join('|');
    expect(text).toContain('Добавяне на елемент');
    expect(text).not.toContain('Add item');
  });

  it('uses the language bundle for a regional tag', async () => {
    const { container } = await draw('bg-BG');
    expect(labels(container).join('|')).toContain('Добавяне на елемент');
  });

  it('lets the form catalog win over the bundle', async () => {
    const { container } = await draw('bg', { 'tuple.add': 'Нов ред' });
    const text = labels(container).join('|');
    expect(text).toContain('Нов ред');
    expect(text).not.toContain('Добавяне на елемент');
  });

  it('falls back to English for a language nobody registered', async () => {
    const { container } = await draw('ja');
    expect(labels(container).join('|')).toContain('Add item');
  });

  it('takes a language registered at runtime', async () => {
    registerRendererLocale('ja', { 'tuple.add': '項目を追加' });
    const { container } = await draw('ja');
    expect(labels(container).join('|')).toContain('項目を追加');
  });
});

/*
  The class of bug the marking-translator guard in `rendererI18n.test.tsx`
  cannot see.

  That file supplies a translator that answers every known key, so a call site
  written as `translate(key, i18nDefaults[key])` returns the marker and looks
  translated. It is not: the **default message** is where the locale bundle is
  delivered, so passing the English default pins the string to English for
  every language whose catalog does not define that key - which is the usual
  case, since a form's catalog is written for its own labels.

  So these render with a locale and **no translator at all**, which is exactly
  what a form with no catalog looks like, and assert the bundled language
  reaches the screen.
*/
describe('a form with a locale and no catalog', () => {
  const drawBare = async (uischema: any, schema: any, data: any) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <JsonForms
          data={data}
          schema={schema}
          uischema={uischema}
          renderers={antdRenderers}
          cells={antdCells}
          // A locale, and nothing else. No `translate`.
          i18n={{ locale: 'bg' } as any}
          onChange={() => undefined}
        />
      );
    });
    return { container, unmount: () => act(() => root.unmount()) };
  };

  const labelsIn = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[aria-label]'))
      .map((el) => el.getAttribute('aria-label'))
      .join(' | ');

  /* The one in the screenshot: a group's data dot. */
  it('translates a group data indicator', async () => {
    const { container, unmount } = await drawBare(
      {
        type: 'Group',
        label: 'Contact details',
        options: { showDataIndicator: true },
        elements: [{ type: 'Control', scope: '#/properties/name' }],
      },
      { type: 'object', properties: { name: { type: 'string' } } },
      { name: 'Ada' }
    );
    const text = labelsIn(container);
    expect(text).toContain('Секцията съдържа данни');
    expect(text).not.toContain('Section contains data');
    unmount();
  });

  it('translates a container validation marker', async () => {
    const { container, unmount } = await drawBare(
      {
        type: 'Group',
        label: 'Contact details',
        options: { showValidationIndicator: true },
        elements: [{ type: 'Control', scope: '#/properties/name' }],
      },
      {
        type: 'object',
        properties: { name: { type: 'string', minLength: 5 } },
      },
      { name: 'a' }
    );
    const text = labelsIn(container);
    expect(text).toContain('Тази секция съдържа грешки');
    expect(text).not.toContain('error in this section');
    unmount();
  });

  /* A cell's composite summary, translated through a threaded `Translator`. */
  it('translates a composite cell summary', async () => {
    const { container, unmount } = await drawBare(
      {
        type: 'Control',
        scope: '#/properties/people',
        options: { table: true, cells: { tags: {} } },
      },
      {
        type: 'object',
        properties: {
          people: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      { people: [{ name: 'Ada', tags: ['a', 'b'] }] }
    );
    const text = container.textContent ?? '';
    expect(text).toContain('елемента');
    expect(text).not.toContain('items');
    unmount();
  });

  /* A file control's button, translated through core's `t` prop. */
  it('translates the file control', async () => {
    const { container, unmount } = await drawBare(
      { type: 'Control', scope: '#/properties/doc' },
      {
        type: 'object',
        properties: {
          // isBase64String: contentEncoding, or format binary/byte.
          doc: { type: 'string', contentEncoding: 'base64' },
        },
      },
      {}
    );
    const text = labelsIn(container);
    expect(text).toContain('Изберете файл');
    expect(text).not.toContain('Select File');
    unmount();
  });
});
