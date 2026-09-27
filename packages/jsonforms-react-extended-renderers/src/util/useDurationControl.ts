import { ControlProps } from '@jsonforms/core';
import { useState } from 'react';
import { useExtendedTranslator } from './useExtendedTranslator';

/**
 * The picker's shape, and why it is not one field per component.
 *
 * ISO 8601 gives seven components, and showing all seven means five rows of
 * `0` for a value like "2 days, 3 hours" - the two that carry information are
 * found by scanning past the five that do not. So the picker shows only the
 * units **in play**, with the rest reachable through an add control.
 *
 * Weeks is the other half of it. ISO forbids combining `W` with anything else,
 * which the previous picker enforced by greying the Weeks row whenever another
 * field was non-zero. That is correct and unexplained: a user who wants weeks
 * has to work out that five other fields must be zeroed first. It is a
 * **mode**, not a component, so it is modelled as one.
 */

export const emptyDurationParts = {
  weeks: 0,
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};
export type ExtendedDurationParts = typeof emptyDurationParts;
export const durationFields = Object.keys(emptyDurationParts) as Array<
  keyof ExtendedDurationParts
>;

/** The components, in magnitude order. Weeks is a mode and is not among them. */
export const durationComponentFields = durationFields.filter(
  (field) => field !== 'weeks'
) as Array<Exclude<keyof ExtendedDurationParts, 'weeks'>>;

export type DurationMode = 'weeks' | 'components';

/**
 * Whether a value is written in the weeks form.
 *
 * Not `parts.weeks > 0`: `P0W` is a valid duration - RFC 3339's
 * `dur-week = 1*DIGIT "W"` admits `0` - and it parses to a draft of all
 * zeros, which is indistinguishable from `P0D`. The **text** is what says
 * which form was written.
 */
export const isWeeksDuration = (value: unknown): boolean =>
  typeof value === 'string' && /^P\d+W$/i.test(value.trim());

/**
 * What an empty picker opens on.
 *
 * Something has to be on screen or the panel is a bare add control. Hours is
 * the unit forms ask for most often, and any other choice is one click away.
 */
const defaultComponentField: keyof ExtendedDurationParts = 'hours';
/**
 * The largest value a component can hold - and it is not 59.
 *
 * A duration's components are **quantities, not clock fields**. ISO 8601
 * bounds none of them: `PT90M`, `PT3600S`, `P18M`, `P400D` and `PT1H591212M`
 * are all valid, and Ajv's `duration` format accepts every one of them. The
 * picker used to cap months at 11 and hours, minutes and seconds at 23 or 59,
 * which is the shape of a *time of day* and has nothing to do with a length
 * of time.
 *
 * The cap was not only wrong, it was **destructive**: `changePart` clamped to
 * it, so typing 90 into Minutes silently became 59. And `PT90M` is not
 * interchangeable with `PT1H30M` as stored data even though the two are the
 * same length - rewriting one into the other is the normalisation §32.1a
 * already forbids.
 *
 * What remains is the only real bound: the range in which an integer is
 * exact. Past it the formatted string would no longer say what was typed.
 */
