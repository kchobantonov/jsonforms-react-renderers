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
        .querySelector<HTMLButtonElement>('[aria-label="Clear value"]')
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

    expect(container.querySelector('[aria-label="Clear value"]')).toBeNull();
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
      container.querySelector('[aria-label="Clear value"]')
    ).not.toBeNull();
    await cleanup();
  });
});
