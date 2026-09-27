import { JSONFORMS_EXTENDED_CONFIG_KEY } from './configNamespaces';

/**
 * Resolving what a text element should do with its text.
 *
 * Two independent requests, and either one is enough to take the element away
 * from the plain renderer:
 *
 * - `options.markup: "markdown"` asks for the restricted Markdown profile.
 * - `options.interpolate: true` asks for message formatting.
 *
 * With neither, the ordinary label renderer keeps the element - there is
 * nothing here it would do differently, and replacing it would change how
 * every existing form draws its labels.
 */

/** The `markup` values the model defines. */
export type Markup = 'plain' | 'markdown';

export type MarkupDiagnostic =
  /** `markup: "markdown"` while the host has the profile switched off. */
  | 'markdownDisabled'
  /** A `markup` value this implementation does not know. */
  | 'markupUnsupported';

export interface MarkupRequest {
  /** Whether Markdown should actually be parsed. */
  markdown: boolean;
  /** Whether the text should be run through message formatting. */
  interpolate: boolean;
  /** Wrap the result in the UI library's own typography components. */
  typography: boolean;
  /** Set when the request cannot be honoured; see `MarkupDiagnostic`. */
  diagnostic?: MarkupDiagnostic;
}

const namespaced = (config: unknown): Record<string, unknown> | undefined =>
  (config as Record<string, unknown> | undefined)?.[
    JSONFORMS_EXTENDED_CONFIG_KEY
  ] as Record<string, unknown> | undefined;

const markupConfig = (config: unknown): Record<string, unknown> | undefined =>
  namespaced(config)?.['markup'] as Record<string, unknown> | undefined;

/**
 * Whether the host permits Markdown at all.
 *
 * Defaults to **true**, which the recommended configuration states and which
 * differs from the other extension gates. Those gate something that executes;
 * this gates a parser that cannot execute anything, and the profile already
 * excludes raw HTML, images and embedded content.
 */
export const markdownEnabled = (config: unknown): boolean => {
  const markdown = markupConfig(config)?.['markdown'] as
    | Record<string, unknown>
    | undefined;
  return markdown?.['enabled'] !== false;
};

/**
 * Which Markdown profile the host has selected.
 *
 * `basic` unless the host says otherwise, and an unrecognized value falls back
 * to `basic` rather than being reported: a profile name is a host setting, not
 * an authored one, so there is no author on the page to tell about it, and the
 * safe direction for an unknown one is the smaller grammar.
 */
export const markdownProfile = (config: unknown): 'basic' | 'extended' =>
  (markupConfig(config)?.['markdown'] as Record<string, unknown> | undefined)?.[
    'profile'
  ] === 'extended'
    ? 'extended'
    : 'basic';

/**
 * Whether to wrap rendered text in the UI library's typography components.
 *
 * Element option first, then the namespaced default, then **true**. It is
 * switchable because those components carry their own margins, which can
 * fight a form's own spacing - the same collision a non-zero column gap
 * produces.
 */
export const typographyEnabled = (
  options: Record<string, unknown> | undefined,
  config: unknown
): boolean => {
  if (typeof options?.['typography'] === 'boolean') {
    return options['typography'] as boolean;
  }
  const fromConfig = markupConfig(config)?.['typography'];
  return typeof fromConfig === 'boolean' ? fromConfig : true;
};

/**
 * What this element is asking for, and whether it can have it.
 *
 * A refused Markdown request keeps `interpolate`: the two are independent, and
 * switching the profile off is not a reason to stop formatting a message.
 */
export const resolveMarkup = (
  options: Record<string, unknown> | undefined,
  config: unknown
): MarkupRequest => {
  const requested = options?.['markup'];
  const interpolate = options?.['interpolate'] === true;
  const typography = typographyEnabled(options, config);

  if (
    requested !== undefined &&
    requested !== 'plain' &&
    requested !== 'markdown'
  ) {
    return {
      markdown: false,
      interpolate,
      typography,
      diagnostic: 'markupUnsupported',
    };
  }
  if (requested === 'markdown' && !markdownEnabled(config)) {
    return {
      markdown: false,
      interpolate,
      typography,
      diagnostic: 'markdownDisabled',
    };
  }
  return { markdown: requested === 'markdown', interpolate, typography };
};

/**
 * Whether the extended renderer should take this element at all.
 *
 * Deliberately reads the **requested** markup rather than the resolved one: an
 * element asking for Markdown that the host has switched off still belongs
 * here, because the refusal has to be reported. Leaving it to the plain
 * renderer would render the source silently, which is the failure this
 * diagnostic exists to prevent.
 */
export const wantsMarkup = (
  options: Record<string, unknown> | undefined
): boolean =>
  options?.['interpolate'] === true ||
  (options?.['markup'] !== undefined && options['markup'] !== 'plain');
