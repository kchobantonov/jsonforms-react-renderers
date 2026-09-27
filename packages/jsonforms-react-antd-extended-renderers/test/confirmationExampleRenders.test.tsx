import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import config from '../../jsonforms-react-demo-common/src/examples/spec/destructive-confirmation/config.json';
import data from '../../jsonforms-react-demo-common/src/examples/spec/destructive-confirmation/data.json';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/destructive-confirmation/schema.json';
import uischema from '../../jsonforms-react-demo-common/src/examples/spec/destructive-confirmation/uischema.json';
import { flushUntil } from './support/flush';

/*
  The confirmation fixture claims to exercise *every* renderer that discards
  data. That claim is only worth making if the fixture actually draws all of
  them, so this renders it with the renderer set the demo uses - base plus
  extended, since the grid lives on this side - and checks each affordance is
  there and reaches the policy.

  The per-renderer mechanics are pinned in the antd package's
  `arrayDeleteConfirmation` and `confirmationRenderers` suites, and the grid's
  in `gridDeleteConfirmation`. What this adds is that the documented example is
  not quietly missing one.
*/

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

const draw = async () => {
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
          uischema={uischema as any}
          config={config}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );
  // This fixture mounts every renderer at once, so the lazy grid resolves
  // well after the rest; the default budget is not enough on a cold module
  // cache.
  await flushUntil(() => container.querySelectorAll('.ag-row').length > 0, 120);
  await settle();
  return {
    container,
    prompted: () =>
      document.querySelector('[data-confirm]')?.getAttribute('data-confirm'),
    stored: () => latest,
    unmount: () => act(() => root.unmount()),
  };
};

const labelled = (scope: ParentNode, prefix: string) =>
  Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).filter(
    (button) => (button.getAttribute('aria-label') ?? '').startsWith(prefix)
  );

describe('the destructive-confirmation spec example', () => {
  it('draws every renderer the policy covers', async () => {
    const { container, unmount } = await draw();
    /*
      Each assertion names the renderer the fixture is supposed to have picked,
      not merely "something rendered" - the whole point of the example is that
      the policy reaches all of them, and a scope that quietly fell through to
      a different renderer would still draw a control.
    */
    // Order lines and Scratch lines: the array table.
    expect(container.querySelectorAll('.ant-table')).toHaveLength(2);
    // Route stops: the expandable array layout, one panel per item.
    const panels = Array.from(
      container.querySelectorAll('.ant-collapse-header')
    ).map((header) => header.textContent ?? '');
    expect(panels.some((text) => text.includes('Portland'))).toBe(true);
    expect(panels.some((text) => text.includes('Salem'))).toBe(true);
    // Drivers: list with detail.
    expect(container.querySelectorAll('.ant-listy')).toHaveLength(1);
    expect(container.textContent).toContain('A. Ferreira');
    // Charges: the AG Grid, which is the extended package's renderer.
    expect(container.querySelectorAll('.ag-row')).toHaveLength(3);
    // Payload: the mixed workspace. Reference is mixed too, hence two selectors.
    expect(container.querySelectorAll('.jsonforms-mixed-tree')).toHaveLength(1);
    expect(
      container.querySelectorAll('.jsonforms-mixed-type-selector').length
    ).toBeGreaterThanOrEqual(2);
    // Dispatch notes, and the payload's own dynamic properties.
    expect(labelled(container, 'Add property').length).toBeGreaterThanOrEqual(2);
    expect(labelled(container, 'Delete').length).toBeGreaterThan(0);
    unmount();
  });

  /*
    The point of prepopulating `payload` with a nonempty object, a nonempty
    array and an empty one: `complex` can be told apart from `always` without
    the reader having to build the value first.
  */
  it('gives the mixed payload both a complex and a non-complex child', async () => {
    const { container, stored, unmount } = await draw();
    const payload = stored().payload;
    expect(payload.route).toEqual({
      origin: 'Portland',
      destination: 'Salem',
    });
    expect(payload.legs).toHaveLength(2);
    expect(payload.blank).toEqual({});
    expect(typeof payload.carrier).toBe('string');
    // All four are reachable in the tree, which is what makes them testable.
    const tree = container.querySelector('.jsonforms-mixed-tree');
    expect(labelled(tree!, 'Delete').length).toBeGreaterThanOrEqual(3);
    unmount();
  });

  it('prompts when a tree node is deleted', async () => {
    const { container, prompted, unmount } = await draw();
    const tree = container.querySelector('.jsonforms-mixed-tree');
    const button = labelled(tree!, 'Delete route')[0];
    expect(button).toBeTruthy();
    act(() => button.click());
    await settle();
    expect(prompted()).toBe('delete');
    unmount();
  });

  /*
    The fixture's config sets `default: "always"` with
    `renderers.mixed.typeChange: "complex"`. Deleting a row is the `always`
    half of that.
  */
  it('prompts when an order line is deleted', async () => {
    const { container, stored, unmount } = await draw();
    // The code is the *value* of a cell input, so `textContent` does not see
    // it; the row is found through the input instead.
    const row = Array.from(
      container.querySelectorAll<HTMLInputElement>('tr input')
    ).find((input) => input.value === 'A-01')?.closest('tr');
    expect(row, 'the order-lines row is not in the fixture').toBeTruthy();
    const button = Array.from(
      row!.querySelectorAll<HTMLButtonElement>('button')
    ).find((entry) =>
      (entry.getAttribute('aria-label') ?? '').toLowerCase().includes('delete')
    );
    expect(button, 'the order-lines table has no row delete').toBeTruthy();
    act(() => button!.click());
    await settle();
    /*
      The array table keeps the dialog it inherited from the upstream antd
      renderers, so this one is not the shared `[data-confirm]` element - only
      the *decision* is shared. Section 14 governs whether to ask, not which
      component asks.
    */
    expect(document.querySelector('.ant-modal')).toBeTruthy();
    expect(stored().lines).toHaveLength(1);
    unmount();
  });
});
