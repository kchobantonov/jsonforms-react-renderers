import {
  containerStyle as sharedContainerStyle,
  resolveGap as sharedResolveGap,
} from '@chobantonov/jsonforms-react-renderer-common/layout/layoutSizing';
import type {
  LayoutContainerOptions,
  LayoutDirection,
} from '@chobantonov/jsonforms-react-renderer-common/layout/layoutSizing';
export {
  resolveGridColumns,
  resolveWrap,
  spanBasis,
  itemSizing,
} from '@chobantonov/jsonforms-react-renderer-common/layout/layoutSizing';
export type {
  LayoutContainerOptions,
  LayoutDirection,
} from '@chobantonov/jsonforms-react-renderer-common/layout/layoutSizing';

// Portable spacing; layout-owned Form.Item margins are suppressed by the layout.
export const DEFAULT_ROW_GAP = 16;
const DEFAULT_COLUMN_GAP = 16;
const gaps = { row: DEFAULT_ROW_GAP, column: DEFAULT_COLUMN_GAP };
export const resolveGap = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection,
) => sharedResolveGap(options, config, direction, gaps);
export const containerStyle = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection,
) => sharedContainerStyle(options, config, direction, gaps);
