import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import config from '@chobantonov/jsonforms-extended-spec/examples/split-layout/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/split-layout/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/split-layout/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/split-layout/uischema.json';

// jsdom has no layout engine. Keep the real antd Splitter and supply only
// the browser measurements needed by tests that assert measured positions.
class ResizeObserverStub {
  static instances = new Set<ResizeObserverStub>();
  targets = new Set<Element>();

  constructor(private callback: ResizeObserverCallback) {
    ResizeObserverStub.instances.add(this);
  }

  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }

  static report(target: Element) {
    for (const observer of this.instances) {
      if (observer.targets.has(target)) {
        observer.callback(
          [{ target } as ResizeObserverEntry],
          observer as unknown as ResizeObserver
        );
      }
    }
  }
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

const measureSplitter = async (container: HTMLElement) => {
  const splitter = container.querySelector<HTMLElement>('.ant-splitter')!;
  // A 900px row with weights 2:1 must produce 600px and 300px panes.
  Object.defineProperties(splitter, {
    offsetWidth: { configurable: true, value: 900 },
    offsetHeight: { configurable: true, value: 300 },
  });
  vi.spyOn(splitter, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 900,
    bottom: 300,
    width: 900,
    height: 300,
    toJSON: () => ({}),
  });
  await act(async () => ResizeObserverStub.report(splitter));
  return splitter;
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
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
          uischema={uischema as any}
          config={config}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  const separators = () =>
    Array.from(container.querySelectorAll<HTMLElement>('[role="separator"]'));
  return {
    container,
    separators,
    unmount: () => act(() => root.unmount()),
  };
};

describe('the split-layout spec example', () => {
  /*
    One separator per adjacent pair of *visible* panes. Counted from the
    fixture rather than hard-coded, so adding a splitter to the example does
    not silently invalidate the rule this is checking.
  */
  it('draws a separator between each pair of panes', async () => {
    const view = draw();
    await settle();
    const expected = Array.from(
      view.container.querySelectorAll('.ant-splitter')
    ).reduce(
      (total, splitter) =>
        total +
        Math.max(
          0,
          splitter.querySelectorAll('.ant-splitter-panel').length - 1
        ),
      0
    );
    expect(view.separators()).toHaveLength(expected);
    view.unmount();
  });

  /* "Layout type determines direction." */
  it('takes its direction from the layout type', async () => {
    const view = draw();
    await settle();
    const orientations = view
      .separators()
      .map((separator) => separator.getAttribute('aria-orientation'));
    // HorizontalLayout -> a vertical separator; VerticalLayout -> horizontal.
    expect(orientations[0]).toBe('vertical');
    expect(orientations[1]).toBe('horizontal');
    view.unmount();
  });

  /*
    "Initial sizes use normal sizing." The first splitter's panes ask for
    weight 2 and Auto, so they start at two thirds and one third rather than
    the equal shares the old implementation always produced.
  */
  it('starts the panes at their weighted shares', async () => {
    const view = draw();
    await settle();
    const splitter = await measureSplitter(view.container);
    const panes = Array.from(
      splitter.querySelectorAll<HTMLElement>('.ant-splitter-panel')
    );
    expect(parseFloat(panes[0].style.flexBasis)).toBeCloseTo(600);
    expect(parseFloat(panes[1].style.flexBasis)).toBeCloseTo(300);
    view.unmount();
  });

  /*
    `resizable` is not asserted here, and deliberately.

    This fixture renders through the **antd** splitter, which delegates the
    separator to antd's `Splitter`. In jsdom the panels measure zero, so antd
    marks every bar `ant-splitter-bar-dragger-disabled` with
    `aria-disabled="true"` whether or not the pane is resizable - the
    distinction is real in a browser and invisible here.

    `resizable` is therefore pinned on the shared renderer instead, in the
    agnostic package's `layoutPrimitives.test.tsx`, where the separator is our
    own element and the state is observable.
  */
  it('keeps a separator for every pair, resizable or not', async () => {
    const view = draw();
    await settle();
    // The non-resizable splitter still contributes its boundary.
    const nonResizable = Array.from(
      view.container.querySelectorAll('.ant-splitter')
    )[2];
    expect(nonResizable.querySelectorAll('[role="separator"]')).toHaveLength(1);
    view.unmount();
  });

  /* "Hidden children leave layout" - including their separator. */
  it('drops a hidden pane and its separator', async () => {
    const hidden = draw({ showAudit: false });
    await settle();
    const without = hidden.separators().length;
    hidden.unmount();

    const shown = draw({ showAudit: true });
    await settle();
    // Exactly one more boundary, because exactly one more pane.
    expect(shown.separators()).toHaveLength(without + 1);
    shown.unmount();
  });

  /*
    The separator carries the role and the current position. The min/max and
    the accessible name come from antd's `Splitter` rather than from this
    renderer - see the note above, and gaps §7.x on the two implementations'
    differing accessibility.
  */
  it('marks each boundary as a separator with its current position', async () => {
    const view = draw();
    await settle();
    await measureSplitter(view.container);
    const first = view.separators()[0];
    expect(first.getAttribute('role')).toBe('separator');
    expect(first.getAttribute('aria-valuenow')).toBe('67');
    view.unmount();
  });
});

