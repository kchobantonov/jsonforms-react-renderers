import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import {
  SharedSplitLayoutRenderer,
  sharedSplitLayoutTester,
  initialSplitSizes,
} from '../src/renderers/SplitLayoutRenderer';
import { SpacerRendererComponent } from '../src/renderers/SpacerRenderer';
import { SeparatorRendererComponent } from '../src/renderers/SeparatorRenderer';

/*
  The two layout primitives from section 7, and the parts of them the gaps
  review had recorded as divergent.
*/

const spacer = (uischema: any, config?: any) =>
  SpacerRendererComponent({
    uischema,
    visible: true,
    config,
  } as any) as React.ReactElement | null;

describe('Spacer', () => {
  /*
    "It defaults to 32 and uses the shared non-negative Dimension type
    (numeric values are CSS pixels on web)."
  */
  it('defaults to 32', () => {
    expect(spacer({ type: 'Spacer' })!.props.style.height).toBe('32px');
  });

  /*
    **`size` is a top-level field.** It used to read `options.height` only, so
    a conformant `{"type":"Spacer","size":16}` silently fell back to 32.
  */
  it('reads the top-level size', () => {
    expect(spacer({ type: 'Spacer', size: 16 })!.props.style.height).toBe(
      '16px'
    );
  });

  it('accepts a string dimension', () => {
    expect(spacer({ type: 'Spacer', size: '2rem' })!.props.style.height).toBe(
      '2rem'
    );
  });

  /* The superseded spelling still works, so existing forms do not shift. */
  it('still honours the older options.height', () => {
    expect(
      spacer({ type: 'Spacer', options: { height: 8 } })!.props.style.height
    ).toBe('8px');
  });

  it('prefers size over the older spelling', () => {
    expect(
      spacer({ type: 'Spacer', size: 4, options: { height: 99 } })!.props.style
        .height
    ).toBe('4px');
  });

  /*
    The specification's flexible-push example. `flexShrink: 0` was hard-coded,
    so a weighted Spacer could not flex at all.
  */
  it('takes a weight instead of a size', () => {
    const style = spacer({
      type: 'Spacer',
      options: { layout: { weight: 2 } },
    })!.props.style;
    expect(style.flex).toBe('2 1 0');
    expect(style.height).toBeUndefined();
  });

  it('ignores a weight that is not positive and finite', () => {
    for (const weight of [0, -1, Number.NaN]) {
      const style = spacer({
        type: 'Spacer',
        size: 10,
        options: { layout: { weight } },
      })!.props.style;
      expect(style.height).toBe('10px');
    }
  });

  it('renders nothing when hidden, and is hidden from assistive tech', () => {
    expect(
      SpacerRendererComponent({
        uischema: { type: 'Spacer' },
        visible: false,
      } as any)
    ).toBeNull();
    expect(spacer({ type: 'Spacer' })!.props['aria-hidden']).toBe('true');
  });
});

describe('Separator orientation', () => {
  const separator = (uischema: any) =>
    SeparatorRendererComponent({
      uischema,
      visible: true,
    } as any) as React.ReactElement | null;

  /* "options.vertical defaults to false (horizontal)". */
  it('is horizontal by default', () => {
    const rule = separator({ type: 'Separator' })!;
    expect(rule.props['data-separator']).toBe('horizontal');
    expect(rule.props['aria-orientation']).toBe('horizontal');
  });

  /*
    `options.vertical` was read by nothing at all, so a vertical separator
    rendered as a horizontal rule across the layout.
  */
  it('reads options.vertical', () => {
    const rule = separator({ type: 'Separator', options: { vertical: true } })!;
    expect(rule.props['data-separator']).toBe('vertical');
  });

  /*
    An `<hr>` carries an implicit `separator` role whose orientation defaults
    to horizontal, so a vertical one has to declare itself - otherwise a
    screen reader describes side-by-side sections as stacked.
  */
  it('exposes the orientation to assistive technology', () => {
    const rule = separator({ type: 'Separator', options: { vertical: true } })!;
    expect(rule.props['aria-orientation']).toBe('vertical');
  });

  /*
    "Parent layout sizing determines the available extent" - the rule supplies
    none of its own height, and stretches to the row instead.
  */
  it('takes its extent from the layout rather than setting a height', () => {
    const rule = separator({ type: 'Separator', options: { vertical: true } })!;
    expect(rule.props.style.alignSelf).toBe('stretch');
    expect(rule.props.style.height).toBe('auto');
  });

  it('renders nothing when hidden', () => {
    expect(
      SeparatorRendererComponent({
        uischema: { type: 'Separator' },
        visible: false,
      } as any)
    ).toBeNull();
  });
});

