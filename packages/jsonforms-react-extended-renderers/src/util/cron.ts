/**
 * Six-field cron, read and written.
 *
 * **Six fields, not five and not seven**: `second minute hour day-of-month month day-of-week`.
 * This is Spring's dialect — `org.springframework.scheduling.support.CronExpression`, which is
 * also what Quartz-adjacent Java schedulers accept minus the year field. It is deliberately not
 * Unix cron, which has no seconds, and not Quartz, which adds a seventh `year` field and ORs the
 * two day fields. An expression written for one and read as the other schedules the wrong thing
 * while looking correct, so the dialect is stated rather than guessed.
 *
 * Spring **ANDs** every field — `CronExpression.nextOrSame` applies them in sequence, with none of
 * Quartz's OR special case — and `?` is its alias for `*`, allowed only in the two day fields.
 *
 * The model here is **one value set per field**, which is what lets the picker offer a list to
 * choose from rather than a syntax to learn. A field that cannot be stated as a set — `L`, `W`,
 * `#` — is left as the text it is, and the control edits that field as text. Nothing is lost and
 * nothing is rewritten.
 */

/** A placeholder for an empty field: every fifteen minutes, on the minute. */
export const DEFAULT_CRON = '0 0/15 * * * *';

/** The six fields, in the order an expression writes them. */
export const CRON_FIELDS = ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const;

export type CronField = (typeof CRON_FIELDS)[number];

/** Day-of-week names Spring accepts, in the order it numbers them. */
export const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** Month names Spring accepts. `JAN` is 1, so this list is offset by one from its values. */
export const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

/**
 * The range a field's **values** live in.
 *
 * Day-of-week stops at 6 although Spring also accepts `7` for Sunday: a set with two Sundays in it
 * would offer the same day twice in the picker. `7` is folded to `0` on the way in and never
 * written back out.
 */
export const FIELD_RANGE: Record<CronField, [number, number]> = {
  second: [0, 59],
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
};

/** The names a field's values may be written with, where it has any. */
function namesFor(field: CronField): readonly string[] | undefined {
  if (field === 'dayOfWeek') return DAY_NAMES;
  if (field === 'month') return MONTH_NAMES;
  return undefined;
}

/** Macros Spring understands in place of all six fields. `@reboot` is not one of them. */
const MACROS: Record<string, string> = {
  '@yearly': '0 0 0 1 1 *',
  '@annually': '0 0 0 1 1 *',
  '@monthly': '0 0 0 1 * *',
  '@weekly': '0 0 0 * * 0',
  '@daily': '0 0 0 * * *',
  '@midnight': '0 0 0 * * *',
  '@hourly': '0 0 * * * *',
};

/** The six fields of an expression, or `undefined` when it does not have six. */
export function splitCron(expression: string): string[] | undefined {
  const trimmed = expression.trim();
  if (trimmed === '') return undefined;
  const expanded = MACROS[trimmed.toLowerCase()] ?? trimmed;
  const fields = expanded.split(/\s+/);
  return fields.length === 6 ? fields : undefined;
}

/** A field's six parts joined back into an expression. */
export function joinCron(fields: readonly string[]): string {
  return fields.join(' ');
}

/** A named or numeric value as the number Spring reads it as. */
function valueOf(text: string, field: CronField): number | undefined {
  const names = namesFor(field);
  if (names) {
    const index = names.indexOf(text.toUpperCase());
    if (index >= 0) return field === 'month' ? index + 1 : index;
  }
  if (!/^\d+$/.test(text)) return undefined;
  const number = Number(text);
  // Both `0` and `7` are Sunday; the set keeps one of them.
  if (field === 'dayOfWeek' && number === 7) return 0;
  const [low, high] = FIELD_RANGE[field];
  return number >= low && number <= high ? number : undefined;
}

/**
 * The values one field selects, or `undefined` when it does not select a set.
 *
 * `undefined` is the honest answer for `L`, `W` and `#` — "the last weekday of the month" is not a
 * list of days, and turning it into one would change what the schedule does. It is also the answer
 * for anything malformed, which is what lets the caller tell a field it can offer choices for from
 * one it has to leave as text.
 */
