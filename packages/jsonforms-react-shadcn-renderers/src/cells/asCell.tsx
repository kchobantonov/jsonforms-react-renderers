import React, { createContext } from 'react';
import { UISchemaElement } from '@jsonforms/core';

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
export const ShadcnGridCellFrame = ({ children }: React.PropsWithChildren) => (
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
      style={{ width: '100%', minWidth: 0 }}
    >
      {children}
    </div>
  </div>
);
