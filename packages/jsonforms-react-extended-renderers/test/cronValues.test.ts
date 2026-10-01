/**
 * Six-field cron, read as values and written back.
 *
 * The dialect is the whole point: `CronExpression` takes **six** fields with
 * seconds first, where Unix cron takes five and Quartz takes seven. An
 * expression written for one and read as the other schedules the wrong thing
 * while looking correct, so these assert the reading rather than the syntax.
 *
 * What the picker *shows* is `cronPicker.test.tsx`; this is the value.
 */
import { describe, expect, it } from 'vitest';
import {
  CRON_FIELDS,
  DEFAULT_CRON,
  FIELD_RANGE,
  cronProblem,
  fieldsForPeriod,
  standDown,
  withTimeDefaults,
  formatField,
  isEvery,
  joinCron,
  parseField,
  periodOf,
  sameExpression,
  splitCron,
  CronField,
} from '../src/util/cron';

describe('reading one field as the values it selects', () => {
  it('reads every way of naming a set', () => {
    expect(parseField('*', 'hour')).toHaveLength(24);
    expect(parseField('9', 'hour')).toEqual([9]);
    expect(parseField('9,17', 'hour')).toEqual([9, 17]);
    expect(parseField('9-12', 'hour')).toEqual([9, 10, 11, 12]);
    expect(parseField('*/6', 'hour')).toEqual([0, 6, 12, 18]);
    expect(parseField('0/15', 'minute')).toEqual([0, 15, 30, 45]);
    // A start with a step runs to the end of the field, not to that one value.
    expect(parseField('10/20', 'minute')).toEqual([10, 30, 50]);
    expect(parseField('9-17/4', 'hour')).toEqual([9, 13, 17]);
    expect(parseField('1,5-7,20', 'dayOfMonth')).toEqual([1, 5, 6, 7, 20]);
  });

  it('reads the names Spring accepts, in both fields', () => {
    expect(parseField('MON', 'dayOfWeek')).toEqual([1]);
    expect(parseField('mon-fri', 'dayOfWeek')).toEqual([1, 2, 3, 4, 5]);
    expect(parseField('JAN', 'month')).toEqual([1]);
    expect(parseField('DEC', 'month')).toEqual([12]);
  });

  it('folds the second Sunday onto the first', () => {
    // Spring numbers Sunday both 0 and 7. A set with two of them would offer the same day twice.
    expect(parseField('7', 'dayOfWeek')).toEqual([0]);
    expect(parseField('0,7', 'dayOfWeek')).toEqual([0]);
  });

  it('treats `?` as every, and only where Spring allows it', () => {
    expect(parseField('?', 'dayOfMonth')).toHaveLength(31);
    expect(parseField('?', 'dayOfWeek')).toHaveLength(7);
    expect(parseField('?', 'minute')).toBeUndefined();
  });

  it('says nothing about syntax that is not a set', () => {
    /*
     * The honest answer, and the one that keeps the control safe: "the last weekday of the month"
     * is not a list of days, and turning it into one would change what the schedule does. The
     * picker shows these fields as text instead of as choices.
     */
    for (const [text, field] of [
      ['L', 'dayOfMonth'],
      ['LW', 'dayOfMonth'],
      ['L-3', 'dayOfMonth'],
      ['15W', 'dayOfMonth'],
      ['FRI#2', 'dayOfWeek'],
      ['5L', 'dayOfWeek'],
      // Wrapping the end of the week is legal and is not a set without inventing an order.
      ['FRI-MON', 'dayOfWeek'],
    ] as Array<[string, CronField]>) {
      expect(parseField(text, field), text).toBeUndefined();
      // Still a schedule the engine runs, so it must not be reported as broken.
      expect(
        cronProblem(
          `0 0 9 ${field === 'dayOfMonth' ? text : '*'} * ${
            field === 'dayOfWeek' ? text : '*'
          }`
        ),
        text
      ).toBeUndefined();
    }
  });

  it('says nothing about what is simply wrong', () => {
    expect(parseField('99', 'minute')).toBeUndefined();
    expect(parseField('25', 'hour')).toBeUndefined();
    expect(parseField('NOTADAY', 'dayOfWeek')).toBeUndefined();
    expect(parseField('1/0', 'minute')).toBeUndefined();
    expect(parseField('', 'minute')).toBeUndefined();
  });
});

