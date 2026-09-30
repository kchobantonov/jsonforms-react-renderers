import type { CSSProperties } from 'react';
export interface TableColumnDefinition {
  field: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}
export const tableColumnFields = (properties: Record<string, unknown>, definitions: TableColumnDefinition[] | undefined, fallback: string[]) =>
  definitions === undefined ? fallback : [...new Set(definitions.map((column) => column.field))].filter((field) => Object.prototype.hasOwnProperty.call(properties, field));
export const tableColumnStyle = (definition?: TableColumnDefinition): CSSProperties => {
  const style: CSSProperties = {};
  for (const key of ['width', 'minWidth', 'maxWidth'] as const) {
    const value = definition?.[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) style[key] = value;
  }
  return style;
};
