import { createAjv as createDefaultAjv } from '@jsonforms/core';
import type { JsonFormsI18nState } from '@jsonforms/core';
import ajvErrors from 'ajv-errors';
import { AjvLocalizers, ajvTranslations } from './ajvI18n';
import { registerAjvKeywords } from './keywords';
import { cronProblem } from '../util/cron';

/*
  Types taken from core's own factory rather than from `ajv` directly. `ajv` is
  not a dependency here - upstream resolves it by root hoisting - so importing
  it even for types makes the package build depend on that hoisting holding.
*/
type Ajv = ReturnType<typeof createDefaultAjv>;
type Options = NonNullable<Parameters<typeof createDefaultAjv>[0]>;

/**
 * The validator this renderer set is written against.
 *
 * JSON Forms' own `createAjv()` is deliberately plain, and three of the things
 * it leaves off are things forms here rely on. The Svelte renderer family
 * makes the same three choices, which is a useful check that this is the
 * shape of validator these renderers expect rather than a local preference.
 *
 * | Option | Why |
 * | --- | --- |
 * | `$data: true` | Without it a `$data` bound does not merely go unenforced - the schema **fails to compile**, and the whole form stops. See below. |
 * | `useDefaults: true` | A schema `default` is written into the data, which several renderers assume when they say a value "is" its default. |
 * | `discriminator: true` | Lets a discriminated `oneOf` report the branch's own errors instead of every branch's. |
 *
 * **`$data` is the one that bites.** Ajv rejects `{"formatMinimum": {"$data": "1/from"}}`
 * at compile time with `formatMinimum value must be ["string"]` unless the
 * option is set, so a date range written the obvious way takes the form down
 * rather than degrading. That is why this factory exists at all, and why the
 * web component uses it by default.
 */
export interface FormsAjvOptions extends Options {
  /** Extra formats to register, as `{ name: predicate }`. */
  formats?: Record<string, (value: string) => boolean>;
  /**
   * `ajv-keywords`, the extended `transform`, and the extra dynamic defaults.
   *
   * Not spelled `keywords`: Ajv already has an option by that name, which
   * takes a `Vocabulary`. Two different things called the same thing in one
   * options object is how a `true` ends up where a vocabulary was expected.
   *
   * On by default, and the reason is that **turning them off fails silently**.
   * JSON Forms' factory sets `strictSchema: false`, so Ajv ignores a keyword
   * it does not know: a schema carrying `transform` or `allRequired` compiles
   * without complaint, validates less than it says, and leaves the data
   * untransformed. Nothing throws and nothing is logged. These are what the
   * Vue 2 forms in this organisation are already authored against, so the
   * default has to be on.
   */
  extendedKeywords?: boolean;
  /**
   * `ajv-errors`, so a schema can carry its own `errorMessage`.
   *
   * On by default. Requires `allErrors`, which this factory therefore turns on
   * with it - see below.
   */
  errorMessages?: boolean;
  /**
   * Permits the `dynamic` dynamic default, which compiles a function from the
   * schema. Off by default; section 14 requires the permission.
   *
   * **A getter is accepted, and is usually what you want.** Everywhere else in
   * this project the permission comes from a *form's*
   * `config.jsonformsExtended.security.allowScriptEvaluation`, but a validator
   * is created once and shared by every form it validates - Ajv caches
   * compiled schemas, so building one per form would recompile on every
   * keystroke. A getter lets the one validator answer per form, the same way
   * `i18n` lets it answer per locale.
   *
   * It is read when a schema **compiles**, not when it validates, because that
   * is when `dynamicDefaults` generators are built.
   */
  allowScriptEvaluation?: boolean | (() => boolean);
  /**
   * The form's i18n state, read at validation time.
   *
   * Supplying it turns on `errorMessage` translation. Ajv's **own** messages
   * are localized only if `localizers` is supplied as well.
   */
  i18n?: () => JsonFormsI18nState | undefined;
  /**
   * Ajv's message localizers - `ajvLocalizers` from
   * `core/ajvI18n/localizers`, or a subset.
   */
  localizers?: AjvLocalizers;
}

/** `color` is not a JSON Schema format and `ajv-formats` does not define one. */
const COLOR =
  /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(.*\)|hsla?\(.*\)|hsb\(.*\)|transparent)$/i;

export const createFormsAjv = (options: FormsAjvOptions = {}): Ajv => {
  const {
    formats,
    extendedKeywords = true,
    errorMessages = true,
    allowScriptEvaluation = false,
    i18n,
    localizers,
    ...ajvOptions
  } = options;

  const ajv = createDefaultAjv({
    useDefaults: true,
    $data: true,
    discriminator: true,
    /*
      `ajv-errors` requires `allErrors`, and throws at plugin time without it.
      Turning it on here rather than asking every caller to remember is also
      what a form wants: JSON Forms shows every field's error at once, so
      stopping at the first failure would leave most of the form silent.

      A caller may still override it; `ajv-errors` is then skipped rather than
      allowed to throw.
    */
    ...(errorMessages ? { allErrors: true } : {}),
    ...ajvOptions,
  });

  ajv.addFormat('color', {
    type: 'string',
    validate: (value: string) => COLOR.test(value),
  });

  /*
    `cron` is not a JSON Schema format keyword, and without this the schema
    route selects the control and validates nothing - `format: "cron"` would be
    ignored with a warning, leaving a five-field expression to be reported by
    the renderer alone. Six fields, seconds first; see `util/cron.ts` for why
    the dialect has to be stated rather than guessed.
  */
  ajv.addFormat('cron', {
    type: 'string',
    validate: (value: string) => cronProblem(value) === undefined,
  });

  for (const [name, validate] of Object.entries(formats ?? {})) {
    ajv.addFormat(name, { type: 'string', validate });
  }

  if (extendedKeywords) {
    registerAjvKeywords(ajv as never, {
      allowScriptEvaluation:
        typeof allowScriptEvaluation === 'function'
          ? allowScriptEvaluation
          : () => allowScriptEvaluation === true,
    });
  }

  if (errorMessages) {
    if ((ajv as { opts?: { allErrors?: boolean } }).opts?.allErrors) {
      ajvErrors(ajv as never);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        'ajv.errorMessagesNeedAllErrors: `errorMessage` support was requested ' +
          'but `allErrors` is off, which ajv-errors requires. Schema-authored ' +
          'messages will not be applied.'
      );
    }
  }

  /*
    Last, because it wraps `ajv.compile`: anything registering keywords after
    this point would still work, but a second wrap would nest the error
    rewriting and unwrap an already-unwrapped list.
  */
  if (i18n || localizers) {
    ajvTranslations(ajv as never, { i18n, localizers });
  }

  return ajv;
};