describe('writing one field back', () => {
  it('writes the shortest thing that says it', () => {
    expect(formatField([9], 'hour')).toBe('9');
    expect(formatField([9, 17], 'hour')).toBe('9,17');
    expect(formatField([9, 10, 11, 12], 'hour')).toBe('9-12');
    expect(formatField([0, 15, 30, 45], 'minute')).toBe('*/15');
    expect(formatField([1, 5, 6, 7, 20], 'dayOfMonth')).toBe('1,5-7,20');
  });

  it('writes two in a row as two, not as a range', () => {
    // `1-2` is no shorter than `1,2` and reads as less.
    expect(formatField([1, 2], 'hour')).toBe('1,2');
  });

  it('writes a full selection as every, and an empty one too', () => {
    // Clearing a field means "every value", which is what `*` says. It is never written as
    // nothing, which would not be an expression.
    expect(formatField([], 'hour')).toBe('*');
    expect(
      formatField(
        Array.from({ length: 24 }, (_, index) => index),
        'hour'
      )
    ).toBe('*');
  });

  it('only writes a step when the spacing really runs to the end of the field', () => {
    // `0,15,30` is evenly spaced too, and writing it as a step would add 45 to the schedule.
    expect(formatField([0, 15, 30], 'minute')).toBe('0,15,30');
    expect(formatField([5, 20, 35, 50], 'minute')).toBe('5/15');
  });

  it('writes the named fields with their names, and never with a step', () => {
    expect(formatField([1], 'dayOfWeek')).toBe('MON');
    expect(formatField([1, 2, 3, 4, 5], 'dayOfWeek')).toBe('MON-FRI');
    expect(formatField([1, 5], 'dayOfWeek')).toBe('MON,FRI');
    expect(formatField([1, 6, 12], 'month')).toBe('JAN,JUN,DEC');
    // A named step is something a reader has to look up to be sure of, and it saves three
    // characters.
    expect(formatField([0, 2, 4, 6], 'dayOfWeek')).toBe('SUN,TUE,THU,SAT');
  });

  it('round-trips every single value of every field', () => {
    for (const field of CRON_FIELDS) {
      const [low, high] = FIELD_RANGE[field];
      for (let value = low; value <= high; value += 1) {
        expect(
          parseField(formatField([value], field), field),
          `${field} ${value}`
        ).toEqual([value]);
      }
    }
  });
});

describe('deciding how often it repeats', () => {
  it('names the coarsest thing the expression puts a condition on', () => {
    expect(periodOf(splitCron('* * * * * *')!)).toBe('second');
    expect(periodOf(splitCron('10 * * * * *')!)).toBe('minute');
    expect(periodOf(splitCron(DEFAULT_CRON)!)).toBe('hour');
    expect(periodOf(splitCron('0 0 9 * * *')!)).toBe('day');
    expect(periodOf(splitCron('0 0 9 ? * MON')!)).toBe('week');
    expect(periodOf(splitCron('0 0 9 1 * ?')!)).toBe('month');
    expect(periodOf(splitCron('0 0 0 1 1 *')!)).toBe('year');
  });

  it('reads the seed two SFTP steps carry as what it is', () => {
    // `10 * * * * *` is second 10 of every minute — the one shape a five-field reading cannot
    // express at all, and it is a real schedule in the shipped catalogue.
    const fields = splitCron('10 * * * * *')!;
    expect(periodOf(fields)).toBe('minute');
    expect(parseField(fields[0], 'second')).toEqual([10]);
  });

  it('shows everything finer than the period and nothing coarser', () => {
    expect(fieldsForPeriod('second')).toEqual([]);
    expect(fieldsForPeriod('minute')).toEqual(['second']);
    expect(fieldsForPeriod('hour')).toEqual(['minute', 'second']);
    expect(fieldsForPeriod('day')).toEqual(['hour', 'minute', 'second']);
    // Weekly picks weekdays, not days of the month: naming both would mean "the 5th, and only
    // when it is a Monday", which Spring's AND allows and nobody meant by picking a weekday.
    expect(fieldsForPeriod('week')).toEqual([
      'dayOfWeek',
      'hour',
      'minute',
      'second',
    ]);
    expect(fieldsForPeriod('month')).toEqual([
      'dayOfMonth',
      'dayOfWeek',
      'hour',
      'minute',
      'second',
    ]);
    expect(fieldsForPeriod('year')).toEqual([
      'month',
      'dayOfMonth',
      'dayOfWeek',
      'hour',
      'minute',
      'second',
    ]);
  });

  it('knows when a field says nothing', () => {
    expect(isEvery('*', 'hour')).toBe(true);
    expect(isEvery('?', 'dayOfWeek')).toBe(true);
    expect(isEvery('0-23', 'hour')).toBe(true);
    expect(isEvery('9', 'hour')).toBe(false);
    // Not a set at all, so it is certainly a condition.
    expect(isEvery('L', 'dayOfMonth')).toBe(false);
  });
});

