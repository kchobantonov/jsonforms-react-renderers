import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { JsonForms } from '@jsonforms/react';
import { shadcnCells, shadcnRenderers } from '../../src';

// Validation updates must preserve the focused input, its caret and subsequent edits.

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
    'value',
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
      <React.Fragment>
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
          renderers={shadcnRenderers}
          cells={shadcnCells}
          onChange={({ data }) => {
            latest = data;
          }}
        />
      </React.Fragment>,
    ),
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
    expect(container.querySelector('.shadcn-jsonforms-error')).toBeTruthy();
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

  it('shows validation feedback after the field becomes invalid', async () => {
    const { input, keyboard, container, unmount } = render();
    act(() => input().focus());
    await keyboard('1');
    expect(container.querySelector('.shadcn-jsonforms-error')).not.toBeNull();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    unmount();
  });
});
