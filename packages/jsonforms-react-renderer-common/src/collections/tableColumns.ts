export interface TableColumnDefinition {
  field: string;
  /** Bind to the whole row instead of a property; field remains the column key. */
  scope?: '#';
  headerName?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}
export const tableColumnFields = (
  properties: Record<string, unknown>,
  definitions: TableColumnDefinition[] | undefined,
  fallback: string[],
) =>
  definitions === undefined
    ? fallback
    : [...new Set(definitions.map((column) => column.field))].filter(
        (field) =>
          Object.prototype.hasOwnProperty.call(properties, field) ||
          definitions.some(
            (column) => column.field === field && column.scope === '#',
          ),
      );
type ColumnDimensions = Pick<
  TableColumnDefinition,
  'width' | 'minWidth' | 'maxWidth'
>;

export const tableColumnStyle = (
  definition?: TableColumnDefinition,
): ColumnDimensions => {
  const style: ColumnDimensions = {};
  for (const key of ['width', 'minWidth', 'maxWidth'] as const) {
    const value = definition?.[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0)
      style[key] = value;
  }
  return style;
};