describe('validating an expression', () => {
  it('accepts what the engine accepts', () => {
    for (const expression of [
      DEFAULT_CRON,
      '0 0 9 ? * MON-FRI',
      '0 0 9 L * ?',
      '0 0 9 ? * 2#1',
      '0 0 9 ? * FRI#2',
      '0 0 9 ? * FRI-MON',
      '0 0 0 1 1 *',
      '@weekly',
      '  0 0 9 * * *  ',
    ]) {
      expect(cronProblem(expression), expression).toBeUndefined();
    }
  });

  it('names the field that is wrong, so the message can point at it', () => {
    expect(cronProblem('0 0 25 * * *')).toBe('hour');
    expect(cronProblem('0 99 * * * *')).toBe('minute');
    expect(cronProblem('0 0 9 * 13 *')).toBe('month');
    expect(cronProblem('0 0 9 * * NOTADAY')).toBe('dayOfWeek');
  });

  it('asks for six fields, since five is the dialect the engine does not speak', () => {
    // A Unix five-field expression is the mistake to expect: `0 9 * * *` is 09:00 daily to cron
    // and 09:00:00 *every hour* would be the nearest six-field reading. It is rejected instead.
    expect(cronProblem('0 9 * * *')).toBe('sixFields');
    expect(cronProblem('0 0 9 * * * 2030')).toBe('sixFields');
    expect(cronProblem('')).toBe('sixFields');
  });

  it('allows `?` only where another field is saying when', () => {
    expect(cronProblem('0 0 9 ? * MON')).toBeUndefined();
    expect(cronProblem('0 ? 9 * * *')).toBe('minute');
  });

  it('expands the macros Spring has, and not the one it does not', () => {
    expect(splitCron('@daily')).toEqual(['0', '0', '0', '*', '*', '*']);
    expect(splitCron('@hourly')).toEqual(['0', '0', '*', '*', '*', '*']);
    // `@reboot` is in Unix cron and in react-js-cron's period list. Spring rejects it, so this
    // must not quietly accept it either.
    expect(cronProblem('@reboot')).toBe('sixFields');
  });
});

describe('deciding whether to write at all', () => {
  it('says two spellings of one schedule are the same, so opening a field does not change it', () => {
    expect(sameExpression('0 */15 * * * *', '0 0/15 * * * *')).toBe(true);
    expect(sameExpression('@daily', '0 0 0 * * *')).toBe(true);
    expect(sameExpression('0 0 9 ? * FRI,MON', '0 0 9 * * MON,FRI')).toBe(true);
    expect(sameExpression('0 0 9 * * 7', '0 0 9 * * SUN')).toBe(true);
    expect(sameExpression('0 0 9-11 * * *', '0 0 9,10,11 * * *')).toBe(true);
  });

  it('says two different schedules are different', () => {
    expect(sameExpression('0 0/15 * * * *', '0 0/30 * * * *')).toBe(false);
    expect(sameExpression('0 0 9 * * *', '0 0 10 * * *')).toBe(false);
    expect(sameExpression('0 0 9 * * *', '0 0 9 * * MON')).toBe(false);
  });

  it('will not call two fields it cannot model the same unless their text is', () => {
    // Neither `L` nor `LW` is a set, so nothing here knows whether they agree.
    expect(sameExpression('0 0 9 L * ?', '0 0 9 LW * ?')).toBe(false);
    expect(sameExpression('0 0 9 L * ?', ' 0 0 9 L * ? ')).toBe(true);
  });
});

