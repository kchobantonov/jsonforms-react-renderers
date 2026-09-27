import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

export const spacerRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Spacer')
);

/**
 * `{ "type": "Spacer", "size": 32 }` — intrinsic spacing, with no data binding.
 *
 * Three things the specification is specific about, and all three were wrong
 * before:
 *
 * - **`size` is a top-level field**, not `options.height`. A conformant
 *   `{"type":"Spacer","size":16}` used to fall through to the default 32.
 * - **The axis follows the parent.** Width inside a `HorizontalLayout`, height
 *   inside a `VerticalLayout` or at the top level. It always applied height.
 * - **It may flex.** `options.layout.weight` is the specification's own
 *   flexible-push example — `flexShrink: 0` was hard-coded, so it could not.
 *
 * "It defaults to 32 and uses the shared non-negative Dimension type (numeric
 * values are CSS pixels on web)."
 */
const DEFAULT_SIZE = 32;

const toCss = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : value;

const resolveSize = (uischema: any, config: any): number | string => {
  // Top-level `size` first; `options.height` is the superseded spelling and is
  // still read so existing forms do not silently change.
  const candidates = [
    uischema?.size,
    uischema?.options?.height,
    config?.height,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(0, candidate);
    }
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return DEFAULT_SIZE;
};

export const SpacerRendererComponent = ({
  config,
  uischema,
  visible,
}: LayoutProps) => {
  const size = resolveSize(uischema, config);
  const weight = (uischema as any)?.options?.layout?.weight;
  const flexible =
    typeof weight === 'number' && Number.isFinite(weight) && weight > 0;

  if (!visible) {
    return null;
  }

  /*
    The axis follows the parent, but the parent applies it: a layout reads a
    Spacer's top-level `size` and gives its slot a fixed main-axis basis -
    width in a row, height in a column. That keeps this package free of any
    dependency on a particular layout implementation.

    What is left here is the standalone case the specification also covers:
    "top-level `size` supplies intrinsic spacing independently of parent layout
    support", where the axis falls back to height.
  */
  return (
    <div
      aria-hidden='true'
      data-spacer
      style={
        flexible
          ? { flex: `${weight} 1 0`, minWidth: 0, minHeight: 0 }
          : { flexShrink: 0, height: toCss(size), width: '100%' }
      }
    />
  );
};

export const SpacerRenderer = withJsonFormsLayoutProps(SpacerRendererComponent);
