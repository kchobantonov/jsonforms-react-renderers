/**
 * The shared destructive-change confirmation policy, with no React in it.
 *
 * Section 14 defines one policy for every renderer that discards data, so this
 * module owns the whole of it: which policy applies, and whether that policy
 * prompts for the values actually being discarded. The renderers only supply
 * the values and act on the answer.
 *
 * Confirmation is **separate from permission**. It never bypasses `restrict`,
 * readonly, disabled state or schema constraints, and it is not a second
 * chance to do something the form already forbids.
 */

export type ConfirmationPolicy = 'always' | 'never' | 'complex';

/**
 * The operations the policy covers. Ordinary typing, navigation, adding a
 * value and re-selecting the current type or branch are not among them.
 */
export type ConfirmationOperation = 'typeChange' | 'branchChange' | 'delete';

/**
 * The catalog ids this package's own renderers use.
 *
 * Stable semantic identifiers, "not library component names" - so a host's
 * configuration survives a renderer being rewritten or renamed.
 *
 * For an action hosted inside another renderer, the id is **the owner of the
 * action**: a dynamic property's Delete is `additionalProperties` even though
 * an object renderer draws it, and the mixed workspace's tree Delete is
 * `mixed`.
 */
export type BaseConfirmationCatalogId =
  | 'mixed'
  | 'oneOf'
  | 'arrayTable'
  | 'arrayLayout'
  | 'listWithDetail'
  | 'additionalProperties';

/**
 * Any stable catalog id, including those a renderer set built on this one
 * contributes.
 *
 * Section 14's list also names `agGrid`, which is **not** enumerated here: that
 * renderer lives in the extended package, and this one must not know about
 * anything downstream of it. The extended set passes its own id as a plain
 * string; the `string & {}` keeps editor completion for the ids this package
 * does own while leaving the vocabulary open.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type ConfirmationCatalogId = BaseConfirmationCatalogId | (string & {});

const POLICIES: ConfirmationPolicy[] = ['always', 'never', 'complex'];

const asPolicy = (value: unknown): ConfirmationPolicy | undefined =>
  POLICIES.includes(value as ConfirmationPolicy)
    ? (value as ConfirmationPolicy)
    : undefined;

/**
 * The documented fallback, used when nothing configures the operation.
 *
 * Only mixed type changes fall back to `complex`; everything else falls back to
 * `always`. Section 14 spells out the consequence: "the default configuration
 * example deliberately opts into always globally while restoring complex for
 * mixed type changes; without that exception a global always also applies to
 * mixed type changes" - so a configured `default` really does replace this,
 * rather than being merged with it.
 */
export const fallbackConfirmationPolicy = (
  catalogId: ConfirmationCatalogId,
  operation: ConfirmationOperation
): ConfirmationPolicy =>
  catalogId === 'mixed' && operation === 'typeChange' ? 'complex' : 'always';

const namespaceOf = (config: unknown): Record<string, unknown> | undefined => {
  const extended = (config as Record<string, unknown> | undefined)?.[
    'jsonformsExtended'
  ];
  const confirmation = (extended as Record<string, unknown> | undefined)?.[
    'confirmation'
  ];
  return confirmation && typeof confirmation === 'object'
    ? (confirmation as Record<string, unknown>)
    : undefined;
};

export interface ResolveConfirmationOptions {
  /** The element's `uischema.options`. */
  options?: Record<string, unknown>;
  /** The global JSON Forms `config`. */
  config?: unknown;
  catalogId: ConfirmationCatalogId;
  operation: ConfirmationOperation;
}

/**
 * Section 14's resolution order, exactly:
 *
 * 1. `options.confirmation[operation]`
 * 2. `config.jsonformsExtended.confirmation.renderers[catalogId][operation]`
 * 3. `config.jsonformsExtended.confirmation.default`
 * 4. the documented fallback
 *
 * Unrecognized values are ignored rather than treated as `never`, so a typo
 * cannot silently switch confirmation off.
 */
export const resolveConfirmationPolicy = ({
  options,
  config,
  catalogId,
  operation,
}: ResolveConfirmationOptions): ConfirmationPolicy => {
  const element = options?.confirmation as Record<string, unknown> | undefined;
  const fromElement = asPolicy(element?.[operation]);
  if (fromElement) {
    return fromElement;
  }

  const namespace = namespaceOf(config);
  const renderers = namespace?.renderers as
    | Record<string, Record<string, unknown>>
    | undefined;
  const fromRenderer = asPolicy(renderers?.[catalogId]?.[operation]);
  if (fromRenderer) {
    return fromRenderer;
  }

  const fromDefault = asPolicy(namespace?.default);
  if (fromDefault) {
    return fromDefault;
  }

  return fallbackConfirmationPolicy(catalogId, operation);
};

/**
 * Whether a value counts as something there is to discard.
 *
 * Section 14: "no prompt when there is no value to discard. False, zero, empty
 * strings, and empty containers are existing values." Only absence is nothing -
 * `null` is a value a user chose, and so is `{}`.
 */
export const isDiscardableValue = (value: unknown): boolean =>
  value !== undefined;

/**
 * Whether a value is the "complex" kind: a **nonempty** object or array.
 *
 * "A nonempty object has at least one own key; a nonempty array has at least
 * one item, independently of whether its nested values are empty" - so
 * `{ a: {} }` qualifies and `{}` does not.
 */
export const isComplexValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value as object).length > 0
  );
};

/**
 * Whether the policy prompts for the values being discarded.
 *
 * Takes a list because "for batches, one confirmation covers the operation;
 * complex applies if any discarded value qualifies" - so a multi-row delete
 * asks once, and asks at all if any one row holds something complex.
 *
 * `complex` deliberately inspects **the old value, not the destination type**:
 * changing a populated object into a string prompts, and changing a string into
 * an object does not.
 */
export const confirmationRequired = (
  policy: ConfirmationPolicy,
  discarded: unknown[]
): boolean => {
  if (policy === 'never') {
    return false;
  }
  if (policy === 'complex') {
    return discarded.some(isComplexValue);
  }
  return discarded.some(isDiscardableValue);
};

/**
 * The whole decision in one call, for a renderer that has a value in hand.
 */
export const shouldConfirm = (
  resolve: ResolveConfirmationOptions,
  discarded: unknown[]
): boolean =>
  confirmationRequired(resolveConfirmationPolicy(resolve), discarded);