export const durationFieldMax = Number.MAX_SAFE_INTEGER;
export const parseExtendedDuration = (
  value: unknown
): ExtendedDurationParts | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const weeks = /^P(\d+)W$/i.exec(text);
  if (weeks) return { ...emptyDurationParts, weeks: Number(weeks[1]) };
  const match =
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(
      text
    );
  if (!match || !match.slice(1).some(Boolean) || /T$/i.test(text)) return null;
  const [, years, months, days, hours, minutes, seconds] = match;
  const parts = {
    weeks: 0,
    years: Number(years || 0),
    months: Number(months || 0),
    days: Number(days || 0),
    hours: Number(hours || 0),
    minutes: Number(minutes || 0),
    seconds: Number(seconds || 0),
  };
  return Object.values(parts).every(Number.isFinite) ? parts : null;
};
export const formatExtendedDuration = (parts: ExtendedDurationParts) => {
  const safe = Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [
      key,
      Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
    ])
  ) as ExtendedDurationParts;
  if (safe.weeks) return `P${safe.weeks}W`;
  const date = `${safe.years ? `${safe.years}Y` : ''}${
    safe.months ? `${safe.months}M` : ''
  }${safe.days ? `${safe.days}D` : ''}`;
  const time = `${safe.hours ? `${safe.hours}H` : ''}${
    safe.minutes ? `${safe.minutes}M` : ''
  }${safe.seconds ? `${safe.seconds}S` : ''}`;
  return date || time ? `P${date}${time ? `T${time}` : ''}` : 'P0D';
};
export const useDurationControl = (props: ControlProps) => {
  const t = useExtendedTranslator();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...emptyDurationParts });
  /**
   * The components on screen.
   *
   * Not derived from "value > 0", because a unit the user has just added is
   * still zero and must stay visible until they type in it or remove it.
   */
  const [shown, setShown] = useState<Array<keyof ExtendedDurationParts>>([]);
  /**
   * Held, not derived from the draft.
   *
   * It used to be `draft.weeks > 0`, which meant clearing the Weeks box
   * flipped the whole panel into components mode mid-edit: the row the user
   * was typing in vanished and the segmented control jumped. A mode is a
   * thing the user chose; it must not depend on the value they are in the
   * middle of entering.
   */
  const [mode, setModeState] = useState<DurationMode>('components');
  const options = { ...props.config, ...props.uischema.options };
  const disabled = !props.enabled || Boolean(props.readonly);
  const value = typeof props.data === 'string' ? props.data : '';
  const commit = (next: string | undefined) => {
    if (!disabled) props.handleChange(props.path, next);
  };
  /**
   * Whether these parts are what the current value already says.
   *
   * Several spellings parse to the same duration - `P0W`, `P0D` and `PT0S`
   * are all "nothing", and `P1DT0H` is `P1D`. Writing the canonical form back
   * over an equal value is a rewrite of data the user did not touch: it marks
   * the field dirty on its own, and it silently replaces whatever a server
   * sent.
   *
   * The specification already forbids this in general - "existing data must
   * not be silently normalized solely because the renderer is mounted" - and
   * the zero rule ("serialize zero as `P0D`") says what to write when the
   * user *means* zero, not what to do with an equivalent value that arrived
   * from somewhere else.
   */
  const unchangedFrom = (next: ExtendedDurationParts) => {
    const current = parseExtendedDuration(value);
    return (
      current !== null &&
      durationFields.every((field) => current[field] === next[field])
    );
  };

  /** Commits, unless it would only rewrite the value into another spelling. */
  const commitParts = (next: ExtendedDurationParts) => {
    if (unchangedFrom(next)) return;
    commit(formatExtendedDuration(next));
  };

  const commitIfLive = (next: ExtendedDurationParts) => {
    if (options.showActions === false) commitParts(next);
  };

  /** In magnitude order however they were added. */
  const activeFields =
    mode === 'weeks'
      ? (['weeks'] as Array<keyof ExtendedDurationParts>)
      : durationComponentFields.filter((field) => shown.includes(field));

  const openFields = (parts: ExtendedDurationParts) => {
    const withValues = durationComponentFields.filter(
      (field) => parts[field] > 0
    );
    return withValues.length ? withValues : [defaultComponentField];
  };

  return {
    open,
    draft,
    options,
    disabled,
    value,
    mode,
    /** The rows to draw, and the order to draw them in. */
    activeFields,
    /** What the add control may offer. Empty in weeks mode. */
    addableFields:
      mode === 'weeks'
        ? []
        : durationComponentFields.filter((field) => !shown.includes(field)),
    error:
      props.errors ||
      (value && !parseExtendedDuration(value) ? t('duration.invalid') : ''),
    showActions: options.showActions !== false,
    openPicker: () => {
      if (!disabled) {
        const parts = parseExtendedDuration(value) ?? {
          ...emptyDurationParts,
        };
        setDraft(parts);
        setModeState(isWeeksDuration(value) ? 'weeks' : 'components');
        setShown(openFields(parts));
        setOpen(true);
      }
    },
    close: () => setOpen(false),
    apply: () => {
      commitParts(draft);
      setOpen(false);
    },
    changeText: (next: string) => commit(next || undefined),
    /**
     * Switches between the two representations.
     *
     * They cannot coexist - `P2W3D` is not a duration - so switching clears
     * the other side rather than pretending to carry it across. The draft is
     * only committed on Apply, so Cancel still restores what was there.
     */
    setMode: (next: DurationMode) => {
      if (disabled || next === mode) return;
      /*
        Starting at zero rather than inventing a week: switching mode is not
        the user saying how long something is. Zero serializes as `P0D`,
        which section 21 requires regardless of which form was on screen -
        there is no distinct `P0W` to preserve, since `P0W` and `P0D` are the
        same duration.
      */
      const parts = { ...emptyDurationParts };
      setModeState(next);
      setDraft(parts);
      setShown(next === 'weeks' ? [] : openFields(parts));
      commitIfLive(parts);
    },
    /** Reveals a unit at zero, in magnitude order. */
    addField: (key: keyof ExtendedDurationParts) => {
      if (disabled || key === 'weeks') return;
      setShown((current) =>
        current.includes(key) ? current : [...current, key]
      );
    },
    /** Hides a unit *and clears it*, so the value matches what is on screen. */
    removeField: (key: keyof ExtendedDurationParts) => {
      if (disabled) return;
      setShown((current) => {
        const next = current.filter((field) => field !== key);
        return next.length ? next : [defaultComponentField];
      });
      const next = { ...draft, [key]: 0 };
      setDraft(next);
      commitIfLive(next);
    },
    changePart: (key: keyof ExtendedDurationParts, value: number) => {
      if (disabled) return;
      const next = {
        ...draft,
        [key]: Math.max(0, Math.min(durationFieldMax, Math.floor(value || 0))),
      };
      setDraft(next);
      commitIfLive(next);
    },
  };
};
