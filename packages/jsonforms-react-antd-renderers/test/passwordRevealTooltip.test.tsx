import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

// An antd Tooltip cannot be opened in jsdom: rc-trigger needs layout APIs jsdom
// does not implement, and no pointer or focus event opens one. Replace it with
// a stub that renders its title, which checks the wiring rather than the hover.
vi.mock('antd', async () => {
  const antd = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...antd,
    Tooltip: ({ title, children }: any) => (
      <span data-tooltip={String(title)}>{children}</span>
    ),
  };
});

const schema = {
  type: 'object',
  properties: {
    password: { type: 'string', format: 'password', title: 'Password' },
    code: {
      type: 'string',
      format: 'password',
      title: 'Code',
      minLength: 4,
      maxLength: 4,
    },
  },
};

const render = (uischema: any, data: any = { password: 'hunter2' }) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema as any}
        uischema={uischema}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={() => undefined}
      />
    )
  );
  const toggle = () =>
    container.querySelector<HTMLButtonElement>('[data-password-toggle]')!;
  return {
    container,
    toggle,
    tip: () => toggle().closest('[data-tooltip]')?.getAttribute('data-tooltip'),
    unmount: () => act(() => root.unmount()),
  };
};

const passwordUi = { type: 'Control', scope: '#/properties/password' };
const otpUi = {
  type: 'Control',
  scope: '#/properties/code',
  options: { variant: 'otp' },
};

describe('the reveal toggle carries a tooltip', () => {
  it('names the action it will perform', () => {
    // antd renders no tooltip on its own reveal icon - it sets an aria-label
    // and stops - so this is ours to supply. The clear button beside it has
    // had one all along; an icon with no visible name is guessable at best.
    const { tip, unmount } = render(passwordUi);
    expect(tip()).toBe('Show password');
    unmount();
  });

  it('follows the state, like the accessible name', () => {
    const { tip, toggle, unmount } = render(passwordUi);
    act(() => toggle().click());
    expect(tip()).toBe('Hide password');
    unmount();
  });

  it('matches the accessible name exactly', () => {
    // Two different strings for one control is worse than one: a screen
    // reader would announce one and a sighted user read the other.
    const { tip, toggle, unmount } = render(passwordUi);
    expect(tip()).toBe(toggle().getAttribute('aria-label'));
    unmount();
  });

  it('is there on the otp variant too', () => {
    const { tip, unmount } = render(otpUi, { code: '4829' });
    expect(tip()).toBe('Show password');
    unmount();
  });
});

describe('the reveal toggle is a single control', () => {
  it('is not nested inside another button', () => {
    /*
      antd 6's `Input.Password` wraps `iconRender`'s output in a span that is
      itself role="button", focusable and labelled from antd's own locale. A
      real button inside it - which is where the accessible name has to live -
      meant two tab stops for one action and two names for it, "Show" and
      "Show password".
    */
    const { container, toggle, unmount } = render(passwordUi);
    expect(toggle().closest('[role="button"]')).toBeNull();
    expect(container.querySelector('.ant-input-password-icon')).toBeNull();
    unmount();
  });

  it('is the only focusable control in the suffix besides clear', () => {
    const { container, unmount } = render(passwordUi);
    const suffix = container.querySelector('.ant-input-suffix')!;
    const focusable = Array.from(
      suffix.querySelectorAll<HTMLElement>('[tabindex], button')
    ).filter((element) => element.tabIndex >= 0);
    expect(
      focusable.map((element) => element.getAttribute('aria-label'))
    ).toEqual(['Show password', 'Clear value']);
    unmount();
  });

  it('still masks and reveals the value', () => {
    const { container, toggle, unmount } = render(passwordUi);
    const field = () => container.querySelector<HTMLInputElement>('input')!;
    expect(field().type).toBe('password');
    act(() => toggle().click());
    expect(field().type).toBe('text');
    act(() => toggle().click());
    expect(field().type).toBe('password');
    unmount();
  });
});
