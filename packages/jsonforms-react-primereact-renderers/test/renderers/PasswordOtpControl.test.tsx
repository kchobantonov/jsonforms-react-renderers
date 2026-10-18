import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { PrimeReactProvider } from 'primereact/api';
import {
  PasswordOtpControl,
  passwordOtpControlTester,
} from '../../src/controls/PasswordOtpControl';

describe('native OTP password', () => {
  it('masks, reveals, follows replacement and guards readonly values', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const render = (data: string, readonly = false) =>
      act(() =>
        root.render(
          <PrimeReactProvider value={{ unstyled: true }}>
            <JsonForms
              schema={{
                type: 'string',
                minLength: 4,
                maxLength: 4,
                format: 'password',
              }}
              uischema={{
                type: 'Control',
                scope: '#',
                options: { variant: 'otp' },
              }}
              data={data}
              readonly={readonly}
              renderers={[
                {
                  tester: passwordOtpControlTester,
                  renderer: PasswordOtpControl,
                },
              ]}
            />
          </PrimeReactProvider>,
        ),
      );
    try {
      render('0012');
      expect(
        Array.from(container.querySelectorAll('input'))
          .map((input) => input.value)
          .join(''),
      ).toBe('0012');
      expect(container.querySelectorAll('input[type="password"]')).toHaveLength(
        4,
      );
      expect(
        container.querySelector<HTMLButtonElement>('[aria-label="Clear value"]')
          ?.style.opacity,
      ).toBe('0');
      act(() =>
        container
          .querySelector<HTMLButtonElement>('[aria-label="Show password"]')!
          .click(),
      );
      expect(container.querySelectorAll('input[type="text"]')).toHaveLength(4);
      render('AB03');
      expect(
        Array.from(container.querySelectorAll('input'))
          .map((input) => input.value)
          .join(''),
      ).toBe('AB03');
      render('AB03', true);
      expect(container.querySelector('[aria-label="Clear value"]')).toBeNull();
      expect(
        Array.from(container.querySelectorAll('input')).every(
          (input) => input.disabled || input.readOnly,
        ),
      ).toBe(true);
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });

  it('requires bounded passwords and accepts UI format selection', () => {
    const ui = {
      type: 'Control',
      scope: '#',
      options: { variant: 'otp', format: 'password' },
    };
    const schema = { type: 'string', minLength: 2, maxLength: 4 };
    const context = { rootSchema: schema, config: {} };
    expect(passwordOtpControlTester(ui, schema, context)).toBe(5);
    expect(passwordOtpControlTester(ui, { type: 'string' }, context)).toBe(-1);
    expect(
      passwordOtpControlTester(
        { ...ui, options: { variant: 'otp' } },
        schema,
        context,
      ),
    ).toBe(-1);
  });
});
