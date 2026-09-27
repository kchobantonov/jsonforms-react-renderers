import type { UISchemaElement } from '@jsonforms/core';

/**
 * The portable layout sizing model, sections 6 and 7.
 *
 * Two kinds of option, on two different elements:
 *
 * - **`options.layout` on a child** says how that child participates in its
 *   parent - `span`, `weight`, `width`, `height` and the min/max constraints.
 * - **flat options on the layout** configure the container itself - `gap`,
 *   `wrap`, `align`, `justify`, `minItemWidth`, and `gridColumns` for a
 *   horizontal layout.
 *
 * "Flat layout options configure immediate children. `options.layout`
 * configures child participation."
 *
 * This module is pure: it turns those options into CSS and a list of
 * diagnostics, and knows nothing about React or antd.
 */

/** "On web numeric Dimension means CSS px". */
export type Dimension = number | string;

export interface LayoutItemOptions {
  span?: number;
  weight?: number;
  width?: Dimension;
  minWidth?: Dimension;
  maxWidth?: Dimension;
  height?: Dimension;
  minHeight?: Dimension;
  maxHeight?: Dimension;
  /** Reserved by the specification; accepted and ignored. */
  start?: number;
  /** Reserved by the specification; accepted and ignored. */
  responsive?: unknown;
}

export interface LayoutContainerOptions {
  gap?: Dimension;
  wrap?: boolean;
  minItemWidth?: Dimension;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  resizable?: boolean;
  /** Horizontal layouts only. */
  gridColumns?: number;
}

export type LayoutDirection = 'row' | 'column';

/** The renderer default, the last step of the `gridColumns` chain. */
export const DEFAULT_GRID_COLUMNS = 16;

/**
 * The gap a layout uses when nothing configures one.
 *
 * Section 7 recommends 0 "unless renderer capability documents another
 * portable default". This **is** that documented default for the antd family,
 * and it is direction-dependent because antd's vertical rhythm already exists
 * and its horizontal rhythm does not:
 *
 * - **Row.** Nothing separates two controls side by side, so with a fallback
 *   of 0 they share an edge. Every uischema written for another family - the
 *   upstream JSON Forms examples included - sets no `gap`, because Material
 *   and Vuetify space children themselves; rendered here they came out
 *   touching. 16px is antd's own `Row gutter={16}` convention and the value
 *   of its `margin` token.
 * - **Column.** `Form.Item` already carries `marginBottom: token.marginLG`
 *   (24px), so a column gap is added *on top of* spacing that is already
 *   there. A non-zero default double-spaces every vertical form.
 *
 * Both remain fully overridable: an explicit `gap` on the element wins, then
 * `jsonformsExtended.layoutDefaults.gap`, and `gap: 0` restores the old
 * behaviour exactly.
 */
export const DEFAULT_ROW_GAP = 16;
export const DEFAULT_COLUMN_GAP = 0;

export interface LayoutDiagnostic {
  /** Index of the child it concerns, or -1 for the container. */
  index: number;
  message: string;
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isUsableWeight = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** "dimensions non-negative where appropriate". */
const isDimension = (value: unknown): value is Dimension =>
  (typeof value === 'number' && Number.isFinite(value) && value >= 0) ||
  (typeof value === 'string' && value.trim().length > 0);

/** A number is CSS pixels; a string is passed through as authored. */
export const toCss = (value: Dimension): string =>
  typeof value === 'number' ? `${value}px` : value;

/**
 * `gridColumns`: explicit -> `jsonformsExtended.layoutDefaults.gridColumns` ->
 * renderer default -> 16.
 */
export const resolveGridColumns = (
  options: LayoutContainerOptions | undefined,
  config: unknown
): number => {
  if (isPositiveInteger(options?.gridColumns)) {
    return options!.gridColumns as number;
  }
  const fromDefaults = layoutDefaultsOf(config)?.gridColumns;
  return isPositiveInteger(fromDefaults) ? fromDefaults : DEFAULT_GRID_COLUMNS;
};

/** `wrap`: explicit -> `jsonformsExtended.layoutDefaults.wrap` -> false. */
export const resolveWrap = (
  options: LayoutContainerOptions | undefined,
  config: unknown
): boolean => {
  if (typeof options?.wrap === 'boolean') {
    return options.wrap;
  }
  const fromDefaults = layoutDefaultsOf(config)?.wrap;
  return typeof fromDefaults === 'boolean' ? fromDefaults : false;
};

/**
 * `gap`: explicit -> `jsonformsExtended.layoutDefaults.gap` -> the renderer
 * default for this direction.
 *
 * `direction` is required rather than defaulted: the two directions have
 * different defaults, and a caller that forgot to pass it would silently give
 * a column the row's gutter.
 */
export const resolveGap = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection
): Dimension => {
  if (isDimension(options?.gap)) {
    return options!.gap as Dimension;
  }
  const fromDefaults = layoutDefaultsOf(config)?.gap;
  if (isDimension(fromDefaults)) {
    return fromDefaults;
  }
  return direction === 'row' ? DEFAULT_ROW_GAP : DEFAULT_COLUMN_GAP;
};

