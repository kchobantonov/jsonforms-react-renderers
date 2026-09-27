import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';
import {
  CLEAR_OFFSET,
  CLEAR_OFFSET_WITH_HANDLES,
} from '../src/antd-controls/AntdClearValueButton';

const render = (schema: any, data: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={{ type: 'object', properties: { value: schema } }}
        uischema={{ type: 'Control', scope: '#/properties/value' }}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={() => undefined}
      />
    )
  );
  return {
    clear: container.querySelector<HTMLElement>(
      'button[aria-label="Clear value"]'
    ),
    feedback: container.querySelector('.ant-form-item-feedback-icon'),
    unmount: () => act(() => root.unmount()),
  };
};

describe('clear affordance on numeric inputs', () => {
  it.each([
    ['number', { type: 'number', exclusiveMinimum: 0 }, -0.2],
    ['integer', { type: 'integer', minimum: 10 }, 1],
  ])('stays available when the value is invalid (%s)', (_l, schema, value) => {
    // The regression: handing the button to antd's `suffix` lost it exactly
    // here, because Form.Item feedback replaces that slot rather than
    // composing with it - `suffix: suffixNode || suffix` in antd's InputNumber.
    const { clear, feedback, unmount } = render(schema, { value });
    expect(feedback).toBeTruthy();
    expect(clear).toBeTruthy();
    unmount();
  });

  it.each([
    ['number', { type: 'number' }],
    ['integer', { type: 'integer' }],
  ])('clears the stepper handles with a wider offset (%s)', (_l, schema) => {
    const { clear, unmount } = render(schema, { value: 5 });
    expect(clear!.style.position).toBe('absolute');
    // The default offset put the button on top of the handles antd reveals
    // on hover.
    expect(clear!.style.insetInlineEnd).toBe(`${CLEAR_OFFSET_WITH_HANDLES}px`);
    expect(CLEAR_OFFSET_WITH_HANDLES).toBeGreaterThan(CLEAR_OFFSET);
    unmount();
  });

  it('keeps the narrower offset for a plain text input, which has no handles', () => {
    const { clear, unmount } = render({ type: 'string' }, { value: 'x' });
    expect(clear!.style.insetInlineEnd).toBe(`${CLEAR_OFFSET}px`);
    unmount();
  });

  it('is still shown for a text input with an error', () => {
    const { clear, feedback, unmount } = render(
      { type: 'string', minLength: 5 },
      { value: 'ab' }
    );
    expect(feedback).toBeTruthy();
    expect(clear).toBeTruthy();
    unmount();
  });

  it('stays in the layout while hidden, so revealing it shifts nothing', () => {
    const { clear, unmount } = render({ type: 'number' }, { value: 5 });
    expect(clear!.style.opacity).toBe('0');
    expect(clear!.style.display).not.toBe('none');
    unmount();
  });
});
