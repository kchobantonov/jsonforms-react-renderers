import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { createAjv, createDefaultValue } from '@jsonforms/core';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import { flushUntil } from './support/flush';
import config from '@chobantonov/jsonforms-extended-spec/examples/array-controls/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/array-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/array-controls/uischema.json';

/*
  Every array presentation, on one schema.

  The fixture's job is to show that **the item shape and the explicit options
  decide the renderer**, so the assertions here are mostly about which one was
  chosen - a table where a table was asked for, expandable forms where the
  items nest, a grid where one was named.
*/

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {
      /* nothing to measure in jsdom */
    }
    unobserve() {
      /* nothing to measure in jsdom */
    }
    disconnect() {
      /* nothing to measure in jsdom */
    }
  };

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 200) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (override?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: any = { ...data, ...(override ?? {}) };
  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={schema as any}
            uischema={uischema as any}
            config={config}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={({ data: next }) => {
              current = next;
            }}
          />
        </ConfigProvider>
      )
    );
  paint();

  /* antd keeps a visited panel mounted, so every query is panel-scoped. */
  const active = () =>
    container.querySelector<HTMLElement>('.ant-tabs-content-active');

  return {
    container,
    paint,
    active,
    current: () => current,
    tabs: () =>
      Array.from(container.querySelectorAll<HTMLElement>('.ant-tabs-tab')).map(
        (tab) => tab.textContent ?? ''
      ),
    selectTab: async (label: string) => {
      const tab = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).find((candidate) => candidate.textContent?.includes(label));
      expect(tab, `no tab labelled ${label}`).toBeTruthy();
      act(() => tab!.click());
      await settle();
    },
    /*
      By accessible name. The panel holds three arrays at once, so a positional
      or text-matching lookup picks whichever one happens to come first - which
      is how the first version of this file concluded that a disabled Delete
      was enabled, having found the *reviewers* one.
    */
    byLabel: (label: string) =>
      Array.from(
        active()?.querySelectorAll<HTMLButtonElement>('button') ?? []
      ).filter((button) => button.getAttribute('aria-label') === label),
    unmount: () => act(() => root.unmount()),
  };
};

const textOf = (element: Element | null | undefined) =>
  element?.textContent ?? '';

describe('the array example', () => {
  it('offers one tab per presentation', async () => {
    const view = draw();
    await settle();
    expect(view.tabs()).toEqual([
      'Table',
      'Expandable',
      'List with detail',
      'AG Grid',
      'Scalar and composite cells',
      'Add, remove and bounds',
    ]);
    view.unmount();
  });
});

describe('the scalar and composite cells tab', () => {
  it('renders both views and paginates the grid without dropping stored rows', async () => {
    const view = draw();
    await view.selectTab('Scalar and composite cells');
    await flushUntil(
      () => (view.active()?.querySelectorAll('.ag-cell').length ?? 0) > 0
    );
    const headers = Array.from(view.active()?.querySelectorAll('th') ?? []).map(
      (header) => header.textContent?.trim()
    );
    expect(headers).toEqual(
      expect.arrayContaining(['Name', 'Tenure', 'Address', 'Phone numbers'])
    );
    expect(view.active()?.querySelector('.ag-paging-panel')).toBeTruthy();
    expect(
      view.active()?.querySelectorAll('.ag-cell[col-id="name"]')
    ).toHaveLength(1);
    expect(view.current().staff).toHaveLength(2);
    view.unmount();
  });
});

describe('the table tab', () => {
  /*
    `sessions` nests a `room` object, which the detail renderer outranks a
    table for. `options.table` is what overrides that - so a real table with
    real column headers is the assertion that the override took.
  */
  it('keeps a nested property in a column instead of switching presentation', async () => {
    const view = draw();
    await view.selectTab('Table');
    const headers = Array.from(view.active()?.querySelectorAll('th') ?? []).map(
      (th) => th.textContent?.trim()
    );
    expect(headers).toContain('Title');
    expect(headers).toContain('Room');
    // Not the expandable presentation: those draw disclosure panels.
    expect(view.active()?.querySelector('.ant-collapse')).toBeNull();
    view.unmount();
  });

  it('summarises the composite column rather than inlining its form', async () => {
    const view = draw();
    await view.selectTab('Table');
    expect(textOf(view.active())).toContain('Aurora');
    // The detail form is behind a dialog, not in the cell.
    expect(
      view.active()?.querySelectorAll('input[value="Aurora"]').length
    ).toBe(0);
    view.unmount();
  });
});

