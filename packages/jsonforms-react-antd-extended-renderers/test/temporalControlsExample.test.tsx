import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { createAjv } from '@jsonforms/core';
import { createFormsAjv } from '@chobantonov/jsonforms-react-extended-renderers';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import data from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/uischema.json';

/*
  Date, time, date-time and duration, split by **how the control was chosen**.

  That split is the point of the fixture. A schema `format` selects the
  renderer *and* gives the validator something to check, so the value has to
  satisfy it. A UI `options.format` selects the renderer and nothing else -
  the schema still says "string" - so the form is free to store whatever house
  format it likes.
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

const ajv = createAjv();
/** The same validator the form uses, so a stored value is judged as it is. */
const accepts = (format: string, value: unknown) =>
  ajv.compile({ type: 'string', format })(value);

/*
  The fixture's `$data` bound cannot be compiled by the plain validator - it
  throws at compile time - so the form is given the one these renderers expect.
*/
const formsAjv = createFormsAjv({ allErrors: true });

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (override?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: any = { ...data, ...(override ?? {}) };
  let errors: any[] = [];
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={current}
          schema={schema as any}
          uischema={uischema as any}
          ajv={formsAjv}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={({ data: next, errors: nextErrors }) => {
            current = next;
            errors = nextErrors ?? [];
          }}
        />
      </ConfigProvider>
    )
  );

  const active = () =>
    container.querySelector<HTMLElement>('.ant-tabs-content-active');

  return {
    container,
    active,
    data: () => current,
    errors: () => errors,
    paths: () => errors.map((error: any) => error.instancePath),
    labelled: (label: string) => {
      const item = Array.from(
        active()?.querySelectorAll<HTMLElement>('.ant-form-item') ?? []
      ).find((entry) => entry.querySelector('label')?.textContent === label);
      return item?.querySelector<HTMLInputElement>('input') ?? null;
    },
    selectTab: async (label: string) => {
      const tab = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).find((candidate) => candidate.textContent?.includes(label));
      expect(tab, `no tab labelled ${label}`).toBeTruthy();
      act(() => tab!.click());
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('the two ways a temporal control is chosen', () => {
  it('separates them into their own categories', async () => {
    const view = draw();
    await settle();
    expect(
      Array.from(
        view.container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).map((tab) => tab.textContent)
    ).toEqual([
      'Selected by the schema',
      'Selected by the UI schema',
      'Restricting the range',
      'In other structures',
    ]);
    view.unmount();
  });

  /*
    One error on purpose, and only one. `bounded.unrestricted` carries bounds
    with `restrict: false` and a value outside them, to show that a bound
    governs what the picker *offers* and never rewrites what is stored.
  */
  it('loads with exactly the one deliberate error', async () => {
    const view = draw();
    await settle();
    expect(view.paths()).toEqual(['/bounded/unrestricted']);
    view.unmount();
  });
});

describe('selected by the schema', () => {
  it('renders a picker for each format keyword', async () => {
    const view = draw();
    await view.selectTab('Selected by the schema');
    expect(view.labelled('Appointment date')?.value).toBe('2026-10-14');
    /*
      Not an exact string. A valid `time` or `date-time` carries an offset and
      the picker displays it in the **viewer's** timezone, so the wall clock
      depends on where the test runs. What must hold is the shape.
    */
    expect(view.labelled('Start time')?.value).toMatch(/^\d{2}:\d{2}$/);
    expect(view.labelled('Send reminder at')?.value).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
    );
    expect(view.labelled('Session length')?.value).toBe('PT1H30M');
    view.unmount();
  });

  /*
    "seconds in the format enable seconds interaction". The save format always
    carries seconds - RFC 3339 requires them - but whether they are on screen
    is the *display* format's business, and the two are independent settings.
  */
  it('shows seconds only where the display format asks for them', async () => {
    const view = draw();
    await view.selectTab('Selected by the schema');
    expect(view.labelled('Start time')?.value).toMatch(/^\d{2}:\d{2}$/);
    expect(view.labelled('Start time, to the second')?.value).toMatch(
      /^\d{2}:\d{2}:\d{2}$/
    );
    // Both store a value with seconds regardless.
    expect((data as any).schemaBased.timeWithSeconds).toMatch(/:\d{2}Z$/);
    view.unmount();
  });

  /*
    The bug this fixture was carrying, and the reason for the split: a control
    selected **by** a format keyword must write values that keyword accepts.
    Core's `defaultTimeFormat` had no offset, so every value the time picker
    wrote was invalid - and so was the fixture's own starting data.
  */
  it('ships values that satisfy the keyword that selected the control', () => {
    const based = (data as any).schemaBased;
    expect(accepts('date', based.date)).toBe(true);
    expect(accepts('time', based.time)).toBe(true);
    expect(accepts('date-time', based.datetime)).toBe(true);
  });

  it('raises no error on the schema-based group', async () => {
    const view = draw();
    await settle();
    expect(
      view.paths().filter((path: string) => path.startsWith('/schemaBased'))
    ).toEqual([]);
    view.unmount();
  });

  it('marks the required date', async () => {
    const view = draw();
    await view.selectTab('Selected by the schema');
    const item = Array.from(
      view.active()!.querySelectorAll<HTMLElement>('.ant-form-item')
    ).find(
      (entry) =>
        entry.querySelector('label')?.textContent === 'Appointment date'
    );
    expect(item?.querySelector('.ant-form-item-required')).toBeTruthy();
    view.unmount();
  });

  it('invents no value for an empty property', async () => {
    const view = draw({
      schemaBased: { ...(data as any).schemaBased, time: undefined },
    });
    await view.selectTab('Selected by the schema');
    expect(view.labelled('Start time')?.value).toBe('');
    expect(view.data().schemaBased.time).toBeUndefined();
    view.unmount();
  });
});

