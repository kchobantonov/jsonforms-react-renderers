import dayjs, { UnitType } from 'dayjs';
import customParsingPlugin from 'dayjs/plugin/customParseFormat';
import durationPlugin from 'dayjs/plugin/duration';
import timezonePlugin from 'dayjs/plugin/timezone'; // dependent on the utc plugin
import utcPlugin from 'dayjs/plugin/utc';

/**
 * Extra `dynamicDefaults` generators, ported from the Vue 2 `common` package.
 *
 * `ajv-keywords`' `dynamicDefaults` ships `timestamp`, `datetime`, `date`,
 * `time`, `random`, `randomint` and `seq`. The set below replaces the temporal
 * ones with offset-aware versions - `{ "func": "date", "args": { "duration":
 * "P1D" } }` is "tomorrow" - and adds `searchParams` and `dynamic`.
 *
 * Unlike the rest of the validator profile these **write into the data**, so
 * they only run under `useDefaults`.
 */

// Required for the custom save formats in the date, time and date-time pickers.
dayjs.extend(customParsingPlugin);
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
dayjs.extend(durationPlugin);

type Generator = (args: unknown) => () => unknown;

const arg = (args: unknown, name: string): string | undefined => {
  const value = (args as Record<string, unknown> | undefined)?.[name];
  return typeof value === 'string' ? value : undefined;
};

/**
 * A default computed by a function **written in the schema**.
 *
 * ```json
 * { "dynamicDefaults": { "ref": { "func": "dynamic", "args": { "func": "(a) => a.x" } } } }
 * ```
 *
 * The Vue 2 original compiles that string with `new Function` unconditionally.
 * Here it is gated: a schema is data, it can arrive with the form, and
 * compiling a string out of it is the same capability the template engines and
 * `Button.script` need permission for. Section 14 is explicit - "String
 * evaluation requires `jsonformsExtended.security.allowScriptEvaluation=true`"
 * - and there is no reason this one entry point should be the exception.
 *
 * Without the permission it is **reported, not silently skipped**: a default
 * that quietly does not appear is indistinguishable from a schema that never
 * asked for one.
 */
export const makeDynamic = (
  allowScriptEvaluation: () => boolean
): Generator => {
  return (args: unknown) => {
    const source = arg(args, 'func');
    if (!source) {
      throw new Error(
        `missing argument 'func' for dynamicDefaults func 'dynamic'`
      );
    }
    if (!allowScriptEvaluation()) {
      // eslint-disable-next-line no-console
      console.warn(
        `dynamicDefaults.evaluationDisabled: the 'dynamic' default compiles a ` +
          `function from the schema, which requires ` +
          `jsonformsExtended.security.allowScriptEvaluation. No default was applied.`
      );
      return () => undefined;
    }
    try {
      const compiled = new Function(
        'args',
        `const func = ${source}; return func(args);`
      );
      return () => {
        try {
          return compiled(args);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error at dynamicDefaults 'dynamic': ${error}`);
          return undefined;
        }
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error at dynamicDefaults 'dynamic': ${error}`);
      return () => undefined;
    }
  };
};

/**
 * A default taken from the page's query string, including one after the hash.
 *
 * Guarded for a non-browser host: this package is rendered in jsdom by its own
 * tests and may be server-rendered, where `window` is absent and the original
 * threw.
 */
export const searchParams: Generator = (args: unknown) => {
  const name = arg(args, 'param');
  if (!name || typeof window === 'undefined' || !window.location) {
    return () => undefined;
  }

  const url = new URL(window.location.href);
  let result = url.searchParams.get(name) ?? undefined;

  if (result === undefined) {
    // Also after the hash, where a hash-routed application puts them.
    const hash = url.hash;
    const index = hash.indexOf('?');
    if (index > 0 && index < hash.length - 1) {
      result =
        new URLSearchParams(hash.substring(index + 1)).get(name) ?? undefined;
    }
  }

  return () => result;
};

/**
 * "now", optionally shifted by an ISO 8601 duration.
 *
 * `{ "date": "2024-01-01", "duration": "P1M", "op": "subtract" }`. `date`
 * defaults to now, and the literal string `"now"` means the same thing.
 */
const nowOffset = (args: unknown) => {
  const duration = arg(args, 'duration');
  const supplied = arg(args, 'date');
  const date: string | Date =
    supplied && supplied !== 'now' ? supplied : new Date();

  /*
    `subtract`, and the original's misspelling. The Vue 2 version compares
    against `'substract'`, so every schema written against it spells it that
    way; accepting only the correct spelling would break them, and accepting
    only the misspelling would enshrine it.
  */
  const op = arg(args, 'op');
  const subtracting = op === 'subtract' || op === 'substract';

  let value = dayjs(date);
  if (value.isValid() && duration) {
    const offset = dayjs.duration(duration);
    value = subtracting ? value.subtract(offset) : value.add(offset);
  }
  return value;
};

const temporal =
  (format: string): Generator =>
  (args: unknown) => {
    const value = nowOffset(args);
    const result = value.isValid() ? value.local().format(format) : undefined;
    return () => result;
  };

export const datetimeOffset = temporal('YYYY-MM-DDTHH:mm:ss.SSS');
export const timeOffset = temporal('HH:mm:ss.SSS');
export const dateOffset = temporal('YYYY-MM-DD');

/** One component of the offset date - `{ "unit": "year" }`. */
export const dateUnit: Generator = (args: unknown) => {
  const value = nowOffset(args);
  if (!value.isValid()) {
    return () => undefined;
  }
  const unit = (arg(args, 'unit') ?? 'millisecond') as UnitType;
  const result = value.local().get(unit);
  return () => result;
};
