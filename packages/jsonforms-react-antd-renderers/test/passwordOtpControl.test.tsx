import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { NOT_APPLICABLE } from '@jsonforms/core';
import { antdRenderers, antdCells } from '../src';
import {
  passwordOtpControlTester,
  hasSegmentedLength,
} from '../src/controls/PasswordOtpControl';
import { otpLength } from '../src/antd-controls/AntdOtp';

const code = (extra: Record<string, unknown> = {}): any => {
  const property: Record<string, unknown> = {
    type: 'string',
    format: 'password',
    title: 'Verification code',
    minLength: 6,
    maxLength: 6,
    ...extra,
  };
  for (const [key, value] of Object.entries(property)) {
    if (value === undefined) delete property[key];
  }
  return { type: 'object', properties: { verificationCode: property } };
};

const otpUi = {
  type: 'Control',
  scope: '#/properties/verificationCode',
  options: { variant: 'otp' },
};
const plainUi = { type: 'Control', scope: '#/properties/verificationCode' };

// JsonForms debounces its own onChange by 10ms, so a commit is not visible to
// the test's listener in the same tick it was dispatched.
const settle = async (ms = 30) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const render = (schema: any, uischema: any, data: any = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const changes: any[] = [];
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema}
        uischema={uischema}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={(e) => changes.push(e.data)}
      />
    )
  );
  const boxes = () =>
    Array.from(container.querySelectorAll<HTMLInputElement>('.ant-otp input'));
  // antd hides a masked character by making the input's own text transparent
  // and drawing this overlay on top of it, so what is actually on screen is
  // the overlay's text - not the input's value.
  const onScreen = () =>
    Array.from(container.querySelectorAll('.ant-otp-mask-icon'))
      .map((icon) => icon.textContent)
      .join('');
  const type = async (text: string) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    [...text].forEach((character, index) => {
      const box = boxes()[index];
      act(() => {
        setter.call(box, character);
        box.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    await settle();
  };
  return {
    container,
    boxes,
    onScreen,
    type,
    latest: () => changes[changes.length - 1]?.verificationCode,
    toggle: () =>
      container.querySelector<HTMLButtonElement>('[data-password-toggle]'),
    clear: () =>
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Clear value"]'
      ),
    unmount: () => act(() => root.unmount()),
  };
};

describe('otp variant selection', () => {
  // A tester is handed the *root* schema and resolves the control's scope
  // itself, so these pass the whole document rather than the property.
  const rank = (uischema: any, schema: any = code()) =>
    passwordOtpControlTester(uischema, schema, { rootSchema: schema } as any);

  it('is selected by variant otp on a bounded password', () => {
    expect(rank(otpUi)).not.toBe(NOT_APPLICABLE);
  });

  it('outranks the plain password control', () => {
    expect(rank(otpUi)).toBeGreaterThan(4);
  });

  it('is not selected without the variant', () => {
    expect(rank(plainUi)).toBe(NOT_APPLICABLE);
  });

  it('is not selected on a string that is not a password', () => {
    const notSecret = {
      type: 'object',
      properties: {
        verificationCode: { type: 'string', minLength: 6, maxLength: 6 },
      },
    };
    expect(rank(otpUi, notSecret)).toBe(NOT_APPLICABLE);
  });

  it('requires both minLength and maxLength', () => {
    // A box-per-character editor has to know how many boxes to draw; guessing
    // would make the widget claim a length the schema does not require.
    expect(rank(otpUi, code({ maxLength: undefined }))).toBe(NOT_APPLICABLE);
    expect(rank(otpUi, code({ minLength: undefined }))).toBe(NOT_APPLICABLE);
    expect(rank(otpUi, code())).not.toBe(NOT_APPLICABLE);
  });

  it('resolves the length from the control scope, not the root schema', () => {
    // The root is an object and has no minLength of its own; reading `schema`
    // directly here meant the variant was never selected.
    expect(
      hasSegmentedLength(
        otpUi as any,
        code() as any,
        {
          rootSchema: code(),
        } as any
      )
    ).toBe(true);
  });

  it('takes the box count from maxLength', () => {
    expect(otpLength({ minLength: 4, maxLength: 4 } as any)).toBe(4);
    expect(otpLength({ minLength: 4, maxLength: 8 } as any)).toBe(8);
    expect(otpLength({ minLength: 0, maxLength: 0 } as any)).toBeUndefined();
    expect(otpLength(undefined)).toBeUndefined();
  });
});

describe('otp rendering', () => {
  it('draws one box per character of maxLength', () => {
    const { boxes, unmount } = render(code(), otpUi);
    expect(boxes()).toHaveLength(6);
    unmount();
  });

  it('follows maxLength rather than a fixed six', () => {
    const { boxes, unmount } = render(
      code({ minLength: 4, maxLength: 4 }),
      otpUi
    );
    expect(boxes()).toHaveLength(4);
    unmount();
  });

  it('falls back to an ordinary password field when the length is unbounded', () => {
    // Degrading to the rank-4 control, not to nothing.
    const { container, boxes, unmount } = render(
      {
        type: 'object',
        properties: {
          verificationCode: { type: 'string', format: 'password' },
        },
      },
      otpUi
    );
    expect(boxes()).toHaveLength(0);
    const field = container.querySelector<HTMLInputElement>('input')!;
    expect(field.type).toBe('password');
    expect(container.querySelector('[data-password-toggle]')).toBeTruthy();
    unmount();
  });

  it('names the group, since the boxes have no single label target', () => {
    const { container, unmount } = render(code(), otpUi);
    const group = container.querySelector('.ant-otp');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBe('Verification code');
    unmount();
  });

  it('shows the stored value across the boxes', () => {
    const { boxes, unmount } = render(code(), otpUi, {
      verificationCode: '482913',
    });
    expect(
      boxes()
        .map((box) => box.value)
        .join('')
    ).toBe('482913');
    unmount();
  });
});

describe('otp storage contract', () => {
  it('commits a partial code as it is typed', async () => {
    // antd fires onChange only once every box is filled, so a half-typed code
    // would leave the data holding the previous value while the screen showed
    // something else.
    const { type, latest, unmount } = render(code(), otpUi);
    await type('48');
    expect(latest()).toBe('48');
    await type('482913');
    expect(latest()).toBe('482913');
    unmount();
  });

  it('lets validation report a code that is too short', async () => {
    const { type, container, unmount } = render(code(), otpUi);
    await type('48');
    expect(container.textContent).toContain('must NOT have fewer than 6');
    unmount();
  });

  it('masks by default, and the mask is not the value itself', async () => {
    /*
      antd draws the mask as an overlay showing
      `typeof mask === 'string' ? mask : value`, over an input whose own text is
      `color: transparent`. So `mask={true}` - the obvious spelling - puts the
      real character on screen and hides nothing. The character has to be
      passed.
    */
    const { boxes, onScreen, unmount } = render(code(), otpUi, {
      verificationCode: '482913',
    });
    expect(boxes().map((box) => box.type)).toEqual(Array(6).fill('password'));
    expect(onScreen()).toBe('••••••');
    expect(onScreen()).not.toContain('4');
    unmount();
  });

  it('reveals the value without writing data', async () => {
    const { boxes, onScreen, toggle, latest, unmount } = render(code(), otpUi, {
      verificationCode: '482913',
    });
    await settle();
    const before = latest();
    expect(toggle()!.getAttribute('aria-label')).toBe('Show password');

    act(() => toggle()!.click());
    await settle();

    expect(toggle()!.getAttribute('aria-label')).toBe('Hide password');
    expect(boxes().map((box) => box.type)).toEqual(Array(6).fill('text'));
    expect(onScreen()).toBe('');
    expect(
      boxes()
        .map((box) => box.value)
        .join('')
    ).toBe('482913');
    expect(latest()).toBe(before);
    unmount();
  });

  it('hides the value again', async () => {
    // The half of the toggle that was broken: revealing worked, hiding did not,
    // because the value had never been masked in the first place.
    const { onScreen, toggle, unmount } = render(code(), otpUi, {
      verificationCode: '482913',
    });
    act(() => toggle()!.click());
    await settle();
    act(() => toggle()!.click());
    await settle();
    expect(onScreen()).toBe('••••••');
    unmount();
  });

  it('clears the value', async () => {
    const { clear, latest, unmount } = render(code(), otpUi, {
      verificationCode: '482913',
    });
    expect(clear()).toBeTruthy();
    act(() => clear()!.click());
    await settle();
    expect(latest()).toBeUndefined();
    unmount();
  });

  it('offers no clear button without a value', () => {
    const { clear, unmount } = render(code(), otpUi);
    expect(clear()).toBeNull();
    unmount();
  });
});