describe('selected by the UI schema', () => {
  /*
    The schema says only `type: "string"`, so `options.format` is doing all the
    selecting. This is how a plain property becomes a picker without the schema
    being changed - and why these three can store shapes no RFC would accept.
  */
  it('renders pickers for properties the schema does not mark', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.labelled('Year and month picker')).toBeTruthy();
    expect(view.labelled('Opening time')).toBeTruthy();
    expect(view.labelled('Published at')).toBeTruthy();
    view.unmount();
  });

  /*
    `views` names the panels a picker offers, and "does not automatically
    change the save format". The picker offers months; the stored value is
    whatever the save format says.
  */
  it('honours views for the calendar granularity', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.labelled('Year and month picker')?.value).toBe('2027.01');
    expect(view.data().uiSchemaBased.month).toBe('2027-01');
    view.unmount();
  });

  /*
    The time half of the same option, which the fixture demonstrates against a
    seconds-bearing format so the two cannot be confused: the stored value
    keeps its seconds while the picker offers only hours and minutes.
  */
  it('honours views for the time columns, without touching storage', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');

    const coarse = view.labelled('Collection window');
    expect(coarse, 'no coarse-time picker in the fixture').toBeTruthy();
    // Displayed and stored to the second.
    expect(coarse?.value).toBe('09:30:00');
    expect(view.data().uiSchemaBased.coarseTime).toBe('09:30:00');
    view.unmount();
  });

  /*
    And the combined array on a date-time control. Only its time half applies:
    a date-time picker always offers a full date, so a narrowed calendar would
    leave it unable to express a value it has to store.
  */
  it('takes both halves of views on a date-time control', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.labelled('Published at, chosen to the minute')).toBeTruthy();
    expect(view.data().uiSchemaBased.datetimeSeconds).toBe(
      '2026/11/02 3:05:30 pm'
    );
    view.unmount();
  });

  /*
    The case the split exists for. `HH:mm` carries no offset, so under
    `format: "time"` it could never validate - here there is no format keyword
    to object, and it is exactly what the form wants to store.
  */
  it('stores a bare HH:mm, which a format keyword would have rejected', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.data().uiSchemaBased.time).toBe('08:00');
    expect(accepts('time', view.data().uiSchemaBased.time)).toBe(false);
    // And the form is not in error over it.
    expect(
      view.paths().filter((path: string) => path.startsWith('/uiSchemaBased'))
    ).toEqual([]);
    view.unmount();
  });

  /*
    The user-facing half of the same point: a UI-selected control can store
    seconds or not, and the display decides whether they can be edited.
  */
  it('offers both a with-seconds and a without-seconds variant', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.labelled('Opening time')?.value).toMatch(
      /^\d{2}:\d{2}\s*(am|pm)$/i
    );
    expect(view.labelled('Opening time, to the second')?.value).toBe(
      '08:00:30'
    );
    expect(view.labelled('Published at')?.value).toBe('02-11-26 03:05 pm');
    expect(view.labelled('Published at, to the second')?.value).toBe(
      '02-11-26 03:05:30 pm'
    );
    view.unmount();
  });

  it('stores the seconds it displays', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.data().uiSchemaBased.timeSeconds).toBe('08:00:30');
    expect(view.data().uiSchemaBased.datetimeSeconds).toBe(
      '2026/11/02 3:05:30 pm'
    );
    view.unmount();
  });

  it('shows a twelve-hour clock over that value', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.labelled('Opening time')?.value).toMatch(
      /^\d{2}:\d{2}\s*(am|pm)$/i
    );
    view.unmount();
  });

  /* Displayed one way, stored in a house format that is nobody's standard. */
  it('keeps display and storage apart', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.labelled('Published at')?.value).toBe('02-11-26 03:05 pm');
    expect(view.data().uiSchemaBased.datetime).toBe('2026/11/02 3:05 pm');
    view.unmount();
  });

  /* `pattern` is the only thing validating a UI-selected control. */
  it('validates through pattern, and nothing else', async () => {
    const view = draw({
      uiSchemaBased: { ...(data as any).uiSchemaBased, month: 'January 2027' },
    });
    await settle();
    expect(view.errors().map((error: any) => error.keyword)).toContain(
      'pattern'
    );
    view.unmount();
  });

  it('commits nothing by being displayed', async () => {
    const view = draw();
    await view.selectTab('Selected by the UI schema');
    expect(view.data().uiSchemaBased).toEqual((data as any).uiSchemaBased);
    view.unmount();
  });
});

