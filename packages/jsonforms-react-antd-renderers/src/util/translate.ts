import { Translator } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { useCallback, useMemo } from 'react';
import { rendererDefault } from './rendererLocale';
// `I18nKey` is declared beside the defaults it indexes, not here: re-exporting
// it from both modules makes `util/index.ts` export the name twice.
import { I18nKey } from './i18nDefaults';

/**
 * The form's translator, or a passthrough returning each default message.
 *
 * For the shared components that take a `Translator` rather than using
 * {@link useI18n} - the composite dialog and the summary helper - because they
 * are also reached from cells, which receive one as a prop.
 */
export const useTranslator = (): Translator => {
  const translate = useJsonForms().i18n?.translate;
  return useMemo(
    () => translate ?? ((_id, defaultMessage) => defaultMessage),
    [translate]
  );
};

/**
 * Translates a renderer's own strings - tooltips, dialog buttons, accessible
 * names - through the form's translator.
 *
 * Reads the translator from context rather than through `withTranslateProps`,
 * so a deeply nested component can use it without every ancestor threading a
 * `t` prop down to it.
 *
 * `{name}` placeholders are filled from `values`. Core does no interpolation
 * itself: the specification puts that on the translator, so a message like
 * "Delete {name}" renders literally unless someone substitutes.
 */
export const useI18n = () => {
  const i18n = useJsonForms().i18n;
  const translate = i18n?.translate;
  /*
    The locale bundle's string is handed to the translator as the *default
    message*, which is what orders the three sources: the form's own catalog
    answers where it has the key, the registered bundle for the current locale
    answers where it does not, and English is what is left. Without this the
    fallback was always English, so a control's built-in strings stayed in
    English however the locale moved - see `rendererLocale.ts`.
  */
  const locale = i18n?.locale;
  return useCallback(
    (key: I18nKey, values?: Record<string, unknown>): string => {
      const fallback = rendererDefault(locale, key);
      const message = translate?.(key, fallback, values) ?? fallback;
      return values === undefined
        ? message
        : message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
            values[name] === undefined ? placeholder : String(values[name])
          );
    },
    [translate, locale]
  );
};

/**
 * The locale-aware default message for one of this package's keys.
 *
 * For the components that translate through a `Translator` they were handed -
 * the cells, the composite dialog, the container indicators - rather than
 * through {@link useI18n}. They have to supply the default message themselves,
 * and reading it straight out of `i18nDefaults` supplies the **English** one,
 * which is where the locale bundle would otherwise have arrived (§6.5). The
 * string then stays English in every language whose catalog does not define
 * that key.
 *
 * Use it in place of `i18nDefaults[key]`:
 *
 * ```ts
 * const d = useI18nDefault();
 * t('file.select', d('file.select'));
 * ```
 */
export const useI18nDefault = () => {
  const locale = useJsonForms().i18n?.locale;
  return useCallback((key: I18nKey) => rendererDefault(locale, key), [locale]);
};
