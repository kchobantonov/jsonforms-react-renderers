import { Environment } from '@marcbachmann/cel-js';

/**
 * The evaluator, with locale-aware formatting.
 *
 * ## Why formatting is functions rather than automatic
 *
 * A locale decides more than which words are shown: `148.5` is `148,50 €` in
 * German and `€148.50` in English, and a date reads differently in every
 * language. An expression language has none of that built in, so it is
 * supplied here as functions the author calls explicitly.
 *
 * Explicit, because the alternative - formatting every number on its way into
 * the text - cannot tell a price from an order number, a year or an id, and
 * would render `2026` as `2,026`. There is no way to opt out of an implicit
 * rule; there is nothing to opt out of with a function.
 *
 * They are part of the published contract: an author writing
 * `{currency(amount, "EUR")}` in a catalog string is relying on them, and a
 * renderer set that drops one breaks that string in every language.
 *
 * ## The locale comes from the form
 *
 * One environment per locale, cached, so switching language re-formats
 * without re-parsing anything. `Intl` does the work, so there is no data to
 * ship and the result matches the platform's own rendering.
 */

/**
 * A temporal value out of the form's data is **always a string**: `data` holds
 * JSON, so a date is whatever the schema's `format` said it was, never a
 * JavaScript `Date`. The three formats parse very differently, and treating
 * them alike is wrong in two of the three cases.
 *
 * | value | `new Date(...)` | formatted in the viewer's zone |
 * | --- | --- | --- |
 * | `2026-10-01` | UTC midnight | **30 September** west of the meridian |
 * | `14:30:00` | **Invalid Date** | - |
 * | `2026-10-01T14:30:00+02:00` | the right instant | correct |
 *
 * So a **calendar date** is read and formatted in UTC, because it denotes a
 * day rather than a moment and must not slide into the day before. A
 * **time-only** value has no date to anchor it and is given one. A
 * **date-time** denotes an instant, and an instant is shown in the reader's
 * own zone - pinning it to UTC would display a time nobody asked for.
 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;

interface Instant {
  date: Date;
  /** `UTC` where the value denotes a day or a clock time rather than a moment. */
  timeZone?: string;
}

const toInstant = (value: unknown): Instant => {
  /*
    A `Date` is accepted because host `context` may legitimately carry one.
    It never comes from `data`.
  */
  if (value instanceof Date) {
    return { date: value };
  }
  const text = String(value);
  const parse = (iso: string, timeZone?: string): Instant => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`not a date: ${text}`);
    }
    return { date, timeZone };
  };
  if (DATE_ONLY.test(text)) {
    return parse(`${text}T00:00:00Z`, UTC);
  }
  if (TIME_ONLY.test(text)) {
    // Any date will do; only the clock is shown.
    return parse(`1970-01-01T${text}Z`, UTC);
  }
  return parse(text);
};

const UTC = 'UTC';

/** CEL integers arrive as `bigint`; `Intl` handles both, `Number()` is for safety. */
const toNumeric = (value: unknown): number | bigint =>
  typeof value === 'bigint' ? value : Number(value);

const build = (locale: string): Environment =>
  new Environment()
    /*
      Registered per numeric CEL type. A value read out of the form's data is
      a `double` to CEL whether or not it has a fraction; a literal or the
      result of `size()` is an `int`. Both have to be accepted or an author
      has to know which is which, which is not knowable from the schema.
    */
    .registerFunction('number(double): string', (v: unknown) =>
      new Intl.NumberFormat(locale).format(toNumeric(v))
    )
    .registerFunction('number(int): string', (v: unknown) =>
      new Intl.NumberFormat(locale).format(toNumeric(v))
    )
    .registerFunction('number(double, int): string', (v: unknown, d: unknown) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: Number(d),
        maximumFractionDigits: Number(d),
      }).format(toNumeric(v))
    )
    .registerFunction(
      'currency(double, string): string',
      (v: unknown, code: unknown) =>
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: String(code),
        }).format(toNumeric(v))
    )
    .registerFunction(
      'currency(int, string): string',
      (v: unknown, code: unknown) =>
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: String(code),
        }).format(toNumeric(v))
    )
    .registerFunction('percent(double): string', (v: unknown) =>
      new Intl.NumberFormat(locale, { style: 'percent' }).format(toNumeric(v))
    )
    .registerFunction('date(string): string', (v: unknown) => {
      const { date, timeZone } = toInstant(v);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone,
      }).format(date);
    })
    .registerFunction('time(string): string', (v: unknown) => {
      const { date, timeZone } = toInstant(v);
      return new Intl.DateTimeFormat(locale, {
        timeStyle: 'short',
        timeZone,
      }).format(date);
    })
    .registerFunction('dateTime(string): string', (v: unknown) => {
      const { date, timeZone } = toInstant(v);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
      }).format(date);
    });

const environments = new Map<string, Environment>();

