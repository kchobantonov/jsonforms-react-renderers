export {
  specDateSaveFormat,
  specTimeSaveFormat,
  specDateTimeSaveFormat,
  saveFormatSatisfies,
  SAVE_FORMAT_DIAGNOSTIC,
  warnOnSaveFormat,
} from '@chobantonov/jsonforms-react-renderer-common/temporalFormats';

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
