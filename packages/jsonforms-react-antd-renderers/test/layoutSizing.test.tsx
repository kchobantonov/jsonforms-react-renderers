import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import {
  DEFAULT_ROW_GAP,
  itemSizing,
  resolveGap,
  resolveGridColumns,
  resolveWrap,
  spanBasis,
} from '../src/util/layoutSizing';

/*
  The portable layout sizing model, sections 6 and 7.

  Two option sets on two different elements: `options.layout` on a child says
  how it participates in its parent, and flat options on the layout configure
  the container. This file pins the resolution rules; the rendering tests
  below check that a form actually gets them.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const control = (scope: string, layout?: any, extra?: any) => ({
  type: 'Control',
  scope,
  ...(layout || extra
    ? { options: { ...(layout ? { layout } : {}), ...extra } }
    : {}),
});

const render = (uischema: any, config?: any, data: any = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={
            {
              type: 'object',
              properties: {
                a: { type: 'string', title: 'A' },
                b: { type: 'string', title: 'B' },
                c: { type: 'string', title: 'C' },
                toggle: { type: 'boolean', title: 'Toggle' },
              },
            } as any
          }
          uischema={uischema}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  const row = () => container.querySelector<HTMLElement>('[data-layout="row"]');
  return {
    container,
    row,
    /** The sized wrapper around each participating child. */
    items: () =>
      Array.from(
        (row() ?? container).querySelectorAll<HTMLElement>(':scope > div')
      ),
    diagnostics: () =>
      Array.from(
        container.querySelectorAll<HTMLElement>('[data-layout-diagnostic]')
      ).map((element) => element.getAttribute('data-layout-diagnostic') ?? ''),
    unmount: () => act(() => root.unmount()),
  };
};

describe('resolving container options', () => {
  /* gridColumns: explicit -> layoutDefaults -> renderer default -> 16 */
  it('resolves gridColumns through its documented chain', () => {
    const defaults = {
      jsonformsExtended: { layoutDefaults: { gridColumns: 12 } },
    };
    expect(resolveGridColumns({ gridColumns: 8 }, defaults)).toBe(8);
    expect(resolveGridColumns(undefined, defaults)).toBe(12);
    expect(resolveGridColumns(undefined, undefined)).toBe(16);
    // "gridColumns/span positive integers"
    expect(resolveGridColumns({ gridColumns: 0 } as any, undefined)).toBe(16);
    expect(resolveGridColumns({ gridColumns: 2.5 } as any, undefined)).toBe(16);
  });

  /* wrap: explicit -> layoutDefaults -> false */
  it('resolves wrap through its documented chain', () => {
    const defaults = { jsonformsExtended: { layoutDefaults: { wrap: true } } };
    expect(resolveWrap({ wrap: false }, defaults)).toBe(false);
    expect(resolveWrap(undefined, defaults)).toBe(true);
    expect(resolveWrap(undefined, undefined)).toBe(false);
  });

  /*
    "Recommended fallback gap is 0 unless renderer capability documents
    another portable default" - antd documents one, and it depends on the
    direction. See DEFAULT_ROW_GAP.
  */
  it('resolves gap through its documented chain', () => {
    const defaults = { jsonformsExtended: { layoutDefaults: { gap: 8 } } };
    expect(resolveGap({ gap: '1rem' }, defaults, 'row')).toBe('1rem');
    expect(resolveGap(undefined, defaults, 'row')).toBe(8);
    expect(resolveGap(undefined, defaults, 'column')).toBe(8);
  });

  /*
    Nothing separates two controls side by side, so a zero fallback made them
    share an edge - which is how every uischema written for another family
    renders here, none of them setting `gap`.
  */
  it('gives a row a gutter by default', () => {
    expect(resolveGap(undefined, undefined, 'row')).toBe(DEFAULT_ROW_GAP);
    expect(DEFAULT_ROW_GAP).toBeGreaterThan(0);
  });

  /*
    And a column none: `Form.Item` already carries `marginBottom`, so a
    column gap is added on top of spacing that is already there.
  */
  it("leaves a column to antd's own vertical rhythm", () => {
    expect(resolveGap(undefined, undefined, 'column')).toBe(0);
  });

  /* The default is a default, not a floor. */
  it('lets an explicit zero turn the gutter off', () => {
    expect(resolveGap({ gap: 0 }, undefined, 'row')).toBe(0);
    expect(
      resolveGap(
        undefined,
        { jsonformsExtended: { layoutDefaults: { gap: 0 } } },
        'row'
      )
    ).toBe(0);
  });
});