/** The base environment for a locale, built once. */
export const environmentFor = (locale: string | undefined): Environment => {
  const key = locale ?? 'en';
  const existing = environments.get(key);
  if (existing) {
    return existing;
  }
  const created = build(key);
  environments.set(key, created);
  return created;
};

/**
 * Evaluates one expression against a scope.
 *
 * Every name in the scope is declared as `dyn`, which is what an untyped
 * evaluation already gives: measured against this library's own
 * `evaluate()`, a `dyn` declaration accepts everything it accepts and refuses
 * the same things - including `seats + 1`, where CEL will not mix a
 * double-typed value with an integer literal. (`seats + 1.0` works.) So the
 * typed environment costs nothing and is what makes the formatting functions
 * reachable.
 *
 * Declaring the names also keeps the refusal: an identifier that is not in
 * the scope is an error rather than a silent `undefined`.
 */
/**
 * `constructor` is a legal JSON key, and the evaluator cannot read an object
 * that has one.
 *
 * Its type check is `switch (v.constructor)` with cases `undefined | Object |
 * Map`, so a data property of that name shadows the constructor and the
 * **whole map** is rejected - every sibling field becomes unreadable with it.
 * Measured: only `constructor` does this; `__proto__`, `toString`, `valueOf`
 * and `hasOwnProperty` as data keys are fine.
 *
 * A `Map` is the repair, because its entries live in an internal slot and
 * cannot shadow `.constructor` - `Map` is already one of the accepted cases,
 * and a key called `constructor` then reads like any other.
 */
const toMaps = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(toMaps);
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !(value instanceof Map)
  ) {
    return new Map(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        toMaps(child),
      ])
    );
  }
  return value;
};

const isUnsupportedObject = (error: unknown): boolean =>
  error instanceof Error && /^Unsupported type: object/.test(error.message);

/**
 * Evaluates one expression against a scope.
 *
 * Every name in the scope is declared as `dyn`, which is what an untyped
 * evaluation already gives: measured against this library's own
 * `evaluate()`, a `dyn` declaration accepts everything it accepts and refuses
 * the same things - including `seats + 1`, where CEL will not mix a
 * double-typed value with an integer literal. (`seats + 1.0` works.) So the
 * typed environment costs nothing and is what makes the formatting functions
 * reachable.
 *
 * Declaring the names also keeps the refusal: an identifier that is not in
 * the scope is an error rather than a silent `undefined`.
 *
 * **The repair runs only after the one failure it fixes.** Data is read as
 * it arrives, so the ordinary path converts nothing; an object carrying a
 * `constructor` key is rebuilt as maps and the expression is tried once
 * more. Converting up front would mean walking the whole form's data on
 * every label of every render to serve a case almost no schema has.
 */
/** The form's translator, as JSON Forms supplies it. */
export type Translate = (
  key: string,
  defaultMessage?: string
) => string | undefined;

/**
 * Registers `translate`, bound to this form's translator.
 *
 * It has to be **registered** rather than passed in the scope, and that is
 * the whole point: a function placed in `context` is not callable, is not
 * even readable, and no expression can reach it. Measured - a member call
 * finds no overload, a bare call finds no overload, and reading it is an
 * unsupported type. So a host cannot widen what an expression can do by
 * putting a callback in the data, deliberately or by accident. Capability is
 * granted here, in one place, on purpose.
 *
 * What it buys: a value out of the data is often a **key**, not a word.
 * `data.plan` is `"Team"` in every language, and `{translate("plan." + plan)}`
 * turns it into the language's own word for it - which a catalog can do for
 * itself, without the UI schema knowing the set of plans.
 *
 * Registered on the per-call clone rather than the cached environment,
 * because the translator belongs to the form while the environment is shared
 * by locale.
 */
const withTranslator = (env: Environment, translate: Translate): Environment =>
  env
    .registerFunction('translate(string): string', (key: unknown) =>
      String(translate(String(key), String(key)) ?? String(key))
    )
    .registerFunction(
      'translate(string, string): string',
      (key: unknown, fallback: unknown) =>
        String(translate(String(key), String(fallback)) ?? String(fallback))
    );

export const evaluateWith = (
  expression: string,
  scope: Record<string, unknown>,
  locale: string | undefined,
  translate?: Translate
): unknown => {
  const declared = (values: Record<string, unknown>) => {
    let env = environmentFor(locale).clone();
    if (translate) {
      env = withTranslator(env, translate);
    }
    for (const name of Object.keys(values)) {
      env.registerVariable(name, 'dyn');
    }
    return env;
  };
  try {
    return declared(scope).evaluate(expression, scope);
  } catch (error) {
    if (!isUnsupportedObject(error)) {
      throw error;
    }
    const repaired = Object.fromEntries(
      Object.entries(scope).map(([name, value]) => [name, toMaps(value)])
    );
    return declared(repaired).evaluate(expression, repaired);
  }
};
