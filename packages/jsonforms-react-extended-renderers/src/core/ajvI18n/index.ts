import type { ErrorTranslator, JsonFormsI18nState } from '@jsonforms/core';
import type Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { defaultErrorTranslator } from '@jsonforms/core';
import { localize_bg } from './bg';

/**
 * Localized validator messages, and `errorMessage` unwrapping.
 *
 * Two jobs that have to happen together, because both rewrite `errors` after
 * a validation and each would undo the other if they ran separately:
 *
 * 1. **Translate Ajv's own messages** through `ajv-i18n`, so `must be >= 5`
 *    arrives in the form's language.
 * 2. **Unwrap `ajv-errors`.** When a schema carries `errorMessage`, ajv-errors
 *    replaces the failures it covers with a single `errorMessage` error and
 *    marks the originals `emUsed`. Left alone, that collapses several
 *    per-property errors into one at the object's path - and JSON Forms maps
 *    errors to controls **by path**, so the fields stop showing them. Unwrapping
 *    restores the original errors and puts the schema's message on each.
 *
 * ## How this differs from the Vue 2 original
 *
 * The original takes a Vue `Ref` and sets each unwrapped message to a
 * `computed()`, relying on the template to unwrap it on read. That is not
 * portable: a JSON Forms `ErrorObject.message` is a `string`, and anything
 * else reaches React as an object and renders as `[object Object]`.
 *
 * Here the translator is a **getter**, called at validation time, and the
 * message is a plain string. The practical difference is when the message is
 * resolved - on validation rather than on render - so a locale change has to
 * revalidate to retranslate. JSON Forms already revalidates on an i18n change,
 * so this costs nothing in the normal case and removes a Vue dependency from
 * the contract.
 */

/** Ajv's localizers, keyed by language: what `ajv-i18n/localize` exports. */
export type AjvLocalizers = Record<
  string,
  ((errors: unknown) => void) | undefined
>;

export interface AjvI18nOptions {
  /**
   * The current i18n state, read at validation time.
   *
   * A getter rather than a value because one Ajv instance outlives many
   * locales; capturing the state would freeze the first one.
   */
  i18n?: () => JsonFormsI18nState | undefined;
  /**
   * Ajv's own message localizers.
   *
   * Supplied by the caller, and **not** imported here on purpose: importing
   * `ajv-i18n/localize` pulls every language it ships into the bundle whether
   * the form has a translator or not. `ajvLocalizers` in `./localizers` is the
   * one-line way to ask for all of them.
   */
  localizers?: AjvLocalizers;
}

/**
 * Bulgarian, which `ajv-i18n` does not ship.
 *
 * Upstream PR ajv-validator/ajv-i18n#312 has not landed. The `required`
 * message is overridden after the base localizer runs, because the shipped
 * form interpolates `missingProperty` - an untranslated property name - into
 * the sentence.
 */
export const localizeBg: NonNullable<AjvLocalizers[string]> = (errors) => {
  const list = errors as ErrorObject[] | undefined;
  if (!list?.length) {
    return;
  }
  localize_bg(list);
  for (const error of list) {
    if (error.keyword === 'required') {
      error.message = 'полето е задължително';
    }
  }
};

/** The localizer for a locale, falling back from `bg-BG` to `bg`. */
const localizerFor = (
  localizers: AjvLocalizers,
  locale: string | undefined
): AjvLocalizers[string] => {
  if (!locale) {
    return undefined;
  }
  return localizers[locale] ?? localizers[locale.split('-')[0]];
};

/**
 * Expands `ajv-errors` wrappers back into the errors they replaced.
 *
 * Each recovered error keeps its own `instancePath`, so it still reaches the
 * control it belongs to, and takes the schema's message. That message is run
 * through the form's translator under `error.errorMessage.<message>`, so a
 * schema can carry a key rather than a sentence; a message that resolves to
 * nothing is used literally, which is the same rule the rest of this renderer
 * set applies to labels.
 */
export const unwrapErrorMessageErrors = (
  errors: ErrorObject[] | null | undefined,
  i18n?: () => JsonFormsI18nState | undefined
): ErrorObject[] => {
  if (!errors?.length) {
    return errors ?? [];
  }
  const translate = i18n?.()?.translate;
  return errors
    .filter((error) => (error as { emUsed?: boolean }).emUsed !== true)
    .flatMap((error) => {
      const covered = (error.params as { errors?: ErrorObject[] } | undefined)
        ?.errors;
      if (error.keyword !== 'errorMessage' || !Array.isArray(covered)) {
        return error;
      }
      const message = error.message;
      const translated =
        translate && message
          ? translate(schemaMessageKey(message), message)
          : message;
      /*
        Marked so the render-time translator leaves them alone: the message is
        the schema author's, and a localizer would regenerate Ajv's own
        wording for the keyword they replaced.
      */
      return covered.map((inner) => ({
        ...inner,
        message: translated,
        [SCHEMA_MESSAGE]: message,
      })) as ErrorObject[];
    });
};

