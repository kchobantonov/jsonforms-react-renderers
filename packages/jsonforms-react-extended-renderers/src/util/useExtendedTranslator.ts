import { useJsonForms } from '@jsonforms/react';
import { ExtendedI18nKey } from './i18nDefaults';
import { extendedDefault } from './extendedLocale';

/**
 * Translates this package's own strings, and substitutes {name} placeholders.
 *
 * Three sources, in order: the form's own catalog, the locale bundle
 * registered for the current locale, then English. The bundle's string is
 * passed as the translator's *default message*, which is what puts the form's
 * catalog first - see `extendedLocale.ts`.
 */
export const useExtendedTranslator = () => {
  const ctx = useJsonForms();
  const translate = ctx.i18n?.translate;
  const locale = ctx.i18n?.locale;
  return (key: ExtendedI18nKey, values?: Record<string, unknown>): string => {
    const fallback = extendedDefault(locale, key);
    const message = translate ? translate(key, fallback, values) : fallback;
    return Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      message ?? fallback
    );
  };
};
