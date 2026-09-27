import localize from 'ajv-i18n/localize';
import { AjvLocalizers, localizeBg } from './index';

/**
 * Every language `ajv-i18n` ships, plus Bulgarian.
 *
 * **In a module of its own, deliberately.** `ajv-i18n/localize` re-exports
 * around twenty locales, and importing it costs that whether or not the form
 * has a translator. Keeping it out of `createFormsAjv`'s import graph means a
 * form that does not localize validator messages does not pay for the ability:
 *
 * ```ts
 * import { createFormsAjv } from '@chobantonov/jsonforms-react-extended-renderers';
 * import { ajvLocalizers } from '@chobantonov/jsonforms-react-extended-renderers/localizers';
 *
 * createFormsAjv({ i18n: () => i18nState, localizers: ajvLocalizers });
 * ```
 *
 * A host that ships two languages can pass `{ en: ajvLocalizers.en, bg: localizeBg }`
 * instead and carry neither the rest nor this module.
 */
export const ajvLocalizers: AjvLocalizers = {
  ...(localize as unknown as AjvLocalizers),
  bg: localizeBg,
};
