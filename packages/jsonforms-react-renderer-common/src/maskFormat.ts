import { Mask, tokens as maskaTokens } from 'maska';
import type { MaskTokens } from 'maska';
import { MaskPattern, isMaskPattern } from './maskControls';

/**
 * Masking, with no React and no antd in it.
 *
 * The whole storage contract - what is displayed, what is stored, what a
 * partial edit means, where the caret lands - is decidable from strings alone,
 * so it is settled here and tested without rendering anything. The renderer
 * above is then only a binding.
 *
 * The engine is [maska](https://github.com/beholdr/maska), the same library the
 * Svelte and Vuetify families use. That is the point: the specification's
 * option table *is* maska's API - `#`/`@`/`*`, `tokens`, `tokensReplace`,
 * `eager`, `reversed` - and it requires cross-platform implementations to
 * "document their mask/token grammar and regex compatibility". Sharing the
 * engine makes the grammars identical by construction rather than by two teams
 * reading the same paragraph.
 */

export { isMaskPattern };
export type { MaskPattern };

/**
 * The default token table, exactly as the specification states it.
 *
 * Written out here rather than imported so the normative table is readable in
 * the code that implements it; `maskFormat.test.ts` asserts it still equals
 * maska's own, so a library bump that changed the grammar would fail rather
 * than quietly re-interpret every authored mask.
 */
export const DEFAULT_MASK_TOKENS: MaskTokens = {
  '#': { pattern: /[0-9]/ },
  '@': { pattern: /[a-zA-Z]/ },
  '*': { pattern: /[a-zA-Z0-9]/ },
};

/** maska's own defaults, for the guard test. */
export const MASKA_DEFAULT_TOKENS: MaskTokens = maskaTokens;

/**
 * A token as a UI schema may spell it: a bare regex source, or an object
 * carrying one plus the engine's repetition flags. A falsy entry *removes* a
 * token, which is how an author narrows the default table.
 */
export type MaskTokenSpec =
  | string
  | {
      pattern: string;
      multiple?: boolean;
      optional?: boolean;
      repeated?: boolean;
    }
  | false
  | null
  | undefined;

export type MaskTokenSpecs = Record<string, MaskTokenSpec>;

/**
 * The token-object fields that survive serialization.
 *
 * maska's `transform` is deliberately absent: it is a function, and the
 * specification rules that out - "function-valued masking-library options are
 * not portable serialized UI-model features". Any other field an author writes
 * is dropped rather than passed through, so a UI schema cannot come to depend
 * on a library detail that another family has no way to honor.
 */
const TOKEN_FLAGS = ['multiple', 'optional', 'repeated'] as const;

/**
 * Compiles an authored regex source.
 *
 * Tried with the `u` flag first so `\p{L}` and friends work, then without it,
 * because `u` rejects escapes that are legal in an ordinary regex (`\-` among
 * them) and an author should not have to know which mode they are in. A source
 * that compiles under neither is reported and dropped: an invalid regex in one
 * token must not take the whole form down with a render-time throw.
 */
export const compileTokenPattern = (source: string): RegExp | undefined => {
  try {
    return new RegExp(source, 'u');
  } catch {
    // fall through to the unflagged attempt
  }
  try {
    return new RegExp(source);
  } catch {
    return undefined;
  }
};

/**
 * Builds the token table from the default one plus the authored entries.
 *
 * This starts from the defaults and applies the author's entries over them,
 * which is what the neighbouring families do, so `"tokens": { "#": ... }`
 * changes one token rather than replacing the table.
 */
export const toMaskTokens = (
  specs: unknown,
  onInvalid?: (token: string, pattern: string) => void
): MaskTokens | undefined => {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) {
    return undefined;
  }
  const result: MaskTokens = { ...DEFAULT_MASK_TOKENS };
  for (const [key, spec] of Object.entries(specs as MaskTokenSpecs)) {
    if (!spec) {
      // An author removing a default token. This only takes effect while
      // `tokensReplace` is on; see `resolveMaskSettings`.
      delete result[key];
      continue;
    }
    const source = typeof spec === 'string' ? spec : spec.pattern;
    if (typeof source !== 'string') {
      continue;
    }
    const pattern = compileTokenPattern(source);
    if (!pattern) {
      onInvalid?.(key, source);
      continue;
    }
    const token: MaskTokens[string] = { pattern };
    if (typeof spec !== 'string') {
      for (const flag of TOKEN_FLAGS) {
        if (spec[flag] === true) {
          token[flag] = true;
        }
      }
    }
    result[key] = token;
  }
  return result;
};

