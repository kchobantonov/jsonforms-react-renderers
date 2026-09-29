import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ShadcnInputControl } from '../src/controls/InputControl';
import { ControlProps } from '@jsonforms/core';

it('shows descriptions on focus, respects persistent hints, and prioritizes errors', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const props = {
    visible: true,
    enabled: true,
    path: 'value',
    label: 'Value',
    description: 'Help',
    data: '',
    errors: '',
    schema: {},
    uischema: { type: 'Control', scope: '#' },
    handleChange: vi.fn(),
  } as unknown as ControlProps;
  try {
    await act(async () => root.render(<ShadcnInputControl {...props} />));
    expect(host.textContent).not.toContain('Help');
    await act(async () => host.querySelector('input')!.focus());
    expect(host.textContent).toContain('Help');
    await act(async () => host.querySelector('input')!.blur());
    expect(host.textContent).not.toContain('Help');
    await act(async () =>
      root.render(
        <ShadcnInputControl
          {...props}
          config={{ showUnfocusedDescription: true }}
        />
      )
    );
    expect(host.textContent).toContain('Help');
    await act(async () =>
      root.render(
        <ShadcnInputControl
          {...props}
          config={{ showUnfocusedDescription: true }}
          uischema={{
            ...props.uischema,
            options: { showUnfocusedDescription: false },
          }}
        />
      )
    );
    expect(host.textContent).not.toContain('Help');
    await act(async () =>
      root.render(
        <ShadcnInputControl
          {...props}
          errors='Invalid'
          config={{ showUnfocusedDescription: true }}
        />
      )
    );
    expect(host.textContent).not.toContain('Help');
    expect(host.querySelector('[role="alert"]')!.textContent).toBe('Invalid');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