/**
 * `jsonformsExtended.layoutDefaults`, per Adjustment 1: everything this
 * project adds to the global config lives under its own namespace rather than
 * at the top level.
 */
const layoutDefaultsOf = (
  config: unknown
): (LayoutContainerOptions & { gridColumns?: number }) | undefined => {
  const extended = (config as Record<string, unknown> | undefined)?.[
    'jsonformsExtended'
  ] as Record<string, unknown> | undefined;
  const defaults = extended?.['layoutDefaults'];
  return defaults && typeof defaults === 'object'
    ? (defaults as LayoutContainerOptions)
    : undefined;
};

const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

/** "justify = main axis; align = cross axis." */
export const containerStyle = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection
): React.CSSProperties => {
  const wrap = resolveWrap(options, config);
  return {
    display: 'flex',
    flexDirection: direction,
    // "Structural layouts have no implicit outer padding."
    padding: 0,
    // "Gap applies only between effective visible immediate children", which
    // is exactly what CSS `gap` does.
    gap: toCss(resolveGap(options, config, direction)),
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems: ALIGN[options?.align ?? ''] ?? undefined,
    justifyContent: JUSTIFY[options?.justify ?? ''] ?? undefined,
    minWidth: 0,
  };
};

/**
 * The span width formula, with the gap accounted for.
 *
 * For usable row width W, G grid columns and gap g the specification gives
 *
 *     c = (W - (G - 1) * g) / G
 *     spanWidth(n) = n * c + (n - 1) * g
 *
 * which rearranges to a form CSS can evaluate without knowing W:
 *
 *     spanWidth(n) = (n / G) * W - g * (G - n) / G
 */
export const spanBasis = (
  span: number,
  grid: number,
  gap: Dimension
): string => {
  const percent = (span / grid) * 100;
  const gapShare = (grid - span) / grid;
  if (gapShare === 0) {
    return `${percent}%`;
  }
  return `calc(${percent}% - ${gapShare} * ${toCss(gap)})`;
};

export const itemOptionsOf = (
  element: UISchemaElement | undefined
): LayoutItemOptions | undefined => {
  const layout = (element as { options?: Record<string, unknown> })?.options?.[
    'layout'
  ];
  return layout && typeof layout === 'object'
    ? (layout as LayoutItemOptions)
    : undefined;
};

export interface ItemSizing {
  style: React.CSSProperties;
  diagnostics: string[];
}

/**
 * One child's participation, resolved.
 *
 * "Primary modes: Auto, Span, Weight, Fixed. Conflict precedence:
 * Fixed > Span > Weight > Auto. Min/max are constraints."
 *
 * The min/max are applied as CSS constraints rather than by redistributing
 * here, because the browser performs the same redistribution the
 * specification describes - flexible children shrink first, then span and
 * fixed ones down to their minimum.
 */