describe('the expandable tab', () => {
  /* `speakers` nests an array, so this presentation is selected unasked. */
  it('is selected by the item shape, with no option', async () => {
    const view = draw();
    await view.selectTab('Expandable');
    expect(view.active()?.querySelector('.ant-collapse')).toBeTruthy();
    view.unmount();
  });

  /* "Use options.elementLabelProp to select an item-relative dotted path." */
  it('labels item headers from elementLabelProp', async () => {
    const view = draw();
    await view.selectTab('Expandable');
    expect(textOf(view.active())).toContain('Rosa Iqbal');
    expect(textOf(view.active())).toContain('Tomas Lind');
    view.unmount();
  });

  /*
    The two controls differ only in their options, which is the point of
    showing them side by side: `initCollapsed` closes everything, and the
    first array's default opens its first item.
  */
  it('opens the first item by default and closes them all under initCollapsed', async () => {
    const view = draw();
    await view.selectTab('Expandable');
    const panels = Array.from(
      view.active()?.querySelectorAll('.ant-collapse') ?? []
    );
    expect(panels.length).toBeGreaterThanOrEqual(2);
    const open = panels.map(
      (panel) => panel.querySelectorAll('.ant-collapse-item-active').length
    );
    expect(open[0], 'the first array should open its first item').toBe(1);
    expect(open[1], 'initCollapsed should leave every item closed').toBe(0);
    view.unmount();
  });
});

describe('the list-with-detail tab', () => {
  /* Selected by element type, not by a Control option. */
  it('lists the items and prompts for a selection', async () => {
    const view = draw();
    await view.selectTab('List with detail');
    expect(textOf(view.active())).toContain('Meridian Press');
    expect(textOf(view.active())).toContain('Calder Coffee');
    view.unmount();
  });
});

describe('the grid tab', () => {
  const cellsOf = (view: ReturnType<typeof draw>, colId: string) =>
    Array.from(view.active()?.querySelectorAll('.ag-cell') ?? []).filter(
      (cell) => cell.getAttribute('col-id') === colId
    );

  /*
    "Nested item properties must not force this explicitly selected grid into
    ListWithDetail or expandable-item presentation." `tickets` nests a
    `holder`, and `variant: "ag-grid"` is what settles it.
  */
  it('is selected by variant, despite the nested item property', async () => {
    const view = draw();
    await view.selectTab('AG Grid');
    await flushUntil(
      () => (view.active()?.querySelectorAll('.ag-cell').length ?? 0) > 0
    );
    expect(view.active()?.querySelector('.ag-root')).toBeTruthy();
    expect(view.active()?.querySelector('.ant-collapse')).toBeNull();
    view.unmount();
  });

  /*
    "Generated data columns dispatch JSON Forms cells" - so a scalar column is
    an input bound to the row, not rendered text. Reading `textContent` here
    finds nothing, which is what made the first version of this test fail.
  */
  it('dispatches a JSON Forms cell into a scalar column', async () => {
    const view = draw();
    await view.selectTab('AG Grid');
    await flushUntil(
      () => (view.active()?.querySelectorAll('.ag-cell').length ?? 0) > 0
    );
    const code = cellsOf(view, 'code')[0];
    expect(code, 'no code column').toBeTruthy();
    const input = code.querySelector<HTMLInputElement>('input');
    expect(input, 'the column rendered no control').toBeTruthy();
    expect(input!.value).toBe('EARLY-1');
    view.unmount();
  });

  /* And a composite column summarises rather than inlining its detail form. */
  it('summarises the composite column', async () => {
    const view = draw();
    await view.selectTab('AG Grid');
    await flushUntil(
      () => (view.active()?.querySelectorAll('.ag-cell').length ?? 0) > 0
    );
    const holder = cellsOf(view, 'holder')[0];
    expect(holder).toBeTruthy();
    expect(holder.textContent).toContain('Ines Roy');
    expect(holder.querySelectorAll('input').length).toBe(0);
    view.unmount();
  });
});

