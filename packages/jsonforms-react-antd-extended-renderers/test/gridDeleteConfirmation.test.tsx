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
import { flushUntil } from './support/flush';

/*
  The AG Grid's selected-row removal is the one confirmation that crosses the
  package boundary: the renderer itself is framework-agnostic and knows only
  that something would be discarded, while the policy, the dialog and the
  `agGrid` catalog id are injected from this side through
  `useRemoveConfirmation`. Wiring it to nothing at all still compiles and still
  deletes - silently - so this is the guard for the seam being connected.

  It is also the only batch case: several selected rows, one prompt.
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

const schema = {
  type: 'object',
  properties: {
    charges: {
      type: 'array',
      title: 'Charges',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', title: 'Charge' },
          amount: { type: 'number', title: 'Amount' },
        },
      },
    },
  },
};

const rows = () => [
  { label: 'Consulting', amount: 1240 },
  { label: 'Support fee', amount: 185.5 },
  { label: 'Additional support', amount: 0 },
];

const draw = async (options: any = {}, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = { charges: rows() };
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={latest}
          schema={schema as any}
          uischema={
            {
              type: 'Control',
              scope: '#/properties/charges',
              options: { variant: 'ag-grid', ...options },
            } as any
          }
          config={config}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={({ data }) => {
            latest = data;
          }}
        />
      </ConfigProvider>
    )
  );
  // The grid renderer is lazy and ag-grid fills its cells asynchronously.
  await flushUntil(() => container.querySelectorAll('.ag-row').length > 0);

  const removeButton = () =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) =>
        (button.getAttribute('aria-label') ?? '')
          .toLowerCase()
          .includes('remove')
    );

  return {
    container,
    selectRows: async (count: number) => {
      /*
        `rowSelection: { mode: 'multiRow' }` adds a checkbox column; a click on
        an ordinary cell selects nothing, which is why this drives the
        checkboxes. The header's select-all lives outside `.ag-row`.
      */
      const boxes = Array.from(
        container.querySelectorAll<HTMLInputElement>(
          '.ag-row .ag-selection-checkbox input'
        )
      );
      expect(boxes.length).toBeGreaterThanOrEqual(count);
      for (const box of boxes.slice(0, count)) {
        act(() => box.click());
      }
      await settle();
    },
    clickRemove: async () => {
      const button = removeButton();
      expect(button, 'no remove action was rendered').toBeTruthy();
      expect(button!.disabled, 'remove was disabled: nothing is selected').toBe(
        false
      );
      act(() => button!.click());
      await settle();
    },
    dialogs: () =>
      document.querySelectorAll('.ant-modal-confirm, [data-confirm]'),
    prompted: () => Boolean(document.querySelector('[data-confirm]')),
    accept: async () => {
      const ok = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button')
      ).find((button) => button.textContent?.includes('Yes'));
      act(() => ok!.click());
      await settle();
      await settle();
    },
    stored: () => latest.charges,
    unmount: () => act(() => root.unmount()),
  };
};

describe('removing selected grid rows', () => {
  it('asks first, and removes nothing yet', async () => {
    const grid = await draw();
    await grid.selectRows(1);
    await grid.clickRemove();
    expect(grid.prompted()).toBe(true);
    expect(grid.stored()).toHaveLength(3);
    grid.unmount();
  });

  it('removes them once confirmed', async () => {
    const grid = await draw();
    await grid.selectRows(1);
    await grid.clickRemove();
    await grid.accept();
    expect(grid.stored()).toHaveLength(2);
    grid.unmount();
  });

  /* "For batches, one confirmation covers the operation." */
  it('asks exactly once for several rows, and removes all of them', async () => {
    const grid = await draw();
    await grid.selectRows(2);
    await grid.clickRemove();
    expect(grid.dialogs()).toHaveLength(1);
    await grid.accept();
    expect(grid.stored()).toHaveLength(1);
    grid.unmount();
  });

  it('skips the prompt when the element says never', async () => {
    const grid = await draw({ confirmation: { delete: 'never' } });
    await grid.selectRows(1);
    await grid.clickRemove();
    expect(grid.prompted()).toBe(false);
    // Proves the removal itself is wired up, so the tests above are not
    // passing merely because nothing can ever be removed.
    expect(grid.stored()).toHaveLength(2);
    grid.unmount();
  });

  /*
    The catalog id is supplied by this package, not by the agnostic renderer -
    so a config entry naming `agGrid` is what proves it arrived.
  */
  it('honours a config entry naming the agGrid catalog id', async () => {
    const grid = await draw(
      {},
      {
        jsonformsExtended: {
          confirmation: { renderers: { agGrid: { delete: 'never' } } },
        },
      }
    );
    await grid.selectRows(1);
    await grid.clickRemove();
    expect(grid.prompted()).toBe(false);
    expect(grid.stored()).toHaveLength(2);
    grid.unmount();
  });

  /* `complex` inspects the rows themselves; a row object is a complex value. */
  it('still asks under complex, because a row is a nonempty object', async () => {
    const grid = await draw({ confirmation: { delete: 'complex' } });
    await grid.selectRows(1);
    await grid.clickRemove();
    expect(grid.prompted()).toBe(true);
    grid.unmount();
  });
});