export const itemSizing = (
  element: UISchemaElement | undefined,
  direction: LayoutDirection,
  grid: number,
  gap: Dimension,
  minItemWidth?: Dimension
): ItemSizing => {
  const item = itemOptionsOf(element);
  const diagnostics: string[] = [];
  const style: React.CSSProperties = { minWidth: 0 };

  const horizontal = direction === 'row';
  /*
    A Spacer carries its size at the top level rather than in `options.layout`,
    and it applies to the parent's **main axis** - width in a row, height in a
    column. Resolving it here is what makes the axis follow the parent without
    the Spacer having to know which layout contains it, and without the
    agnostic package reaching into this one.

    `options.layout` still wins, so a Spacer may take a weight instead.
  */
  const spacerSize =
    (element as { type?: string })?.type === 'Spacer'
      ? (element as unknown as { size?: Dimension }).size
      : undefined;
  const main =
    (horizontal ? item?.width : item?.height) ??
    (item?.span === undefined && item?.weight === undefined
      ? spacerSize
      : undefined);
  let span = item?.span;

  if (span !== undefined && !isPositiveInteger(span)) {
    diagnostics.push('`span` must be a positive integer; ignored.');
    span = undefined;
  } else if (span !== undefined && !horizontal) {
    /*
      "Unsupported hints are ignored with diagnostic; e.g. span under
      Group/VerticalLayout does not create a horizontal grid."
    */
    diagnostics.push('`span` has no effect in a vertical layout; ignored.');
    span = undefined;
  } else if (span !== undefined && span > grid) {
    // "Clamp span above gridColumns and diagnose."
    diagnostics.push(
      `\`span\` ${span} exceeds gridColumns ${grid}; clamped to ${grid}.`
    );
    span = grid;
  }

  let weight = item?.weight;
  if (weight !== undefined && !isUsableWeight(weight)) {
    diagnostics.push(
      '`weight` must be a finite number greater than 0; ignored.'
    );
    weight = undefined;
  }

  if (main !== undefined && !isDimension(main)) {
    diagnostics.push(
      `\`${
        horizontal ? 'width' : 'height'
      }\` must be a non-negative dimension; ignored.`
    );
  }

  // Fixed
  if (main !== undefined && isDimension(main)) {
    style.flex = `0 0 ${toCss(main)}`;
  } else if (span !== undefined) {
    // Span, against the complete logical grid
    style.flex = `0 0 ${spanBasis(span, grid, gap)}`;
  } else if (weight !== undefined) {
    /*
      Weight. The two axes are **not** the same basis, which is the whole of
      the specification's vertical qualifier: "vertical weight distributes
      remaining height only when parent height is definite/resolvable".

      A `0` basis in a column would collapse the child to nothing whenever the
      parent's height is indefinite, which is the ordinary case for a form. An
      `auto` basis is the rule expressed in CSS: the child starts at its
      content height, and weight divides whatever space is left over - none
      when the height is indefinite, the remainder when it is not.
    */
    style.flex = horizontal ? `${weight} 1 0` : `${weight} 1 auto`;
  } else {
    /*
      Auto. "Horizontal Auto behaves as weight 1. Vertical Auto means
      natural/content height."
    */
    style.flex = horizontal ? '1 1 0' : '0 0 auto';
  }

  const constraint = (
    value: Dimension | undefined,
    key: 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight'
  ) => {
    if (value === undefined) return;
    if (!isDimension(value)) {
      diagnostics.push(`\`${key}\` must be a non-negative dimension; ignored.`);
      return;
    }
    (style as Record<string, unknown>)[key] = toCss(value);
  };

  constraint(item?.minWidth, 'minWidth');
  constraint(item?.maxWidth, 'maxWidth');
  constraint(item?.minHeight, 'minHeight');
  constraint(item?.maxHeight, 'maxHeight');

  /*
    "`minItemWidth` is parent default minimum" - a default the child's own
    `minWidth` overrides.
  */
  if (
    horizontal &&
    item?.minWidth === undefined &&
    minItemWidth !== undefined &&
    isDimension(minItemWidth)
  ) {
    style.minWidth = toCss(minItemWidth);
  }

  return { style, diagnostics };
};

/**
 * Options a layout carries that this model does not define.
 *
 * `columns` is the one worth naming: it is the 2-16 encoding the Svelte and
 * Vuetify renderer families use, and the portable contract replaces it with
 * `options.layout.span` against a configurable `gridColumns`. A form carrying
 * it gets a diagnostic rather than silence, because the sizes would otherwise
 * be quietly wrong.
 */
export const legacySizingDiagnostics = (
  element: UISchemaElement | undefined
): string[] => {
  const options = (element as { options?: Record<string, unknown> })?.options;
  const diagnostics: string[] = [];
  if (options?.['columns'] !== undefined) {
    diagnostics.push(
      '`columns` is not part of the portable contract; use `options.layout.span` with `gridColumns`.'
    );
  }
  if (options?.['trim'] !== undefined) {
    diagnostics.push(
      '`trim` is excluded by the portable contract; use `options.layout.width` or `maxWidth`.'
    );
  }
  return diagnostics;
};