describe('the span width formula', () => {
  /*
      c = (W - (G - 1) * g) / G
      spanWidth(n) = n * c + (n - 1) * g
                   = (n / G) * W - g * (G - n) / G
  */
  it('matches the specification, gap included', () => {
    expect(spanBasis(4, 16, 0)).toBe('calc(25% - 0.75 * 0px)');
    expect(spanBasis(8, 16, '1rem')).toBe('calc(50% - 0.5 * 1rem)');
  });

  /* A full-width span leaves no gap to subtract. */
  it('is a plain percentage at full width', () => {
    expect(spanBasis(16, 16, '1rem')).toBe('100%');
  });
});

describe('a child’s participation', () => {
  const sizing = (
    layout: any,
    direction: any = 'row',
    grid = 16,
    gap: any = 0
  ) =>
    itemSizing(
      { type: 'Control', options: { layout } } as any,
      direction,
      grid,
      gap
    );

  /* "Conflict precedence: Fixed > Span > Weight > Auto." */
  it('prefers Fixed over everything', () => {
    const { style } = sizing({ width: 200, span: 4, weight: 3 });
    expect(style.flex).toBe('0 0 200px');
  });

  it('prefers Span over Weight', () => {
    const { style } = sizing({ span: 4, weight: 3 });
    expect(style.flex).toBe('0 0 calc(25% - 0.75 * 0px)');
  });

  it('uses Weight when it is the only hint', () => {
    expect(sizing({ weight: 3 }).style.flex).toBe('3 1 0');
  });

  /*
    "Vertical weight distributes remaining height only when parent height is
    definite/resolvable." A zero basis would collapse the child to nothing
    whenever the parent's height is indefinite - the ordinary case for a form -
    so the column basis is `auto`: content height first, weight over the
    remainder if there is any.
  */
  it('gives vertical weight a content-height basis, not zero', () => {
    expect(sizing({ weight: 3 }, 'column').style.flex).toBe('3 1 auto');
  });

  /* "Horizontal Auto behaves as weight 1." */
  it('treats horizontal Auto as weight 1', () => {
    expect(sizing(undefined).style.flex).toBe('1 1 0');
  });

  /* "Vertical Auto means natural/content height." */
  it('treats vertical Auto as natural height', () => {
    expect(sizing(undefined, 'column').style.flex).toBe('0 0 auto');
  });

  it('applies min and max as constraints, not modes', () => {
    const { style } = sizing({ weight: 1, minWidth: 120, maxWidth: '20rem' });
    expect(style.flex).toBe('1 1 0');
    expect(style.minWidth).toBe('120px');
    expect(style.maxWidth).toBe('20rem');
  });

  /* "`minItemWidth` is parent default minimum" - the child's own wins. */
  it('takes minItemWidth from the parent unless the child sets one', () => {
    const parentOnly = itemSizing(
      { type: 'Control' } as any,
      'row',
      16,
      0,
      140
    );
    expect(parentOnly.style.minWidth).toBe('140px');
    const childWins = itemSizing(
      { type: 'Control', options: { layout: { minWidth: 90 } } } as any,
      'row',
      16,
      0,
      140
    );
    expect(childWins.style.minWidth).toBe('90px');
  });
});

