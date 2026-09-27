import dayjs from 'dayjs';
import { getData } from './datejs';
import { JSONFORMS_EXTENDED_CONFIG_KEY } from './configNamespaces';

/**
 * Picker limits from `formatMinimum` and friends.
 *
 * Section 18's temporal contract:
 *
 * | Keyword | Meaning for the widget |
 * | --- | --- |
 * | `formatMinimum` | Inclusive lower bound: prevent choices and completed commits before it. |
 * | `formatExclusiveMinimum` | Exclusive lower bound: "the boundary itself is not selectable". |
 * | `formatMaximum` | Inclusive upper bound. |
 * | `formatExclusiveMaximum` | Exclusive upper bound. |
 *
 * "The preventive bound behavior above follows effective `restrict`" - these
 * limits are about what the picker *offers*. They never clamp a value that is
 * already stored: "does not authorize clamping existing data". A value outside
 * the bounds stays exactly as it is, shown with its validation error, and the
 * validator remains the thing that decides validity.
 *
 * The four keywords come from `ajv-formats`, not from JSON Schema itself, and
 * Ajv only compares them when the schema carries a `format` it knows how to
 * order. A UI-only `options.format` cannot supply that, so a control selected
 * that way gets bounds in the picker and no validation behind them.
 */

/**
 * Just the four keywords, read off whatever schema object is to hand.
 *
 * An index signature rather than four optional fields: they are `ajv-formats`
 * extensions, so `JsonSchema` does not declare them and a structural type of
 * four optional unknowns has no property in common with it.
 */
export type TemporalBoundsSchema = Record<string, unknown>;

export type BoundPrecision = 'day' | 'minute' | 'second';

export interface TemporalBounds {
  min?: dayjs.Dayjs;
  max?: dayjs.Dayjs;
  /** True when the bounds leave nothing selectable at all. */
  empty: boolean;
}

/** The arbitrary day a bare time is placed on, so two clock values compare. */
const CLOCK_DAY = '2000-01-01';

/**
 * Resolves the four keywords into one selectable range.
 *
 * **Exclusivity is resolved at the picker's precision**, which the section
 * requires: "exclusivity must be preserved at the picker's supported
 * precision". A date picker offering whole days cannot express "after
 * 2026-09-19 but not 2026-09-19 itself" except by starting at the 20th, so an
 * exclusive lower bound steps one unit forward and an exclusive upper bound
 * one unit back.
 *
 * `timeOnly` normalises both bounds onto one arbitrary day, so a time picker
 * compares clock values without inventing a reference date - the approach the
 * Svelte renderer family takes for the same reason.
 */
export const temporalBounds = (
  schema: TemporalBoundsSchema | undefined,
  formats: string[],
  precision: BoundPrecision,
  timeOnly = false
): TemporalBounds => {
  let min: dayjs.Dayjs | undefined;
  let max: dayjs.Dayjs | undefined;

  for (const [key, lower, exclusive] of [
    ['formatMinimum', true, false],
    ['formatExclusiveMinimum', true, true],
    ['formatMaximum', false, false],
    ['formatExclusiveMaximum', false, true],
  ] as const) {
    const raw = (schema as Record<string, unknown> | undefined)?.[key];
    if (typeof raw !== 'string') {
      continue;
    }
    let bound = getData(raw, formats);
    if (!bound) {
      continue;
    }
    if (timeOnly) {
      bound = bound.year(2000).month(0).date(1);
    }

    let candidate = bound.startOf(precision);
    if (
      lower &&
      (candidate.isBefore(bound) || (exclusive && candidate.isSame(bound)))
    ) {
      // Either the bound sits mid-unit - so the first whole unit at or after
      // it is the next one - or it is exclusive and must be stepped past.
      candidate = candidate.add(1, precision);
    } else if (!lower && exclusive && candidate.isSame(bound)) {
      candidate = candidate.subtract(1, precision);
    }

    // Several keywords may apply at once; the tightest one wins.
    if (lower) {
      if (!min || candidate.isAfter(min)) {
        min = candidate;
      }
    } else if (!max || candidate.isBefore(max)) {
      max = candidate;
    }
  }

  const clockStart = dayjs(CLOCK_DAY).startOf('day');
  const empty =
    !!(min && max && min.isAfter(max)) ||
    (timeOnly &&
      !!(
        (min && !min.isBefore(clockStart.add(1, 'day'))) ||
        (max && max.isBefore(clockStart))
      ));

  return { min, max, empty };
};

