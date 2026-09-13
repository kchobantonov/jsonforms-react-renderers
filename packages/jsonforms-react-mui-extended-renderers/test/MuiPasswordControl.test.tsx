import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers } from '@jsonforms/material-renderers';
import { vi } from 'vitest';
import { muiExtendedRenderers } from '../src';

const mount = async (options = {}, readonly = false) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const onChange = vi.fn();
  await act(async () =>
    root.render(
      <JsonForms
        schema={{
          type: 'object',
          properties: { password: { type: 'string', maxLength: 20 } },
        }}
        uischema={{
          type: 'Control',
          scope: '#/properties/password',
          options: { format: 'password', ...options },
        }}
        data={{ password: 'secret' }}
        readonly={readonly}
        onChange={onChange}
        renderers={[...materialRenderers, ...muiExtendedRenderers]}
      />
    )
  );
  return {
    container,
    onChange,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
};

describe('MUI password control', () => {
  it('masks by default and toggles visibility without changing data', async () => {
    const view = await mount({ restrict: true, placeholder: 'Password' });
    try {
      const input = view.container.querySelector('input')!;
      expect(input.type).toBe('password');
      expect(input.maxLength).toBe(20);
      expect(input.placeholder).toBe('Password');
      view.onChange.mockClear();
      await act(async () =>
        view.container
          .querySelector<HTMLButtonElement>('[aria-label="Show password"]')!
          .click()
      );
      expect(input.type).toBe('text');
      expect(input.value).toBe('secret');
      for (const [change] of view.onChange.mock.calls) {
        expect(change.data).toEqual({ password: 'secret' });
      }
      await act(async () =>
        view.container
          .querySelector<HTMLButtonElement>('[aria-label="Hide password"]')!
          .click()
      );
      expect(input.type).toBe('password');
    } finally {
      await view.cleanup();
    }
  });

  it('clears through JSON Forms', async () => {
    const view = await mount();
    try {
      await act(async () =>
        view.container
          .querySelector<HTMLButtonElement>('[aria-label="Clear value"]')!
          .click()
      );
      expect(
        view.onChange.mock.calls.at(-1)?.[0].data.password
      ).toBeUndefined();
    } finally {
      await view.cleanup();
    }
  });

  it.each([
    [{ clearable: false }, false],
    [{}, true],
  ])('respects clearability and readonly', async (options, readonly) => {
    const view = await mount(options, readonly);
    try {
      expect(
        view.container.querySelector('[aria-label="Clear value"]')
      ).toBeNull();
      if (readonly)
        expect(view.container.querySelector('input')!.disabled).toBe(true);
    } finally {
      await view.cleanup();
    }
  });
});