describe('choosing how often it repeats', () => {
  const NOTHING = ['*', '*', '*', '*', '*', '*'];

  it('selects nothing, because a period is a lens and not a value', () => {
    // Picking "Yearly" is not the same as saying when in the year. A picker that answered that
    // question on someone's behalf would put a schedule in the field that nobody chose.
    for (const period of [
      'year',
      'month',
      'week',
      'day',
      'hour',
      'minute',
      'second',
    ] as const) {
      expect(joinCron(standDown(NOTHING, period)), period).toBe('* * * * * *');
    }
  });

  it('keeps what a field already says', () => {
    expect(joinCron(standDown(splitCron('0 0/15 * * * *')!, 'day'))).toBe(
      '0 0/15 * * * *'
    );
  });

  it('stands a coarser field down, so a hidden condition cannot survive the switch', () => {
    // The row that said "on the 1st" is gone from the form; the condition must go with it.
    expect(joinCron(standDown(splitCron('0 0 9 1 * *')!, 'day'))).toBe(
      '0 0 9 * * *'
    );
    expect(joinCron(standDown(splitCron('0 0 9 ? * MON')!, 'hour'))).toBe(
      '0 0 * * * *'
    );
    expect(joinCron(standDown(splitCron('0 0 0 1 JAN *')!, 'week'))).toBe(
      '0 0 0 * * *'
    );
  });
});

describe('the time of day a choice implies', () => {
  it("pins the time below what was chosen, so nine o'clock is not 3600 executions", () => {
    // `* * 9 * * *` is every second of the 9am hour. Picking an hour has to mean the hour.
    expect(
      joinCron(withTimeDefaults(['*', '*', '9', '*', '*', '*'], 'hour'))
    ).toBe('0 0 9 * * *');
    expect(
      joinCron(withTimeDefaults(['*', '30', '*', '*', '*', '*'], 'minute'))
    ).toBe('0 30 * * * *');
    expect(
      joinCron(withTimeDefaults(['*', '*', '*', '*', '*', 'MON'], 'dayOfWeek'))
    ).toBe('0 0 0 * * MON');
    expect(
      joinCron(withTimeDefaults(['*', '*', '*', '*', 'MAR', '*'], 'month'))
    ).toBe('0 0 0 * MAR *');
  });

  it('never fills in a day or a month, which is the question being asked', () => {
    // Choosing March must not also choose the 1st, and choosing the 1st must not also choose
    // Sunday — Spring ANDs the two day fields, so that last one runs one year in seven.
    expect(withTimeDefaults(['*', '*', '*', '*', 'MAR', '*'], 'month')[3]).toBe(
      '*'
    );
    expect(
      withTimeDefaults(['*', '*', '*', '1', 'MAR', '*'], 'dayOfMonth')[5]
    ).toBe('*');
  });

  it('leaves alone anything already said', () => {
    expect(
      joinCron(withTimeDefaults(splitCron('0 0/15 * * * *')!, 'hour'))
    ).toBe('0 0/15 * * * *');
    expect(
      joinCron(withTimeDefaults(splitCron('30 45 9 * * *')!, 'hour'))
    ).toBe('30 45 9 * * *');
  });

  it('pins nothing above what was chosen', () => {
    expect(
      joinCron(withTimeDefaults(['10', '*', '*', '*', '*', '*'], 'second'))
    ).toBe('10 * * * * *');
  });

  it('is one selection away from being undone', () => {
    // "Every minute during the 9am hour" is still reachable: clear the minutes again. The pin is
    // a starting point, not a constraint.
    const pinned = withTimeDefaults(['*', '*', '9', '*', '*', '*'], 'hour');
    const cleared = [...pinned];
    cleared[1] = formatField([], 'minute');
    expect(joinCron(cleared)).toBe('0 * 9 * * *');
  });
});