/**
 * Carries the **untranslated** message a schema's `errorMessage` supplied.
 *
 * Two things need it. A host using only the validation-time path reads
 * `error.message`, which is already translated. A host using
 * {@link createAjvErrorTranslator} needs the original key, because the locale
 * may have changed since the validation that produced the error and core does
 * not revalidate when it does.
 *
 * A `Symbol.for`, so it survives the error being copied between module
 * instances - the same reasoning as `ElementRender`.
 */
export const SCHEMA_MESSAGE = Symbol.for('jsonforms.ajv.schemaMessage');

/** The catalog key a schema-authored message is looked up under. */
export const schemaMessageKey = (message: string) =>
  `error.errorMessage.${message}`;

/**
 * Localizes an error **when it is rendered**, which is core's own hook for it.
 *
 * Prefer this to the `localizers` option below wherever the form can change
 * language without the data changing. The difference is when the message is
 * produced:
 *
 * | | Produced | A locale change |
 * | --- | --- | --- |
 * | `createFormsAjv({ localizers })` | at **validation** | shows the old language until something revalidates |
 * | this, as `i18n.translateError` | at **render** | takes effect immediately |
 *
 * That second row is not a detail. JSON Forms does **not** revalidate when the
 * locale changes - verified - so a form whose data is untouched goes on
 * displaying the previous language. The validation-time path exists because
 * the Vue 2 original works that way and it needs no extra wiring; this is the
 * one to reach for when the switch has to be visible.
 *
 * The two are safe together: `ajv-i18n` regenerates a message from the error's
 * `keyword` and `params` rather than editing the existing text, so localizing
 * twice is idempotent.
 */
export const createAjvErrorTranslator = (
  localizers: AjvLocalizers,
  getLocale: () => string | undefined
): ErrorTranslator => {
  return (error, translate, uischema) => {
    /*
      The schema's own message. Re-translated here rather than reused, because
      `error.message` was translated at validation time and the locale may
      have moved since - which is the whole reason this hook is preferred.
      It is never handed to a localizer: the author has already replaced Ajv's
      wording for that keyword.
    */
    const authored = (error as unknown as Record<symbol, unknown>)[
      SCHEMA_MESSAGE
    ];
    if (typeof authored === 'string') {
      return translate(schemaMessageKey(authored), authored) ?? authored;
    }
    const localize = localizerFor(localizers, getLocale());
    if (!localize) {
      return defaultErrorTranslator(error, translate, uischema);
    }
    /*
      On a copy: the error objects live in the JSON Forms store, and localizing
      in place would rewrite state during a render and leave the message stuck
      in whichever language rendered first.
    */
    const copy = { ...error } as ErrorObject;
    localize([copy]);
    return copy.message ?? defaultErrorTranslator(error, translate, uischema);
  };
};

/**
 * Wraps `ajv.compile` so every validation's errors are localized and unwrapped.
 *
 * Ajv exposes no hook after validation, so the compiled function is wrapped.
 * The wrapper copies `errors` back onto itself after each call because callers
 * - JSON Forms among them - read `validate.errors`, not the return value.
 */
export const ajvTranslations = (
  ajv: Ajv,
  options: AjvI18nOptions = {}
): Ajv => {
  const localizers = options.localizers;
  const compile = ajv.compile.bind(ajv) as Ajv['compile'];

  const wrapped = ((...args: Parameters<Ajv['compile']>) => {
    const validate = compile(...args) as ValidateFunction;

    const wrapper = ((...data: unknown[]) => {
      const valid = (validate as (...d: unknown[]) => boolean)(...data);
      /*
        Copied every call, not once: Ajv sets `errors`, `evaluated` and friends
        on the compiled function itself, and a caller reads them from whatever
        it was handed - which is this wrapper.
      */
      Object.assign(wrapper, validate);
      if (!valid && validate.errors) {
        const localize = localizers
          ? localizerFor(localizers, options.i18n?.()?.locale)
          : undefined;
        if (localize) {
          /*
            `errorMessage` errors are excluded: their text comes from the
            schema, and a localizer would overwrite it with Ajv's own wording
            for a keyword the author has already replaced.
          */
          localize(
            validate.errors.filter((error) => error.keyword !== 'errorMessage')
          );
        }
        wrapper.errors = unwrapErrorMessageErrors(
          validate.errors,
          options.i18n
        );
      } else {
        wrapper.errors = validate.errors;
      }
      return valid;
    }) as ValidateFunction;

    Object.assign(wrapper, validate);
    return wrapper;
  }) as Ajv['compile'];

  ajv.compile = wrapped;
  return ajv;
};
