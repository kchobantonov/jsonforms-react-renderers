import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Locale } from 'antd/es/locale';

/**
 * Teaching antd which language it is in.
 *
 * JSON Forms carries a locale (`i18n.locale`) and translates the strings the
 * *renderers* own. It says nothing to antd, which owns a second set of strings
 * nobody authored here: the month and weekday names in a calendar, "Today",
 * "OK", a select's empty text, a table's sort tooltips. Without this they stay
 * English however the form is configured, which looks like a translation gap
 * in the form rather than a missing setting.
 *
 * dayjs has to be told separately, because antd's locale supplies the widget
 * chrome while dayjs supplies the formatted date itself.
 *
 * ## Why loaders rather than imports
 *
 * antd ships 75 locales and dayjs 143. Importing them statically puts every
 * one in the bundle to use at most one, so each entry here is a **loader**: a
 * function whose `import()` the bundler turns into its own chunk, fetched only
 * if that locale is asked for.
 *
 * The specifiers are deliberately literal. A computed `import(path)` cannot be
 * analysed statically, and a bundler answers that by emitting either nothing
 * or all 75 - so the list below *is* the build-time selection of supported
 * locales, and adding one means adding a line.
 */

/**
 * A loaded locale: antd's chrome, plus the name dayjs knows it by.
 *
 * The dayjs name is carried rather than applied by the loader, because
 * `dayjs.locale()` is global state and has to be set **every time this locale
 * becomes the active one** - not only the first time it is fetched. Applying
 * it inside the loader looked right and left the last-loaded language in
 * charge, so switching back to an already-cached one formatted its dates in
 * the wrong language.
 */
export interface LoadedLocale {
  antd: Locale;
  dayjsName: string;
}

export type AntdLocaleLoader = () => Promise<LoadedLocale>;

/** Both halves of a locale: the widget chrome, and the date formatting. */
const entry =
  (
    antd: () => Promise<{ default: Locale }>,
    day: () => Promise<unknown>,
    dayjsName: string
  ): AntdLocaleLoader =>
  async () => {
    const [locale] = await Promise.all([antd(), day()]);
    return { antd: locale.default, dayjsName };
  };

/**
 * The locales this build includes.
 *
 * Keyed by language tag, matched case-insensitively and by language alone -
 * `bg-BG`, `bg_BG` and `bg` all reach the same entry - so a host that carries
 * a regional tag does not have to normalise it first.
 *
 * Replace or extend it with {@link setAntdLocaleLoaders} at startup; the key
 * is what `i18n.locale` will hold.
 */
export const defaultAntdLocaleLoaders: Record<string, AntdLocaleLoader> = {
  en: entry(
    () => import('antd/locale/en_US'),
    () => import('dayjs/locale/en'),
    'en'
  ),
  bg: entry(
    () => import('antd/locale/bg_BG'),
    () => import('dayjs/locale/bg'),
    'bg'
  ),
  de: entry(
    () => import('antd/locale/de_DE'),
    () => import('dayjs/locale/de'),
    'de'
  ),
  es: entry(
    () => import('antd/locale/es_ES'),
    () => import('dayjs/locale/es'),
    'es'
  ),
  fr: entry(
    () => import('antd/locale/fr_FR'),
    () => import('dayjs/locale/fr'),
    'fr'
  ),
  it: entry(
    () => import('antd/locale/it_IT'),
    () => import('dayjs/locale/it'),
    'it'
  ),
  ja: entry(
    () => import('antd/locale/ja_JP'),
    () => import('dayjs/locale/ja'),
    'ja'
  ),
  nl: entry(
    () => import('antd/locale/nl_NL'),
    () => import('dayjs/locale/nl'),
    'nl'
  ),
  pl: entry(
    () => import('antd/locale/pl_PL'),
    () => import('dayjs/locale/pl'),
    'pl'
  ),
  pt: entry(
    () => import('antd/locale/pt_PT'),
    () => import('dayjs/locale/pt'),
    'pt'
  ),
  ru: entry(
    () => import('antd/locale/ru_RU'),
    () => import('dayjs/locale/ru'),
    'ru'
  ),
  tr: entry(
    () => import('antd/locale/tr_TR'),
    () => import('dayjs/locale/tr'),
    'tr'
  ),
  uk: entry(
    () => import('antd/locale/uk_UA'),
    () => import('dayjs/locale/uk'),
    'uk'
  ),
  zh: entry(
    () => import('antd/locale/zh_CN'),
    () => import('dayjs/locale/zh-cn'),
    'zh-cn'
  ),
};

let loaders: Record<string, AntdLocaleLoader> = defaultAntdLocaleLoaders;

/**
 * Replaces the supported set, for a build that wants fewer chunks or more
 * languages than the list above.
 */
export const setAntdLocaleLoaders = (
  next: Record<string, AntdLocaleLoader>
): void => {
  loaders = next;
};

export const getAntdLocaleLoaders = (): Record<string, AntdLocaleLoader> =>
  loaders;

/** `bg-BG` and `bg_BG` both mean `bg`, and case never matters. */
export const localeKey = (locale: string | undefined): string | undefined => {
  if (!locale) {
    return undefined;
  }
  const lower = locale.toLowerCase().replace(/_/g, '-');
  return loaders[lower] ? lower : lower.split('-')[0];
};

const cache = new Map<string, LoadedLocale>();

/** Applying a locale is two things, and dayjs is global. */
const apply = (loaded: LoadedLocale): Locale => {
  dayjs.locale(loaded.dayjsName);
  return loaded.antd;
};

/**
 * Resolves the antd locale for a language tag, loading it on first use.
 *
 * Returns `undefined` until it arrives and for a tag this build does not
 * carry, which is what antd's own default handles - English chrome is a
 * better answer than a form that will not render.
 */
export const useAntdLocale = (
  locale: string | undefined
): Locale | undefined => {
  const key = localeKey(locale);
  const [resolved, setResolved] = useState<Locale | undefined>(undefined);

  useEffect(() => {
    if (!key) {
      setResolved(undefined);
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      // Re-applied, not just re-read: another locale may have been the last
      // one to set dayjs.
      setResolved(apply(cached));
      return;
    }
    const load = loaders[key];
    if (!load) {
      setResolved(undefined);
      return;
    }
    let live = true;
    load()
      .then((value) => {
        cache.set(key, value);
        if (live) {
          setResolved(apply(value));
        }
      })
      .catch(() => {
        // A missing chunk must not take the form down; antd falls back to its
        // own default, which is English.
        if (live) {
          setResolved(undefined);
        }
      });
    return () => {
      live = false;
    };
  }, [key]);

  return resolved;
};
