import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { DispatchCell, JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedCells, antdExtendedRenderers } from '../src';

/**
 * The gap these entries close.
 *
 * Both array presentations draw a column through `DispatchCell` against the
 * **cells** registry. A control that exists only as a *renderer* is therefore
 * unreachable in a column, and the column falls back to `TextCell` without
 * saying anything - a colour field shows `#3366ff` as text.
 *
 * The cells are exercised through `DispatchCell` rather than through a whole
 * grid on purpose: that is the single line of contact between the two, the
 * grid adds nothing to it, and a test that mounted ag-grid in jsdom would be
 * testing ag-grid.
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

const schema: any = {
  type: 'object',
  properties: {
    plain: { type: 'string', title: 'Plain' },
    favoriteColor: { type: 'string', format: 'color', title: 'Favorite color' },
    tenure: { type: 'string', format: 'duration', title: 'Tenure' },
  },
};

const data = {
  plain: 'text',
  favoriteColor: '#3366ff',
  tenure: 'P2DT3H',
};

const renderers = [...antdRenderers, ...antdExtendedRenderers];

/** Dispatches one column the way both array renderers do. */
const drawColumn = async (field: string, cells: any) => {
  let latest: any = data;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const Column = () => (
    <DispatchCell
      schema={schema.properties[field]}
      uischema={
        { type: 'Control', scope: `#/properties/${field}`, label: false } as any
      }
      path={field}
      enabled
      renderers={renderers}
      cells={cells}
    />
  );
  act(() =>
    root.render(
      <ConfigProvider>
        <JsonForms
          data={data}
          schema={schema}
          uischema={{ type: 'VerticalLayout', elements: [] } as any}
          config={{}}
          renderers={[...renderers, { tester: () => 99, renderer: Column }]}
          cells={cells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
  return {
    container,
    /** The colour control's trigger is a plain span, not an antd class. */
    colorTrigger: () =>
      container.querySelector('[aria-label="Choose a color"]'),
    durationTrigger: () =>
      container.querySelector('[aria-label="Choose a duration"]'),
    input: () => container.querySelector<HTMLInputElement>('input'),
    latest: () => latest,
    type: async (text: string) => {
      const field = container.querySelector<HTMLInputElement>('input')!;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      act(() => {
        setter.call(field, text);
        field.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
      });
    },
    labels: () =>
      container.querySelectorAll('.ant-form-item-label label').length,
    unmount: () => act(() => root.unmount()),
  };
};

/**
 * The antd **table**, end to end.
 *
 * The grid is exercised through `DispatchCell` above, because that is its
 * single line of contact with the cells registry. The table is exercised
 * through the real renderer instead, because its path contract is the part
 * worth pinning: `TableControl` composes `rowPath + '.' + propName` and hands
 * that to `DispatchCell` together with a `#/properties/<prop>` uischema -
 * the same shape the grid uses, and the shape `asCell` depends on. If either
 * renderer ever passed the *row* path instead, cells would read whole rows
 * and this is where it would show.
 */
describe('the antd table', () => {
  const arraySchema: any = {
    type: 'object',
    properties: {
      people: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Name' },
            favoriteColor: {
              type: 'string',
              format: 'color',
              title: 'Favorite color',
            },
            tenure: { type: 'string', format: 'duration', title: 'Tenure' },
          },
        },
      },
    },
  };
  const arrayData = {
    people: [{ name: 'Ana', favoriteColor: '#3366ff', tenure: 'P2DT3H' }],
  };

  const drawTable = async (cells: any) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider>
          <JsonForms
            data={arrayData}
            schema={arraySchema}
            uischema={
              {
                type: 'Control',
                scope: '#/properties/people',
                options: { table: true },
              } as any
            }
            config={{}}
            renderers={renderers}
            cells={cells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    return {
      container,
      colorTrigger: () =>
        container.querySelector('[aria-label="Choose a color"]'),
      durationTrigger: () =>
        container.querySelector('[aria-label="Choose a duration"]'),
      values: () =>
        Array.from(container.querySelectorAll('input')).map((i) => i.value),
      unmount: () => act(() => root.unmount()),
    };
  };

  it('reaches the extended cells, and resolves each column to its own value', async () => {
    const view = await drawTable([...antdCells, ...antdExtendedCells]);
    expect(view.colorTrigger()).toBeTruthy();
    expect(view.durationTrigger()).toBeTruthy();
    /*
      Each column shows its OWN field. A row-path bug would put the same
      value - or nothing - in every column, which is why all three are
      asserted rather than just the colour one.
    */
    expect(view.values()).toEqual(
      expect.arrayContaining(['Ana', '#3366ff', 'P2DT3H'])
    );
    view.unmount();
  });

  it('falls back to text cells without them, exactly as the grid does', async () => {
    const view = await drawTable(antdCells);
    expect(view.colorTrigger()).toBeNull();
    expect(view.durationTrigger()).toBeNull();
    // The values are still right - it is the control that is missing.
    expect(view.values()).toEqual(
      expect.arrayContaining(['Ana', '#3366ff', 'P2DT3H'])
    );
    view.unmount();
  });
});

