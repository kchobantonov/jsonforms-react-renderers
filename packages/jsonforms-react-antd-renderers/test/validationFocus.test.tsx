import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  A field that becomes invalid while it is being typed into must not lose the
  caret.

  The hazard is antd's, and antd names it: the `Form.Item` feedback icon is
  composed into the input's `suffix`, and an antd `Input` with no prefix, suffix
  or `allowClear` renders a bare `<input>` while one with any of them nests it
  inside `<span class="ant-input-affix-wrapper">`. Switching `hasFeedback` on
  when a field turns invalid therefore moves the input to a different position
  in the element tree, React unmounts it and mounts a replacement, and the
  person typing is put out of the field mid-word. antd's own development
  warning: "dynamic add or remove prefix / suffix will make it lose focus caused
  by dom structure change".

  `ControlFormItem` keeps `hasFeedback` on at all times and suppresses the icon
  instead. These tests are the guard for that, on the plain text control -
  everything else that renders through the same frame inherits it.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 400) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const setNativeValue = (field: HTMLInputElement, value: string) =>
  Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!.call(field, value);

const schema = {
  type: 'object',
  properties: { reference: { type: 'string', pattern: '^[0-9]{6}$' } },
};

const render = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = {};
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{}}
          schema={schema as any}
          uischema={
            {
              type: 'Control',
              scope: '#/properties/reference',
              label: 'Reference',
            } as any
          }
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data }) => {
            latest = data;
          }}
        />
      </ConfigProvider>
    )
  );

  const input = () => container.querySelector<HTMLInputElement>('input')!;

  /** Types into whatever holds focus, as a keyboard does. */
  const keyboard = async (text: string) => {
    for (const char of text) {
      const field = document.activeElement as HTMLInputElement | null;
      if (!field || field.tagName !== 'INPUT') {
        // Focus has gone; a person's keystrokes would go nowhere from here.
        return;
      }
      setNativeValue(field, field.value + char);
      act(() => {
        field.dispatchEvent(new Event('input', { bubbles: true }));
      });
      // The text control debounces by 300ms, which is the only reason this
      // defect was easier to see on the masked control than on this one.
      await settle();
    }
  };

  return {
    container,
    input,
    keyboard,
    stored: () => latest.reference,
    unmount: () => act(() => root.unmount()),
  };
};

describe('a field that turns invalid while being typed into', () => {
  it('keeps the same input element', async () => {
    const { container, input, keyboard, unmount } = render();
    const field = input();
    act(() => field.focus());
    await keyboard('1');
    // The error really is on screen - otherwise this would pass against a form
    // that never validated at all.
    expect(container.querySelector('.ant-form-item-has-error')).toBeTruthy();
    expect(input()).toBe(field);
    unmount();
  });

  it('keeps the caret', async () => {
    const { input, keyboard, unmount } = render();
    const field = input();
    act(() => field.focus());
    await keyboard('1');
    expect(document.activeElement).toBe(field);
    unmount();
  });

  it('accepts the rest of the value without the field being clicked again', async () => {
    // Every intermediate value fails the pattern, so the field is invalid from
    // the first keystroke until the sixth.
    const { keyboard, input, stored, unmount } = render();
    act(() => input().focus());
    await keyboard('482913');
    // The control debounces, and JsonForms debounces its own onChange on top,
    // so the last keystroke needs one more window before the data is readable.
    await settle();
    expect(input().value).toBe('482913');
    expect(stored()).toBe('482913');
    unmount();
  });

  it('does not add or remove the affix wrapper around it', async () => {
    const { container, input, keyboard, unmount } = render();
    act(() => input().focus());
    const wrapped = () => !!container.querySelector('.ant-input-affix-wrapper');
    const before = wrapped();
    await keyboard('1');
    expect(wrapped()).toBe(before);
    unmount();
  });

  it('shows no feedback icon while the value is valid', async () => {
    // `hasFeedback` is on the whole time, so the guard against it quietly
    // starting to draw a success tick.
    const { container, unmount } = render();
    expect(container.querySelector('.ant-form-item-feedback-icon')).toBeNull();
    unmount();
  });

  it('still shows the error icon once there is an error', async () => {
    const { input, keyboard, container, unmount } = render();
    act(() => input().focus());
    await keyboard('1');
    expect(
      container.querySelector('.ant-form-item-feedback-icon-error')
    ).toBeTruthy();
    unmount();
  });
});