describe('splitter initial sizes', () => {
  /*
    "Initial sizes use normal sizing." Both implementations used equal shares
    (`100 / count`) regardless of what the panes asked for.
  */
  it('divides by weight', () => {
    expect(
      initialSplitSizes([
        { type: 'Control', options: { layout: { weight: 3 } } },
        { type: 'Control', options: { layout: { weight: 1 } } },
      ] as any)
    ).toEqual([75, 25]);
  });

  /* Auto is weight 1, so equal shares are a result rather than a rule. */
  it('gives equal shares when nothing asks for more', () => {
    expect(
      initialSplitSizes([{ type: 'Control' }, { type: 'Control' }] as any)
    ).toEqual([50, 50]);
  });

  it('mixes weighted and unweighted panes', () => {
    expect(
      initialSplitSizes([
        { type: 'Control', options: { layout: { weight: 2 } } },
        { type: 'Control' },
      ] as any)
    ).toEqual([(2 / 3) * 100, (1 / 3) * 100]);
  });

  /* "Span SHOULD NOT be used" with a splitter, so it falls back to Auto. */
  it('ignores span', () => {
    expect(
      initialSplitSizes([
        { type: 'Control', options: { layout: { span: 12 } } },
        { type: 'Control', options: { layout: { span: 4 } } },
      ] as any)
    ).toEqual([50, 50]);
  });

  it('ignores a weight that is not positive and finite', () => {
    expect(
      initialSplitSizes([
        { type: 'Control', options: { layout: { weight: -2 } } },
        { type: 'Control', options: { layout: { weight: 1 } } },
      ] as any)
    ).toEqual([50, 50]);
  });
});

/*
  `resizable` on the shared splitter, where the separator is our own element.

  The antd splitter delegates its bar to antd's `Splitter`, which in jsdom
  reports every bar disabled because the panels measure zero - so the state is
  only observable here.
*/
describe('splitter resizable', () => {
  const draw = (options: any) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <JsonForms
          data={{ a: 'one', b: 'two' }}
          schema={
            {
              type: 'object',
              properties: {
                a: { type: 'string', title: 'A' },
                b: { type: 'string', title: 'B' },
              },
            } as any
          }
          uischema={
            {
              type: 'HorizontalLayout',
              options: { variant: 'splitter', ...options },
              elements: [
                { type: 'Control', scope: '#/properties/a' },
                { type: 'Control', scope: '#/properties/b' },
              ],
            } as any
          }
          /*
            Only the splitter. Its children have no matching renderer and draw
            nothing, which is fine - these assertions are about the separator.
          */
          renderers={[
            {
              tester: sharedSplitLayoutTester,
              renderer: SharedSplitLayoutRenderer,
            },
          ]}
          onChange={() => undefined}
        />
      )
    );
    return {
      separator: () =>
        container.querySelector<HTMLElement>('[role="separator"]'),
      container,
      unmount: () => act(() => root.unmount()),
    };
  };

  /* "`resizable` defaults true." */
  it('is operable by default', () => {
    const view = draw({});
    const separator = view.separator()!;
    expect(separator.getAttribute('tabindex')).toBe('0');
    expect(separator.getAttribute('aria-disabled')).toBeNull();
    view.unmount();
  });

  /*
    False keeps the boundary - it is still a separator - but stops it being
    focusable or operable.
  */
  it('keeps the boundary and drops the operability when false', () => {
    const view = draw({ resizable: false });
    const separator = view.separator()!;
    expect(separator).toBeTruthy();
    expect(separator.getAttribute('tabindex')).toBeNull();
    expect(separator.getAttribute('aria-disabled')).toBe('true');
    view.unmount();
  });

  /* "splitter+wrap unsupported" - reported rather than silently ignored. */
  it('diagnoses wrap alongside the splitter variant', () => {
    const view = draw({ wrap: true });
    expect(
      view.container.querySelector('[data-layout-diagnostic]')
    ).toBeTruthy();
    view.unmount();
  });
});

/* The same box-model trap on the shared splitter's panes. */
describe('shared splitter pane sizing', () => {
  it('keeps padding inside the pane', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <JsonForms
          data={{}}
          schema={{ type: 'object', properties: {} } as any}
          uischema={
            {
              type: 'HorizontalLayout',
              options: { variant: 'splitter' },
              elements: [
                { type: 'Label', text: 'a' },
                { type: 'Label', text: 'b' },
              ],
            } as any
          }
          renderers={[
            {
              tester: sharedSplitLayoutTester,
              renderer: SharedSplitLayoutRenderer,
            },
          ]}
          onChange={() => undefined}
        />
      )
    );
    const panes = Array.from(
      container.querySelectorAll<HTMLElement>('div')
    ).filter((element) => element.style.overflow === 'auto');
    expect(panes.length).toBeGreaterThan(0);
    for (const pane of panes) {
      expect(pane.style.boxSizing).toBe('border-box');
    }
    act(() => root.unmount());
    container.remove();
  });
});
