import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

const render = (schema: any, options: any, data: any, config: any = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        config={config}
        data={data}
        schema={{ type: 'object', properties: { choice: schema } }}
        uischema={{
          type: 'Control',
          scope: '#/properties/choice',
          ...(options ? { options } : {}),
        }}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={() => undefined}
      />
    )
  );
  return {
    oriented: container.querySelector<HTMLElement>('[aria-orientation]'),
    inputs: Array.from(container.querySelectorAll<HTMLInputElement>('input')),
    unmount: () => act(() => root.unmount()),
  };
};

const radioSchema = { type: 'string', enum: ['Standard', 'Express'] };
const checkboxSchema = {
  type: 'array',
  uniqueItems: true,
  items: { type: 'string', enum: ['Email', 'SMS'] },
};

describe.each([
  ['radio group', radioSchema, { format: 'radio' }, 'Standard'],
  ['checkbox group', checkboxSchema, {}, ['Email']],
])('%s orientation', (_label, schema, base, data) => {
  it('is horizontal by default', () => {
    const { oriented, unmount } = render(schema, base, { choice: data });
    expect(oriented?.getAttribute('aria-orientation')).toBe('horizontal');
    unmount();
  });

  it('stacks and announces itself when vertical is true', () => {
    const { oriented, unmount } = render(
      schema,
      { ...base, vertical: true },
      { choice: data }
    );
    expect(oriented?.getAttribute('aria-orientation')).toBe('vertical');
    unmount();
  });

  it('treats an absent option as horizontal, not as vertical', () => {
    // `vertical` defaults to false; only an explicit true stacks.
    const { oriented, unmount } = render(
      schema,
      { ...base, vertical: undefined },
      { choice: data }
    );
    expect(oriented?.getAttribute('aria-orientation')).toBe('horizontal');
    unmount();
  });

  it('keeps every choice, whichever orientation', () => {
    for (const vertical of [false, true]) {
      const { inputs, unmount } = render(
        schema,
        { ...base, vertical },
        { choice: data }
      );
      expect(inputs).toHaveLength(2);
      unmount();
    }
  });
});

describe('radio group choice identity', () => {
  it('keeps two choices that share a label distinct', () => {
    // Keying by label collapsed them into one rendered radio.
    const { inputs, unmount } = render(
      {
        type: 'string',
        oneOf: [
          { const: 'a', title: 'Same' },
          { const: 'b', title: 'Same' },
        ],
      },
      { format: 'radio' },
      { choice: 'a' }
    );
    expect(inputs).toHaveLength(2);
    expect(inputs.filter((i) => i.checked)).toHaveLength(1);
    unmount();
  });
});

it('uses scoped radio defaults and honors an explicit horizontal override', () => {
  for (const vertical of [undefined, false]) {
    const { oriented, unmount } = render(
      radioSchema,
      { format: 'radio', vertical },
      { choice: 'Standard' },
      { jsonformsExtended: { radio: { vertical: true } } }
    );
    expect(oriented?.getAttribute('aria-orientation')).toBe(
      vertical === false ? 'horizontal' : 'vertical'
    );
    unmount();
  }
});
