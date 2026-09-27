import type { Layout, UISchemaElement } from '@jsonforms/core';
import type { ExtendedUISchemaElement } from '../core/uiSchema';
import { extendedConfig } from './configNamespaces';

/**
 * Which engine renders a `TemplateLayout`, and whether it is allowed to run.
 *
 * "optional top-level `lang` selects the engine. Resolve the language from
 * explicit lang, then the configured default, then ractive for the
 * default web profile. Keep that existing config name."
 *
 * `defaultTemplateLang` is read from `config.jsonformsExtended`, with the
 * specification's flat `config.defaultTemplateLang` still honoured beneath it.
 * Adjustment 1 puts every form-wide setting in the namespace; the key keeps
 * the name the specification gives it.
 */

/** The engines this renderer set implements. */
export const TEMPLATE_LANGS = ['ractive', 'jsx'] as const;
export type TemplateLang = (typeof TEMPLATE_LANGS)[number];

/**
 * A `TemplateLayout` element.
 *
 * `lang` is **not** narrowed to {@link TemplateLang}, and that is deliberate.
 * The specification requires an unknown language to be *diagnosed* rather than
 * refused - "unknown or unsupported languages must be diagnosed rather than
 * interpreted as another engine" - and it names `vue` as a profile a web
 * renderer set need not implement. A closed union would make the diagnostic
 * path unauthorable: `lang: "handlebars"` would not compile, so the case the
 * renderer exists to report could never be written down.
 *
 * `TemplateLang | (string & {})` keeps editor completion for the two engines
 * this set implements while still accepting any string.
 */
export type TemplateLayoutElement = Omit<Layout, 'elements'> & {
  type: 'TemplateLayout';
  /** The template source. Required by section 13. */
  template: string;
  /** `ractive`, `jsx`, or anything else - which is diagnosed, not rejected. */
  lang?: TemplateLang | (string & NonNullable<unknown>);
  /** Lets a registered `Template` resolve this element by name. */
  name?: string;
  /**
   * Children; a named one is addressable from the template.
   *
   * Section 13: "each named child is available as a partial that mounts its
   * delegated renderer". The names come from the project's own element type,
   * since core declares none.
   */
  elements: ExtendedUISchemaElement[];
};

/** "then ractive for the default web profile" */
export const DEFAULT_TEMPLATE_LANG: TemplateLang = 'ractive';

export interface ResolvedTemplateLang {
  /** The engine to use, or undefined when the request cannot be honoured. */
  lang?: TemplateLang;
  /** What was asked for, when it is not a language this set implements. */
  requested?: string;
  /**
   * Why nothing will render. `unsupported` is a language this set does not
   * implement; `evaluation-disabled` is a supported one the host has not
   * permitted.
   */
  diagnostic?: 'unsupported' | 'evaluation-disabled';
}

const asLang = (value: unknown): TemplateLang | undefined =>
  typeof value === 'string' &&
  (TEMPLATE_LANGS as readonly string[]).includes(value.toLowerCase())
    ? (value.toLowerCase() as TemplateLang)
    : undefined;

/**
 * Whether the host permits compiling strings into executable code.
 *
 * "String evaluation requires
 * `jsonformsExtended.security.allowScriptEvaluation=true`… Enabling string
 * evaluation means the host treats the UI schema as trusted executable code."
 *
 * **Both** engines need it. JSX is compiled and handed to `new Function`;
 * Ractive compiles each `{{ }}` expression the same way. Neither is a sandbox,
 * and the default is therefore off.
 */
export const allowsScriptEvaluation = (config: unknown): boolean => {
  const security = extendedConfig(config)?.['security'];
  return (
    !!security &&
    typeof security === 'object' &&
    (security as Record<string, unknown>)['allowScriptEvaluation'] === true
  );
};

/**
 * The engine for one element, or a diagnostic saying why there is none.
 *
 * "Unknown or unsupported languages must be diagnosed rather than interpreted
 * as another engine" - so an unrecognized `lang` does **not** fall back to the
 * default. Falling back is what turns a typo into a form that renders the
 * wrong thing and says nothing.
 */
export const resolveTemplateLang = (
  uischema: UISchemaElement | undefined,
  config: unknown
): ResolvedTemplateLang => {
  const requested = (uischema as { lang?: unknown } | undefined)?.lang;

  if (requested !== undefined) {
    const explicit = asLang(requested);
    return explicit
      ? { lang: explicit }
      : { requested: String(requested), diagnostic: 'unsupported' };
  }

  /*
    Namespaced, per adjustment 1: element options stay flat, form-wide
    settings live under `jsonformsExtended`. The specification spells this one
    `config.defaultTemplateLang` and says to keep the name - the *name* is
    kept, and only its namespace changes, which is the project-wide rule for
    every other config key.

    The flat spelling is still read underneath, so forms written against the
    specification's literal wording keep working.
  */
  const namespaced = extendedConfig(config) as
    | { defaultTemplateLang?: unknown }
    | undefined;
  const configured =
    namespaced?.defaultTemplateLang ??
    (config as { defaultTemplateLang?: unknown } | undefined)
      ?.defaultTemplateLang;
  if (configured !== undefined) {
    const fromConfig = asLang(configured);
    return fromConfig
      ? { lang: fromConfig }
      : { requested: String(configured), diagnostic: 'unsupported' };
  }

  return { lang: DEFAULT_TEMPLATE_LANG };
};

/**
 * The same resolution, plus the security gate, for a renderer about to run.
 *
 * Kept separate from {@link resolveTemplateLang} because the **testers** must
 * not consult it: a disabled host still needs the element to select a renderer,
 * so that renderer can report why nothing is shown. A tester returning `-1`
 * would leave the element unhandled and silent.
 */
export const resolveTemplateEngine = (
  uischema: UISchemaElement | undefined,
  config: unknown
): ResolvedTemplateLang => {
  const resolved = resolveTemplateLang(uischema, config);
  if (resolved.lang && !allowsScriptEvaluation(config)) {
    return { ...resolved, diagnostic: 'evaluation-disabled' };
  }
  return resolved;
};
