import {
  formatDateTimeValue,
  formatDateValue,
  formatTimeValue,
  parseDateValue,
  parseTimeValue,
} from '../src/util/dateTime';

describe('Shadcn picker value conversion', () => {
  it('round-trips JSON Schema date values without a timezone shift', () => {
    const date = parseDateValue('1985-06-02');

    expect(date).toBeDefined();
    expect(formatDateValue(date!)).toBe('1985-06-02');
  });

  it('parses time and date-time values into picker parts', () => {
    expect(parseTimeValue('13:45:09')).toEqual({
      hours: 13,
      minutes: 45,
      seconds: 9,
    });
    expect(parseTimeValue('2026-08-29T07:05:00-04:00')).toEqual({
      hours: 7,
      minutes: 5,
      seconds: 0,
    });
  });

  it('saves complete JSON Schema time and date-time strings', () => {
    const time = { hours: 7, minutes: 5, seconds: 9 };
    const date = new Date(2026, 7, 29);

    expect(formatTimeValue(time)).toBe('07:05:09');
    expect(formatDateTimeValue(date, time)).toMatch(
      /^2026-08-29T07:05:09[+-]\d{2}:\d{2}$/
    );
  });
});
