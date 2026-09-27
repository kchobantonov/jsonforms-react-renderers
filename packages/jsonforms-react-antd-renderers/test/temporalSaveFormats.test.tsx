import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { createAjv } from '@jsonforms/core';
import { antdCells, antdRenderers } from '../src';
import {
  SAVE_FORMAT_DIAGNOSTIC,
  saveFormatSatisfies,
  specDateSaveFormat,
  specDateTimeSaveFormat,
  specTimeSaveFormat,
} from '../src/util/temporalFormats';

/*
  A temporal control is selected **by** the schema's `format` keyword, so what
  it writes has to satisfy that same keyword. That was not true: core's
  `defaultTimeFormat` is `HH:mm:ss`, JSON Forms validates formats in full mode
  where RFC 3339 `time` requires an offset, and so every value the time picker
  could produce was invalid - including the one you got by trying to fix it
  with the picker.

  These tests validate the committed value with the same Ajv the form uses,
  which is the only check that would have caught it.
*/

class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const ajv = createAjv();
const accepts = (format: string, value: unknown) =>
  ajv.compile({ type: 'string', format })(value);

const draw = (format: string, initial?: string) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: any = initial === undefined ? {} : { value: initial };
  let errors: any[] = [];
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={current}
          schema={
            {
              type: 'object',
              properties: { value: { type: 'string', format, title: 'Value' } },
            } as any
          }
          uischema={{ type: 'Control', scope: '#/properties/value' } as any}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data, errors: next }) => {
            current = data;
            errors = next ?? [];
          }}
        />
      </ConfigProvider>
    )
  );

  return {
    container,
    value: () => current.value,
    errors: () => errors,
    input: () => container.querySelector<HTMLInputElement>('input')!,
    unmount: () => act(() => root.unmount()),
  };
};

/**
 * Types a value into the picker's text input and confirms it.
 *
 * Driving the popup's calendar in jsdom is not possible - it measures - but
 * the text path commits through exactly the same handler, which is where the
 * save format is applied.
 */
const commit = async (view: ReturnType<typeof draw>, typed: string) => {
  const input = view.input();
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!;
  act(() => {
    input.focus();
    setter.call(input, typed);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle();
  act(() => {
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true })
    );
  });
  await settle();
};

describe('the defaults are the ones section 18 names', () => {
  it('matches the specification, character for character', () => {
    expect(specDateSaveFormat).toBe('YYYY-MM-DD');
    expect(specTimeSaveFormat).toBe('HH:mm:ssZ');
    // The `T` is escaped; dayjs emits the same string either way.
    expect(specDateTimeSaveFormat).toBe('YYYY-MM-DD[T]HH:mm:ssZ');
  });
});

describe('what a picker commits satisfies the format that selected it', () => {
  it('commits a valid time', async () => {
    const view = draw('time');
    await commit(view, '09:30');
    expect(view.value(), 'the picker committed nothing').toBeTruthy();
    expect(
      accepts('time', view.value()),
      `${JSON.stringify(view.value())} is not a valid time`
    ).toBe(true);
    expect(view.errors()).toHaveLength(0);
    view.unmount();
  });

  it('commits a valid date-time', async () => {
    const view = draw('date-time');
    await commit(view, '2026-10-13 17:00');
    expect(view.value(), 'the picker committed nothing').toBeTruthy();
    expect(
      accepts('date-time', view.value()),
      `${JSON.stringify(view.value())} is not a valid date-time`
    ).toBe(true);
    expect(view.errors()).toHaveLength(0);
    view.unmount();
  });

  it('commits a valid date', async () => {
    const view = draw('date');
    await commit(view, '2026-10-13');
    expect(accepts('date', view.value())).toBe(true);
    expect(view.errors()).toHaveLength(0);
    view.unmount();
  });

  /*
    The offset is the whole point for `time`: seconds alone are not enough
    under RFC 3339, which is why `HH:mm:ss` failed.
  */
  it('writes an offset into a time', async () => {
    const view = draw('time');
    await commit(view, '09:30');
    expect(String(view.value())).toMatch(/(Z|[+-]\d\d:\d\d)$/);
    view.unmount();
  });
});

