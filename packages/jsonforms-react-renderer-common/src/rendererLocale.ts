import { I18nKey, i18nDefaults } from './i18nDefaults';
import { bgRendererLocale } from './locale/bg';

/**
 * Synchronous catalogs for shared renderer messages. Each UI library owns its
 * component locale separately. Hosts can replace these catalogs at startup
 * with setRendererLocales or register individual languages.
 */
export type RendererLocaleCatalog = Partial<Record<I18nKey, string>>;

/**
 * The languages this build carries.
 *
 * `en` is present and empty on purpose: English *is* `i18nDefaults`, and an
 * entry saying so keeps "is this language supported" a question about this
 * map rather than a special case.
 *
 * Normalized locale tags match by region, then language: `bg-BG`, `bg_BG` and `bg` all
 * reach the same entry.
 */
export const defaultRendererLocales: Record<string, RendererLocaleCatalog> = {
  en: {},
  bg: bgRendererLocale,
};

let catalogs: Record<string, RendererLocaleCatalog> = defaultRendererLocales;

/** Replaces the supported set wholesale. */
export const setRendererLocales = (
  next: Record<string, RendererLocaleCatalog>
): void => {
  catalogs = next;
};

export const getRendererLocales = (): Record<string, RendererLocaleCatalog> =>
  catalogs;

/** Lower-cased, `_` as `-`, to match catalog keys. */
const normalize = (locale: string) => locale.toLowerCase().replace(/_/g, '-');

/** Adds or replaces one language, leaving the others alone. */
export const registerRendererLocale = (
  locale: string,
  catalog: RendererLocaleCatalog
): void => {
  catalogs = { ...catalogs, [normalize(locale)]: catalog };
};

/**
 * The catalog for a locale, falling back to its language.
 *
 * `de-AT` uses the `de` bundle when no `de-AT` one is registered, which is
 * what a regional tag wants: the alternative is reverting to English over a
 * region nobody translated separately.
 */
export const resolveRendererLocale = (
  locale: string | undefined
): RendererLocaleCatalog | undefined => {
  if (!locale) return undefined;
  const code = normalize(locale);
  return catalogs[code] ?? catalogs[code.split('-')[0]];
};

/**
 * What a key reads as before the form's own catalog is consulted.
 *
 * Handed to the translator as its *default message*, so precedence falls out
 * of JSON Forms' own contract rather than being re-implemented here: the
 * form's catalog wins where it has the key, the locale bundle answers where it
 * does not, and English is what is left.
 */
export const rendererDefault = (
  locale: string | undefined,
  key: I18nKey
): string => resolveRendererLocale(locale)?.[key] ?? i18nDefaults[key];