describe('the bounds tab', () => {
  /*
    "With restrict, maxItems disables/prevents Add and minItems
    disables/prevents Delete." One item, minimum one: Delete must be refused.
  */
  it('refuses to delete the last item at minItems', async () => {
    const view = draw();
    await view.selectTab('Add, remove and bounds');
    expect(view.current().rounds).toHaveLength(1);

    // The affordance is gone...
    const [add] = view.byLabel('Add to Review rounds');
    expect(add?.disabled, 'Add should be available below maxItems').toBe(false);
    const deletes = view.byLabel('Delete button');
    expect(deletes.length).toBeGreaterThan(0);
    expect(deletes[0].disabled, 'Delete should be refused at minItems').toBe(
      true
    );

    // ...and the handler is guarded too, which is the part a user can reach
    // through a keyboard or a stale DOM node.
    act(() => deletes[0].click());
    await settle();
    expect(view.current().rounds).toHaveLength(1);
    view.unmount();
  });

  /*
    The live half of the initialization claim: what Add actually puts in the
    data, not only what the helper returns.
  */
  it('adds an item initialized from declared defaults, and stops at maxItems', async () => {
    const view = draw();
    await view.selectTab('Add, remove and bounds');

    act(() => view.byLabel('Add to Review rounds')[0].click());
    await settle();
    view.paint();
    await settle();
    expect(view.current().rounds).toHaveLength(2);
    expect(view.current().rounds[1]).toEqual({ active: true });

    act(() => view.byLabel('Add to Review rounds')[0].click());
    await settle();
    view.paint();
    await settle();
    expect(view.current().rounds).toHaveLength(3);

    // maxItems is 3: Add is now refused, by affordance and by handler.
    expect(view.byLabel('Add to Review rounds')[0].disabled).toBe(true);
    act(() => view.byLabel('Add to Review rounds')[0].click());
    await settle();
    expect(view.current().rounds).toHaveLength(3);
    view.unmount();
  });

  /*
    "Explicit Add initializes a new value." The spec's own worked example is
    this exact shape: a required `name` and an `active` with a default, giving
    `{ "active": true }` and an error that the helper does not invent away.
  */
  it('initializes a new item from declared defaults only', () => {
    const items = (schema as any).properties.rounds.items;
    expect(createDefaultValue(items, schema as any)).toEqual({ active: true });

    const ajv = createAjv();
    const validate = ajv.compile(items);
    validate({ active: true });
    expect(
      validate.errors?.map((error: any) => error.keyword),
      'the missing name must remain an error'
    ).toContain('required');
  });

  /* "disableAdd / disableRemove leave existing item values editable." */
  it('takes the add and remove affordances away without freezing the fields', async () => {
    const view = draw();
    await view.selectTab('Add, remove and bounds');

    const [add] = view.byLabel('Add to Opening checklist button');
    expect(add?.disabled, 'disableAdd should remove Add').toBe(true);

    act(() => add.click());
    await settle();
    expect(view.current().checklist).toHaveLength(2);

    // "These options leave existing item values editable."
    const editable = Array.from(
      view.active()?.querySelectorAll<HTMLInputElement>('input') ?? []
    ).filter((input) => input.value === 'Unlock the hall');
    expect(editable.length, 'the checklist fields should be editable').toBe(1);
    expect(editable[0].disabled).toBe(false);
    view.unmount();
  });

  /*
    The contrast that makes the previous two tests mean something: an array
    with neither bounds nor disable options keeps both affordances.
  */
  it('leaves an unconstrained array alone', async () => {
    const view = draw();
    await view.selectTab('Add, remove and bounds');
    expect(view.byLabel('Add to Reviewers button')[0].disabled).toBe(false);
    view.unmount();
  });

  /*
    "Provide an accessible explanation of array-level errors near the array,
    including when it has no items." The failure is the array's, not any one
    reviewer's.
  */
  it('reports a contains failure against the array, empty or not', () => {
    const ajv = createAjv();
    const validate = ajv.compile(schema as any);

    validate({ reviewers: [] });
    const empty = validate.errors ?? [];
    expect(empty.map((error: any) => error.instancePath)).toContain(
      '/reviewers'
    );
    expect(empty.map((error: any) => error.keyword)).toContain('contains');

    validate({ reviewers: [{ name: 'Ada Fenn', lead: true }] });
    expect(validate.errors).toBeNull();
  });
});
