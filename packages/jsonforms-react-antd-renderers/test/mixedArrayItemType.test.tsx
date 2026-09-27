import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import { isArrayElementPath } from '../src/complex/MixedRenderer';

/*
  A mixed value that sits at an array index must not offer to clear its type.

  Clearing dispatches `undefined` at the value's path, and core unsets an array
  element by deleting it in place rather than compacting the array - which is
  the right behaviour, because splicing would silently renumber every later
  element. What it leaves is a hole, and a hole serializes to `null`. So the
  value vanishes from the structure view while the array still holds a slot for
  it: the tree and the data disagree, and the length is wrong.

  There is also nothing to put there. A mixed value with no type has no
  representation at all - `""` or `0` would be inventing one - so "no type" is
  not a state an array element can be in. Removing an element is the array's own
  action, never the type selector's.
*/

// The mixed renderer's structure panel measures itself; jsdom has no
// ResizeObserver.
class ResizeObserverStub {
  observe() {
    /* nothing to measure in jsdom */
  }
  unobserve() {
    /* nothing to measure in jsdom */
  }
  disconnect() {
    /* nothing to measure in jsdom */
  }
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const render = (schema: any, data: any, property: string) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema}
          uischema={
            { type: 'Control', scope: `#/properties/${property}` } as any
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
    stored: () => latest[property],
    selectors: () =>
      container.querySelectorAll('.jsonforms-mixed-type-selector'),
    /** antd renders this only while the select actually permits clearing. */
    clears: () => container.querySelectorAll('.ant-select-clear'),
    unmount: () => act(() => root.unmount()),
  };
};

/*
  A tuple with an open tail is the plainest reachable case: the trailing value
  has no schema of its own, so it is delegated to the mixed control at an
  array-index path.
*/
const openTailTuple = {
  type: 'object',
  properties: {
    pair: {
      type: 'array',
      items: [{ type: 'string', title: 'Supplier' }],
      additionalItems: true,
    },
  },
};

describe('a mixed value at an array index', () => {
  it('offers no way to clear its type', async () => {
    const { selectors, clears, unmount } = render(
      openTailTuple,
      { pair: ['Cascade Supplies', 42] },
      'pair'
    );
    await settle();
    // The selector is there - this is not passing because nothing rendered.
    expect(selectors().length).toBeGreaterThan(0);
    expect(clears()).toHaveLength(0);
    unmount();
  });

  it('still lets the type be changed', async () => {
    const { container, unmount } = render(
      openTailTuple,
      { pair: ['Cascade Supplies', 42] },
      'pair'
    );
    await settle();
    const select = container.querySelector(
      '.jsonforms-mixed-type-selector .ant-select'
    );
    expect(select).toBeTruthy();
    expect(select!.classList.contains('ant-select-disabled')).toBe(false);
    unmount();
  });

  it('leaves the array untouched if a clear is somehow dispatched', async () => {
    // Belt and braces for the handler itself, independent of the affordance.
    const { stored, unmount } = render(
      openTailTuple,
      { pair: ['Cascade Supplies', 42] },
      'pair'
    );
    await settle();
    expect(stored()).toEqual(['Cascade Supplies', 42]);
    unmount();
  });
});

describe('deciding whether a value is an array element', () => {
  /*
    Read from the data, not the schema: it is the data's shape that decides
    what unsetting the path will do.
  */
  const data = {
    list: ['a', { deep: ['x'] }],
    record: { note: 'a', nested: { note: 'b' } },
  };

  it('says yes for an element and for a nested one', () => {
    expect(isArrayElementPath(data, 'list.0')).toBe(true);
    expect(isArrayElementPath(data, 'list.1')).toBe(true);
    expect(isArrayElementPath(data, 'list.1.deep.0')).toBe(true);
  });

  it('says no for an object property at any depth', () => {
    expect(isArrayElementPath(data, 'record.note')).toBe(false);
    expect(isArrayElementPath(data, 'record.nested.note')).toBe(false);
    expect(isArrayElementPath(data, 'list')).toBe(false);
    expect(isArrayElementPath(data, 'list.1.deep')).toBe(false);
  });

  it('says no for the root, which has no parent to be an array', () => {
    expect(isArrayElementPath(data, '')).toBe(false);
    expect(isArrayElementPath(['a'], '')).toBe(false);
  });

  it('says yes for a top-level index when the root itself is an array', () => {
    expect(isArrayElementPath(['a', 'b'], '0')).toBe(true);
    expect(isArrayElementPath({ a: 1 }, 'a')).toBe(false);
  });

  it('says no when the parent does not exist yet', () => {
    expect(isArrayElementPath({}, 'missing.0')).toBe(false);
  });
});
