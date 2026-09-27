/**
 * A CSS length, as far as a type can usefully describe one.
 *
 * The runtime accepts `number | string` and passes a string through as
 * authored (`toCss` in the antd package's `layoutSizing.ts`), so this type is
 * deliberately a **subset** of what will work - its job is to catch `width:
 * '100'` and `width: 'pixels'`, not to be the authority on CSS.
 *
 * Three calibration decisions, each of which costs something if got wrong:
 *
 * - **No `fr`.** The layout containers are `display: flex` and item sizing
 *   sets `flex-basis` and `width`. `fr` is a grid unit and means nothing in
 *   either, so admitting it would type-approve a value that silently does
 *   nothing - the worst kind of permissiveness.
 * - **The functional notations are all here**, not only `calc()`. `clamp()`,
 *   `min()`, `max()` and `var()` are ordinary in responsive layouts, and a
 *   type that rejects them produces false errors on correct CSS.
 * - **The unit list is long on purpose.** A short list looks tidy and turns
 *   every `vmin`, `dvh` or `pt` into a compile error on a value that works.
 *
 * Known looseness: TypeScript's `${number}` is lenient, so `'100 px'` is
 * accepted. Narrowing that is not worth the type it would take.
 */

type AbsoluteUnit = 'px' | 'pt' | 'pc' | 'cm' | 'mm' | 'in' | 'q';
type FontRelativeUnit =
  | 'em'
  | 'rem'
  | 'ex'
  | 'ch'
  | 'cap'
  | 'ic'
  | 'lh'
  | 'rlh';
type ViewportUnit =
  | 'vw'
  | 'vh'
  | 'vmin'
  | 'vmax'
  | 'vi'
  | 'vb'
  | 'svw'
  | 'svh'
  | 'lvw'
  | 'lvh'
  | 'dvw'
  | 'dvh';

export type CssUnit = AbsoluteUnit | FontRelativeUnit | ViewportUnit | '%';

/** Sizing keywords, plus the CSS-wide ones any property accepts. */
export type CssKeyword =
  | 'auto'
  | 'none'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | 'stretch'
  | 'inherit'
  | 'initial'
  | 'revert'
  | 'unset';

export type CssFunction =
  | `calc(${string})`
  | `min(${string})`
  | `max(${string})`
  | `clamp(${string})`
  | `fit-content(${string})`
  | `var(${string})`;

/** A bare number is CSS pixels, which is what `toCss` does with it. */
export type CssLength =
  | number
  | `${number}${CssUnit}`
  /* `0` is a valid length on its own, and the only unitless one. */
  | '0'
  | CssKeyword
  | CssFunction;
