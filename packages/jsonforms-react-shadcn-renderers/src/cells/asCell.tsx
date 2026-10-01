import React, { createContext } from 'react';
import {
  CellProps,
  ControlElement,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { ErrorIndicator } from '../complex/ErrorIndicator';

export const ShadcnCellMode = createContext(false);

/** DispatchCell paths already include the field scope; connected controls must not append it again. */
export const asShadcnCell = <P extends { uischema?: UISchemaElement }>(
  Control: React.ComponentType<P>
): React.ComponentType<P> => {
  const Cell = (props: P) => (
    <ShadcnCellMode.Provider value={true}>
      <Control
        {...props}
        uischema={{ ...props.uischema, scope: '#', label: false } as any}
      />
    </ShadcnCellMode.Provider>
  );
  return Cell;
};

/** AG Grid cells fill a row; center short controls such as checkboxes vertically. */
const ConnectedGridCellFrame = withJsonFormsCellProps(
  ({
    children,
    errors,
    path,
    schema,
    uischema,
  }: React.PropsWithChildren<CellProps>) => (
    <div
      className='shadcn-jsonforms-grid-cell'
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        minWidth: 0,
        width: '100%',
      }}
    >
      <div
        className='shadcn-jsonforms-grid-cell-content'
        style={{ flex: 1, minWidth: 0 }}
      >
        {children}
      </div>
      {errors &&
        uischema.options?.summary?.type !== 'Label' &&
        schema.type !== 'object' &&
        schema.type !== 'array' && (
          <ErrorIndicator
            local
            errors={errors}
            path={path}
            className='shadcn-jsonforms-cell-error'
          />
        )}
    </div>
  )
);

export const ShadcnGridCellFrame = (
  props: React.PropsWithChildren<{
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    path: string;
  }>
) => (
  <ConnectedGridCellFrame
    {...props}
    uischema={props.uischema as ControlElement}
  />
);