describe('editing an invalid stored value fixes it', () => {
  /*
    Reported from the demo: a form carrying a value that does not satisfy its
    own format could not be corrected, because the picker wrote another
    invalid one. Both of these start from exactly the values that were on
    screen.
  */
  it('repairs a time stored without an offset', async () => {
    const view = draw('time', '01:30:47');
    expect(accepts('time', '01:30:47')).toBe(false);
    await commit(view, '09:30');
    expect(accepts('time', view.value())).toBe(true);
    view.unmount();
  });

  it('repairs a date-time stored without seconds or offset', async () => {
    const view = draw('date-time', '2026-10-13T17:00');
    expect(accepts('date-time', '2026-10-13T17:00')).toBe(false);
    await commit(view, '2026-10-14 09:15');
    expect(accepts('date-time', view.value())).toBe(true);
    view.unmount();
  });

  /* An invalid stored value is still shown, not blanked. */
  it('displays the invalid value rather than discarding it', () => {
    const view = draw('time', '01:30:47');
    expect(view.input().value).toBe('01:30');
    expect(view.value()).toBe('01:30:47');
    view.unmount();
  });
});

describe('an explicit save format still wins', () => {
  it('honours timeSaveFormat over the default', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let current: any = {};
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={
              {
                type: 'object',
                properties: { value: { type: 'string' } },
              } as any
            }
            uischema={
              {
                type: 'Control',
                scope: '#/properties/value',
                options: { format: 'time', timeSaveFormat: 'HH:mm' },
              } as any
            }
            renderers={antdRenderers}
            cells={antdCells}
            onChange={({ data }) => {
              current = data;
            }}
          />
        </ConfigProvider>
      )
    );
    const view = {
      container,
      input: () => container.querySelector<HTMLInputElement>('input')!,
      value: () => current.value,
      errors: () => [],
      unmount: () => act(() => root.unmount()),
    };
    await commit(view as any, '09:30');
    // No schema format here, so a bare `HH:mm` is exactly what was asked for.
    expect(view.value()).toBe('09:30');
    view.unmount();
  });
});

/*
  The bounds, seen through the picker rather than through the helper.

  antd marks an unselectable day with `.ant-picker-cell-disabled`, so this is
  the one place the "prevent choices" half of section 18 is observable.
*/
describe('the picker refuses what the bounds exclude', () => {
  const openCalendar = async (schema: any, options?: any) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{ value: '2026-10-14' }}
            schema={{ type: 'object', properties: { value: schema } } as any}
            uischema={
              {
                type: 'Control',
                scope: '#/properties/value',
                ...(options ? { options } : {}),
              } as any
            }
            renderers={antdRenderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    const input = container.querySelector<HTMLInputElement>('input')!;
    act(() => {
      input.focus();
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      input.click();
    });
    await settle(150);
    /** Title of each day cell that the calendar has disabled. */
    const disabledDays = () =>
      Array.from(document.querySelectorAll('.ant-picker-cell-disabled')).map(
        (cell) => cell.getAttribute('title')
      );
    return {
      container,
      disabledDays,
      unmount: () => act(() => root.unmount()),
    };
  };

  const bounded = {
    type: 'string',
    format: 'date',
    formatMinimum: '2026-10-01',
    formatMaximum: '2026-10-31',
  };

  it('disables days outside an inclusive range and offers the bounds', async () => {
    const view = await openCalendar(bounded);
    const disabled = view.disabledDays();
    expect(disabled.length, 'the calendar disabled nothing').toBeGreaterThan(0);
    expect(disabled).toContain('2026-09-30');
    expect(disabled).toContain('2026-11-01');
    expect(disabled).not.toContain('2026-10-01');
    expect(disabled).not.toContain('2026-10-31');
    view.unmount();
    document.body.innerHTML = '';
  });

  /* "the adjacent selectable dates are September 20 for a lower bound" */
  it('disables the boundary itself when the bound is exclusive', async () => {
    const view = await openCalendar({
      type: 'string',
      format: 'date',
      formatExclusiveMinimum: '2026-10-19',
    });
    const disabled = view.disabledDays();
    expect(disabled).toContain('2026-10-19');
    expect(disabled).not.toContain('2026-10-20');
    view.unmount();
    document.body.innerHTML = '';
  });

  /* "The preventive bound behavior above follows effective `restrict`." */
  it('offers everything when restrict is off', async () => {
    const view = await openCalendar(bounded, { restrict: false });
    expect(view.disabledDays()).toEqual([]);
    view.unmount();
    document.body.innerHTML = '';
  });
});

