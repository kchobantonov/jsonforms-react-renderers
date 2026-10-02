import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  Every array renderer's row delete must reach the confirmation policy with the
  **value it would discard**.

  This is a regression guard for one specific trap, which has now been walked
  into twice. On an array control, `props.data` is the item **count**, not the
  array - so `props.data[rowIndex]` is `undefined`, the policy is told there is
  nothing to lose, and `always` decides not to prompt. The row then disappears
  with no dialog at all, which is worse than the behaviour that was there
  before the policy existed.

  Each renderer is checked twice: that it prompts and keeps the row, and that
  `confirmation: { delete: "never" }` skips the prompt and removes it. The
  second half is what makes the first non-vacuous - without it, a renderer that
  simply never deleted anything would pass.
*/

// The collapsible array layout measures its panels; jsdom has no
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

/** A flat row: no nesting, so the table renderer wins. */
const tableSchema = {
  type: 'object',
  properties: {
    rows: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          quantity: { type: 'integer' },
        },
      },
    },
  },
};

/** A nested row, which the expandable array layout takes instead. */
const layoutSchema = {
  type: 'object',
  properties: {
    rows: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          address: {
            type: 'object',
            properties: { city: { type: 'string' } },
          },
        },
      },
    },
  },
};

const rows = () => [
  { code: 'A-01', quantity: 3, address: { city: 'Portland' } },
  { code: 'B-02', quantity: 1, address: { city: 'Salem' } },
];

const render = (schema: any, uischema: any, options?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = { rows: rows() };
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={latest}
          schema={schema}
          uischema={options ? { ...uischema, options } : uischema}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data }) => {
            latest = data;
          }}
        />
      </ConfigProvider>
    )
  );

  const deleteButton = () =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) =>
        (button.getAttribute('aria-label') ?? '')
          .toLowerCase()
          .includes('delete') ||
        (button.getAttribute('aria-label') ?? '')
          .toLowerCase()
          .includes('remove')
    );

  return {
    container,
    clickDelete: async () => {
      const checkbox = container.querySelector<HTMLInputElement>(
        'tbody tr[data-row-key] input[type="checkbox"]'
      );
      if (checkbox && !checkbox.checked) {
        act(() => checkbox.click());
        await settle();
      }
      const button = deleteButton();
      expect(button, 'no delete control was rendered').toBeTruthy();
      act(() => button!.click());
      await settle();
    },
    /** Either dialog: the table keeps its own, the rest use the shared one. */
    prompted: () => Boolean(document.querySelector('.ant-modal')),
    stored: () => latest.rows,
    unmount: () => act(() => root.unmount()),
  };
};

const cases = [
  {
    name: 'the array table',
    schema: tableSchema,
    uischema: { type: 'Control', scope: '#/properties/rows' },
  },
  {
    name: 'the expandable array layout',
    schema: layoutSchema,
    uischema: { type: 'Control', scope: '#/properties/rows' },
  },
  {
    name: 'list with detail',
    schema: tableSchema,
    uischema: { type: 'ListWithDetail', scope: '#/properties/rows' },
  },
];

describe.each(cases)('$name', ({ schema, uischema }) => {
  it('asks before removing a row, and removes nothing yet', async () => {
    const { clickDelete, prompted, stored, unmount } = render(schema, uischema);
    await settle();
    await clickDelete();
    /*
      If the discarded value resolves to `undefined`, the policy concludes
      there is nothing to lose and this is where it fails.
    */
    expect(prompted()).toBe(true);
    expect(stored()).toHaveLength(2);
    unmount();
  });

  it('removes it without asking when the element says never', async () => {
    const { clickDelete, prompted, stored, unmount } = render(
      schema,
      uischema,
      { confirmation: { delete: 'never' } }
    );
    await settle();
    await clickDelete();
    await settle();
    expect(prompted()).toBe(false);
    // Proves the delete really is wired up, so the test above is not passing
    // simply because nothing can be deleted.
    expect(stored()).toHaveLength(1);
    unmount();
  });
});

