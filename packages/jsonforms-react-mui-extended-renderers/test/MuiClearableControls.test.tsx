import { ControlProps, JsonSchema } from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import { muiExtendedRenderers } from '../src';
import {
  hasClearableValue,
  MuiClearableControl,
} from '../src/renderers/controls/MuiClearableControl';

const render = async (element: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(element));

  return {
    container,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
};

const controlProps = (
  data: unknown,
  handleChange = vi.fn(),
  overrides: Partial<ControlProps> = {}
): ControlProps =>
  ({
    cells: [],
    config: {},
    data,
    description: '',
    enabled: true,
    errors: '',
    handleChange,
    id: 'value',
    label: 'Value',
    path: 'value',
    renderers: [],
    required: false,
    rootSchema: {},
    schema: { type: 'string' },
    uischema: { type: 'Control', scope: '#/properties/value' },
    visible: true,
    ...overrides,
  } as ControlProps);

describe('MUI clear value behavior', () => {
  it.each([
    ['text', 'value'],
    ['zero', 0],
    ['false', false],
  ])('treats populated %s data as clearable', (_name, data) => {
    expect(hasClearableValue(data)).toBe(true);
  });

  it.each([undefined, null, ''])('treats %s as empty', (data) => {
    expect(hasClearableValue(data)).toBe(false);
  });

  it.each(['MuiInputBase-root', 'MuiPickersInputBase-root'])(
    'centers Clear on %s independently of labels and helper text',
    async (inputClass) => {
      let inputTop = 124;
      let inputHeight = 40;
      let resize: () => void = () => {};
      const disconnect = vi.fn();
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: () => void) {
            resize = callback;
          }
          observe() {}
          unobserve() {}
          disconnect = disconnect;
        }
      );
      const bounds = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: HTMLElement) {
          return {
            top: this.classList.contains(inputClass) ? inputTop : 100,
            height: this.classList.contains(inputClass) ? inputHeight : 160,
          } as DOMRect;
        });
      let cleanup: (() => Promise<void>) | undefined;
      try {
        const view = await render(
          <MuiClearableControl
            {...controlProps('value')}
            Renderer={() => (
              <div>
                <label>Label</label>
                <div className={inputClass}>
                  <input />
                </div>
                <p>Validation helper text</p>
              </div>
            )}
          />
        );
        cleanup = view.cleanup;
        const button = view.container.querySelector<HTMLElement>(
          ':is([aria-label="Clear value"], [aria-label="Clear input field"])'
        )!;
        expect(getComputedStyle(button).top).toBe('44px');
        expect(getComputedStyle(button).transform).toBe('translateY(-50%)');
        inputTop = 116;
        inputHeight = 56;
        await act(async () => resize());
        expect(getComputedStyle(button).top).toBe('44px');
        inputTop = 100;
        await act(async () => resize());
        expect(getComputedStyle(button).top).toBe('28px');
        await cleanup();
        cleanup = undefined;
        expect(disconnect).toHaveBeenCalled();
      } finally {
        await cleanup?.();
        bounds.mockRestore();
        vi.unstubAllGlobals();
      }
    }
  );

  it('emits undefined through the JSON Forms path', async () => {
    const handleChange = vi.fn();
    const { container, cleanup } = await render(
      <MuiClearableControl
        {...controlProps('value', handleChange)}
        Renderer={() => <input aria-label='Value' />}
      />
    );

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>(
          ':is([aria-label="Clear value"], [aria-label="Clear input field"])'
        )
        ?.click();
    });

    expect(handleChange).toHaveBeenCalledWith('value', undefined);
    await cleanup();
  });

  it.each([
    ['empty data', controlProps(undefined)],
    ['disabled', controlProps('value', vi.fn(), { enabled: false })],
    [
      'clearable false',
      controlProps('value', vi.fn(), {
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { clearable: false },
        },
      }),
    ],
  ])('hides the action for %s', async (_name, props) => {
    const { container, cleanup } = await render(
      <MuiClearableControl
        {...props}
        Renderer={() => <input aria-label='Value' />}
      />
    );

    expect(
      container.querySelector(
        ':is([aria-label="Clear value"], [aria-label="Clear input field"])'
      )
    ).toBeNull();
    await cleanup();
  });
});

describe('MUI clearable renderer registry', () => {
  it.each([
    ['string', 'value'],
    ['integer', 0],
    ['number', 1.5],
    ['date', '2026-08-31'],
    ['time', '12:30:00'],
    ['date-time', '2026-08-31T12:30:00Z'],
  ])('adds a clear action to populated %s controls', async (format, data) => {
    const schema: JsonSchema =
      format === 'integer' || format === 'number'
        ? { type: format }
        : format === 'string'
        ? { type: 'string' }
        : { type: 'string', format };
    const { container, cleanup } = await render(
      <JsonForms
        cells={materialCells}
        data={data}
        renderers={[...materialRenderers, ...muiExtendedRenderers]}
        schema={schema}
        uischema={{ type: 'Control', scope: '#' }}
      />
    );

    expect(
      container.querySelector(
        ':is([aria-label="Clear value"], [aria-label="Clear input field"])'
      )
    ).not.toBeNull();
    await cleanup();
  });
});

