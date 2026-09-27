import dayjs from 'dayjs';
import { formatDate } from './datejs';

/**
 * The serialization formats a temporal control saves in.
 *
 * Section 18 fixes these defaults, and the reason is not style: a control is
 * selected **by** the schema's `format` keyword, so the value it writes has to
 * satisfy that same keyword. JSON Forms' `createAjv` validates formats in full
 * mode, where RFC 3339 `time` and `date-time` both require seconds **and** a
 * timezone offset.
 *
 * Core's `defaultTimeFormat` is `HH:mm:ss`, which has no offset - so a time
 * control wrote `17:04:09` and the form went invalid the moment anyone used
 * the picker, with no way to fix it from the picker either. Every value it
 * could produce was invalid.
 *
 * | Format | Written | Accepted by `format: "time"` |
 * | --- | --- | --- |
 * | `HH:mm:ss` | `17:04:09` | no |
 * | `HH:mm:ssZ` | `17:04:09-04:00` | yes |
 *
 * `date` needs no offset and core's default already matches the section.
 */

/** Section 18: `YYYY-MM-DD`. */
export const specDateSaveFormat = 'YYYY-MM-DD';

/** Section 18: `HH:mm:ssZ`, "including offset under this format". */
export const specTimeSaveFormat = 'HH:mm:ssZ';

/**
 * Section 18: `YYYY-MM-DDTHH:mm:ssZ`.
 *
 * The `T` is escaped. dayjs passes an unrecognised letter through unchanged,
 * so both spellings produce the same string - but `T` sits directly against
 * `DD`, and escaping says that it is a literal rather than leaving the reader
 * to check the token table.
 */
export const specDateTimeSaveFormat = 'YYYY-MM-DD[T]HH:mm:ssZ';

/** The calendar views a date picker may offer, per section 18. */
export type DateView = 'year' | 'month' | 'day';

/**
 * The picker granularity, from `views` or - failing that - the save format.
 *
 * Section 18 makes `views` "a date-only array drawn from `year`, `month`,
 * `day`", and is explicit that it "does not automatically change
 * `dateSaveFormat`". The two are independent settings: a year/month picker
 * that stores a full date is a legitimate thing to ask for.
 *
 * Before this existed the granularity was **inferred from the save format** -
 * no `D` meant a month picker, no `M` a year picker. That is the coupling the
 * section rules out, and backwards: it made the storage decide the interaction.
 * The inference is kept as a fallback for forms authored against it, below an
 * explicit `views`.
 */
/** The time columns a picker may offer. */
export type TimeView = 'hours' | 'minutes' | 'seconds';

/**
 * Which time columns `views` asks for, or `undefined` to leave it to the
 * display format.
 *
 * The specification narrows `views` to a date-only array, but the convention
 * it comes from uses time views as well - a time picker defaults to
 * `['hours','minutes']` there, and a date-time picker to
 * `['year','day','hours','minutes']`. Honouring them costs nothing and means a
 * UI schema carrying `views: ['hours','minutes']` hides the seconds column
 * rather than being accepted and ignored.
 *
 * `undefined` rather than all-true when no time view is named: a picker
 * already derives its columns from the display format, and overriding that
 * with an explicit set would make `views: ['year']` on a time picker blank the
 * whole panel. An array naming no time view leaves the format in charge.
 *
 * Independent of the save format, as `views` is everywhere: asking for hours
 * and minutes does not stop seconds being stored.
 */
export const timePickerColumns = (
  views: unknown
):
  | { showHour: boolean; showMinute: boolean; showSecond: boolean }
  | undefined => {
  if (!Array.isArray(views)) {
    return undefined;
  }
  const wanted = views.filter(
    (view): view is TimeView =>
      view === 'hours' || view === 'minutes' || view === 'seconds'
  );
  if (wanted.length === 0) {
    return undefined;
  }
  return {
    showHour: wanted.includes('hours'),
    showMinute: wanted.includes('minutes'),
    showSecond: wanted.includes('seconds'),
  };
};

