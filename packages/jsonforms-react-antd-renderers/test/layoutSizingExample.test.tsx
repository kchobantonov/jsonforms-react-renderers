import { flattenExampleNavigation } from './flattenExampleNavigation';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import config from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/uischema.json';

/*
  The layout-sizing fixture, rendered with the base renderer set.

  The Spacer row is deliberately not asserted here: a Spacer is registered by
  the extended set, and this package must not depend on it.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (override?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={{ ...data, ...(override ?? {}) }}
          schema={schema as any}
          uischema={flattenExampleNavigation(uischema)}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  const rows = () =>
    Array.from(container.querySelectorAll<HTMLElement>('[data-layout="row"]'));
  return {
    container,
    rows,
    itemsIn: (row: HTMLElement) =>
      Array.from(row.querySelectorAll<HTMLElement>(':scope > div')),
    unmount: () => act(() => root.unmount()),
  };
};

describe('the layout-sizing spec example', () => {
  it('sizes the span row against the 16-column grid', async () => {
    const view = draw();
    await settle();
    const items = view.itemsIn(view.rows()[0]);
    // 4 / 8 / 4 of 16, with the configured 1rem gap subtracted per the formula.
    expect(items[0].style.flexBasis).toBe('calc(25% - 0.75 * 1rem)');
    expect(items[1].style.flexBasis).toBe('calc(50% - 0.5 * 1rem)');
    expect(items[2].style.flexBasis).toBe('calc(25% - 0.75 * 1rem)');
    view.unmount();
  });

  it('gives the weight row proportional shares', async () => {
    const view = draw();
    await settle();
    const items = view.itemsIn(view.rows()[1]);
    expect(items.map((item) => item.style.flexGrow)).toEqual(['2', '2', '1']);
    view.unmount();
  });

  /* "Conflict precedence: Fixed > Span > Weight > Auto. Min/max are constraints." */
  it('keeps fixed fixed and constrains the flexible one', async () => {
    const view = draw();
    await settle();
    const items = view.itemsIn(view.rows()[2]);
    expect(items[0].style.flexBasis).toBe('180px');
    expect(items[0].style.flexGrow).toBe('0');
    expect(items[1].style.maxWidth).toBe('32rem');
    // minItemWidth is the parent default for the child that sets no minimum.
    expect(items[0].style.minWidth).toBe('120px');
    view.unmount();
  });

  /* "Hidden children leave layout." */
  it('drops the conditional child until its rule matches', async () => {
    const hidden = draw({ needsApproval: false });
    await settle();
    expect(hidden.itemsIn(hidden.rows()[3])).toHaveLength(1);
    hidden.unmount();

    const shown = draw({ needsApproval: true });
    await settle();
    expect(shown.itemsIn(shown.rows()[3])).toHaveLength(2);
    shown.unmount();
  });

  it('applies the container options to the wrapping row', async () => {
    const view = draw();
    await settle();
    // Found by what it is, not where it sits - rows get added to the fixture.
    const wrapRow = view.rows().find((row) => row.style.flexWrap === 'wrap')!;
    expect(wrapRow).toBeTruthy();
    expect(wrapRow.style.flexWrap).toBe('wrap');
    expect(wrapRow.style.justifyContent).toBe('space-between');
    expect(view.itemsIn(wrapRow)[0].style.minWidth).toBe('14rem');
    view.unmount();
  });

  /* gap: the layout's own option beats the configured default. */
  it('prefers the element gap over the configured default', async () => {
    const view = draw();
    await settle();
    // The outer VerticalLayout asks for 1.5rem; the config default is 1rem.
    const column = view.container.querySelector<HTMLElement>(
      '[data-layout="column"]'
    )!;
    expect(column.style.gap).toBe('1.5rem');
    expect(view.rows()[0].style.gap).toBe('1rem');
    view.unmount();
  });
});

/*
  The 4 / 8 / 4 row whose middle child is behind a toggle.

  It is in the fixture to show that **span is absolute and weight is
  relative**, which is the one thing about the two modes that is easy to get
  backwards: hiding a spanned child leaves its share of the grid empty, while
  hiding a weighted one is redistributed among the survivors.
*/
describe('a hidden middle child', () => {
  const rowsFor = (view: ReturnType<typeof draw>) => {
    const matching = view
      .rows()
      .filter((row) => row.textContent?.includes('Booked by'));
    // Locate the paired demonstration independently of later example groups.
    expect(matching).toHaveLength(2);
    return { span: matching[0], weight: matching[1] };
  };

  it('lays the three out at 4 / 8 / 4 while all are visible', async () => {
    const view = draw({ showTeam: true });
    await settle();
    const { span } = rowsFor(view);
    expect(view.itemsIn(span).map((item) => item.style.flexBasis)).toEqual([
      'calc(25% - 0.75 * 1rem)',
      'calc(50% - 0.5 * 1rem)',
      'calc(25% - 0.75 * 1rem)',
    ]);
    view.unmount();
  });

  /*
    "Span against the complete logical grid" - the grid does not shrink to the
    children that remain, so the survivors keep 4/16 each and the freed 8/16
    stays empty. Two slots, not three with a blank one.
  */
  it('leaves the span row short when the middle goes', async () => {
    const view = draw({ showTeam: false });
    await settle();
    const { span } = rowsFor(view);
    const items = view.itemsIn(span);
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.style.flexBasis)).toEqual([
      'calc(25% - 0.75 * 1rem)',
      'calc(25% - 0.75 * 1rem)',
    ]);
    view.unmount();
  });

  /* Weight is a share of what is there, so the survivors take it all. */
  it('redistributes the weight row instead', async () => {
    const shown = draw({ showTeam: true });
    await settle();
    expect(
      shown.itemsIn(rowsFor(shown).weight).map((item) => item.style.flexGrow)
    ).toEqual(['1', '2', '1']);
    shown.unmount();

    const hidden = draw({ showTeam: false });
    await settle();
    // Two children of equal weight: half each, with nothing left over.
    expect(
      hidden.itemsIn(rowsFor(hidden).weight).map((item) => item.style.flexGrow)
    ).toEqual(['1', '1']);
    hidden.unmount();
  });
});
