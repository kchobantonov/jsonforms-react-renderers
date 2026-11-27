import type { ArrayLayoutProps, UISchemaElement } from '@jsonforms/core';

export type ArrayItemViewProps = Pick<
  ArrayLayoutProps,
  'schema' | 'path' | 'enabled' | 'cells' | 'renderers'
> & {
  detail: UISchemaElement;
  indices: number[];
  hideAvatar: boolean;
  canRemove: boolean;
  requestRemove: (index: number) => void;
  childLabelForIndex: (path: string, index: number) => string;
  removeLabel: string;
  removeTooltip: string;
};
