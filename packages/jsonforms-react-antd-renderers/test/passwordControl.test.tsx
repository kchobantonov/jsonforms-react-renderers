import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { createTranslator, NOT_APPLICABLE } from '@jsonforms/core';
import { antdRenderers, antdCells } from '../src';
import { passwordControlTester } from '../src/controls/PasswordControl';

const render = (schema: any, uischema: any, data: any, i18n?: any) => {
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
        i18n={i18n}
        onChange={(e) => changes.push(e.data)}
      />
    )
  );
  return {
    container,
    changes,
    input: container.querySelector<HTMLInputElement>('input'),
    toggle: container.querySelector<HTMLButtonElement>(
      '[data-password-toggle]'
    ),
    unmount: () => act(() => root.unmount()),
  };
};

const stringSchema = {
  type: 'object',
  properties: { secret: { type: 'string' } },
};
const formatSchema = {
  type: 'object',
  properties: { secret: { type: 'string', format: 'password' } },
};
const plain = { type: 'Control', scope: '#/properties/secret' };
const uiFormat = { ...plain, options: { format: 'password' } };

describe('password selection', () => {
  it('is selected by the schema format', () => {
    expect(
      passwordControlTester(
        plain as any,
        formatSchema.properties.secret as any,
        undefined
      )
    ).not.toBe(NOT_APPLICABLE);
  });

  it('is selected by the UI option on a plain string', () => {
    // The gap this closes: supporting only the schema format left
    // `options.format: "password"` rendering in clear text.
    expect(
      passwordControlTester(
        uiFormat as any,
        stringSchema.properties.secret as any,
        undefined
      )
    ).not.toBe(NOT_APPLICABLE);
  });

  it('does not claim an ordinary string, or a non-string', () => {
    expect(
      passwordControlTester(
        plain as any,
        stringSchema.properties.secret as any,
        undefined
      )
    ).toBe(NOT_APPLICABLE);
    expect(
      passwordControlTester(
        uiFormat as any,
        { type: 'number' } as any,
        undefined
      )
    ).toBe(NOT_APPLICABLE);
  });

  it.each([
    ['schema format', formatSchema, plain],
    ['UI option', stringSchema, uiFormat],
  ])('renders an obscured input via %s', (_l, schema, uischema) => {
    const { input, unmount } = render(schema, uischema, { secret: 'hunter2' });
    expect(input!.getAttribute('type')).toBe('password');
    unmount();
  });
});

describe('reveal and hide', () => {
  it('starts obscured and toggles presentation only', () => {
    const { input, toggle, changes, unmount } = render(formatSchema, plain, {
      secret: 'hunter2',
    });
    expect(input!.getAttribute('type')).toBe('password');
    const before = changes.length;

    act(() => toggle!.click());
    expect(document.querySelector('input')!.getAttribute('type')).toBe('text');

    // Toggling must not write data, fire a change or alter validation.
    expect(changes.length).toBe(before);
    unmount();
  });

  it('names the action it will perform, and that name changes with it', () => {
    const { toggle, unmount } = render(formatSchema, plain, { secret: 'x' });
    expect(toggle!.getAttribute('aria-label')).toBe('Show password');
    act(() => toggle!.click());
    expect(
      document
        .querySelector<HTMLElement>('[data-password-toggle]')!
        .getAttribute('aria-label')
    ).toBe('Hide password');
    unmount();
  });

  it('is a real focusable button, not an unlabelled span', () => {
    const { toggle, unmount } = render(formatSchema, plain, { secret: 'x' });
    expect(toggle!.tagName).toBe('BUTTON');
    expect(toggle!.tabIndex).toBe(0);
    unmount();
  });

  it('translates the toggle name', () => {
    const { toggle, unmount } = render(
      formatSchema,
      plain,
      { secret: 'x' },
      {
        locale: 'bg',
        translate: createTranslator((key, fallback) =>
          key === 'password.show' ? 'Покажи паролата' : fallback
        ),
      }
    );
    expect(toggle!.getAttribute('aria-label')).toBe('Покажи паролата');
    unmount();
  });

  it('keeps reveal state out of the data', () => {
    const { toggle, changes, unmount } = render(formatSchema, plain, {
      secret: 'x',
    });
    act(() => toggle!.click());
    expect(changes.every((d) => Object.keys(d).join() === 'secret')).toBe(true);
    unmount();
  });
});

describe('password in a table cell', () => {
  it('stays masked, rather than falling through to the text cell', () => {
    const { container, unmount } = render(
      {
        type: 'object',
        properties: {
          accounts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user: { type: 'string' },
                secret: { type: 'string', format: 'password' },
              },
            },
          },
        },
      },
      {
        type: 'Control',
        scope: '#/properties/accounts',
        options: { table: true },
      },
      { accounts: [{ user: 'jdoe', secret: 'hunter2' }] }
    );
    const types = Array.from(
      container.querySelectorAll<HTMLInputElement>('input')
    ).map((i) => i.getAttribute('type'));
    expect(types).toContain('password');
    unmount();
  });
});

describe('reveal and clear stay separate', () => {
  it('are two controls with different names', () => {
    const { container, toggle, unmount } = render(formatSchema, plain, {
      secret: 'hunter2',
    });
    const clear = container.querySelector<HTMLElement>(
      'button[aria-label="Clear value"]'
    );
    expect(clear).toBeTruthy();
    expect(toggle).toBeTruthy();
    expect(clear).not.toBe(toggle);
    expect(clear!.getAttribute('aria-label')).not.toBe(
      toggle!.getAttribute('aria-label')
    );
    unmount();
  });
});

describe('trailing affordances do not collide', () => {
  const invalid = {
    type: 'object',
    properties: {
      secret: { type: 'string', format: 'password', minLength: 8 },
    },
  };

  it('puts the clear button in the suffix, not on top of the reveal toggle', () => {
    // Overlaying it landed the clear icon on the reveal icon, and the error
    // icon on both. `Input` composes its `suffix` with the feedback icon, so
    // antd lays the three out instead.
    const { container, unmount } = render(formatSchema, plain, {
      secret: 'hunter2',
    });
    const clear = container.querySelector<HTMLElement>(
      'button[aria-label="Clear value"]'
    )!;
    expect(clear.closest('.ant-input-suffix')).toBeTruthy();
    expect(clear.style.position).not.toBe('absolute');
    unmount();
  });

  it('shows reveal, clear and the error icon side by side when invalid', () => {
    const { container, unmount } = render(invalid, plain, { secret: 'short' });
    const suffix = container.querySelector('.ant-input-suffix')!;
    expect(suffix.querySelector('[data-password-toggle]')).toBeTruthy();
    expect(
      suffix.querySelector('button[aria-label="Clear value"]')
    ).toBeTruthy();
    expect(suffix.querySelector('.ant-form-item-feedback-icon')).toBeTruthy();
    // All three in one flex row: none of them is taken out of the flow, which
    // is what made them stack in the same corner.
    const positioned = Array.from(
      suffix.querySelectorAll<HTMLElement>('*')
    ).filter((element) => element.style.position === 'absolute');
    expect(positioned).toEqual([]);
    unmount();
  });

  it('keeps the reveal toggle when there is no value to clear', () => {
    const { container, toggle, unmount } = render(formatSchema, plain, {});
    expect(toggle).toBeTruthy();
    expect(
      container.querySelector('button[aria-label="Clear value"]')
    ).toBeNull();
    unmount();
  });
});