/*
  The authoring mistake this whole area invites: a save format that the
  schema's own `format` rejects. It reads like a display setting and is a
  validity setting, and the symptom is a form nobody can make valid.
*/
describe('a save format the schema format rejects', () => {
  it('accepts the defaults', () => {
    expect(saveFormatSatisfies('date', specDateSaveFormat)).toBe(true);
    expect(saveFormatSatisfies('time', specTimeSaveFormat)).toBe(true);
    expect(saveFormatSatisfies('date-time', specDateTimeSaveFormat)).toBe(true);
  });

  /* The exact combination that produced `23:03` against `format: "time"`. */
  it('rejects a bare HH:mm under format time', () => {
    expect(saveFormatSatisfies('time', 'HH:mm')).toBe(false);
  });

  it('rejects seconds without an offset', () => {
    expect(saveFormatSatisfies('time', 'HH:mm:ss')).toBe(false);
  });

  it('rejects a space-separated date-time', () => {
    expect(saveFormatSatisfies('date-time', 'YYYY-MM-DD HH:mm')).toBe(false);
  });

  /*
    The reason the probe instant is all single digits. An unpadded token emits
    two digits anyway for any instant after 09:59, so a probe taken from the
    afternoon accepts `H:mm:ss` and the padding bug ships.
  */
  it('rejects an unpadded token', () => {
    expect(saveFormatSatisfies('time', 'H:mm:ssZ')).toBe(false);
    expect(saveFormatSatisfies('time', 'HH:m:ssZ')).toBe(false);
    expect(saveFormatSatisfies('date', 'YYYY-M-D')).toBe(false);
  });

  /*
    No ordered `format` means nothing to contradict - which is exactly why a
    house format belongs on a control selected through `options.format`.
  */
  it('has no objection when the schema carries no format', () => {
    expect(saveFormatSatisfies(undefined, 'YYYY-MM')).toBe(true);
    expect(saveFormatSatisfies('duration', 'HH:mm')).toBe(true);
  });

  it('warns through the picker, naming the option', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{ value: '09:30:00Z' }}
            schema={
              {
                type: 'object',
                properties: { value: { type: 'string', format: 'time' } },
              } as any
            }
            uischema={
              {
                type: 'Control',
                scope: '#/properties/value',
                options: { timeSaveFormat: 'HH:mm' },
              } as any
            }
            renderers={antdRenderers}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await settle();
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain(SAVE_FORMAT_DIAGNOSTIC);
    expect(String(warn.mock.calls[0][0])).toContain('"HH:mm"');
    warn.mockRestore();
    act(() => root.unmount());
  });
});

/*
  Seconds, and why the display format is not only cosmetic.

  §18 keeps display and storage independent - "seconds in the format enable
  seconds interaction" - and the save format always carries seconds because
  RFC 3339 requires them. The consequence is easy to miss: seconds that are
  not on screen are not editable, and the next edit sets them to zero.
*/
describe('seconds', () => {
  it('keeps stored seconds out of a display that does not ask for them', () => {
    const view = draw('time', '09:30:45Z');
    expect(view.input().value).toMatch(/^\d{2}:\d{2}$/);
    expect(view.value()).toBe('09:30:45Z');
    view.unmount();
  });

  /* The practical reason to turn them on when they matter. */
  it('zeroes seconds the display did not show, on the next edit', async () => {
    const view = draw('time', '09:30:45Z');
    await commit(view, '11:15');
    expect(String(view.value())).toMatch(/^11:15:00/);
    view.unmount();
  });

  it('keeps them when the display shows them', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let current: any = { value: '09:30:45Z' };
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={
              {
                type: 'object',
                properties: { value: { type: 'string', format: 'time' } },
              } as any
            }
            uischema={
              {
                type: 'Control',
                scope: '#/properties/value',
                options: { timeFormat: 'HH:mm:ss' },
              } as any
            }
            renderers={antdRenderers}
            cells={antdCells}
            onChange={({ data }) => {
              current = data;
            }}
          />
        </ConfigProvider>
      )
    );
    const view = {
      input: () => container.querySelector<HTMLInputElement>('input')!,
      value: () => current.value,
    };
    expect(view.input().value).toMatch(/^\d{2}:\d{2}:45$/);
    await commit(view as any, '11:15:30');
    expect(String(view.value())).toMatch(/^11:15:30/);
    // Still a valid time, because the save format is a separate setting.
    expect(accepts('time', view.value())).toBe(true);
    act(() => root.unmount());
  });
});
