import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

const schema: any = {
  type: 'object',
  properties: {
    people: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phoneNumbers: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};
const uischema: any = {
  type: 'Control',
  scope: '#/properties/people',
  options: { table: true, cells: { phoneNumbers: {} } },
};

const render = (translations?: Record<string, string>) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={{ people: [{ name: 'Ada', phoneNumbers: ['a', 'b', 'c'] }] }}
        schema={schema}
        uischema={uischema}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={() => undefined}
        i18n={
          translations
            ? {
                locale: 'de',
                translate: ((key: string, fallback?: string) =>
                  translations[key] ?? fallback) as any,
              }
            : undefined
        }
      />
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

describe('composite cell i18n', () => {
  it('uses the English defaults when nothing is registered', () => {
    const { container, unmount } = render();
    expect(container.textContent).toContain('3 items');
    unmount();
  });

  // Every visible string goes through the translator, so a host can localise
  // it - none of them may be hardcoded English.
  it('honours host translations for the summary', () => {
    const { container, unmount } = render({
      'composite.summary.items': '{count} Einträge',
    });
    expect(container.textContent).toContain('3 Einträge');
    expect(container.textContent).not.toContain('3 items');
    unmount();
  });

  it('honours host translations for the action tooltips', () => {
    const { container, unmount } = render({
      'composite.edit': 'Bearbeiten {label}',
    });
    const edit = container.querySelector('[aria-label^="Bearbeiten"]');
    expect(edit).toBeTruthy();
    unmount();
  });
});