export function parseField(text: string, field: CronField): number[] | undefined {
  const [low, high] = FIELD_RANGE[field];
  const all = (): number[] => Array.from({ length: high - low + 1 }, (_, index) => low + index);
  const value = text.trim();
  if (value === '') return undefined;
  // `?` is Spring's alias for `*`, and only in the two day fields.
  if (value === '*') return all();
  if (value === '?') return field === 'dayOfMonth' || field === 'dayOfWeek' ? all() : undefined;

  const selected = new Set<number>();
  for (const part of value.split(',')) {
    const [range, step, ...rest] = part.split('/');
    if (rest.length > 0) return undefined;
    let by = 1;
    if (step !== undefined) {
      if (!/^\d+$/.test(step) || Number(step) < 1) return undefined;
      by = Number(step);
    }

    let from: number;
    let to: number;
    if (range === '*' || range === '?') {
      [from, to] = [low, high];
    } else {
      const [start, end, ...extra] = range.split('-');
      if (extra.length > 0) return undefined;
      const first = valueOf(start, field);
      if (first === undefined) return undefined;
      if (end === undefined) {
        // `5/10` means "from 5, every 10" — a bare value only when there is no step beside it.
        [from, to] = step === undefined ? [first, first] : [first, high];
      } else {
        const last = valueOf(end, field);
        if (last === undefined) return undefined;
        // A range that wraps the end of the week (`FRI-MON`) is legal and is not a set this can
        // state without inventing an order, so it is left as text.
        if (last < first) return undefined;
        [from, to] = [first, last];
      }
    }
    for (let each = from; each <= to; each += by) selected.add(each);
  }
  return [...selected].sort((left, right) => left - right);
}

/** One value as the picker shows it and the expression writes it: a name where the field has one. */
export function labelFor(value: number, field: CronField): string {
  const names = namesFor(field);
  if (!names) return String(value);
  return field === 'month' ? names[value - 1] : names[value];
}

/**
 * One field written as compactly as it can be said.
 *
 * Runs become ranges and an even spacing becomes a step, because that is how people write these
 * and a list of every value is not readable at a glance. Named fields are written with their names
 * and never with a step: a step on a name is not something every reader will be sure of, and the
 * list it would save is three characters long.
 */
export function formatField(values: readonly number[], field: CronField): string {
  const [low, high] = FIELD_RANGE[field];
  const sorted = [...new Set(values)].filter(value => value >= low && value <= high).sort((a, b) => a - b);
  // An empty selection is "every", which is what clearing a field means. It is never written as
  // nothing, which would not be an expression.
  if (sorted.length === 0 || sorted.length === high - low + 1) return '*';

  const named = namesFor(field) !== undefined;
  if (!named && sorted.length > 2) {
    const step = sorted[1] - sorted[0];
    const even = sorted.every((value, index) => index === 0 || value - sorted[index - 1] === step);
    // Only when the run really goes to the end of the field: `0,15,30` is evenly spaced too, and
    // writing it as a step would add 45 to the schedule.
    if (even && step > 1 && sorted[sorted.length - 1] + step > high) {
      return sorted[0] === low ? `*/${step}` : `${sorted[0]}/${step}`;
    }
  }

  const parts: string[] = [];
  let index = 0;
  while (index < sorted.length) {
    let end = index;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) end += 1;
    const first = labelFor(sorted[index], field);
    // Two in a row is written as two: `1-2` is no shorter than `1,2` and reads as less.
    if (end - index >= 2) parts.push(`${first}-${labelFor(sorted[end], field)}`);
    else for (let each = index; each <= end; each += 1) parts.push(labelFor(sorted[each], field));
    index = end + 1;
  }
  return parts.join(',');
}

