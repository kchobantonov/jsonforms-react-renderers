import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { InputShell } from '../src/controls/InputControl';

it('updates required markers with config and respects explicit control overrides', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = (hide: boolean, local?: boolean) =>
    act(() =>
      root.render(
        <InputShell
          id='name'
          label='Name'
          required
          config={{ hideRequiredAsterisk: hide }}
          uischema={
            {
              type: 'Control',
              scope: '#',
              options:
                local === undefined ? {} : { hideRequiredAsterisk: local },
            } as any
          }
        >
          <input id='name' required />
        </InputShell>
      )
    );
  try {
    render(false);
    expect(host.querySelector('label')?.textContent).toBe('Name *');
    render(true);
    expect(host.querySelector('label')?.textContent).toBe('Name');
    expect(host.querySelector('input')?.required).toBe(true);
    render(true, false);
    expect(host.querySelector('label')?.textContent).toBe('Name *');
    render(false, true);
    expect(host.querySelector('label')?.textContent).toBe('Name');
  } finally {
    act(() => root.unmount());
  }
});