describe('the extended cells', () => {
  it('gives a colour column its picker', async () => {
    const view = await drawColumn('favoriteColor', [
      ...antdCells,
      ...antdExtendedCells,
    ]);
    expect(view.colorTrigger()).toBeTruthy();
    expect(view.input()?.value).toBe('#3366ff');
    view.unmount();
  });

  it('gives a duration column its picker', async () => {
    const view = await drawColumn('tenure', [
      ...antdCells,
      ...antdExtendedCells,
    ]);
    expect(view.durationTrigger()).toBeTruthy();
    expect(view.input()?.value).toBe('P2DT3H');
    view.unmount();
  });

  /*
    Without them the column is a plain TextCell. This is what the bug looked
    like, and it is what a host that does not concatenate the export still
    gets - so it is the behaviour, not merely the absence of a test.
  */
  it('falls back to a text cell when they are not registered', async () => {
    const colour = await drawColumn('favoriteColor', antdCells);
    expect(colour.colorTrigger()).toBeNull();
    expect(colour.input()?.value).toBe('#3366ff');
    colour.unmount();

    const duration = await drawColumn('tenure', antdCells);
    expect(duration.durationTrigger()).toBeNull();
    duration.unmount();
  });

  /*
    The silent half of the same bug. Reading the wrong path shows an empty
    cell, which someone notices; **writing** the wrong path creates
    `favoriteColor.favoriteColor` and loses the edit, which nobody notices
    until the data is saved. Worth its own test because a read-only assertion
    passes against a control that edits into the void.
  */
  it("writes an edit to the column's own path, not a nested one", async () => {
    const view = await drawColumn('favoriteColor', [
      ...antdCells,
      ...antdExtendedCells,
    ]);
    await view.type('#ff0000');
    expect(view.latest().favoriteColor).toBe('#ff0000');
    // The path bug's fingerprint: a nested object where a string belongs.
    expect(typeof view.latest().favoriteColor).toBe('string');
    view.unmount();
  });

  /*
    A column header already names the field, and an inline message under a
    cell grows the row. `ControlFormItem` drops both inside a cell, which is
    why these are the same components rather than cell-only copies.
  */
  it('draws no label, so the same component serves both places', async () => {
    const view = await drawColumn('favoriteColor', [
      ...antdCells,
      ...antdExtendedCells,
    ]);
    expect(view.labels()).toBe(0);
    view.unmount();
  });

  it('leaves a column no extended cell claims alone', async () => {
    const view = await drawColumn('plain', [
      ...antdCells,
      ...antdExtendedCells,
    ]);
    expect(view.input()?.value).toBe('text');
    expect(view.colorTrigger()).toBeNull();
    view.unmount();
  });

  /*
    A code editor is not a cell: it draws no ControlFormItem, and it wants
    height a row does not have. A value that large belongs in the detail
    dialog, which dispatches renderers.
  */
  it('does not register the code editor as a cell', () => {
    const {
      monacoControlTester,
    } = require('@chobantonov/jsonforms-react-extended-renderers');
    expect(
      antdExtendedCells.some((entry) => entry.tester === monacoControlTester)
    ).toBe(false);
  });
});
