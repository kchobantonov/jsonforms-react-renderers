import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  The expandable array's own UI options, all of which arrive through `config`
  as well as through the element, because the demo's settings panel sets them
  globally.

  Every one of these was declared in the portable specification and exposed as
  a toggle in the demo, while no renderer read it - so flipping the toggle did
  nothing at all. They are tested through `config` for that reason: an option
  that works only when written onto the element does not answer the complaint.
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

/** Nested items, so the expandable array layout wins over the table. */
const schema = {
  type: 'object',
  properties: {
    milestones: {
      type: 'array',
      title: 'Project milestones',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Stop', minLength: 3 },
          window: {
            type: 'object',
            title: 'Window',
            properties: { from: { type: 'string', title: 'From' } },
          },
        },
      },
    },
  },
};

const uischema = { type: 'Control', scope: '#/properties/milestones' } as any;

const milestones = () => [
  { name: 'Portland', window: { from: '08:00' } },
  { name: 'Salem', window: { from: '11:30' } },
];

const draw = (config?: any, data: any = { milestones: milestones() }, ui = uischema) => {
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
          uischema={ui}
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
  const panels = () =>
    Array.from(container.querySelectorAll<HTMLElement>('.ant-collapse-item'));
  const find = (label: string) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) =>
        (button.getAttribute('aria-label') ?? '')
          .toLowerCase()
          .includes(label.toLowerCase())
    );
  return {
    container,
    panels,
    /** The index of the open panel, or -1. */
    openIndex: () =>
      panels().findIndex((panel) =>
        panel.classList.contains('ant-collapse-item-active')
      ),
    toggle: async (index: number) => {
      const header = panels()[index].querySelector<HTMLElement>(
        '.ant-collapse-header'
      );
      act(() => header!.click());
      await settle();
    },
    add: async () => {
      act(() => find('add')!.click());
      await settle();
    },
    actionIn: async (index: number, label: string) => {
      const button = Array.from(
        panels()[index].querySelectorAll<HTMLButtonElement>('button')
      ).find((entry) =>
        (entry.getAttribute('aria-label') ?? '')
          .toLowerCase()
          .includes(label.toLowerCase())
      );
      expect(button, `panel ${index} has no ${label}`).toBeTruthy();
      act(() => button!.click());
      await settle();
    },
    accept: async () => {
      const ok = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button')
      ).find((button) => button.textContent?.includes('Yes'));
      act(() => ok!.click());
      await settle();
      await settle();
    },
    avatars: () => container.querySelectorAll('.ant-avatar').length,
    stored: () => latest.milestones,
    unmount: () => act(() => root.unmount()),
  };
};

describe('initCollapsed', () => {
  /*
    "False: initially open the first item if present." The previous state was
    `useState(false)` with an uncontrolled Collapse, so every item started
    closed - which happened to look like `initCollapsed: true`, permanently.
  */
  it('opens the first item by default', async () => {
    const view = draw();
    await settle();
    expect(view.openIndex()).toBe(0);
    view.unmount();
  });

  it('opens nothing when set', async () => {
    const view = draw({ initCollapsed: true });
    await settle();
    expect(view.openIndex()).toBe(-1);
    view.unmount();
  });

  it('opens nothing when the array is empty, with either setting', async () => {
    const view = draw(undefined, { milestones: [] });
    await settle();
    expect(view.panels()).toHaveLength(0);
    view.unmount();
  });

  /* "Initialization only, not a continuously controlled expansion value." */
  it('does not fight the user afterwards', async () => {
    const view = draw({ initCollapsed: true });
    await settle();
    await view.toggle(1);
    expect(view.openIndex()).toBe(1);
    view.unmount();
  });

  it('is overridable on the element', async () => {
    const view = draw(
      { initCollapsed: true },
      { milestones: milestones() },
      {
        ...uischema,
        options: { initCollapsed: false },
      }
    );
    await settle();
    expect(view.openIndex()).toBe(0);
    view.unmount();
  });
});

describe('collapseNewItems', () => {
  /* "False: open the newly added item." */
  it('opens the item that was just added', async () => {
    const view = draw({ initCollapsed: true });
    await settle();
    await view.add();
    expect(view.stored()).toHaveLength(3);
    // Add appends, so the new item is the last one.
    expect(view.openIndex()).toBe(2);
    view.unmount();
  });

  /* "True: leave it closed and preserve existing expansion." */
  it('leaves it closed and keeps the open panel where it was', async () => {
    const view = draw({ collapseNewItems: true });
    await settle();
    await view.toggle(1);
    expect(view.openIndex()).toBe(1);
    await view.add();
    expect(view.stored()).toHaveLength(3);
    expect(view.openIndex()).toBe(1);
    view.unmount();
  });
});

