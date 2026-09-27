import { describe, expect, it } from 'vitest';
import {
  disabledDateFor,
  disabledTimeFor,
  temporalBounds,
} from '../src/util/temporalBounds';
import dayjs from 'dayjs';
import { datePickerMode, timePickerColumns } from '../src/util/temporalFormats';

/*
  Section 18's four format bounds, resolved into something a picker can offer.

  The part worth testing hard is exclusivity: "exclusivity must be preserved at
  the picker's supported precision". A picker offering whole days cannot say
  "after the 19th but not the 19th" except by starting at the 20th.
*/

const DATE_FORMATS = ['YYYY-MM-DD'];
const TIME_FORMATS = ['HH:mm:ssZ', 'HH:mm:ss', 'HH:mm'];

describe('inclusive bounds', () => {
  it('takes the bound itself as selectable', () => {
    const { min, max } = temporalBounds(
      { formatMinimum: '2026-09-19', formatMaximum: '2026-09-25' },
      DATE_FORMATS,
      'day'
    );
    expect(min?.format('YYYY-MM-DD')).toBe('2026-09-19');
    expect(max?.format('YYYY-MM-DD')).toBe('2026-09-25');
  });

  it('ignores a bound that is not a string', () => {
    const { min } = temporalBounds({ formatMinimum: 17 }, DATE_FORMATS, 'day');
    expect(min).toBeUndefined();
  });

  it('ignores a bound it cannot parse', () => {
    const { min } = temporalBounds(
      { formatMinimum: 'next Tuesday' },
      DATE_FORMATS,
      'day'
    );
    expect(min).toBeUndefined();
  });
});

describe('exclusive bounds, at the picker precision', () => {
  /*
    The specification's own worked example: "An exclusive bound on 2026-09-19
    excludes that date; the adjacent selectable dates are September 20 for a
    lower bound and September 18 for an upper bound."
  */
  it('steps a lower bound forward one day', () => {
    const { min } = temporalBounds(
      { formatExclusiveMinimum: '2026-09-19' },
      DATE_FORMATS,
      'day'
    );
    expect(min?.format('YYYY-MM-DD')).toBe('2026-09-20');
  });

  it('steps an upper bound back one day', () => {
    const { max } = temporalBounds(
      { formatExclusiveMaximum: '2026-09-19' },
      DATE_FORMATS,
      'day'
    );
    expect(max?.format('YYYY-MM-DD')).toBe('2026-09-18');
  });

  /*
    Stated as a difference rather than a wall clock: the bound is a clock value
    placed on a reference day, so an absolute expectation here would be an
    assertion about the runner's timezone instead of about exclusivity.
  */
  it('steps by a minute when that is the precision', () => {
    const inclusive = temporalBounds(
      { formatMinimum: '09:30:00Z' },
      TIME_FORMATS,
      'minute',
      true
    );
    const exclusive = temporalBounds(
      { formatExclusiveMinimum: '09:30:00Z' },
      TIME_FORMATS,
      'minute',
      true
    );
    expect(exclusive.min!.diff(inclusive.min!, 'minute')).toBe(1);
  });

  it('steps by a day, not a minute, when the precision is a day', () => {
    const inclusive = temporalBounds(
      { formatMinimum: '2026-09-19' },
      DATE_FORMATS,
      'day'
    );
    const exclusive = temporalBounds(
      { formatExclusiveMinimum: '2026-09-19' },
      DATE_FORMATS,
      'day'
    );
    expect(exclusive.min!.diff(inclusive.min!, 'day')).toBe(1);
  });
});

describe('several bounds at once', () => {
  it('keeps the tightest of each end', () => {
    const { min, max } = temporalBounds(
      {
        formatMinimum: '2026-09-10',
        formatExclusiveMinimum: '2026-09-19',
        formatMaximum: '2026-09-30',
        formatExclusiveMaximum: '2026-09-25',
      },
      DATE_FORMATS,
      'day'
    );
    expect(min?.format('YYYY-MM-DD')).toBe('2026-09-20');
    expect(max?.format('YYYY-MM-DD')).toBe('2026-09-24');
  });

  /* Contradictory bounds leave nothing to pick, and say so. */
  it('reports an empty range', () => {
    const bounds = temporalBounds(
      { formatMinimum: '2026-09-25', formatMaximum: '2026-09-19' },
      DATE_FORMATS,
      'day'
    );
    expect(bounds.empty).toBe(true);
    expect(disabledDateFor(bounds)!(dayjs('2026-09-22'))).toBe(true);
  });
});