export interface MaskSettings {
  mask: MaskPattern;
  tokens: MaskTokens;
  tokensReplace: boolean;
  eager: boolean;
  reversed: boolean;
  returnMaskedValue: boolean;
}

export const DEFAULT_MASK_SETTINGS = {
  tokensReplace: true,
  eager: false,
  reversed: false,
  returnMaskedValue: false,
} as const;

/**
 * Resolves the authored options into the settings the engine takes.
 *
 * These options are **not** namespaced under `jsonformsExtended`. Adjustment 1
 * places a config key by where it comes from, and every one of them is an
 * established convention of the inspected Vuetify and Svelte families, so they
 * sit at the top level of `config` under the names those families already use -
 * alongside `clearable`, `restrict` and `placeholder`, which this control also
 * reads flat.
 *
 * `mask` is the exception: it is read from the element only. A form-wide
 * default mask would claim every string field in the form, and the tester
 * inspects `uischema.options.mask` too, so a config-level one could never have
 * selected this renderer in the first place.
 *
 * Every boolean means what it says: `"eager": true` is eager. That is worth
 * stating because the inspected Svelte families compute `eager` and `reversed`
 * as `appliedOptions.<option> === false`, so omission gives false, an explicit
 * `true` *also* gives false, and only an explicit `false` turns the behaviour
 * on - the inversion their own gap review records. The options are spelled the
 * same way here and behave as documented instead.
 */
export const resolveMaskSettings = (
  options: unknown,
  config: unknown,
  onInvalid?: (token: string, pattern: string) => void
): MaskSettings | undefined => {
  const mask = (options as { mask?: unknown } | undefined)?.mask;
  if (!isMaskPattern(mask)) {
    return undefined;
  }
  const applied = {
    ...(config as Record<string, unknown> | undefined),
    ...(options as Record<string, unknown> | undefined),
  };
  // `maskReplacers` is the older spelling of `tokens`. The specification says
  // `tokens` wins outright when both are present rather than the two merging,
  // which is what the inspected families do.
  const specs = applied.tokens ?? applied.maskReplacers;

  const flag = (name: keyof typeof DEFAULT_MASK_SETTINGS) =>
    (applied[name] ?? DEFAULT_MASK_SETTINGS[name]) === true;

  return {
    mask,
    tokens: toMaskTokens(specs, onInvalid) ?? DEFAULT_MASK_TOKENS,
    tokensReplace: flag('tokensReplace'),
    eager: flag('eager'),
    reversed: flag('reversed'),
    returnMaskedValue: flag('returnMaskedValue'),
  };
};

/**
 * `tokensReplace` is passed straight through to the engine, and it decides
 * what happens to a *removed* token. The table built above already contains
 * the defaults, so with `tokensReplace: true` - the documented default - it is
 * used verbatim and a removal holds. With `tokensReplace: false` the engine
 * merges its own defaults back underneath, so an override still applies but a
 * removal is undone. That is the neighbouring families' behaviour, kept for
 * parity rather than because it reads well.
 */
export const createMask = (settings: MaskSettings): Mask =>
  new Mask({
    mask: settings.mask,
    tokens: settings.tokens,
    tokensReplace: settings.tokensReplace,
    eager: settings.eager,
    reversed: settings.reversed,
  });

/**
 * The stored form of what is currently displayed.
 *
 * `returnMaskedValue` is the whole of the storage decision: false stores the
 * characters the user supplied, true stores them with the mask's literals in
 * place. The specification is firm that choosing it is an authoring decision
 * with a schema consequence - "if `returnMaskedValue: true` is chosen, the
 * schema must instead describe the stored representation containing the
 * separator" - and that the renderer "must not rewrite the schema when this
 * option changes". Nothing here touches the schema.
 */
export const storedValue = (
  mask: Mask,
  displayed: string,
  returnMaskedValue: boolean
): string =>
  returnMaskedValue ? mask.masked(displayed) : mask.unmasked(displayed);

/**
 * Whether a stored string is one this mask could have produced.
 *
 * The test is a round trip rather than a syntax check, because the question is
 * not "does this look plausible" but "would displaying this and reading it back
 * return the same value". A value that fails is one the mask cannot carry
 * without changing it - `"1234567890"` under `###-###` loses four digits, and
 * `"unknown"` loses everything.
 */
