import {
  containerStyle as sharedContainerStyle,
  resolveGap as sharedResolveGap,
} from '@chobantonov/jsonforms-react-renderer-common/layoutSizing';
import type {
  LayoutContainerOptions,
  LayoutDirection,
} from '@chobantonov/jsonforms-react-renderer-common/layoutSizing';
export {
  DEFAULT_GRID_COLUMNS,
  toCss,
  resolveGridColumns,
  resolveWrap,
  spanBasis,
  itemOptionsOf,
  itemSizing,
  legacySizingDiagnostics,
} from '@chobantonov/jsonforms-react-renderer-common/layoutSizing';
export type {
  Dimension,
  LayoutItemOptions,
  LayoutContainerOptions,
  LayoutDirection,
  LayoutGapDefaults,
  LayoutDiagnostic,
  ItemSizing,
} from '@chobantonov/jsonforms-react-renderer-common/layoutSizing';

// Ant Design Form.Item already supplies vertical rhythm; rows need a gutter.
export const DEFAULT_ROW_GAP = 16;
export const DEFAULT_COLUMN_GAP = 0;
const gaps = { row: DEFAULT_ROW_GAP, column: DEFAULT_COLUMN_GAP };
export const resolveGap = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection
) => sharedResolveGap(options, config, direction, gaps);
export const containerStyle = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection
) => sharedContainerStyle(options, config, direction, gaps);
