import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { shadcnRenderers, shadcnCells } from '../src';
let dispose = () => {};
beforeEach(() => vi.useFakeTimers());
afterEach(() => { dispose(); vi.useRealTimers(); });
const mount = (bounded = true, uiPassword = false, readonly = false) => {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  let data: any;
  act(() => root.render(<JsonForms schema={{ type: 'object', properties: { code: {
    type: 'string', ...(uiPassword ? {} : { format: 'password' }), ...(bounded ? { minLength: 4, maxLength: 4 } : {}),
  } } }} uischema={{ type: 'Control', scope: '#/properties/code', options: { variant: 'otp', ...(uiPassword ? { format: 'password' } : {}) } }}
    data={{ code: 'a1' }} readonly={readonly} renderers={shadcnRenderers} cells={shadcnCells} onChange={event => { data = event.data; }} />));
  act(() => vi.runAllTimers());
  dispose = () => { act(() => root.unmount()); container.remove(); };
  return { container, data: () => data };
};
it.each([false, true])('selects masked OTP for schema or UI password (UI=%s), and reveal preserves data', ui => {
  const { container, data } = mount(true, ui);
  expect(container.querySelectorAll('input[type=password]')).toHaveLength(4);
  const before = data();
  act(() => (container.querySelector('[aria-label="Show password"]') as HTMLButtonElement).click());
  expect(container.querySelectorAll('input[type=text]')).toHaveLength(4);
  expect(data()).toEqual(before);
});
it('commits partial edits, distributes paste, and clears to undefined', () => {
  const { container, data } = mount();
  const inputs = container.querySelectorAll('input');
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(inputs[2], 'b');
    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => vi.runAllTimers());
  expect(data().code).toBe('a1b');
  act(() => {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'xy89extra' } });
    inputs[0].dispatchEvent(event);
  });
  act(() => vi.runAllTimers());
  expect(data().code).toBe('xy89');
  act(() => (container.querySelector('[aria-label="Clear value"]') as HTMLButtonElement).click());
  act(() => vi.runAllTimers());
  expect(data().code).toBeUndefined();
});
it('falls back to one masked password input without bounds', () => {
  expect(mount(false).container.querySelectorAll('input[type=password]')).toHaveLength(1);
});
it('disables inputs and reveal for readonly forms', () => {
  const { container } = mount(true, false, true);
  expect(Array.from(container.querySelectorAll('input')).every(input => input.disabled)).toBe(true);
  expect((container.querySelector('[aria-label="Show password"]') as HTMLButtonElement).disabled).toBe(true);
});
