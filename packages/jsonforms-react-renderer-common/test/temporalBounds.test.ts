import { describe, expect, it } from 'vitest';
import { temporalBounds } from '../src/temporalBounds';
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
  });
});