/** Whether a field is something Spring would accept, set or not. */
function validField(value: string, field: CronField): boolean {
  if (parseField(value, field) !== undefined) return true;
  if (field === 'dayOfMonth' && (value === 'L' || value === 'LW' || /^L-\d+$/.test(value) || /^\d+W$/.test(value))) {
    return true;
  }
  // `5#2` is the second Friday and `FRI#2` is the same day written with a name; Spring accepts both
  // spellings, so a validator that only knew the numeric one would call a working schedule broken.
  if (
    field === 'dayOfWeek' &&
    (/^\d?L$/.test(value) || /^[A-Za-z]{3}L$/.test(value) || /^(?:\d|[A-Za-z]{3})#[1-5]$/.test(value))
  ) {
    return true;
  }
  // A wrapping range is legal and simply not a set. `FRI-MON`, `NOV-FEB`.
  const [start, end] = value.split('-');
  return end !== undefined && valueOf(start, field) !== undefined && valueOf(end, field) !== undefined;
}

/** Why this expression cannot be scheduled, as a message key, or `undefined` when it can. */
export function cronProblem(expression: string): string | undefined {
  const fields = splitCron(expression);
  if (!fields) return 'sixFields';
  const bad = CRON_FIELDS.findIndex((field, index) => !validField(fields[index], field));
  return bad < 0 ? undefined : CRON_FIELDS[bad];
}

/**
 * How often the schedule repeats — the coarsest thing it puts a condition on.
 *
 * This is what the picker asks first, because it decides which of the six fields are worth showing:
 * a schedule that runs every hour has nothing to say about which day it is, and five dropdowns of
 * "every" is a form that hides its own answer. Derived rather than stored, so an expression typed
 * into the field opens on the period it actually describes.
 */
export type CronPeriod = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

/** Coarsest first: the order a period is decided in, and the order the picker lists fields in. */
const BY_PERIOD: ReadonlyArray<readonly [CronPeriod, CronField]> = [
  ['year', 'month'],
  ['month', 'dayOfMonth'],
  ['week', 'dayOfWeek'],
  ['day', 'hour'],
  ['hour', 'minute'],
  ['minute', 'second'],
];

/** Whether a field says anything at all, rather than standing for every value it could take. */
export function isEvery(text: string, field: CronField): boolean {
  const values = parseField(text, field);
  const [low, high] = FIELD_RANGE[field];
  return values !== undefined && values.length === high - low + 1;
}

export function periodOf(fields: readonly string[]): CronPeriod {
  for (const [period, field] of BY_PERIOD) {
    if (!isEvery(fields[CRON_FIELDS.indexOf(field)], field)) return period;
  }
  return 'second';
}

/**
 * The fields the picker shows for a period, coarsest first.
 *
 * Everything finer than the period, which is what "repeats every X" leaves to be decided. A period
 * of `week` hides the day of the month, since naming both days would mean "the 5th, and only when
 * it is a Monday" — legal under Spring's AND, and never what picking a weekday meant.
 */
export function fieldsForPeriod(period: CronPeriod): CronField[] {
  const from = BY_PERIOD.findIndex(([each]) => each === period);
  if (from < 0) return [];
  return BY_PERIOD.slice(from)
    .map(([, field]) => field)
    // A weekly schedule picks weekdays, not days of the month.
    .filter(field => !(period === 'week' && field === 'dayOfMonth'));
}

/**
 * Whether two expressions schedule the same thing.
 *
 * The point is to **not write**. `0 0/15 * * * *` and its asterisk spelling select the same
 * minutes, and `@daily` is `0 0 0 * * *`; opening the picker on one and pressing OK without
 * touching anything must leave the field exactly as it was. Rewriting it would mark the field
 * dirty on its own and quietly replace what a server sent — the same rule the duration control
 * keeps for `P1DT0H` against `P1D`, and the one section 18 states as "existing data must not be
 * silently normalized solely because the renderer is mounted".
 *
 * Compared as **values**, field by field, which is the only comparison that answers this: the two
 * spellings are different strings and the same schedule. A field neither side can state as a set is
 * compared as text, because two pieces of syntax this does not model are only known to agree when
 * they are identical.
 */
export function sameExpression(left: string, right: string): boolean {
  if (left.trim() === right.trim()) return true;
  const a = splitCron(left);
  const b = splitCron(right);
  if (!a || !b) return false;
  return CRON_FIELDS.every((field, index) => {
    const one = parseField(a[index], field);
    const other = parseField(b[index], field);
    if (one === undefined || other === undefined) return a[index] === b[index];
    return one.length === other.length && one.every((value, at) => value === other[at]);
  });
}

/** Every field standing for every value: what a picker opened on nothing has chosen so far. */
export const NOTHING_CHOSEN: readonly string[] = ['*', '*', '*', '*', '*', '*'];

/**
 * How coarse each field is, for deciding what is "finer than" what.
 *
 * The two day fields share a rank because they answer the same question — which day — by two
 * different routes, and neither is finer than the other.
 */
const COARSENESS: Record<CronField, number> = {
  month: 0,
  dayOfMonth: 1,
  dayOfWeek: 1,
  hour: 2,
  minute: 3,
  second: 4,
};

/**
 * A period's fields with everything coarser than it standing down to every.
 *
 * The period is a **lens**, not data: it decides which rows are worth showing and nothing else, so
 * this seeds nothing and selects nothing. The one thing it must do is drop the conditions the lens
 * is about to hide — a monthly schedule switched to daily that kept its day of the month would
 * still run once a month, with nothing on screen saying so, because the row that said it is gone.
 */
export function standDown(fields: readonly string[], period: CronPeriod): string[] {
  const shown = new Set(fieldsForPeriod(period));
  return CRON_FIELDS.map((field, index) => (shown.has(field) ? (fields[index] ?? '*') : '*'));
}

/**
 * The time of day a choice implies, where it has not been said.
 *
 * Picking nine o'clock means **nine o'clock**, not every second of the hour after it — but in cron
 * a field left alone means every value, so `* * 9 * * *` is 3600 executions and not one. So
 * choosing a value pins the time fields below it that are still saying "every".
 *
 * Only downwards, only the time fields, and only when something was actually chosen. Clearing a
 * field pins nothing, and the day and month fields are never filled in on someone's behalf: that
 * would be the picker deciding which day the schedule runs, which is the question being asked.
 * Every pin it does make is one selection away from being undone, so "every minute during the 9am
 * hour" is still reachable — it is just no longer what picking an hour silently means.
 */
export function withTimeDefaults(fields: readonly string[], changed: CronField): string[] {
  const from = COARSENESS[changed];
  return CRON_FIELDS.map((field, index) => {
    const text = fields[index] ?? '*';
    const isTime = field === 'hour' || field === 'minute' || field === 'second';
    if (!isTime || COARSENESS[field] <= from || !isEvery(text, field)) return text;
    return formatField([FIELD_RANGE[field][0]], field);
  });
}