export const datePickerMode = (
  views: unknown,
  saveFormat: string
): 'date' | 'month' | 'year' => {
  if (Array.isArray(views)) {
    const wanted = views.filter(
      (view): view is DateView =>
        view === 'year' || view === 'month' || view === 'day'
    );
    // The finest view the author asked for is the one the picker lands on.
    if (wanted.includes('day')) {
      return 'date';
    }
    if (wanted.includes('month')) {
      return 'month';
    }
    if (wanted.includes('year')) {
      return 'year';
    }
  }
  if (!saveFormat.includes('D')) {
    return saveFormat.includes('M') ? 'month' : 'year';
  }
  return 'date';
};

/*
  RFC 3339, as `ajv-formats` applies it in full mode. Inlined rather than
  imported because the check below has to run in a cell, where pulling in a
  validator would be out of proportion to the question being asked.
*/
const RFC3339 = {
  date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
  time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
  'date-time':
    /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
};

/**
 * The instant the check below formats, chosen rather than picked at random.
 *
 * **Every component is a single digit.** That is the whole point: a format
 * using an unpadded token - `H:mm:ss` rather than `HH:mm:ss` - emits a
 * two-digit hour anyway for any instant after 09:59, so a probe taken from
 * the afternoon quietly accepts it. At 04:05:06 the same format emits
 * `4:05:06`, which RFC 3339 rejects, and the author hears about it.
 *
 * It is fixed rather than `dayjs()` because the answer must not depend on
 * when the form happens to be rendered.
 */
const PROBE_INSTANT = '2001-02-03T04:05:06';

/**
 * Whether a save format can produce a value the schema's `format` accepts.
 *
 * The trap this exists for: a control selected by `format: "time"` given
 * `timeSaveFormat: "HH:mm"` writes `23:03`, which that same keyword rejects -
 * so the form is invalid the instant anyone edits it, and no amount of picking
 * repairs it. It reads like a display setting and is a validity setting.
 *
 * The check is empirical rather than a parse of the format string: the
 * reference instant above is formatted and the result tested. That way a
 * format nobody anticipated is judged by what it actually emits.
 *
 * Returns true when there is nothing to object to - including when the schema
 * carries no ordered `format` at all, which is the whole point of choosing a
 * control through `options.format` instead.
 */
export const saveFormatSatisfies = (
  jsonFormat: unknown,
  saveFormat: string
): boolean => {
  const pattern = RFC3339[jsonFormat as keyof typeof RFC3339];
  if (!pattern) {
    return true;
  }
  return pattern.test(formatDate(dayjs(PROBE_INSTANT), saveFormat));
};

/** Stable code, per section 21. */
export const SAVE_FORMAT_DIAGNOSTIC = 'temporal.saveFormatInvalid';

const warned = new Set<string>();

/**
 * Warns once per offending combination.
 *
 * A console warning rather than a rendered message, following the precedent
 * set for `Categorization`'s `initial` (adjustment 10.5): this is an authoring
 * mistake in the UI schema, not something the person filling in the form can
 * act on. They already get the validation error.
 */
export const warnOnSaveFormat = (
  jsonFormat: unknown,
  saveFormat: string
): void => {
  if (saveFormatSatisfies(jsonFormat, saveFormat)) {
    return;
  }
  const key = `${String(jsonFormat)}|${saveFormat}`;
  if (warned.has(key)) {
    return;
  }
  warned.add(key);
  // eslint-disable-next-line no-console
  console.warn(
    `${SAVE_FORMAT_DIAGNOSTIC}: the save format ${JSON.stringify(
      saveFormat
    )} produces values that \`format: ${JSON.stringify(
      jsonFormat
    )}\` rejects, so the control cannot be made valid. Either drop the schema \`format\` and select the control with \`options.format\`, or use a save format carrying the parts RFC 3339 requires.`
  );
};