describe('what the date picker disables', () => {
  const disabled = disabledDateFor(
    temporalBounds(
      { formatMinimum: '2026-09-19', formatMaximum: '2026-09-25' },
      DATE_FORMATS,
      'day'
    )
  )!;

  it('offers the bounds themselves', () => {
    expect(disabled(dayjs('2026-09-19'))).toBe(false);
    expect(disabled(dayjs('2026-09-25'))).toBe(false);
  });

  it('offers the days between', () => {
    expect(disabled(dayjs('2026-09-22'))).toBe(false);
  });

  it('refuses the days outside', () => {
    expect(disabled(dayjs('2026-09-18'))).toBe(true);
    expect(disabled(dayjs('2026-09-26'))).toBe(true);
  });

  it('returns nothing to install when no bound applies', () => {
    expect(
      disabledDateFor(temporalBounds({}, DATE_FORMATS, 'day'))
    ).toBeUndefined();
  });
});

describe('what the time picker disables', () => {
  /* A bare time is a clock value; both ends sit on one reference day. */
  const bounds = temporalBounds(
    { formatMinimum: '09:00:00Z', formatMaximum: '17:00:00Z' },
    ['HH:mm:ssZ'],
    'minute',
    true
  );
  const at = disabledTimeFor(bounds, true, 'minute')!(undefined as any);

  it('disables the hours before the lower bound', () => {
    expect(at.disabledHours!()).toContain(bounds.min!.hour() - 1);
    expect(at.disabledHours!()).not.toContain(bounds.min!.hour());
  });

  it('disables the hours after the upper bound', () => {
    expect(at.disabledHours!()).toContain(bounds.max!.hour() + 1);
    expect(at.disabledHours!()).not.toContain(bounds.max!.hour());
  });

  it('narrows the minutes only on the bounding hours', () => {
    const lower = temporalBounds(
      { formatMinimum: '09:30:00Z' },
      ['HH:mm:ssZ'],
      'minute',
      true
    );
    const slot = disabledTimeFor(lower, true, 'minute')!(undefined as any);
    const hour = lower.min!.hour();
    expect(slot.disabledMinutes!(hour)).toContain(lower.min!.minute() - 1);
    expect(slot.disabledMinutes!(hour)).not.toContain(lower.min!.minute());
    // An hour that is not the boundary is unrestricted.
    expect(slot.disabledMinutes!(hour + 2)).toEqual([]);
  });

  /* Seconds are only offered - and only restricted - at second precision. */
  it('adds seconds only when the precision asks for them', () => {
    const minuteSlot = disabledTimeFor(bounds, true, 'minute')!(
      undefined as any
    );
    expect(minuteSlot.disabledSeconds).toBeUndefined();
    const secondSlot = disabledTimeFor(bounds, true, 'second')!(
      undefined as any
    );
    expect(secondSlot.disabledSeconds).toBeDefined();
  });
});

describe('date-time bounds apply per boundary day', () => {
  const bounds = temporalBounds(
    {
      formatMinimum: '2026-09-19T09:00:00Z',
      formatMaximum: '2026-09-25T17:00:00Z',
    },
    ['YYYY-MM-DDTHH:mm:ssZ'],
    'minute'
  );
  const disabledTime = disabledTimeFor(bounds, false, 'minute')!;

  /*
    "date-time bounds applied per boundary day" - a day strictly inside the
    range has every hour available; only the first and last days are narrowed.
  */
  it('leaves a day inside the range unrestricted', () => {
    const slot = disabledTime(dayjs('2026-09-22T12:00:00'));
    expect(slot.disabledHours).toBeUndefined();
  });

  it('narrows the first day', () => {
    const slot = disabledTime(bounds.min!);
    expect(slot.disabledHours!()).toContain(bounds.min!.hour() - 1);
    expect(slot.disabledHours!()).not.toContain(bounds.min!.hour());
  });

  it('narrows the last day', () => {
    const slot = disabledTime(bounds.max!);
    expect(slot.disabledHours!()).toContain(bounds.max!.hour() + 1);
  });
});