/*
  Section 18's format bounds. "The preventive bound behavior above follows
  effective `restrict`" - so these govern what the picker offers, and the
  validator remains the thing that decides validity.
*/
describe('restricting the range', () => {
  const open = async (override?: any) => {
    const view = draw(override);
    await view.selectTab('Restricting the range');
    return view;
  };

  it('offers a picker for each bounded property', async () => {
    const view = await open();
    expect(view.labelled('Booking date')).toBeTruthy();
    expect(view.labelled('Within office hours')).toBeTruthy();
    expect(view.labelled('Appointment slot')).toBeTruthy();
    view.unmount();
  });

  it('accepts a value inside the bounds', async () => {
    const view = await open();
    expect(view.paths()).not.toContain('/bounded/bookingDate');
    expect(view.paths()).not.toContain('/bounded/officeHours');
    expect(view.paths()).not.toContain('/bounded/slot');
    view.unmount();
  });

  /*
    "An exclusive bound on 2026-09-19 excludes that date; the adjacent
    selectable dates are September 20 for a lower bound."
  */
  it('excludes the boundary of an exclusive bound', async () => {
    const view = await open({
      bounded: { ...(data as any).bounded, notBefore: '2026-10-19' },
    });
    await settle();
    expect(view.errors().map((error: any) => error.keyword)).toContain(
      'formatExclusiveMinimum'
    );
    view.unmount();
  });

  /*
    The contrast the tab exists for: the same bounds, `restrict: false`, and a
    stored value outside them. The value is kept exactly as it is and reported,
    rather than being clamped into range.
  */
  it('keeps an out-of-range value when restrict is off', async () => {
    const view = await open();
    expect(view.data().bounded.unrestricted).toBe('2026-12-24');
    expect(view.labelled('Same bounds, restrict off')?.value).toBe(
      '2026-12-24'
    );
    expect(view.paths()).toContain('/bounded/unrestricted');
    view.unmount();
  });
});