describe('nested MUI clearable controls', () => {
  it.each([
    ['enum', { type: 'string', enum: ['Ada', 'Grace'] }],
    [
      'oneOf',
      {
        oneOf: [
          { const: 'Ada', title: 'Ada' },
          { const: 'Grace', title: 'Grace' },
        ],
      },
    ],
    ['text', { type: 'string' }],
  ])(
    'preserves %s values, paths and additional errors',
    async (_kind, valueSchema) => {
      const onChange = vi.fn();
      const { container, cleanup } = await render(
        <JsonForms
          cells={materialCells}
          data={{ name: 'Ada' }}
          onChange={onChange}
          additionalErrors={[
            {
              instancePath: '/name',
              schemaPath: '',
              keyword: 'external',
              params: {},
              message: 'Name is already taken',
            },
          ]}
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          schema={{
            type: 'object',
            properties: { name: valueSchema as JsonSchema },
          }}
          uischema={{ type: 'Control', scope: '#/properties/name' }}
        />
      );
      try {
        expect(container.querySelector('input')?.value).toBe('Ada');
        expect(
          container.querySelector('.jsonforms-mui-clear-value')
        ).toBeNull();
        if (_kind === 'text') {
          const native = container.querySelector(
            'button[aria-label="Clear input field"]'
          )!;
          expect(native.closest('.MuiInputBase-root')).not.toBeNull();
        }
        expect(container.textContent).toContain('Name is already taken');
        if (_kind !== 'text') {
          await act(async () => {
            container
              .querySelector<HTMLButtonElement>('[aria-label="Open"]')!
              .click();
          });
          const option = Array.from(
            document.querySelectorAll<HTMLElement>('[role="option"]')
          ).find((option) => option.textContent === 'Grace');
          expect(option).toBeDefined();
          await act(async () => option!.click());
          await vi.waitFor(() =>
            expect(onChange.mock.calls.at(-1)?.[0].data).toEqual({
              name: 'Grace',
            })
          );
        }
        await act(async () => {
          container
            .querySelector<HTMLButtonElement>(
              ':is([aria-label="Clear value"], [aria-label="Clear input field"])'
            )!
            .click();
        });
        await vi.waitFor(() =>
          expect(onChange.mock.calls.at(-1)?.[0].data).toEqual({
            name: undefined,
          })
        );
      } finally {
        await cleanup();
      }
    }
  );
});

describe('MUI dropdown clear actions', () => {
  it('adds a clear action when autocomplete is explicitly disabled', async () => {
    const { container, cleanup } = await render(
      <JsonForms
        data='Ada'
        schema={{ type: 'string', enum: ['Ada', 'Grace'] }}
        uischema={{
          type: 'Control',
          scope: '#',
          options: { autocomplete: false },
        }}
        renderers={[...materialRenderers, ...muiExtendedRenderers]}
        cells={materialCells}
      />
    );
    try {
      expect(container.querySelector('.MuiAutocomplete-root')).toBeNull();
      expect(
        container.querySelectorAll('.jsonforms-mui-clear-value')
      ).toHaveLength(1);
    } finally {
      await cleanup();
    }
  });

  it.each([
    ['enum', { type: 'string', enum: ['Ada', 'Grace'] }],
    [
      'oneOf',
      {
        oneOf: [
          { const: 'Ada', title: 'Ada' },
          { const: 'Grace', title: 'Grace' },
        ],
      },
    ],
  ])(
    'uses only the native clear action for %s dropdowns',
    async (_kind, schema) => {
      for (const clearable of [true, false]) {
        const { container, cleanup } = await render(
          <JsonForms
            data='Ada'
            schema={schema as JsonSchema}
            uischema={{ type: 'Control', scope: '#', options: { clearable } }}
            renderers={[...materialRenderers, ...muiExtendedRenderers]}
            cells={materialCells}
          />
        );
        try {
          const nativeClear = container.querySelector<HTMLElement>(
            '.MuiAutocomplete-clearIndicator'
          )!;
          expect(Boolean(nativeClear)).toBe(clearable);
          expect(
            container.querySelector('.jsonforms-mui-clear-value')
          ).toBeNull();

          expect(
            container.querySelectorAll(
              'button:is([aria-label="Clear value"], [aria-label="Clear input field"])'
            )
          ).toHaveLength(clearable ? 1 : 0);
          expect(
            container.querySelector('button[aria-label="Open"]')
          ).not.toBeNull();
          await act(async () =>
            container.querySelector<HTMLInputElement>('input')!.focus()
          );
          expect(
            Boolean(container.querySelector('.MuiAutocomplete-clearIndicator'))
          ).toBe(clearable);
        } finally {
          await cleanup();
        }
      }
    }
  );
});