export const fitsMask = (
  mask: Mask,
  stored: string,
  returnMaskedValue: boolean
): boolean =>
  returnMaskedValue
    ? mask.masked(stored) === stored
    : mask.unmasked(mask.masked(stored)) === stored;

/**
 * What the field shows for a stored value.
 *
 * A value the mask fits is displayed masked. **A value it does not fit is shown
 * verbatim**, which is the whole of this renderer's answer to the question the
 * specification leaves open - "treatment of existing values that do not fit" -
 * and it is not a free choice: section 19 requires out-of-domain data to be
 * rendered honestly, and the shared editing contract says in as many words to
 * "preserve invalid incoming data for correction; do not truncate it
 * automatically on rendering."
 *
 * The alternative - showing the masked remnant - would put `123-456` on screen
 * for a stored `1234567890` while the data still held ten digits, so the field
 * would disagree with the form it belongs to and a validation error would point
 * at something invisible.
 */
export const displayValue = (
  mask: Mask,
  stored: string,
  returnMaskedValue: boolean
): string =>
  fitsMask(mask, stored, returnMaskedValue) ? mask.masked(stored) : stored;

/**
 * String length as JSON Schema counts it.
 *
 * "JSON Schema strings are sequences of Unicode code points; HTML maxlength
 * measures UTF-16 code units. A direct mapping is therefore not equivalent for
 * all valid input." Iterating a string yields code points, so `"😀"` is 1 here
 * and 2 to `String.prototype.length` - and a `maxLength: 1` schema accepts it.
 */
export const codePointLength = (value: string): number => [...value].length;

/**
 * Whether an edit is allowed to stand under `restrict` and `maxLength`.
 *
 * The limit is checked against the **stored** string, never the displayed one.
 * With `returnMaskedValue: false` those differ by every mask literal, so a
 * `maxLength: 6` field masked `###-###` displays seven characters for six
 * stored digits: forwarding the limit to the input's `maxlength`, as the
 * neighbouring families do, blocks the seventh keystroke and makes the sixth
 * digit untypeable. The specification asks for exactly this distinction - "for
 * masked or formatted inputs, distinguish display characters from the stored
 * representation to which the schema constraint applies."
 */
export const withinMaxLength = (
  stored: string,
  maxLength: number | undefined
): boolean => maxLength === undefined || codePointLength(stored) <= maxLength;

/**
 * Where the caret belongs after the mask has rewritten what was typed.
 *
 * Inserting a literal moves every later character right, so leaving the caret
 * at its raw offset drops it a character behind after each separator - type
 * `123` into `###-###` and the `-` appears, but the next digit lands before it.
 * The rule is to keep the caret after the same *token* character it was after,
 * which is found by walking the masked text until it carries as many token
 * characters as the raw text did up to the caret.
 *
 * This mirrors maska's own `MaskInput.fixCursor`, reimplemented rather than
 * reused because that method is private to a class whose binding writes
 * `input.value` directly and dispatches a non-bubbling `CustomEvent` - the two
 * things React's controlled inputs and synthetic events do not survive. Keeping
 * it pure also makes it testable without a DOM.
 *
 * Returns `undefined` when the caret should be left where the browser put it.
 */
export const nextCaret = (
  mask: Mask,
  raw: string,
  caret: number | null,
  masked: string,
  deleting: boolean
): number | undefined => {
  // Typing at the end: the browser has already left the caret at the end, and
  // the masked text only ever grows to the right of it.
  if (caret === null || (caret === raw.length && !deleting)) {
    return undefined;
  }
  const rawHead = raw.slice(0, caret);
  const maskedHead = masked.slice(0, caret);
  if (rawHead === maskedHead) {
    return caret;
  }
  if (deleting) {
    return caret + masked.length - raw.length;
  }
  const typed = mask.unmasked(rawHead);
  if (typed.length === 0) {
    return 0;
  }
  for (let index = 1; index <= masked.length; index += 1) {
    if (mask.unmasked(masked.slice(0, index)).length >= typed.length) {
      return index;
    }
  }
  return masked.length;
};

/**
 * The text an edit should leave on screen.
 *
 * The one special case is maska's: deleting the last token character of an
 * eager mask would otherwise leave its literals stranded - `1` backspaced under
 * an eager `###-###` masks back to `1-`, which cannot be deleted - so an eager
 * delete that empties the value empties the field.
 */
export const maskEdit = (
  mask: Mask,
  raw: string,
  deleting: boolean
): string => {
  if (deleting && mask.isEager() && mask.unmasked(raw) === '') {
    return '';
  }
  return mask.masked(raw);
};