/*
  A pane is sized to the full height of its slot and then padded. Under the
  default `content-box` the padding lands outside that height, so every pane
  overflows by exactly its padding and shows a scrollbar over content that
  fits - which is what the demo did.

  Asserted on the style rather than by measuring, because jsdom lays nothing
  out: a scrollbar is not observable here, but the cause is.
*/
describe('pane sizing', () => {
  const paddedPanes = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (element) =>
        element.style.overflow === 'auto' && element.style.padding !== ''
    );

  it('keeps padding inside each pane, so nothing scrolls that fits', async () => {
    const view = draw();
    await settle();
    const panes = paddedPanes(view.container);
    expect(panes.length).toBeGreaterThan(0);
    for (const pane of panes) {
      expect(pane.style.boxSizing).toBe('border-box');
    }
    view.unmount();
  });
});

/*
  A pane revealed by a rule has to arrive with a share of the space.

  antd applies `defaultSize` on mount only, so without a remount the pane that
  was already there keeps the 100% it resolved to when it was alone, and the
  new one falls back to `auto` - present in the DOM, and invisible.

  **This has to toggle at runtime.** Mounting fresh with the pane already
  visible passes either way, because then both panes get their default on the
  same mount - which is exactly how the first version of this test managed to
  pass against the bug.
*/
describe('a pane that appears at runtime', () => {
  it('gives the revealed pane a real share', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let current: any = { ...data, showAudit: false };
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
    /*
      The audit splitter is the fourth in the fixture. Scoped to it rather than
      taking the last panels in the container, which would follow whatever
      splitter happens to be added to the example last.
    */
    const bases = () => {
      const splitter = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-splitter')
      )[3];
      return Array.from(
        splitter.querySelectorAll<HTMLElement>('.ant-splitter-panel')
      ).map((panel) => panel.style.flexBasis);
    };

    paint();
    await settle(200);
    // Alone, the single pane takes everything.
    expect(bases()).toContain('100%');

    // Reveal it the way a user does.
    const box = container.querySelector<HTMLInputElement>(
      'input[type=checkbox]'
    )!;
    act(() => box.click());
    await settle(200);
    paint();
    await settle(200);

    // The value lives on the input, not in textContent.
    expect(
      Array.from(container.querySelectorAll<HTMLInputElement>('input')).some(
        (input) => input.value === 'Reassigned by A. Ferreira.'
      )
    ).toBe(true);
    // Two panes sharing the space, not 100% and whatever is left.
    expect(bases()).toEqual(['50%', '50%']);

    act(() => root.unmount());
    container.remove();
  });
});

/*
  The same three-and-a-toggle shape as a splitter.

  Panes are weighted 1 : 2 : 1 rather than spanned - "span SHOULD NOT be used"
  with a splitter - so removing the middle redistributes, where the spanned row
  in the layout-sizing fixture leaves a hole.
*/
describe('three panes with a hidden middle', () => {
  const lastSplitterBases = (container: HTMLElement) => {
    const splitter = Array.from(
      container.querySelectorAll<HTMLElement>('.ant-splitter')
    ).at(-1)!;
    return Array.from(
      splitter.querySelectorAll<HTMLElement>('.ant-splitter-panel')
    ).map((panel) => panel.style.flexBasis);
  };

  it('starts at 1 : 2 : 1', async () => {
    const view = draw({ showTeamPane: true });
    await settle();
    expect(lastSplitterBases(view.container)).toEqual(['25%', '50%', '25%']);
    view.unmount();
  });

  it('gives the middle pane’s share to the survivors when it goes', async () => {
    const view = draw({ showTeamPane: false });
    await settle();
    expect(lastSplitterBases(view.container)).toEqual(['50%', '50%']);
    view.unmount();
  });
});