describe('diagnostics rather than silence', () => {
  const sizing = (layout: any, direction: any = 'row', grid = 16) =>
    itemSizing(
      { type: 'Control', options: { layout } } as any,
      direction,
      grid,
      0
    );

  /* "Clamp span above gridColumns and diagnose." */
  it('clamps an oversized span and says so', () => {
    const { style, diagnostics } = sizing({ span: 20 });
    expect(style.flex).toBe('0 0 100%');
    expect(diagnostics.join(' ')).toContain('clamped to 16');
  });

  /*
    "Unsupported hints are ignored with diagnostic; e.g. span under
    Group/VerticalLayout does not create a horizontal grid."
  */
  it('ignores span in a vertical layout, with a diagnostic', () => {
    const { style, diagnostics } = sizing({ span: 4 }, 'column');
    expect(style.flex).toBe('0 0 auto');
    expect(diagnostics.join(' ')).toContain('no effect in a vertical layout');
  });

  it('rejects a span that is not a positive integer', () => {
    expect(sizing({ span: 0 }).diagnostics.join(' ')).toContain(
      'positive integer'
    );
    expect(sizing({ span: 2.5 }).diagnostics.join(' ')).toContain(
      'positive integer'
    );
  });

  /* "weight finite > 0" */
  it('rejects a weight that is not finite and positive', () => {
    for (const weight of [0, -1, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(sizing({ weight }).diagnostics.join(' ')).toContain('weight');
    }
  });

  it('rejects a negative dimension', () => {
    expect(sizing({ width: -10 }).diagnostics.join(' ')).toContain('width');
  });
});

// ------------------------------------------------------------- in a form

describe('a rendered horizontal layout', () => {
  /*
    The end-to-end shape of it: a uischema that says nothing about spacing -
    which is what the upstream JSON Forms examples look like - gets a row
    gutter and no column gutter.
  */
  it('spaces an unconfigured row and not an unconfigured column', async () => {
    const row = render({
      type: 'HorizontalLayout',
      elements: [control('#/properties/a'), control('#/properties/b')],
    });
    await settle();
    /*
      The literal, not `${DEFAULT_ROW_GAP}px`: comparing the rendered value
      against the constant that produced it passes for any constant, zero
      included, which is the whole thing this is meant to catch.
    */
    expect(row.row()!.style.gap).toBe('16px');
    row.unmount();

    const column = render({
      type: 'VerticalLayout',
      elements: [control('#/properties/a'), control('#/properties/b')],
    });
    await settle();
    expect(
      column.container.querySelector<HTMLElement>('[data-layout="column"]')!
        .style.gap
    ).toBe('0px');
    column.unmount();
  });

  it('sizes its children from options.layout', async () => {
    const view = render({
      type: 'HorizontalLayout',
      options: { gap: '1rem' },
      elements: [
        control('#/properties/a', { span: 4 }),
        control('#/properties/b', { weight: 2 }),
        control('#/properties/c', { width: 120 }),
      ],
    });
    await settle();
    const items = view.items();
    expect(items[0].style.flexBasis).toBe('calc(25% - 0.75 * 1rem)');
    expect(items[0].style.flexGrow).toBe('0');
    // The DOM normalises a `0` basis to `0px`, so the parts are read rather
    // than the shorthand string.
    expect(items[1].style.flexGrow).toBe('2');
    expect(items[1].style.flexBasis).toBe('0px');
    expect(items[2].style.flexBasis).toBe('120px');
    expect(items[2].style.flexGrow).toBe('0');
    view.unmount();
  });

  it('applies the container options to the row itself', async () => {
    const view = render({
      type: 'HorizontalLayout',
      options: {
        gap: 12,
        wrap: true,
        align: 'center',
        justify: 'space-between',
      },
      elements: [control('#/properties/a'), control('#/properties/b')],
    });
    await settle();
    const row = view.row()!;
    expect(row.style.gap).toBe('12px');
    expect(row.style.flexWrap).toBe('wrap');
    expect(row.style.alignItems).toBe('center');
    expect(row.style.justifyContent).toBe('space-between');
    // "Structural layouts have no implicit outer padding."
    expect(row.style.padding).toBe('0px');
    view.unmount();
  });

  /*
    "Only effective visible UI-schema children participate. Hidden children
    leave layout." The old implementation divided 24 by `elements.length`, so a
    hidden child still consumed a share and a gap.
  */
  it('drops a hidden child out of the layout entirely', async () => {
    const withRule = {
      ...control('#/properties/b'),
      rule: {
        effect: 'HIDE',
        condition: {
          scope: '#/properties/toggle',
          schema: { const: true },
        },
      },
    };
    const uischema = {
      type: 'HorizontalLayout',
      elements: [
        control('#/properties/a'),
        withRule,
        control('#/properties/c'),
      ],
    };

    const shown = render(uischema, undefined, { toggle: false });
    await settle();
    expect(shown.items()).toHaveLength(3);
    shown.unmount();

    const hidden = render(uischema, undefined, { toggle: true });
    await settle();
    // Two wrappers, not three-with-one-empty.
    expect(hidden.items()).toHaveLength(2);
    hidden.unmount();
  });

  it('reads gridColumns from the global defaults', async () => {
    const view = render(
      {
        type: 'HorizontalLayout',
        elements: [control('#/properties/a', { span: 2 })],
      },
      { jsonformsExtended: { layoutDefaults: { gridColumns: 4 } } }
    );
    await settle();
    // 2 of 4, not 2 of 16. The 16px is the row default gap, not a column count.
    expect(view.items()[0].style.flex).toBe('0 0 calc(50% - 0.5 * 16px)');
    view.unmount();
  });

  /*
    The two names the portable contract replaces. Both are reported rather than
    ignored, because a form carrying them would otherwise be silently the wrong
    size.
  */
  it('diagnoses the excluded columns and trim options', async () => {
    const view = render({
      type: 'HorizontalLayout',
      elements: [
        control('#/properties/a', undefined, { columns: 4 }),
        control('#/properties/b', undefined, { trim: true }),
      ],
    });
    await settle();
    const all = view.diagnostics().join(' ');
    expect(all).toContain('`columns` is not part of the portable contract');
    expect(all).toContain('`trim` is excluded by the portable contract');
    view.unmount();
  });
});
