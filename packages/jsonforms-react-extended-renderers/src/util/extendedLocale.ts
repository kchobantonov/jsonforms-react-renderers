import { ExtendedI18nKey, extendedI18nDefaults } from './i18nDefaults';
import { bgExtendedLocale } from '../locale/bg';

/**
 * Locale bundles for this package's **own** strings - the grid's "Add row",
 * the editor's loading and maximize labels, the colour and duration prompts.
 *
 * `extendedI18nDefaults` is one table of English, so those stayed English
 * however `i18n.locale` moved unless the form's catalog carried every key.
 * The antd package has the same mechanism (`rendererLocale.ts`) over its own
 * key space; the two are separate because neither package depends on the
 * other, and each owns the keys it draws.
 *
 * The lookup is synchronous rather than a set of `import()` loaders: these
 * strings are on screen as soon as a renderer mounts, so loading them
 * asynchronously would show English and then swap it out.
 */
export type ExtendedLocaleCatalog = Partial<Record<ExtendedI18nKey, string>>;

/** `en` is present and empty on purpose: English *is* the defaults table. */
export const defaultExtendedLocales: Record<string, ExtendedLocaleCatalog> = {
  en: {},
  bg: bgExtendedLocale,
};

let catalogs: Record<string, ExtendedLocaleCatalog> = defaultExtendedLocales;

/** Replaces the supported set wholesale. */
export const setExtendedLocales = (
  next: Record<string, ExtendedLocaleCatalog>
): void => {
  catalogs = next;
};

export const getExtendedLocales = (): Record<string, ExtendedLocaleCatalog> =>
  catalogs;

/** `bg-BG`, `bg_BG` and `bg` are one locale. */
const normalize = (locale: string) => locale.toLowerCase().replace(/_/g, '-');

/** Adds or replaces one language, leaving the others alone. */
export const registerExtendedLocale = (
  locale: string,
  catalog: ExtendedLocaleCatalog
): void => {
  catalogs = { ...catalogs, [normalize(locale)]: catalog };
};

/** The catalog for a locale, falling back to its language (`de-AT` -> `de`). */
export const resolveExtendedLocale = (
  locale: string | undefined
): ExtendedLocaleCatalog | undefined => {
  if (!locale) return undefined;
  const code = normalize(locale);
  return catalogs[code] ?? catalogs[code.split('-')[0]];
};

/**
 * What a key reads as before the form's own catalog is consulted.
 *
 * Handed to the translator as its *default message*, so the form's catalog
 * still wins where it has the key.
 */
export const extendedDefault = (
  locale: string | undefined,
  key: ExtendedI18nKey
): string => resolveExtendedLocale(locale)?.[key] ?? extendedI18nDefaults[key];
