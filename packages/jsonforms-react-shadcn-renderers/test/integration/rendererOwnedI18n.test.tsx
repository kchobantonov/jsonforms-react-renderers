import { MixedTypeSelector } from '../../src/complex/mixed/MixedWidgets';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms, JsonFormsContext } from '@jsonforms/react';
import { createTranslator, type JsonSchema7 } from '@jsonforms/core';
import { shadcnRenderers, shadcnCells } from '../../src';
import { CombinatorSwitchDialog } from '../../src/complex/CombinatorSwitchDialog';
import {
  Pagination,
  PaginationPrevious,
  PaginationNext,
} from '@jsonforms-react-shadcn-ui/pagination';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
} from '@jsonforms-react-shadcn-ui/breadcrumb';

const marker = (key: string) => `«${key}»`;

const cases: {
  name: string;
  schema: JsonSchema7;
  value: unknown;
  key: string;
  bg: string;
}[] = [
  {
    name: 'boolean',
    schema: { type: 'boolean' },
    value: true,
    key: 'boolean.yes',
    bg: 'Да',
  },
  {
    name: 'false boolean',
    schema: { type: 'boolean' },
    value: false,
    key: 'boolean.no',
    bg: 'Не',
  },
  {
    name: 'enum',
    schema: { type: 'string', enum: ['a', 'b'] },
    value: undefined,
    key: 'enum.select',
    bg: 'Изберете...',
  },
  {
    name: 'clear text',
    schema: { type: 'string' },
    value: 'Untranslated input',
    key: 'control.clearValue',
    bg: 'Изчистване на стойността',
  },
  {
    name: 'clear date',
    schema: { type: 'string', format: 'date' },
    value: '2026-08-29',
    key: 'temporal.clearDate',
    bg: 'Изчистване на датата',
  },
  {
    name: 'clear time',
    schema: { type: 'string', format: 'time' },
    value: '13:45:00Z',
    key: 'temporal.clearTime',
    bg: 'Изчистване на часа',
  },
  {
    name: 'clear date-time',
    schema: { type: 'string', format: 'date-time' },
    value: '2026-08-29T13:45:00Z',
    key: 'temporal.clearDateTime',
    bg: 'Изчистване на датата и часа',
  },
  {
    name: 'array add',
    schema: { type: 'array', items: { type: 'string' } },
    value: [],
    key: 'array.addAriaLabel',
    bg: 'Добавяне',
  },
];
const strings = (host: HTMLElement) =>
  host.textContent +
  [...host.querySelectorAll('[aria-label], [title]')]
    .map((el) => `${el.getAttribute('aria-label')} ${el.getAttribute('title')}`)
    .join('|');

it.each(cases)(
  'localizes $name without a host catalog and follows translator changes',
  async ({ schema, value, key, bg }) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const data = { value };
    const render = async (
      translate?: (key: string, fallback?: string) => string | undefined,
    ) => {
      await act(async () =>
        root.render(
          <JsonForms
            schema={{ type: 'object', properties: { value: schema } }}
            uischema={{ type: 'Control', scope: '#/properties/value' }}
            data={data}
            renderers={shadcnRenderers}
            cells={shadcnCells}
            i18n={{
              locale: 'bg-BG',
              translate: translate && createTranslator(translate),
            }}
          />,
        ),
      );
    };
    try {
      await render();
      expect(strings(host)).toContain(bg);
      await render(marker);
      expect(strings(host)).toContain(marker(key));
      await render(() => undefined);
      expect(strings(host)).toContain(bg);
      expect(data.value).toEqual(value);
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  },
);

it.each(['date', 'time'])(
  'localizes the opened %s picker, including accessible names',
  async (format) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const render = async (
      translate?: (key: string, fallback?: string) => string | undefined,
    ) => {
      await act(async () =>
        root.render(
          <JsonForms
            schema={{
              type: 'object',
              properties: { value: { type: 'string', format } },
            }}
            uischema={{
              type: 'Control',
              scope: '#/properties/value',
              options: { ampm: true },
            }}
            data={{}}
            renderers={shadcnRenderers}
            cells={shadcnCells}
            i18n={{
              locale: 'bg',
              translate: translate && createTranslator(translate),
            }}
          />,
        ),
      );
    };
    try {
      await render();
      await act(async () =>
        host.querySelector<HTMLButtonElement>('button')!.click(),
      );
      if (format === 'date') {
        expect(strings(document.body)).toContain('Към следващия месец');
        expect(
          document.querySelector('[aria-label="Избор на месец"]'),
        ).not.toBeNull();
        expect(
          document.querySelector('[aria-label="понеделник"]'),
        ).not.toBeNull();
        expect(
          [...document.querySelectorAll('option')]
            .map((el) => el.textContent)
            .join('|'),
        ).not.toContain('Jan');
      } else {
        expect(strings(document.body)).toContain('Готово');
        expect(
          document.querySelector('input[aria-label="Часове"]'),
        ).not.toBeNull();
        expect(
          document.querySelector('[aria-label="Увеличаване на часовете"]'),
        ).not.toBeNull();
        expect(strings(document.body)).toContain('пр.об.');
      }
      await render(marker);
      expect(strings(document.body)).toContain(
        marker(format === 'date' ? 'calendar.nextMonth' : 'temporal.hours'),
      );
      expect(strings(document.body)).not.toContain('Go to the Next Month');
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  },
);

it('localizes confirmation chrome and shared navigation primitives', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonFormsContext.Provider value={{ i18n: { locale: 'bg' } } as any}>
          <CombinatorSwitchDialog
            open
            onCancel={() => undefined}
            onConfirm={() => undefined}
          />
          <Pagination>
            <PaginationPrevious />
            <PaginationNext />
          </Pagination>
          <Breadcrumb>
            <BreadcrumbEllipsis />
          </Breadcrumb>
        </JsonFormsContext.Provider>,
      ),
    );
    const text = strings(document.body);
    for (const translated of [
      'Изчистване на формуляра?',
      'Затваряне',
      'Предишна',
      'Следваща',
      'Навигационна пътека',
    ])
      expect(text).toContain(translated);
    expect(text).not.toContain('Clear form?');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('translates type choices while emitting the original type identifier', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onChange = vi.fn();
  try {
    await act(async () =>
      root.render(
        <JsonFormsContext.Provider
          value={{ i18n: { locale: 'bg', translate: marker } } as any}
        >
          <MixedTypeSelector
            types={['string', 'number']}
            value='string'
            disabled={false}
            onChange={onChange}
          />
        </JsonFormsContext.Provider>,
      ),
    );
    await act(async () =>
      host.querySelector<HTMLButtonElement>('[role="combobox"]')!.click(),
    );
    const number = [
      ...document.querySelectorAll<HTMLElement>('[role="option"]'),
    ].find((el) => el.textContent === marker('mixed.type.number'));
    expect(number).toBeDefined();
    await act(async () => number!.click());
    expect(onChange).toHaveBeenCalledWith('number');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
