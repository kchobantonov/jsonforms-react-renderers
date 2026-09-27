import { ExampleDescription } from '@jsonforms/examples';
import { Translator, createTranslator } from '@jsonforms/core';

/** A `translations.json`: every locale in one object, keyed by locale code. */
export type TranslationCatalogs = Record<string, Record<string, string>>;

/**
 * An example that carries its raw catalogs alongside the `i18n` state.
 *
 * JSON Forms' `i18n` holds a `translate` **function**, which is neither
 * serializable nor locale-aware: `Translator` is `(id, defaultMessage, values)`
 * and receives no locale. Keeping the catalogs beside it lets the demo show
 * them in the Internationalization editor and rebuild `translate` when the
 * locale changes.
 */
export type ExampleWithTranslations = ExampleDescription & {
  translations?: TranslationCatalogs;
};

/**
 * Fills `{name}` placeholders from the translation context.
 *
 * Core passes `{ error }` when translating a validation message, and ajv puts
 * the interesting numbers in `error.params` - `limit` for `minimum`,
 * `multipleOf` for `multipleOf`, and so on. Core does no interpolation itself:
 * the specification is explicit that "interpolation syntax belongs to the
 * translator, not JSON Forms core", so a catalog entry like
 * "Enter a value of at least {limit}." renders literally unless the translator
 * substitutes.
 *
 * An unknown placeholder is left in place rather than blanked, so a wrong
 * parameter name is visible instead of silently producing a gap.
 */
const interpolate = (message: string, values: unknown): string => {
  const context = values as
    | { error?: { params?: Record<string, unknown> } }
    | undefined;
  const params = context?.error?.params;
  const direct = values as Record<string, unknown> | undefined;
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = direct?.[name] ?? params?.[name];
    return value === undefined ? placeholder : String(value);
  });
};

/**
 * Builds a translator over one locale's catalog.
 *
 * Returning the supplied fallback for a miss matters: returning the key would
 * stop core's error-translation lookup chain early.
 */
export const translatorFor = (
  catalogs: TranslationCatalogs,
  locale: string
): Translator =>
  createTranslator((id, defaultMessage, values) => {
    const messages = catalogs[locale] ?? {};
    const message = messages[id];
    return message === undefined
      ? defaultMessage
      : interpolate(message, values);
  });

/** The catalogs an example carries, if any. */
export const exampleTranslations = (
  example: ExampleDescription | undefined
): TranslationCatalogs | undefined => {
  const catalogs = (example as ExampleWithTranslations | undefined)
    ?.translations;
  return catalogs && typeof catalogs === 'object' ? catalogs : undefined;
};

/**
 * What the Internationalization editor shows.
 *
 * With catalogs, the `translations.json` document verbatim - the locales keyed
 * by code, nothing wrapped around them. Which locale is active comes from the
 * demo's locale switcher, not from this document.
 *
 * Without catalogs, the example's `i18n` as before - which for a function-only
 * `translate` serializes to just its locale, since JSON cannot represent the
 * function.
 */
export const i18nEditorValue = (
  example: ExampleDescription | undefined
): unknown => exampleTranslations(example) ?? example?.i18n;

/**
 * Reads an edited Internationalization document as catalogs.
 *
 * Returns undefined when the document is not that shape - for example a legacy
 * `{ "locale": "en" }` - so the caller can fall back rather than silently
 * treating a locale string as a catalog.
 */
export const asTranslationCatalogs = (
  value: unknown
): TranslationCatalogs | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const entries = Object.values(value as Record<string, unknown>);
  const isCatalog = (entry: unknown) =>
    Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry);
  return entries.length > 0 && entries.every(isCatalog)
    ? (value as TranslationCatalogs)
    : undefined;
};
