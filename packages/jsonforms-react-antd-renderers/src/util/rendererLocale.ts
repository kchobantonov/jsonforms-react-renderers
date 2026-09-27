import { I18nKey, i18nDefaults } from './i18nDefaults';
import { bgRendererLocale } from '../locale/bg';
import { deRendererLocale } from '../locale/de';

/**
 * Locale bundles for the renderer set's **own** strings.
 *
 * `./locale.ts` already teaches antd which language it is in, so a calendar's
 * month names follow `i18n.locale`. The strings *this package* owns did not:
 * `i18nDefaults` is one table of English, so "Clear value", the duration
 * units, the composite dialog's buttons and the rest stayed English unless the
 * form's own catalog happened to carry all 93 keys. This closes that gap, and
 * is the direct counterpart of `defaultAntdLocaleLoaders`.
 *
 * ## Why these are plain objects and not loaders
 *
 * The antd chrome is fetched through `import()` because antd ships 75 locales
 * and dayjs 143 - importing them statically to use one is indefensible. Here
 * the whole bundle is under a hundred short strings, and the strings are on
 * screen the moment a control renders rather than when a calendar is opened:
 * an async load would show English and then swap it out in front of the user.
 * So the lookup is synchronous, and the shipped languages are in the bundle.
 *
 * A build that wants fewer, or more, replaces the map with
 * {@link setRendererLocales} at startup.
 */
export type RendererLocaleCatalog = Partial<Record<I18nKey, string>>;

/**
 * The languages this build carries.
 *
 * `en` is present and empty on purpose: English *is* `i18nDefaults`, and an
 * entry saying so keeps "is this language supported" a question about this
 * map rather than a special case.
 *
 * Keyed and matched like {@link localeKey} - `bg-BG`, `bg_BG` and `bg` all
 * reach the same entry.
 */
export const defaultRendererLocales: Record<string, RendererLocaleCatalog> = {
  en: {},
  bg: bgRendererLocale,
  de: deRendererLocale,
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

/** Lower-cased, `_` as `-`, to match how the loaders above are keyed. */
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
