import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  `options.autocomplete` - searchable finite choices.

  Two things the specification is firm about, and neither is what the widget
  looks like: "searchability does not mean accepting arbitrary new values", and
  "a searchable renderer must define how the displayed choices respond to the
  query, including labels, locale, and empty results."

  This family defaults searching **off**, which section 18 permits ("no
  universal default is imposed") and which differs from Material. See
  Adjustment 16.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema = {
  type: 'object',
  properties: {
    department: {
      type: 'string',
      oneOf: [
        { const: 'eng', title: 'Engineering' },
        { const: 'fin', title: 'Finance' },
        { const: 'ops', title: 'Operations' },
      ],
    },
    speed: { type: 'string', enum: ['Standard', 'Express'] },
  },
};

const render = ({
  property = 'department',
  options,
  config,
  data = {},
}: {
  property?: string;
  options?: Record<string, unknown>;
  config?: Record<string, unknown>;
  data?: any;
} = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={
            {
              type: 'Control',
              scope: `#/properties/${property}`,
              ...(options ? { options } : {}),
            } as any
          }
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );

  const search = () =>
    container.querySelector<HTMLInputElement>(
      'input.ant-select-selection-search-input'
    ) ?? container.querySelector<HTMLInputElement>('.ant-select input');

  return {
    container,
    search,
    /** antd marks a searchable select on the wrapper. */
    searchable: () =>
      Boolean(container.querySelector('.ant-select-show-search')),
    stored: () => latest[property],
    unmount: () => act(() => root.unmount()),
  };
};

describe('the family default', () => {
  it('is not searchable', async () => {
    const { searchable, unmount } = render();
    await settle();
    expect(searchable()).toBe(false);
    unmount();
  });

  it('is unchanged by an explicit false', async () => {
    const { searchable, unmount } = render({
      options: { autocomplete: false },
    });
    await settle();
    expect(searchable()).toBe(false);
    unmount();
  });
});

describe('opting in', () => {
  it('makes the choices searchable', async () => {
    const { searchable, unmount } = render({ options: { autocomplete: true } });
    await settle();
    expect(searchable()).toBe(true);
    unmount();
  });

  it('can be switched on for the whole form from config', async () => {
    const { searchable, unmount } = render({ config: { autocomplete: true } });
    await settle();
    expect(searchable()).toBe(true);
    unmount();
  });

  /*
    Only `true` enables it, so an element `false` beats a config `true` - the
    case a truthiness merge would get wrong.
  */
  it('lets an element false override a config true', async () => {
    const { searchable, unmount } = render({
      config: { autocomplete: true },
      options: { autocomplete: false },
    });
    await settle();
    expect(searchable()).toBe(false);
    unmount();
  });

  it('gives the search box a real input to type into', async () => {
    const { search, unmount } = render({ options: { autocomplete: true } });
    await settle();
    expect(search()).toBeTruthy();
    expect(search()!.readOnly).toBe(false);
    unmount();
  });
});

describe('what searching does and does not do', () => {
  it('does not turn the search text into a value', async () => {
    const { search, stored, unmount } = render({
      options: { autocomplete: true },
    });
    await settle();
    const field = search()!;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    act(() => {
      setter.call(field, 'Marketing');
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    act(() => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
    });
    await settle();
    await settle();
    // "Search text is not itself a new allowed value."
    expect(stored()).toBeUndefined();
    unmount();
  });

  it('still stores the constant when a branch is chosen', async () => {
    const { container, stored, unmount } = render({
      options: { autocomplete: true },
      data: { department: 'eng' },
    });
    await settle();
    // The label is shown; the constant is what is stored.
    expect(container.textContent).toContain('Engineering');
    expect(stored()).toBe('eng');
    unmount();
  });
});