/*
  `views` - section 18's "date-only array drawn from year, month, day".

  The point of the tests below is that `views` and `dateSaveFormat` are
  **independent**: the section says `views` "does not automatically change
  dateSaveFormat", and the granularity used to be inferred from the save
  format, which is that coupling backwards.
*/
describe('picker granularity', () => {
  it('takes the finest view the author asked for', () => {
    expect(datePickerMode(['year', 'month', 'day'], 'YYYY-MM-DD')).toBe('date');
    expect(datePickerMode(['year', 'month'], 'YYYY-MM-DD')).toBe('month');
    expect(datePickerMode(['year'], 'YYYY-MM-DD')).toBe('year');
  });

  /*
    The discriminating case: a month picker that stores a full date. The old
    inference reads `YYYY-MM-DD`, sees a `D`, and gives a day grid - which is
    precisely what the section forbids deriving.
  */
  it('lets views win over what the save format would have implied', () => {
    expect(datePickerMode(['year', 'month'], 'YYYY-MM-DD')).toBe('month');
    expect(datePickerMode(['year', 'month', 'day'], 'YYYY-MM')).toBe('date');
  });

  it('ignores entries that are not calendar views', () => {
    expect(datePickerMode(['hour', 'minute'], 'YYYY-MM-DD')).toBe('date');
  });

  /* Without `views`, the old inference stands - forms rely on it. */
  it('falls back to the save format when views is absent', () => {
    expect(datePickerMode(undefined, 'YYYY-MM-DD')).toBe('date');
    expect(datePickerMode(undefined, 'YYYY-MM')).toBe('month');
    expect(datePickerMode(undefined, 'YYYY')).toBe('year');
    expect(datePickerMode('not an array', 'YYYY-MM')).toBe('month');
  });
});

/*
  The picker's own typing, asserted here rather than left to a build to
  notice. antd types `disabledTime` as `(date: DateType) => DisabledTimes`;
  declaring the parameter nullable made TypeScript infer the picker's generic
  as `Dayjs | null`, which then rejected the `onChange` handler beside it -
  an error reported against `onChange` and caused by this function.
*/
describe('the disabledTime signature', () => {
  it('takes a non-null date, and copes with nothing anyway', () => {
    const bounds = temporalBounds(
      { formatMinimum: '09:00:00Z' },
      ['HH:mm:ssZ'],
      'minute',
      true
    );
    const slot = disabledTimeFor(bounds, true, 'minute')!;
    // Typed non-null; a bare time picker really can call it with nothing.
    expect(() => slot(undefined as any)).not.toThrow();
    expect(slot(dayjs()).disabledHours).toBeDefined();
  });
});

describe('`views` on the time half of a picker', () => {
  /*
    The specification narrows `views` to a date-only array, and the convention
    it is drawn from uses time views too - a time picker defaults to
    ['hours','minutes'] there and a date-time picker to
    ['year','day','hours','minutes']. Honouring them means such a UI schema
    hides the seconds column instead of being accepted and ignored.
  */
  it('asks for exactly the columns named', () => {
    expect(timePickerColumns(['hours', 'minutes'])).toEqual({
      showHour: true,
      showMinute: true,
      showSecond: false,
    });
    expect(timePickerColumns(['hours', 'minutes', 'seconds'])).toEqual({
      showHour: true,
      showMinute: true,
      showSecond: true,
    });
  });

  /*
    An array naming no time view leaves the display format in charge. Returning
    an all-false set instead would blank the panel of a time picker whose
    `views` happened to be date-only - which is exactly what a date-time
    picker's default array looks like from the time half's point of view.
  */
  it('defers to the format when no time view is named', () => {
    expect(timePickerColumns(['year', 'month', 'day'])).toBeUndefined();
    expect(timePickerColumns([])).toBeUndefined();
    expect(timePickerColumns(undefined)).toBeUndefined();
    expect(timePickerColumns('hours')).toBeUndefined();
  });

  /* The date views of a combined array are the other half's business. */
  it('reads the time half of a mixed array', () => {
    expect(timePickerColumns(['year', 'day', 'hours', 'minutes'])).toEqual({
      showHour: true,
      showMinute: true,
      showSecond: false,
    });
  });

  it('ignores a value that is not a view', () => {
    expect(timePickerColumns(['hours', 'fortnights'])).toEqual({
      showHour: true,
      showMinute: false,
      showSecond: false,
    });
  });
});
