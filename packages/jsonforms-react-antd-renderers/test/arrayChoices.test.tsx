import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  `variant: "multi-select"` and `variant: "chips"` - the two project extensions
  over the same array-of-choices shapes the automatic checkbox group already
  handles.

  Most of what the specification asks for here is about **identity**: which
  stored value an interaction refers to. `1` and `"1"` are different choices,
  `false` and `0` are values rather than removal signals, and where duplicates
  are permitted a removal has to take the occurrence that was clicked.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const enumItems = (extra: Record<string, unknown> = {}) => ({
  type: 'array',
  uniqueItems: true,
  items: { type: 'string', enum: ['Email', 'SMS', 'Post'] },
  ...extra,
});

const freeItems = (extra: Record<string, unknown> = {}) => ({
  type: 'array',
  items: { type: 'string', minLength: 1 },
  ...extra,
});

const root = (value: any) => ({ type: 'object', properties: { value } });

// ------------------------------------------------------------------ selection

// ----------------------------------------------------------------- rendering

const render = (value: any, data: any, variant: string, options?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const rootNode = createRoot(container);
  let latest: any = data;
  act(() =>
    rootNode.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={root(value) as any}
          uischema={
            {
              type: 'Control',
              scope: '#/properties/value',
              options: { variant, ...(options ?? {}) },
            } as any
          }
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );
  return {
    container,
    chips: () =>
      Array.from(container.querySelectorAll<HTMLElement>('[data-chip]')),
    input: () =>
      container.querySelector<HTMLInputElement>('[data-chips-input] input') ??
      container.querySelector<HTMLInputElement>('input[data-chips-input]'),
    stored: () => latest.value,
    unmount: () => act(() => rootNode.unmount()),
  };
};

describe('the chips control', () => {
  it('draws one tag per stored value, in order', async () => {
    const { chips, unmount } = render(
      freeItems(),
      { value: ['a', 'b'] },
      'chips'
    );
    await settle();
    expect(
      chips().map((chip) => chip.textContent?.replace(/\s*$/, ''))
    ).toEqual(['a', 'b']);
    unmount();
  });

  it('draws a tag for each of two equal values', async () => {
    // A Select in tags mode would show one; the array holds two.
    const { chips, unmount } = render(
      freeItems(),
      { value: ['a', 'a'] },
      'chips'
    );
    await settle();
    expect(chips()).toHaveLength(2);
    unmount();
  });

  it('removes the occurrence that was closed, not the first match', async () => {
    const { chips, stored, unmount } = render(
      freeItems(),
      { value: ['keep', 'drop', 'keep'] },
      'chips'
    );
    await settle();
    const close = chips()[2].querySelector<HTMLElement>('.ant-tag-close-icon');
    act(() => close!.click());
    await settle();
    await settle();
    expect(stored()).toEqual(['keep', 'drop']);
    unmount();
  });

  it('commits a typed token only on Enter', async () => {
    const { container, stored, unmount } = render(
      freeItems(),
      { value: [] },
      'chips'
    );
    await settle();
    const field = container.querySelector<HTMLInputElement>('input')!;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    act(() => {
      setter.call(field, 'partial');
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    // Still a draft.
    expect(stored()).toEqual([]);

    act(() => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
    });
    await settle();
    await settle();
    expect(stored()).toEqual(['partial']);
    unmount();
  });

  it('offers a chooser rather than free entry when the items are finite', async () => {
    const { container, unmount } = render(enumItems(), { value: [] }, 'chips');
    await settle();
    expect(container.querySelector('[data-chips-select]')).toBeTruthy();
    expect(container.querySelector('[data-chips-input]')).toBeNull();
    unmount();
  });

  it('keeps a stored value the choices do not contain', async () => {
    const { chips, stored, unmount } = render(
      enumItems(),
      { value: ['Email', 'Carrier pigeon'] },
      'chips'
    );
    await settle();
    expect(chips()).toHaveLength(2);
    expect(stored()).toEqual(['Email', 'Carrier pigeon']);
    unmount();
  });

  it('stops removing at minItems while restrict is on', async () => {
    const { chips, unmount } = render(
      freeItems({ minItems: 2 }),
      { value: ['a', 'b'] },
      'chips',
      { restrict: true }
    );
    await settle();
    expect(chips()[0].querySelector('.ant-tag-close-icon')).toBeNull();
    unmount();
  });
});

describe('the multi-select control', () => {
  it('renders the stored values as the selection', async () => {
    const { container, unmount } = render(
      enumItems(),
      { value: ['Email', 'SMS'] },
      'multi-select'
    );
    await settle();
    expect(container.querySelector('[data-multi-select]')).toBeTruthy();
    expect(container.textContent).toContain('Email');
    expect(container.textContent).toContain('SMS');
    unmount();
  });

  it('shows a oneOf branch title while storing its constant', async () => {
    const { container, stored, unmount } = render(
      {
        type: 'array',
        uniqueItems: true,
        items: {
          oneOf: [
            { const: 'eng', title: 'Engineering' },
            { const: 'fin', title: 'Finance' },
          ],
        },
      },
      { value: ['eng'] },
      'multi-select'
    );
    await settle();
    expect(container.textContent).toContain('Engineering');
    expect(stored()).toEqual(['eng']);
    unmount();
  });

  it('keeps a stored value outside the permitted set', async () => {
    const { container, stored, unmount } = render(
      enumItems(),
      { value: ['Email', 'Carrier pigeon'] },
      'multi-select'
    );
    await settle();
    expect(container.textContent).toContain('Carrier pigeon');
    expect(stored()).toEqual(['Email', 'Carrier pigeon']);
    unmount();
  });
});
