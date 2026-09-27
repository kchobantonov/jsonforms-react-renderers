import {
  ExampleDescription,
  getExamples,
  registerExamples,
} from '@jsonforms/examples';
import { ExampleWithTranslations } from '../i18nCatalogs';

/**
 * `@jsonforms/examples` keeps one flat registry keyed by `name`, and the
 * official Eclipse examples put themselves into it as soon as the package is
 * imported. Ours land in the same registry, so without a marker the two are
 * indistinguishable once registered.
 *
 * Every example this package owns therefore registers through
 * `registerProjectExamples`, which records the name. Anything registered
 * without that marker is an official example, whatever the import order
 * happened to be - relying on "ours are imported last" would break silently
 * the first time someone reorders an import.
 */
const projectExampleNames = new Set<string>();

/** Prefix applied to an official example's `name`, which is also its URL hash. */
export const OFFICIAL_EXAMPLE_NAME_PREFIX = 'jsonforms-';

/** Prefix applied to an official example's visible label. */
export const OFFICIAL_EXAMPLE_LABEL_PREFIX = 'JsonForms: ';

/**
 * Registers examples owned by this project, marking them as ours.
 *
 * Accepts the raw `translations` catalogs alongside `i18n`, so an example can
 * drive the demo's locale switcher and its Internationalization editor without
 * going through the spec-example registry.
 */
export const registerProjectExamples = (
  examples: ExampleWithTranslations[]
): void => {
  examples.forEach((example) => projectExampleNames.add(example.name));
  registerExamples(examples);
};

export const isProjectExample = (name: string): boolean =>
  projectExampleNames.has(name);

/**
 * Names of the prefixed copies registered below.
 *
 * Deliberately a set rather than a `name.startsWith(prefix)` test: a name
 * cannot tell us who created it. Upstream is free to ship an example called
 * `jsonforms-foo`, and treating that as "already prefixed" would leave it
 * unlabelled and let the copy of upstream's `foo` overwrite it.
 */
const prefixedOfficialNames = new Set<string>();

export const isPrefixedOfficialExample = (name: string): boolean =>
  prefixedOfficialNames.has(name);

let prefixed = false;

/**
 * Re-registers every official example under a prefixed name and label, so the
 * demo's example list shows at a glance which entries come from upstream.
 *
 * Call this once, after all example modules have been imported. Repeat calls
 * are a no-op; the guard is the flag below, not a check on the names.
 *
 * Every example that is not ours is prefixed, including one upstream already
 * calls `jsonforms-something` - that becomes `jsonforms-jsonforms-something`.
 * Prefixing is injective, so two copies can never collide with each other.
 *
 * The registry has no unregister function, so the original unprefixed entries
 * stay behind; `listExamples` filters them out rather than showing each
 * official example twice. A copy may overwrite an original that happened to
 * occupy its name, which costs nothing: that original has a copy of its own
 * under the double prefix, and originals are not listed.
 */
export const registerOfficialExamplesWithPrefix = (): void => {
  if (prefixed) {
    return;
  }
  prefixed = true;

  const copies = getExamples()
    .filter((example) => !isProjectExample(example.name))
    .map((example) => ({
      ...example,
      name: `${OFFICIAL_EXAMPLE_NAME_PREFIX}${example.name}`,
      label: `${OFFICIAL_EXAMPLE_LABEL_PREFIX}${example.label}`,
    }));

  copies.forEach((copy) => prefixedOfficialNames.add(copy.name));
  registerExamples(copies);
};

/**
 * The examples the demo shows: this project's, plus the prefixed copies of the
 * official ones. `getExamples` sorts by label, so the `JsonForms: ` entries
 * group together.
 */
export const listExamples = (): ExampleDescription[] => {
  registerOfficialExamplesWithPrefix();
  return getExamples().filter(
    (example) =>
      isProjectExample(example.name) || isPrefixedOfficialExample(example.name)
  );
};
