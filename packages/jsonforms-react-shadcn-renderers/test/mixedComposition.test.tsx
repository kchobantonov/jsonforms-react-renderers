import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';

it('delegates a mixed string to its compatible composition branch', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: ['string', 'integer'],
            anyOf: [
              { type: 'string', title: 'Text branch', minLength: 3 },
              { type: 'integer', title: 'Integer branch', minimum: 10 },
            ],
          }}
          uischema={{ type: 'Control', scope: '#' }}
          data='abcd'
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    expect(container.textContent).not.toContain('No applicable renderer');
    expect(container.textContent).not.toContain('Integer branch');
    expect(container.querySelector('[role=tablist]')).toBeNull();
    expect(
      Array.from(container.querySelectorAll('input')).some(
        (input) => input.value === 'abcd'
      )
    ).toBe(true);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

it('exposes object fields declared inside allOf', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: ['object', 'null'],
            properties: { code: { type: 'string' } },
            allOf: [
              { properties: { name: { type: 'string' } }, required: ['name'] },
            ],
          }}
          uischema={{ type: 'Control', scope: '#' }}
          data={{ name: 'Ada', code: 'A1' }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    expect(container.textContent).not.toContain('No applicable renderer');
    expect(
      Array.from(container.querySelectorAll('input')).some(
        (input) => input.value === 'A1'
      )
    ).toBe(true);
    expect(
      Array.from(container.querySelectorAll('input')).some(
        (input) => input.value === 'Ada'
      )
    ).toBe(true);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

for (const keyword of ['anyOf', 'oneOf']) {
  it(`renders a sole ${keyword} branch without navigation`, () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={{
              type: 'string',
              [keyword]: [{ type: 'string', title: 'Only choice' }],
            }}
            uischema={{ type: 'Control', scope: '#' }}
            data='hello'
            renderers={shadcnRenderers}
            cells={shadcnCells}
          />
        )
      );
      expect(
        container.querySelector('[role=tablist],[role=combobox]')
      ).toBeNull();
      expect(
        Array.from(container.querySelectorAll('input')).filter(
          (input) => input.value === 'hello'
        )
      ).toHaveLength(1);
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });
}
