import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import { shadcnRenderers, shadcnCells } from '../../src';

const cases = [
  ['date', 'temporal.datePlaceholder', 'Pick a date', 'Изберете дата'],
  ['time', 'temporal.timePlaceholder', 'Pick a time', 'Изберете час'],
  [
    'date-time',
    'temporal.dateTimePlaceholder',
    'Pick a date and time',
    'Изберете дата и час',
  ],
];

it.each(cases)(
  'localizes the %s placeholder and preserves authored overrides',
  async (format, key, english, bulgarian) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const schema = {
      type: 'object',
      properties: { value: { type: 'string', format } },
    };
    const data = {};
    const render = async (
      locale: string,
      catalog: Record<string, string> = {},
      config = {},
      options = {},
    ) => {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema}
            data={data}
            uischema={{ type: 'Control', scope: '#/properties/value', options }}
            config={config}
            renderers={shadcnRenderers}
            cells={shadcnCells}
            i18n={{
              locale,
              translate: createTranslator(
                (id, fallback) => catalog[id] ?? fallback,
              ),
            }}
          />,
        ),
      );
      return container.querySelector('button')?.textContent;
    };
    try {
      expect(await render('en')).toBe(english);
      expect(await render('bg-BG')).toBe(bulgarian);
      expect(await render('bg', { [key]: 'Custom translation' })).toBe(
        'Custom translation',
      );
      expect(await render('unsupported')).toBe(english);
      expect(await render('bg', {}, { placeholder: 'Configured hint' })).toBe(
        'Configured hint',
      );
      expect(
        await render(
          'bg',
          { [key]: 'Custom translation' },
          { placeholder: 'Configured hint' },
          { placeholder: 'Authored hint' },
        ),
      ).toBe('Authored hint');
      expect(await render('bg', {}, {}, { placeholder: '' })).toBe('');
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  },
);
