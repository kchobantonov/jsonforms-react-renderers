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
 * The cron picker's shape, and the two things it refuses to do.
 *
 * A period is a **lens** on a schedule: it decides which of the six fields are
 * worth showing and asserts nothing of its own. So a property with no schedule
 * in it opens with no period chosen and no rows, and choosing one writes
 * nothing. What the control *produces* is `cronValues.test.ts`; these are about
 * what is on screen and what reaches the data.
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
    schedule: { type: 'string', title: 'Schedule', format: 'cron' },
  },
} as any;

const uischema = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/schedule' }],
} as any;

const draw = (schedule?: string) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = schedule === undefined ? {} : { schedule };
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

  /** One row per field, read by the label in the addon. */
  const rows = () =>
    Array.from(panel().querySelectorAll<HTMLElement>('.ant-space-compact'));

  const labels = () =>
    rows()
      .map(
        (row) =>
          row.querySelector('.ant-space-addon')?.textContent?.trim() ?? ''
      )
      .filter(Boolean);

  const rowFor = (label: string) =>
    rows().find(
      (candidate) =>
        candidate.querySelector('.ant-space-addon')?.textContent?.trim() ===
        label
    );

  /**
   * What a multi-select row has chosen, read from its open list.
   *
   * Not from the chips: the row asks for `maxTagCount: 'responsive'`, and
   * antd's overflow measures every item as zero wide in jsdom, so the only
   * thing it renders is the "+ n ..." rest item.
   *
   * Only usable on a **short** field. The list virtualizes, so a sixty-value
   * field renders a window of its options and a selection outside that window
   * is not in the DOM to be found. What those fields select is
   * `cronValues.test.ts`; what is asserted here is that they are offered as
   * choices at all.
   */
  const chosen = async (label: string) => {
    const select = rowFor(label)?.querySelector<HTMLElement>('.ant-select');
    expect(select, `no ${label} row`).toBeTruthy();
    await act(async () => {
      select!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      select!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle(200);
    const lists = document.querySelectorAll<HTMLElement>(
      '.ant-select-dropdown'
    );
    const list = lists[lists.length - 1];
    return Array.from(
      list?.querySelectorAll<HTMLElement>('.ant-select-item-option-selected') ??
        []
    ).map((option) => option.textContent?.trim() ?? '');
  };

  return {
    container,
    panel,
    labels,
    rowFor,
    chosen,
    data: () => latest,
    /** The expression box inside the picker. */
    expression: () =>
      panel().querySelector<HTMLInputElement>('input[aria-label="Expression"]')
        ?.value ?? '',
    /** The control's own field, which is the value. */
    field: () =>
      container.querySelector<HTMLInputElement>('input.ant-input')?.value ?? '',
    openPicker: async () => {
      const trigger = container.querySelector<HTMLElement>(
        '[aria-label="Choose a schedule"], .anticon-schedule'
      );
      expect(trigger, 'no picker trigger').toBeTruthy();
      await act(async () => {
        trigger!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await settle(200);
    },
    press: async (text: string) => {
      const button = Array.from(
        panel().querySelectorAll<HTMLElement>('button')
      ).find((each) => each.textContent?.trim() === text);
      expect(button, `no ${text} button`).toBeTruthy();
      await act(async () => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await settle();
    },
    type: async (value: string) => {
      const input = panel().querySelector<HTMLInputElement>(
        'input[aria-label="Expression"]'
      );
      expect(input, 'no expression input').toBeTruthy();
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )!.set!;
        setter.call(input, value);
        input!.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('a schedule the value already states', () => {
  it('opens on the period the expression describes', async () => {
    // `0 0/15 * * * *` restricts minutes and seconds and nothing coarser, so
    // the coarsest thing it says is "within the hour".
    const form = draw('0 0/15 * * * *');
    await form.openPicker();

    expect(form.labels()[0]).toBe('Repeats');
    expect(form.rowFor('Repeats')?.textContent).toContain('Hourly');
    expect(form.labels()).toEqual(['Repeats', 'Minutes', 'Seconds']);
    form.unmount();
  });

  it('offers each field as choices rather than as the syntax it is written in', async () => {
    const form = draw('0 0/15 * * * *');
    await form.openPicker();

    // A list to pick from, not a box to spell `0/15` into. Which values that
    // step selects is `cronValues.test.ts`; the list is too long to read back
    // through a virtualized dropdown.
    expect(form.rowFor('Minutes')?.querySelector('.ant-select')).toBeTruthy();
    expect(form.rowFor('Seconds')?.querySelector('.ant-select')).toBeTruthy();
    // And the spelling it was written in survives being looked at.
    expect(form.expression()).toBe('0 0/15 * * * *');
    form.unmount();
  });

  it('shows what a restricted field selects', async () => {
    const form = draw('0 0 9 * * MON');
    await form.openPicker();

    expect(await form.chosen('Days of week')).toEqual(['MON']);
    form.unmount();
  });

  it('shows a whole field standing for every value as nothing chosen', async () => {
    // Seven chips here, sixty on the seconds row, and all of them saying the
    // one thing an empty selection already says. A monthly schedule, because
    // that is a period whose rows include a day of the week it does not use.
    const form = draw('0 0 9 1 * *');
    await form.openPicker();

    expect(await form.chosen('Days of week')).toEqual([]);
    expect(form.rowFor('Days of week')?.textContent).toContain('Every');
    form.unmount();
  });

  it('reads the seconds field, which is the one a five-field dialect loses', async () => {
    // `10 * * * * *` is second 10 of every minute. Read as Unix cron it is
    // something else entirely, and read as Quartz it is short a field.
    const form = draw('10 * * * * *');
    await form.openPicker();

    expect(form.rowFor('Repeats')?.textContent).toContain('Every minute');
    expect(form.rowFor('Seconds')?.querySelector('.ant-select')).toBeTruthy();
    expect(form.expression()).toBe('10 * * * * *');
    form.unmount();
  });

  it('names days and months rather than numbering them', async () => {
    const form = draw('0 0 9 ? * MON-FRI');
    await form.openPicker();

    // Named, not numbered: the field stores 1-5 and `MON` is what it is called.
    expect(await form.chosen('Days of week')).toEqual([
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
    ]);
    form.unmount();
  });

  it('edits a field it cannot offer a list for as the text it is', async () => {
    // "The last day of the month" is not a list of days. Offering one would
    // change what the schedule does, so the field keeps its syntax.
    const form = draw('0 0 9 L * ?');
    await form.openPicker();

    const row = form.rowFor('Days of month');
    expect(row?.querySelector('.ant-select')).toBeFalsy();
    expect(row?.querySelector<HTMLInputElement>('input')?.value).toBe('L');
    expect(form.panel().textContent).toContain('Edited as text');
    form.unmount();
  });
});

describe('a property with no schedule in it', () => {
  it('opens with no period and no rows, rather than on a placeholder', async () => {
    /*
      The field's placeholder is a real expression, and a picker that loaded it
      would be showing a schedule nobody chose - with Cancel the only way to
      leave the property as it was found.
    */
    const form = draw();
    await form.openPicker();

    expect(form.labels()).toEqual(['Repeats']);
    expect(form.rowFor('Repeats')?.textContent).toContain('Choose how often');
    expect(form.expression()).toBe('');
    form.unmount();
  });

  it('writes nothing when Apply is pressed without an edit', async () => {
    const form = draw();
    await form.openPicker();
    await form.press('Apply');

    expect(form.data().schedule).toBeUndefined();
    form.unmount();
  });
});

describe('applying without editing', () => {
  for (const [written, why] of [
    ['0 0/15 * * * *', 'a step'],
    ['0 */15 * * * *', 'the other spelling of the same step'],
    ['@daily', 'a macro'],
    ['0 0 9 * * 7', 'the second number for Sunday'],
    ['0 0 9-11 * * *', 'a range a list would also express'],
    ['0 0 9 L * ?', 'syntax the picker models as text'],
  ] as Array<[string, string]>) {
    it(`leaves ${written} exactly as it was (${why})`, async () => {
      /*
        Section 18: existing data must not be silently normalized solely
        because the renderer is mounted. Each of these has a canonical form the
        picker would otherwise write back, marking the field dirty without an
        edit and replacing whatever a server sent.
      */
      const form = draw(written);
      await form.openPicker();
      await form.press('Apply');

      expect(form.data().schedule).toBe(written);
      form.unmount();
    });
  }
});

describe('what the picker writes', () => {
  it('commits an edited expression on Apply and not before', async () => {
    const form = draw('0 0 9 * * *');
    await form.openPicker();
    await form.type('0 30 9 * * *');

    expect(form.data().schedule).toBe('0 0 9 * * *');
    await form.press('Apply');
    expect(form.data().schedule).toBe('0 30 9 * * *');
    form.unmount();
  });

  it('keeps a draft out of the value when Cancel is pressed', async () => {
    const form = draw('0 0 9 * * *');
    await form.openPicker();
    await form.type('0 30 9 * * *');
    await form.press('Cancel');

    expect(form.data().schedule).toBe('0 0 9 * * *');
    form.unmount();
  });

  it('refuses to apply a five-field expression', async () => {
    // The dialect takes six. `0 9 * * *` is 09:00 daily to Unix cron and is
    // not the same schedule here, so it is rejected rather than reinterpreted.
    const form = draw('0 0 9 * * *');
    await form.openPicker();
    await form.type('0 9 * * *');

    const apply = Array.from(
      form.panel().querySelectorAll<HTMLButtonElement>('button')
    ).find((each) => each.textContent?.trim() === 'Apply');
    expect(apply?.disabled).toBe(true);
    form.unmount();
  });
});

describe('the control itself', () => {
  it('keeps the expression editable as text, with the picker inside the field', async () => {
    // One field, like the duration and color controls - not a widget beside an
    // input.
    const form = draw('0 0/15 * * * *');

    expect(form.field()).toBe('0 0/15 * * * *');
    expect(
      form.container.querySelector('[aria-label="Choose a schedule"]')
    ).toBeTruthy();
    form.unmount();
  });

  it('reports a schedule the dialect cannot run, naming the field', async () => {
    const form = draw('0 0 25 * * *');

    expect(form.container.textContent).toContain('hours field is not valid');
    form.unmount();
  });
});
