/**
 * Converts what a numeric input reports into a value safe to commit.
 *
 * The specification is explicit that a numeric editor must "parse the complete
 * input before committing a number" and must not "accept a numeric prefix
 * while silently discarding the rest of the user's entry":
 *
 * - `parseInt('1.9')` is `1`. Typing a fractional value into an integer field
 *   silently committed a different number than the one on screen. The spec
 *   names this case: "1.9 must not become integer 1 through truncation."
 * - `parseInt('1e3')` is `1`, not `1000` - the spec names this one too. An
 *   integer editor may refuse exponent syntax, "but it must not interpret 1e3
 *   as 1".
 * - `parseFloat('12abc')` is `12`, discarding the rest.
 *
 * `Number` parses the whole string or fails, so it does none of these.
 *
 * **Integer fields commit the fractional value rather than rounding it.**
 * Rounding would be the same silent substitution in a different disguise;
 * committing 1.9 lets schema validation report "must be integer" against what
 * the user actually typed, which they can then correct. This follows section
 * 19: the UI represents actual form data and does not invent nearby valid data
 * to make the widget look valid.
 *
 * Returns `undefined` for an empty or unparseable entry, so nothing is
 * committed rather than `NaN` or `±Infinity`, which the spec forbids as form
 * values. `Number('')` is `0`, so the empty case is tested first - otherwise
 * clearing a field would commit a zero.
 *
 * **Not covered: precision loss.** `Number('9007199254740993')` is
 * `9007199254740992`. antd's `InputNumber` has already converted the text to a
 * JavaScript number before this is called, so the original digits are gone and
 * the change cannot be detected here. Doing so needs antd's `stringMode`; see
 * section 4.3 of the implementation-gaps document.
 */
export const toCommittableNumber = (value: unknown): number | undefined => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed =
    typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};