describe('expansion follows the item, not the slot', () => {
  /*
    "Track the logical item through renderer-owned reorder operations rather
    than transferring expansion to the item now at its old index."
  */
  it('moves with the item when it is reordered', async () => {
    const view = draw({ showSortButtons: true }, { milestones: milestones() }, uischema);
    await settle();
    expect(view.openIndex()).toBe(0);
    // Move the open item down; expansion should go with it, not stay on slot 0.
    await view.actionIn(0, 'down');
    expect(view.openIndex()).toBe(1);
    expect(view.stored()[1].name).toBe('Portland');
    view.unmount();
  });

  /* "Reconcile deletion ... without editing the wrong item." */
  it('closes when the open item is deleted', async () => {
    const view = draw();
    await settle();
    await view.actionIn(0, 'delete');
    await view.accept();
    expect(view.stored()).toHaveLength(1);
    expect(view.openIndex()).toBe(-1);
    view.unmount();
  });

  it('shifts down when an earlier item is deleted', async () => {
    const view = draw();
    await settle();
    await view.toggle(1);
    expect(view.openIndex()).toBe(1);
    await view.actionIn(0, 'delete');
    await view.accept();
    // The item that was open is now at index 0, and is still the open one.
    expect(view.stored()).toHaveLength(1);
    expect(view.stored()[0].name).toBe('Salem');
    expect(view.openIndex()).toBe(0);
    view.unmount();
  });
});

describe('hideAvatar', () => {
  it('draws the index marker by default', async () => {
    const view = draw();
    await settle();
    expect(view.avatars()).toBe(2);
    view.unmount();
  });

  it('hides it when set through config', async () => {
    const view = draw({ hideAvatar: true });
    await settle();
    expect(view.avatars()).toBe(0);
    view.unmount();
  });

  /*
    "True: hide that marker, without suppressing accessible item identity or
    validation feedback." Hiding it outright would take the only statement of
    which item a header belongs to out of the accessibility tree too.
  */
  it('keeps the index readable when the marker is hidden', async () => {
    const view = draw({ hideAvatar: true });
    await settle();
    const headers = Array.from(
      view.container.querySelectorAll('.ant-collapse-header')
    ).map((header) => header.textContent ?? '');
    expect(headers[0]).toContain('1');
    expect(headers[1]).toContain('2');
    view.unmount();
  });
});

describe('hideArraySummaryValidation', () => {
  // `minLength: 3` makes the second item's name invalid.
  const invalid = () => ({
    milestones: [{ name: 'Portland' }, { name: 'ab' }],
  });

  /*
    The summary is a Badge carrying the error count. Not `#tooltip-validation`:
    that id is handed to antd's `Tooltip`, which does not forward it to the
    DOM, so it matches nothing whatever the state.
  */
  const summary = (view: ReturnType<typeof draw>) =>
    view.container.querySelector('.ant-card-head .ant-badge');

  it('shows the child-error summary by default', async () => {
    const view = draw(undefined, invalid());
    await settle();
    expect(summary(view)).toBeTruthy();
    view.unmount();
  });

  it('hides it when set', async () => {
    const view = draw({ hideArraySummaryValidation: true }, invalid());
    await settle();
    expect(summary(view)).toBeNull();
    view.unmount();
  });

  /* "retain validation and field/item error feedback" - the field still says so. */
  it('leaves the offending field marked', async () => {
    const view = draw({ hideArraySummaryValidation: true }, invalid());
    await settle();
    await view.toggle(1);
    expect(
      view.container.querySelectorAll('.ant-form-item-has-error').length
    ).toBeGreaterThan(0);
    view.unmount();
  });
});

/*
  `hideAvatar` is specified for the expandable array. List with detail draws
  the same one-based index marker, and the demo sets the option globally, so it
  is honoured there too - a superset of the specification, not a divergence
  from it. See Adjustment 18.
*/
describe('hideAvatar in list with detail', () => {
  const drawList = (config?: any) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{ milestones: milestones() }}
            schema={schema as any}
            uischema={
              { type: 'ListWithDetail', scope: '#/properties/milestones' } as any
            }
            config={config}
            renderers={antdRenderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    return {
      container,
      avatars: () => container.querySelectorAll('.ant-avatar').length,
      unmount: () => act(() => root.unmount()),
    };
  };

  it('draws the marker by default', async () => {
    const view = drawList();
    await settle();
    expect(view.avatars()).toBe(2);
    view.unmount();
  });

  it('hides it when set, keeping the index readable', async () => {
    const view = drawList({ hideAvatar: true });
    await settle();
    expect(view.avatars()).toBe(0);
    expect(view.container.textContent).toContain('1');
    expect(view.container.textContent).toContain('2');
    view.unmount();
  });
});
