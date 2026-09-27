import type Ajv from 'ajv';
import keywords from 'ajv-keywords';
import dynamicDefaults from 'ajv-keywords/dist/definitions/dynamicDefaults';
import transform from './transform';
import {
  dateOffset,
  dateUnit,
  datetimeOffset,
  makeDynamic,
  searchParams,
  timeOffset,
} from './dynamicDefaults';

/**
 * `ajv-keywords`, plus the extensions the Vue 2 `common` package added.
 *
 * Two of the three registrations here are **global mutations of the
 * `ajv-keywords` module**, not of the Ajv instance: `dynamicDefaults.DEFAULTS`
 * is a module-level table, so a generator registered for one validator is
 * registered for every validator in the process. That is how the original
 * works and it cannot be made per-instance without forking the plugin, so it
 * is written down rather than hidden - and it is why {@link registerAjvKeywords}
 * is idempotent instead of assuming it runs once.
 */

export interface AjvKeywordOptions {
  /**
   * Whether the `dynamic` default - which compiles a function from the schema
   * - is permitted. Read when a schema compiles, so one validator can answer
   * differently for different forms.
   *
   * Off by default. Section 14: "String evaluation requires
   * `jsonformsExtended.security.allowScriptEvaluation=true`."
   */
  allowScriptEvaluation?: () => boolean;
}

export const registerAjvKeywords = (
  ajv: Ajv,
  options: AjvKeywordOptions = {}
): Ajv => {
  keywords(ajv);

  /*
    `ajv-keywords`' own `transform` has a fixed transformation table with no
    registration hook, so adding `capitalize` and `startCase` means replacing
    the keyword outright. Removing first, because `addKeyword` on an existing
    keyword throws.
  */
  if (ajv.getKeyword('transform')) {
    ajv.removeKeyword('transform');
  }
  ajv.addKeyword(transform());

  const defaults = dynamicDefaults.DEFAULTS as Record<string, unknown>;
  defaults.dynamic = makeDynamic(
    options.allowScriptEvaluation ?? (() => false)
  );
  defaults.searchParams = searchParams;
  /*
    These three **replace** `ajv-keywords`' own `datetime`, `date` and `time`,
    which take no arguments. The replacements accept an offset, and with no
    arguments behave as the originals did.
  */
  defaults.datetime = datetimeOffset;
  defaults.date = dateOffset;
  defaults.time = timeOffset;
  defaults.dateUnit = dateUnit;

  return ajv;
};
