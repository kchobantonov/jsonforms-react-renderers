import React from 'react';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { ctxToCellProps, useJsonForms } from '@jsonforms/react';
import { CellModeProvider, ControlFormItem } from './cellMode';

/**
 * The chrome around one table or grid cell.
 *
 * The scalar cells in the cells registry are bare inputs - they draw no
 * Form.Item of their own - so without this a cell shows no validation state at
 * all. It supplies the compact form: the error border plus an icon whose
 * tooltip carries the message, and no label or inline message, neither of
 * which a row has room for. `CellModeProvider` keeps anything dispatched
 * inside it on the same footing.
 */
export const CellFrame = ({
  errors,
  path,
  children,
}: React.PropsWithChildren<{ errors?: string; path?: string }>) => (
  <CellModeProvider>
    <ControlFormItem path={path} errors={errors || undefined}>{children}</ControlFormItem>
  </CellModeProvider>
);

export type ConnectedCellFrameProps = React.PropsWithChildren<{
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  path: string;
}>;

/**
 * CellFrame for callers that do not already hold the cell's errors - the AG
 * Grid renderer, whose cells are dispatched from a cellRenderer rather than
 * from a connected component.
 */
export const ConnectedCellFrame = ({
  schema,
  uischema,
  path,
  children,
}: ConnectedCellFrameProps) => {
  const ctx = useJsonForms();
  const { errors } = ctxToCellProps(ctx, { schema, uischema, path } as any);
  return <CellFrame errors={errors} path={path}>{children}</CellFrame>;
};
