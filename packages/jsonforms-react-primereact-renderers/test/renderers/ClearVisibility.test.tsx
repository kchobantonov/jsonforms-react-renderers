import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import {
  PrimeClearableInput,
  PrimeClearValueButton,
} from '../../src/prime-controls/PrimeClearValueButton';

it('shows populated clear actions on hover or keyboard focus without shifting layout', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const clear = vi.fn();
  const render = (data: unknown, enabled = true) =>
    act(() =>
      root.render(
        <PrimeReactProvider value={{ unstyled: true }}>
          <PrimeClearableInput>
            <input aria-label='Value' />
            <PrimeClearValueButton
              data={data}
              enabled={enabled}
              onClear={clear}
            />
          </PrimeClearableInput>
        </PrimeReactProvider>,
      ),
    );
  try {
    render(0);
    const input = host.querySelector('input')!;
    const button = host.querySelector('button')!;
    expect(button.style.opacity).toBe('0');
    act(() =>
      input.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })),
    );
    expect(button.style.opacity).toBe('1');
    act(() =>
      input.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          relatedTarget: document.body,
        }),
      ),
    );
    expect(button.style.opacity).toBe('0');
    act(() => input.focus());
    expect(button.style.opacity).toBe('1');
    act(() => button.focus());
    expect(button.style.opacity).toBe('1');
    act(() => button.click());
    expect(clear).toHaveBeenCalledOnce();
    act(() => button.blur());
    expect(button.style.opacity).toBe('0');
    render('');
    expect(host.querySelector('button')).toBeNull();
    render('value', false);
    expect(host.querySelector('button')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
