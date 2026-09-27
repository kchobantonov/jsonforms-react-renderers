import { describe, expect, it } from 'vitest';
import { createAjv } from '@jsonforms/core';
import {
  formatExtendedDuration,
  isWeeksDuration,
  parseExtendedDuration,
} from '../src/util/useDurationControl';

/*
  The weeks form, and the zero that made it interesting.

  `P0W` is a valid duration: RFC 3339's `dur-week = 1*DIGIT "W"` admits `0`.
  It parses to a draft of all zeros - the same draft `P0D` parses to - so
  nothing about the *parts* says which form was written. Only the text does,
  which is why the picker reads its mode from the text and why applying an
  untouched value must not rewrite it.
*/

describe('P0W', () => {
  /* Not an assumption: the validator the forms actually use accepts it. */
  it('is accepted by the duration format', () => {
    const ajv = createAjv();
    const validate = ajv.compile({
      type: 'string',
      format: 'duration',
    } as never);
    expect(validate('P0W')).toBe(true);
    expect(validate('P2W')).toBe(true);
    // And the empty designator is still not a duration.
    expect(validate('P')).toBe(false);
  });

  it('parses, as a duration of nothing', () => {
    expect(parseExtendedDuration('P0W')).toEqual({
      weeks: 0,
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('is indistinguishable from P0D once parsed', () => {
    expect(parseExtendedDuration('P0W')).toEqual(parseExtendedDuration('P0D'));
  });

  /*
    Section 21's "serialize zero as P0D" - which is about what to write when
    the user means zero. Leaving an incoming `P0W` alone is the control's job,
    not the formatter's; `durationPicker.test.tsx` covers that.
  */
  it('serializes a zero duration as P0D', () => {
    expect(formatExtendedDuration(parseExtendedDuration('P0W')!)).toBe('P0D');
  });

  it('is recognised as the weeks form even at zero', () => {
    expect(isWeeksDuration('P0W')).toBe(true);
    expect(isWeeksDuration('P2W')).toBe(true);
    expect(isWeeksDuration('P0D')).toBe(false);
    expect(isWeeksDuration('P2DT3H')).toBe(false);
    expect(isWeeksDuration(undefined)).toBe(false);
  });
});

describe('the weeks form generally', () => {
  it('round trips a non-zero value', () => {
    expect(formatExtendedDuration(parseExtendedDuration('P2W')!)).toBe('P2W');
  });

  /* `P2W3D` is not a duration; the two forms cannot be combined. */
  it('refuses weeks combined with other components', () => {
    expect(parseExtendedDuration('P2W3D')).toBeNull();
  });
});

/*
  A duration's components are quantities, not clock fields.

  The picker capped months at 11 and hours, minutes and seconds at 23 or 59 -
  the shape of a time of day, which a length of time is not. ISO 8601 bounds
  none of them, and the cap was applied by clamping, so a typed 90 became 59
  without saying so.
*/
describe('components are unbounded quantities', () => {
  const ajv = createAjv();
  const isDuration = ajv.compile({ type: 'string', format: 'duration' });

  it.each([
    'PT90M',
    'PT3600S',
    'P18M',
    'P400D',
    'PT25H',
    'P1Y13M',
    'PT1H591212M',
  ])('round-trips %s without normalising it', (text) => {
    // The premise first: the validator has to agree these are durations.
    expect(isDuration(text), `${text} rejected by ajv`).toBe(true);
    const parts = parseExtendedDuration(text);
    expect(parts, `${text} did not parse`).not.toBeNull();
    expect(formatExtendedDuration(parts!)).toBe(text);
  });

  /*
    `1*DIGIT` admits leading zeros, so these are durations too - but the
    canonical form has no way to spell them, so parsing and reformatting
    *does* change the text. What protects them is that nothing reformats a
    value the user did not edit; see the Apply tests in durationPicker.
  */
  it.each(['PT011H591212M', 'P0001D', 'P01Y02M03D'])(
    'accepts %s, whose canonical spelling differs',
    (text) => {
      expect(isDuration(text), `${text} rejected by ajv`).toBe(true);
      const parts = parseExtendedDuration(text);
      expect(parts).not.toBeNull();
      expect(isDuration(formatExtendedDuration(parts!))).toBe(true);
    }
  );
});
