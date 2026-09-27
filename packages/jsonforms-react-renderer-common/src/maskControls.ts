import {
  Tester,
  UISchemaElement,
  and,
  formatIs,
  isStringControl,
  not,
  optionIs,
  or,
  rankWith,
} from '@jsonforms/core';

/**
 * A mask pattern as the UI model may serialize it: one pattern, or a set of
 * alternatives the masking engine picks between by length.
 *
 * A function-valued mask is deliberately not part of this type. The
 * specification is explicit that "function-valued masking-library options are
 * not portable serialized UI-model features", and a UI schema is JSON.
 */
export type MaskPattern = string | string[];

/**
 * Whether `options.mask` carries an actual pattern.
 *
 * This is the whole of the fix for the selection defect the Svelte review
 * recorded. Those families select with `hasOption('mask')`, which tests
 * *presence*: the temporal controls take a **boolean** `mask` that turns their
 * format-derived mask off, so `"mask": false` - an author asking for less
 * masking - made the field eligible for the generic masked renderer instead.
 * The specification names the case directly: "a boolean temporal option must
 * not by itself request a generic masked field."
 *
 * Requiring a non-empty string (or a non-empty array of them) excludes `false`,
 * `true`, `""`, `[]` and a function in one predicate.
 */
export const isMaskPattern = (value: unknown): value is MaskPattern => {
  if (typeof value === 'string') {
    return value.length > 0;
  }
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string' && entry.length > 0)
  );
};

export const hasMaskPattern: Tester = (uischema: UISchemaElement) =>
  isMaskPattern(
    (uischema as { options?: Record<string, unknown> }).options?.mask
  );

/**
 * The string formats that name their own editor.
 *
 * A `format` says what the value *is*; a mask only says how it is typed. So
 * when both are present the format wins and the mask is ignored, rather than a
 * date being edited through a generic text mask that knows nothing about
 * calendars. The specification leaves this to us - "handling of competing
 * specialized string presentations belong in renderer-family specifications" -
 * and it is the reason this tester can sit at a rank of its own without
 * tie-breaking against the temporal controls by registration order.
 */
const SPECIALIZED_STRING_FORMATS = [
  'color',
  'date',
  'date-time',
  'duration',
  'password',
  'time',
];

const hasSpecializedFormat: Tester = or(
  ...SPECIALIZED_STRING_FORMATS.flatMap((format) => [
    formatIs(format),
    optionIs('format', format),
  ])
);

/**
 * Rank 4, above the plain text control at 1 and the color and duration
 * controls at 3, and never in a tie with the temporal controls at 4 because
 * {@link hasSpecializedFormat} excludes every schema they match.
 */
export const extendedMaskTester = rankWith(
  4,
  and(isStringControl, hasMaskPattern, not(hasSpecializedFormat))
);
