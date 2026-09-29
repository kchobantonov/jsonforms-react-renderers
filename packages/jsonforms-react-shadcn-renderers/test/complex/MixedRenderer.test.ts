import { JsonForms } from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { shadcnCells, shadcnRenderers } from '../../src/renderers';
import {
  MixedRendererComponent,
  schemaForType,
} from '../../src/complex/MixedRenderer';
import { renderMarkup } from '../render';

describe('Shadcn mixed renderer schemas', () => {
  it('keeps only constraints that apply to the selected type', () => {
    expect(
      schemaForType(
        {
          type: ['array', 'object', 'string'],
          items: { type: 'number' },
          minItems: 2,
          properties: { child: { type: 'string' } },
          required: ['child'],
          minLength: 4,
        },
        'string',
        {}
      )
    ).toEqual({ type: 'string', minLength: 4 });
  });

  it('renders no value control for the null type', () => {
    const markup = renderMarkup(
      React.createElement(JsonForms, {
        cells: shadcnCells,
        data: null,
        renderers: shadcnRenderers,
        schema: { type: ['null', 'string'] },
        uischema: { type: 'Control', scope: '#/' },
      })
    );

    expect(markup).toContain('>null<');
    expect(markup).not.toContain('No applicable renderer found');
    expect(markup).not.toContain('type="text"');
  });
});

it('keeps the type selector controlled when data is set and cleared', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const handleChange = vi.fn();
  try {
    for (const [data, expected] of [
      [undefined, 'Select a type'],
      ['hello', 'string'],
      [undefined, 'Select a type'],
      [null, 'null'],
      [42, 'number'],
      [{}, 'Select a type'],
    ] as const) {
      act(() =>
        root.render(
          React.createElement(MixedRendererComponent, {
            data,
            schema: { type: ['string', 'number', 'null'] },
            rootSchema: {},
            uischema: { type: 'Control', scope: '#' },
            path: '',
            label: 'Value',
            visible: true,
            enabled: true,
            handleChange,
            renderers: shadcnRenderers,
            cells: shadcnCells,
          } as any)
        )
      );
      expect(host.querySelector('[role="combobox"]')?.textContent).toBe(
        expected
      );
    }
    expect(handleChange).not.toHaveBeenCalled();
    const messages = [...warn.mock.calls, ...error.mock.calls].flat().join(' ');
    expect(messages).not.toMatch(
      /uncontrolled.*controlled|controlled.*uncontrolled/i
    );
  } finally {
    act(() => root.unmount());
    host.remove();
    warn.mockRestore();
    error.mockRestore();
  }
});
