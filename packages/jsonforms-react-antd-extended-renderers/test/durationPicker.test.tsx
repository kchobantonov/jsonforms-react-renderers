import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';

/**
 * The duration picker's shape.
 *
 * ISO 8601 has seven components and the picker used to draw all seven, so
 * `P2DT3H` was two useful rows among five zeros - and Weeks sat first, greyed
 * whenever anything else was set, with nothing on screen saying why. These
 * tests are about what is *shown*, which is the part that changed; the value
 * it produces is unchanged and covered by `duration.test.ts`.
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

const settle = async (ms = 120) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema = {
  type: 'object',
  properties: {
    duration: { type: 'string', title: 'Duration', format: 'duration' },
  },
} as any;

const uischema = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/duration' }],
} as any;

const draw = (duration?: string) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = duration === undefined ? {} : { duration };
  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={latest}
            schema={schema}
            uischema={uischema}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={({ data }) => {
              latest = data;
            }}
          />
        </ConfigProvider>
      )
    );
  paint();

  /** The picker renders in a popover, which antd portals to the body. */
  const panel = () =>
    document.querySelector<HTMLElement>('.ant-popover') ?? document.body;

  /*
    One row per unit in play, read by the unit in the input's addon. antd 6
    spells that `.ant-space-addon` inside a `.ant-space-compact`; antd 5's
    `.ant-input-number-group` is gone.
  */
  const rows = () =>
    Array.from(panel().querySelectorAll<HTMLElement>('.ant-space-compact'));

  const units = () =>
    rows()
      .map(
        (row) =>
          row.querySelector('.ant-space-addon')?.textContent?.trim() ?? ''
      )
      .filter(Boolean);

  const valueOf = (unit: string) => {
    const row = rows().find(
      (candidate) =>
        candidate.querySelector('.ant-space-addon')?.textContent?.trim() ===
        unit
    );
    return row?.querySelector<HTMLInputElement>('input')?.value ?? '';
  };

  return {
    container,
    paint,
    panel,
    units,
    valueOf,
    data: () => latest,
    openPicker: async () => {
      const trigger = container.querySelector<HTMLElement>(
        '[aria-label="Choose a duration"], .anticon-clock-circle'
      );
      expect(trigger, 'no picker trigger').toBeTruthy();
      await act(async () => {
        trigger!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await settle(200);
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('which units the picker shows', () => {
  /*
    The change that motivated this: two components, two rows. Not seven.
  */
  it('shows only the units the value uses', async () => {
    const view = draw('P2DT3H');
    await view.openPicker();

    expect(view.units()).toEqual(['Days', 'Hours']);
    expect(view.valueOf('Days')).toBe('2');
    expect(view.valueOf('Hours')).toBe('3');
    view.unmount();
  });

  /*
    Magnitude order, across the date and time halves - `P1DT2H30M` is one
    value, not "days" and "a time".

    (ISO itself requires the components to be written in descending order, so
    a value cannot arrive out of order. The order that has to be *chosen* is
    for units added by hand, which the add test below covers.)
  */
  it('orders them by magnitude, across the date and time halves', async () => {
    const view = draw('P1DT2H30M');
    await view.openPicker();
    expect(view.units()).toEqual(['Days', 'Hours', 'Minutes']);
    view.unmount();
  });

  /*
    An empty value still needs something to type into, or the panel is a bare
    add control.
  */
  it('opens an empty value on one unit', async () => {
    const view = draw();
    await view.openPicker();
    expect(view.units()).toEqual(['Hours']);
    view.unmount();
  });
});

describe('adding and removing units', () => {
  const addUnit = async (view: ReturnType<typeof draw>, unit: string) => {
    const select = view.panel().querySelector<HTMLElement>('.ant-select');
    expect(select, 'no add control').toBeTruthy();
    await act(async () => {
      select!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    await settle(150);
    const option = Array.from(
      document.querySelectorAll('.ant-select-item-option-content')
    ).find((node) => node.textContent === unit);
    expect(option, `no option ${unit}`).toBeTruthy();
    await act(async () => {
      (option as HTMLElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );
    });
    await settle(150);
  };

  it('reveals an added unit at zero, in magnitude order', async () => {
    const view = draw('PT3H');
    await view.openPicker();
    expect(view.units()).toEqual(['Hours']);

    await addUnit(view, 'Days');
    // Days is larger, so it goes above Hours rather than where it was added.
    expect(view.units()).toEqual(['Days', 'Hours']);
    expect(view.valueOf('Days')).toBe('0');
    view.unmount();
  });

  /* Removing clears the unit, so the value matches what is on screen. */
  it('removes a unit and clears it', async () => {
    const view = draw('P2DT3H');
    await view.openPicker();

    const remove = Array.from(
      view.panel().querySelectorAll<HTMLButtonElement>('button')
    ).find((button) =>
      (button.getAttribute('aria-label') ?? '').includes('Days')
    );
    expect(remove, 'no remove action for Days').toBeTruthy();
    await act(async () => remove!.click());
    await settle();

    expect(view.units()).toEqual(['Hours']);
    view.unmount();
  });

  /* The last remaining unit keeps no remove action - there must be one row. */
  it('does not offer to remove the only unit', async () => {
    const view = draw('PT3H');
    await view.openPicker();
    const removes = Array.from(
      view.panel().querySelectorAll<HTMLButtonElement>('button')
    ).filter((button) =>
      (button.getAttribute('aria-label') ?? '').startsWith('Remove')
    );
    expect(removes).toHaveLength(0);
    view.unmount();
  });
});

describe('weeks is a mode, not a component', () => {
  /*
    ISO forbids combining `W` with anything else. The old picker enforced that
    by greying the Weeks row, which is correct and tells the user nothing.
  */
  it('is not one of the component rows', async () => {
    const view = draw('P2DT3H');
    await view.openPicker();
    expect(view.units()).not.toContain('Weeks');
    view.unmount();
  });

  it('opens a weeks value in weeks mode, with one row', async () => {
    const view = draw('P2W');
    await view.openPicker();
    expect(view.units()).toEqual(['Weeks']);
    expect(view.valueOf('Weeks')).toBe('2');
    view.unmount();
  });

  /*
    `P0W` is a valid duration - RFC 3339's `dur-week = 1*DIGIT "W"` admits
    zero - and it parses to a draft of all zeros, indistinguishable from
    `P0D`. So the mode has to come from the **text**, not from `weeks > 0`.
  */
  it('opens P0W in weeks mode, at zero', async () => {
    const view = draw('P0W');
    await view.openPicker();
    expect(view.units()).toEqual(['Weeks']);
    expect(view.valueOf('Weeks')).toBe('0');
    view.unmount();
  });

  /*
    The mode is something the user chose, so it must not depend on the value
    they are in the middle of entering. Deriving it from `weeks > 0` meant
    clearing the box made the row vanish and the segmented control jump.
  */
  it('stays in weeks mode while the box is cleared', async () => {
    const view = draw('P2W');
    await view.openPicker();
    expect(view.units()).toEqual(['Weeks']);

    const input = view
      .panel()
      .querySelector<HTMLInputElement>('.ant-input-number-input');
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, '0');
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();

    expect(view.units()).toEqual(['Weeks']);
    expect(view.valueOf('Weeks')).toBe('0');
    view.unmount();
  });

  /* And switching is an explicit act, not a consequence of zeroing fields. */
  it('switches between the two representations', async () => {
    const view = draw('P2DT3H');
    await view.openPicker();

    const weeks = Array.from(
      view.panel().querySelectorAll<HTMLElement>('.ant-segmented-item-label')
    ).find((node) => node.textContent === 'Weeks');
    expect(weeks, 'no weeks mode').toBeTruthy();
    await act(async () => {
      weeks!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();

    expect(view.units()).toEqual(['Weeks']);
    view.unmount();
  });
});

/*
  What Apply writes, and what it must leave alone.

  Several spellings are the same duration - `P0W`, `P0D` and `PT0S` are all
  "nothing", `P1DT0H` is `P1D` - so committing the canonical form back over an
  equal value rewrites data nobody touched. The specification forbids that in
  general: "existing data must not be silently normalized solely because the
  renderer is mounted."
*/
describe('applying without editing', () => {
  const applyIn = async (view: ReturnType<typeof draw>) => {
    const apply = Array.from(
      view.panel().querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.trim() === 'Apply');
    expect(apply, 'no Apply button').toBeTruthy();
    await act(async () => apply!.click());
    await settle();
  };

  /*
    The last three carry leading zeros, which `1*DIGIT` admits and the
    canonical form cannot spell. Nothing reformats a value the user did not
    edit, so they survive - the same rule that protects `P0W`.
  */
  it.each([
    'P0W',
    'P0D',
    'PT0S',
    'P1DT0H',
    'P2W',
    'PT011H591212M',
    'P0001D',
    'P01Y02M03D',
  ])(
    'leaves %s exactly as it was',
    async (value) => {
      const view = draw(value);
      await view.openPicker();
      await applyIn(view);
      expect(view.data().duration).toBe(value);
      view.unmount();
    }
  );

  /* And still writes when something actually changed. */
  it('writes the canonical form once a unit is edited', async () => {
    const view = draw('P0W');
    await view.openPicker();

    const input = view
      .panel()
      .querySelector<HTMLInputElement>('.ant-input-number-input');
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, '3');
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    await applyIn(view);

    expect(view.data().duration).toBe('P3W');
    view.unmount();
  });
});

describe('the panel lines up', () => {
  /*
    The rows were flex, and a flex item keeps its natural width: the
    number-and-unit group sat at about half the panel while the add control
    below it ran the full width. jsdom applies no stylesheet, so what is
    asserted here is the inline geometry the renderer asks for - a grid, whose
    items stretch - not the pixels a browser then produces.
  */
  const rowsOf = (view: ReturnType<typeof draw>) =>
    Array.from(
      view.panel()?.querySelectorAll<HTMLElement>('div[style*="grid"]') ?? []
    );

  it('gives every row the same two columns', async () => {
    const view = draw('P1DT2H30M');
    await view.openPicker();

    const rows = rowsOf(view);
    expect(rows).toHaveLength(3);
    const columns = new Set(rows.map((row) => row.style.gridTemplateColumns));
    expect(columns.size).toBe(1);
    expect([...columns][0]).toMatch(/^1fr /);
    view.unmount();
  });

  /*
    The removal buttons align because the column is there whether or not a
    button is in it. A row that cannot be removed used to grow into the space.
  */
  it('reserves the button column on a row that cannot be removed', async () => {
    const view = draw();
    await view.openPicker();

    expect(view.units()).toEqual(['Hours']);
    const [row] = rowsOf(view);
    expect(row.children).toHaveLength(2);
    expect(row.querySelector('button')).toBeNull();
    view.unmount();
  });

  /*
    One unit column for the whole panel, sized from the longest label the
    panel can offer rather than the rows on screen: adding a unit must not
    resize the ones already there, and "Minutes" and "Минути" are not the same
    width.
  */
  it('gives every unit label the same width', async () => {
    const view = draw('P1DT2H30M');
    await view.openPicker();

    const widths = new Set(
      Array.from(
        view.panel()?.querySelectorAll<HTMLElement>('.ant-space-addon') ?? []
      ).map((addon) => addon.style.width)
    );
    expect(widths.size).toBe(1);
    expect([...widths][0]).toMatch(/^\d+ch$/);
    view.unmount();
  });
});

/*
  A duration's components are quantities, not clock fields.

  The picker capped months at 11 and hours, minutes and seconds at 23 or 59 -
  the shape of a time of day. A length of time has no such bound: `PT90M` and
  `P400D` are ordinary durations, and `PT90M` is not interchangeable with
  `PT1H30M` as stored data. Worse, the cap was enforced by clamping, so a
  typed 90 became 59 with nothing said.
*/
describe('components are not clock fields', () => {
  const typeInto = async (
    view: ReturnType<typeof draw>,
    unit: string,
    text: string
  ) => {
    const row = Array.from(
      view.panel().querySelectorAll<HTMLElement>('.ant-space-compact')
    ).find(
      (candidate) =>
        candidate.querySelector('.ant-space-addon')?.textContent?.trim() ===
        unit
    );
    expect(row, `no ${unit} row`).toBeTruthy();
    const input = row!.querySelector<HTMLInputElement>('input');
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, text);
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
  };

  const applyIn = async (view: ReturnType<typeof draw>) => {
    const apply = Array.from(
      view.panel().querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.trim() === 'Apply');
    await act(async () => apply!.click());
    await settle();
  };

  it('keeps a minute count far above 59', async () => {
    const view = draw('PT1H');
    await view.openPicker();
    await typeInto(view, 'Hours', '1');

    // The panel opens on Hours alone; Minutes has to be added first.
    const select = view.panel().querySelector<HTMLElement>('.ant-select');
    await act(async () => {
      select!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    await settle(150);
    const option = Array.from(
      document.querySelectorAll('.ant-select-item-option-content')
    ).find((node) => node.textContent === 'Minutes');
    await act(async () => {
      (option as HTMLElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );
    });
    await settle(150);

    await typeInto(view, 'Minutes', '591212');
    expect(view.valueOf('Minutes')).toBe('591212');

    await applyIn(view);
    expect(view.data().duration).toBe('PT1H591212M');
    view.unmount();
  });

  /*
    A second capped unit, and typed rather than parsed: a value that merely
    *arrives* above the cap was displayed intact even when the cap was there,
    because the draft comes from the parser and only `changePart` clamped. So
    the assertion has to go through typing or it guards nothing.
  */
  it('keeps an hour count above 23', async () => {
    const view = draw('PT1H');
    await view.openPicker();

    await typeInto(view, 'Hours', '25');
    expect(view.valueOf('Hours')).toBe('25');

    await applyIn(view);
    expect(view.data().duration).toBe('PT25H');
    view.unmount();
  });

  it('does not offer a maximum that would clamp', async () => {
    const view = draw('PT90M');
    await view.openPicker();
    const input = view
      .panel()
      .querySelector<HTMLInputElement>('.ant-input-number-input');
    expect(input?.getAttribute('aria-valuemax')).toBe(
      String(Number.MAX_SAFE_INTEGER)
    );
    view.unmount();
  });
});