/*
  The same controls reached through the structures a real schema uses: a
  `$ref` shared by two properties, both tuple spellings, and a mixed type.

  The theme of the whole example repeats here - the renderer understands more
  of the schema than the validator does, and the tuple pair is the clearest
  case of it.
*/
describe('in other structures', () => {
  const open = async (override?: any) => {
    const view = draw(override);
    await view.selectTab('In other structures');
    return view;
  };

  /* One `$defs` definition, used twice, each with its own data. */
  it('resolves a $ref, independently per property', async () => {
    const view = await open();
    const labels = Array.from(
      view.active()!.querySelectorAll<HTMLElement>('.ant-form-item label')
    ).map((label) => label.textContent);
    expect(
      labels.filter((label) => label === 'From').length
    ).toBeGreaterThanOrEqual(2);
    const values = Array.from(
      view.active()!.querySelectorAll<HTMLInputElement>('input')
    ).map((input) => input.value);
    expect(values).toContain('2026-10-01');
    expect(values).toContain('2026-11-30');
    view.unmount();
  });

  /*
    `formatMinimum: { "$data": "1/from" }` - the reason the bound keywords are
    worth having in pairs. The pointer is relative to the instance, so `1/from`
    is the sibling property.
  */
  it('holds one end of a range against the other', async () => {
    const view = await open({
      composed: {
        ...(data as any).composed,
        bookingPeriod: { from: '2026-10-05', to: '2026-10-01' },
      },
    });
    await settle();
    expect(view.errors().map((error: any) => error.keyword)).toContain(
      'formatMinimum'
    );
    view.unmount();
  });

  it('says nothing about a range that is in order', async () => {
    const view = await open();
    expect(view.paths()).not.toContain('/composed/bookingPeriod/to');
    view.unmount();
  });

  /* Both tuple spellings render the same pair of positions. */
  it('renders a date control at each tuple position', async () => {
    const view = await open();
    const text = view.active()?.textContent ?? '';
    expect(text).toContain('Cover (tuple)');
    expect(text).toContain('Cover (draft-07 tuple)');
    const values = Array.from(
      view.active()!.querySelectorAll<HTMLInputElement>('input')
    ).map((input) => input.value);
    // Four date inputs across the two tuples, two of each value.
    expect(
      values.filter((value) => value === '2026-10-01').length
    ).toBeGreaterThanOrEqual(3);
    view.unmount();
  });

  /* A mixed type still reaches the picker for its string branch. */
  it('renders the picker inside a mixed type', async () => {
    const view = await open();
    const text = view.active()?.textContent ?? '';
    expect(text).toContain('Optional date');
    expect(
      Array.from(
        view.active()!.querySelectorAll<HTMLInputElement>('input')
      ).map((input) => input.value)
    ).toContain('2026-10-14');
    view.unmount();
  });
});

/*
  What the *validator* makes of the two tuple spellings, which is not the same
  thing at all. JSON Forms configures a draft-07 Ajv, and `prefixItems` is a
  2020-12 keyword it has never heard of.
*/
describe('the tuple spellings validate differently', () => {
  const check = (schema: any, value: unknown[]) => {
    const validate = formsAjv.compile(schema);
    return validate(value);
  };

  const positions = [
    { type: 'string', format: 'date' },
    { type: 'string', format: 'date' },
  ];

  it('validates each position under the draft-07 spelling', () => {
    const schema = {
      type: 'array',
      items: positions,
      additionalItems: false,
      minItems: 2,
    };
    expect(check(schema, ['2026-10-01', '2026-10-05'])).toBe(true);
    expect(check(schema, ['not a date', '2026-10-05'])).toBe(false);
  });

  /*
    The finding. `prefixItems` is ignored, so nothing checks the positions -
    a bad date passes. And adding `items: false` alongside it is worse: to a
    draft-07 validator that reads "no items at all", so every element is
    rejected and the form can never be valid.
  */
  it('checks nothing under the 2020-12 spelling', () => {
    const schema = { type: 'array', prefixItems: positions, minItems: 2 };
    expect(check(schema, ['2026-10-01', '2026-10-05'])).toBe(true);
    expect(check(schema, ['not a date', '2026-10-05'])).toBe(true);
  });

  it('rejects everything when items:false is added to it', () => {
    const schema = {
      type: 'array',
      prefixItems: positions,
      items: false,
      minItems: 2,
    };
    expect(check(schema, ['2026-10-01', '2026-10-05'])).toBe(false);
  });

  /* The canonical fixture uses draft-07 so each position is validated. */
  it('validates dates in the canonical fixture', () => {
    const tuple = (schema as any).properties.composed.properties.tupleRange;
    expect(check(tuple, ['2026-10-01', '2026-10-05'])).toBe(true);
    expect(check(tuple, ['not a date', '2026-10-05'])).toBe(false);
  });
});