/**
 * Whether preventive constraints apply, per section 15.
 *
 * The section states the default plainly - "`restrict`: shared preferred
 * default **true**" - and JSON Forms core's `configDefault` sets
 * `restrict: false`. A renderer that merges the form config and then asks
 * `restrict !== false` therefore gets `false` every time, and the
 * specification's default is unreachable: nothing the author omits can ever
 * turn it on.
 *
 * So the flat `config.restrict` is deliberately **not** consulted. It cannot
 * be told apart from core's seeded default once the two have been merged, and
 * treating that seed as an author's choice is what defeats the contract. The
 * resolution order is the project's usual one (adjustment 1), minus that step:
 *
 * 1. the element's own `options.restrict` - flat, as element options always are;
 * 2. `config.jsonformsExtended.restrict`, for a form-wide setting;
 * 3. `true`.
 */
export const effectiveRestrict = (
  options: Record<string, unknown> | undefined,
  config: unknown
): boolean => {
  if (typeof options?.restrict === 'boolean') {
    return options.restrict;
  }
  const extended = (config as Record<string, unknown> | undefined)?.[
    JSONFORMS_EXTENDED_CONFIG_KEY
  ] as Record<string, unknown> | undefined;
  if (typeof extended?.restrict === 'boolean') {
    return extended.restrict;
  }
  return true;
};

/**
 * A bound written as an Ajv `$data` reference, resolved against the form data.
 *
 * `{ "formatMinimum": { "$data": "1/from" } }` is how a date range says "not
 * before the other end", and it is the reason the four bound keywords exist in
 * pairs at all. The pointer is a **JSON Relative Pointer**, relative to the
 * *instance* being validated: `1/from` means up one level from this property,
 * then `from`.
 *
 * Section 18 keeps this separate from literal bounds - "literal bounds and
 * `$data` references are separate support capabilities. A renderer claiming
 * literal-bound support must not imply that it resolves `$data` bounds" - so
 * it is resolved deliberately here rather than being assumed to come for free.
 *
 * Returns undefined for anything it cannot follow, which leaves the bound
 * simply unapplied: the picker offers more than it might, and the validator
 * still has the final say.
 */
export const resolveDataPointer = (
  pointer: string,
  path: string | undefined,
  rootData: unknown
): unknown => {
  const match = /^(\d+)(?:\/(.*))?$/.exec(pointer);
  if (!match) {
    // Absolute pointers and the `#` key-name suffix are not supported; a
    // relative pointer is what a sibling bound needs.
    return undefined;
  }
  const up = Number(match[1]);
  const segments = (path ?? '').split('.').filter(Boolean);
  if (up > segments.length) {
    return undefined;
  }
  const base = up === 0 ? segments : segments.slice(0, segments.length - up);
  const rest = (match[2] ?? '').split('/').filter(Boolean);
  let current: unknown = rootData;
  for (const segment of [...base, ...rest]) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

/**
 * The bound keywords with any `$data` references replaced by their values.
 *
 * Keeps `temporalBounds` working on strings alone, which is what makes its
 * arithmetic testable without a form around it.
 */
export const resolveDataBounds = (
  schema: TemporalBoundsSchema | undefined,
  path: string | undefined,
  rootData: unknown
): TemporalBoundsSchema | undefined => {
  if (!schema) {
    return schema;
  }
  let changed = false;
  const resolved: Record<string, unknown> = { ...schema };
  for (const key of [
    'formatMinimum',
    'formatMaximum',
    'formatExclusiveMinimum',
    'formatExclusiveMaximum',
  ]) {
    const raw = (schema as Record<string, unknown>)[key];
    const pointer = (raw as { $data?: unknown } | undefined)?.$data;
    if (typeof pointer !== 'string') {
      continue;
    }
    changed = true;
    const value = resolveDataPointer(pointer, path, rootData);
    if (typeof value === 'string') {
      resolved[key] = value;
    } else {
      // Not filled in yet, or not a string: no bound rather than a wrong one.
      delete resolved[key];
    }
  }
  return changed ? resolved : schema;
};
