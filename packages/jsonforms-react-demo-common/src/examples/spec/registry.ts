import { ExampleDescription } from '@jsonforms/examples';
import {
  ExampleWithTranslations,
  TranslationCatalogs,
  translatorFor,
} from '../../i18nCatalogs';
import { registerProjectExamples } from '../registry';

export type { TranslationCatalogs };
export { translatorFor };

/** Prefix applied to a spec example's `name`, which is also its URL hash. */
export const SPEC_EXAMPLE_NAME_PREFIX = 'spec-';

/** Prefix applied to a spec example's visible label. */
export const SPEC_EXAMPLE_LABEL_PREFIX = 'Spec: ';

const specExampleNames = new Set<string>();

export const isSpecExample = (name: string): boolean =>
  specExampleNames.has(name);

export type SpecExampleInput = Omit<ExampleDescription, 'name' | 'label'> & {
  /** Folder name, without the prefix. */
  id: string;
  /** Human-readable name, without the prefix. */
  label: string;
  /** Contents of `translations.json`, if the example has one. */
  translations?: TranslationCatalogs;
  /** Locale to bind the translator to. Defaults to `en`. */
  locale?: string;
};

/**
 * Registers an example that demonstrates a spec in `client/docs`.
 *
 * Prefixing name and label keeps spec examples identifiable in the demo's
 * example list, the same way official JSON Forms examples are prefixed.
 */
export const registerSpecExamples = (examples: SpecExampleInput[]): void => {
  const described = examples.map(
    ({ id, label, translations, locale = 'en', ...rest }) => {
      const name = `${SPEC_EXAMPLE_NAME_PREFIX}${id}`;
      specExampleNames.add(name);
      return {
        ...rest,
        name,
        label: `${SPEC_EXAMPLE_LABEL_PREFIX}${label}`,
        ...(translations
          ? {
              i18n: {
                locale,
                translate: translatorFor(translations, locale),
              },
              // Kept beside `i18n` so the demo can show the catalogs in its
              // Internationalization editor and rebuild `translate` when the
              // locale changes. `i18n.translate` is a function, so it
              // serializes to nothing.
              translations,
            }
          : {}),
      } as ExampleWithTranslations;
    }
  );
  registerProjectExamples(described);
};