/*
  A row's Delete sits inside the row, so without `stopPropagation` its click
  also reaches whatever the row itself does on click. In list with detail that
  is "select me", which means pressing Delete on one entry while looking at
  another silently navigates away from the entry being read - and then asks
  about the delete.

  Section 14 is explicit that "cancellation leaves committed data, selection,
  and expansion unchanged", and declining a prompt that has already moved the
  selection cannot honour that: the move happened on the way in, before there
  was anything to cancel.
*/
describe('deleting from list with detail', () => {
  const draw = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latest: any = { rows: rows() };
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={latest}
            schema={tableSchema as any}
            uischema={
              { type: 'ListWithDetail', scope: '#/properties/rows' } as any
            }
            renderers={antdRenderers}
            cells={antdCells}
            onChange={({ data }) => {
              latest = data;
            }}
          />
        </ConfigProvider>
      )
    );
    const items = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>('.jsonforms-list-detail-item')
      );
    return {
      container,
      items,
      select: async (index: number) => {
        act(() => items()[index].click());
        await settle();
      },
      deleteAt: async (index: number) => {
        const button = Array.from(
          items()[index].querySelectorAll<HTMLButtonElement>('button')
        ).find((entry) =>
          (entry.getAttribute('aria-label') ?? '')
            .toLowerCase()
            .includes('delete')
        );
        expect(button, `row ${index} has no delete`).toBeTruthy();
        act(() => button!.click());
        await settle();
      },
      /** What the detail pane is showing, which is the selection made visible. */
      detail: () =>
        Array.from(container.querySelectorAll<HTMLInputElement>('input'))
          .map((input) => input.value)
          .filter(Boolean),
      cancel: async () => {
        const no = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            '.ant-modal-footer button'
          )
        ).find((button) => button.textContent?.includes('No'));
        expect(no, 'no decline button').toBeTruthy();
        act(() => no!.click());
        await settle();
      },
      stored: () => latest.rows,
      unmount: () => act(() => root.unmount()),
    };
  };

  it('keeps the selection on the entry being read', async () => {
    const list = draw();
    await settle();
    await list.select(0);
    expect(list.detail()).toContain('A-01');

    // Delete on the *other* entry.
    await list.deleteAt(1);

    expect(document.querySelector('[data-confirm]')).toBeTruthy();
    // The row that was being read is still the one on screen.
    expect(list.detail()).toContain('A-01');
    expect(list.detail()).not.toContain('B-02');
    list.unmount();
  });

  it('leaves the selection alone when the prompt is declined', async () => {
    const list = draw();
    await settle();
    await list.select(0);
    await list.deleteAt(1);
    await list.cancel();
    expect(list.detail()).toContain('A-01');
    expect(list.stored()).toHaveLength(2);
    list.unmount();
  });

  /* Selecting is still the row's own job; only the action opts out. */
  it('still selects when the row itself is clicked', async () => {
    const list = draw();
    await settle();
    await list.select(1);
    expect(list.detail()).toContain('B-02');
    list.unmount();
  });
});

/* The same rule, in the renderer whose container expands rather than selects. */
describe('deleting from the expandable array layout', () => {
  const draw = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latest: any = { rows: rows() };
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={latest}
            schema={layoutSchema as any}
            uischema={{ type: 'Control', scope: '#/properties/rows' } as any}
            renderers={antdRenderers}
            cells={antdCells}
            onChange={({ data }) => {
              latest = data;
            }}
          />
        </ConfigProvider>
      )
    );
    const panels = () =>
      Array.from(container.querySelectorAll<HTMLElement>('.ant-collapse-item'));
    return {
      container,
      panels,
      expandedCount: () =>
        container.querySelectorAll('.ant-collapse-item-active').length,
      /** Which panel is open, or -1. The layout is an accordion: at most one. */
      openIndex: () =>
        panels().findIndex((panel) =>
          panel.classList.contains('ant-collapse-item-active')
        ),
      deleteAt: async (index: number) => {
        const button = Array.from(
          panels()[index].querySelectorAll<HTMLButtonElement>('button')
        ).find((entry) =>
          (entry.getAttribute('aria-label') ?? '')
            .toLowerCase()
            .includes('delete')
        );
        expect(button, `panel ${index} has no delete`).toBeTruthy();
        act(() => button!.click());
        await settle();
      },
      toggleAt: async (index: number) => {
        const header = panels()[index].querySelector<HTMLElement>(
          '.ant-collapse-header'
        );
        act(() => header!.click());
        await settle();
      },
      unmount: () => act(() => root.unmount()),
    };
  };

  it('does not expand the panel whose Delete was pressed', async () => {
    const layout = draw();
    await settle();
    // `collapsed` defaults to false, so the first item starts open.
    expect(layout.openIndex()).toBe(0);
    await layout.deleteAt(1);
    expect(document.querySelector('[data-confirm]')).toBeTruthy();
    // Panel 1 did not steal the expansion on the way to the prompt.
    expect(layout.openIndex()).toBe(0);
    layout.unmount();
  });

  /*
    Expanding is still the header's own job; only the action opts out. The
    layout is an accordion, so opening one closes the other rather than adding
    to a count.
  */
  it('still expands when the header itself is clicked', async () => {
    const layout = draw();
    await settle();
    await layout.toggleAt(1);
    expect(layout.openIndex()).toBe(1);
    expect(layout.expandedCount()).toBe(1);
    layout.unmount();
  });
});
