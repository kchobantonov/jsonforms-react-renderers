/// <reference path='../ark-ui-react-factory.d.ts' />

import { LayoutProps } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { ark } from '@ark-ui/react/factory';
import React from 'react';

export const ArkLayout = ({
  direction,
  ...props
}: LayoutProps & { direction: 'row' | 'column' }) => {
  const layout = props.uischema as any;
  if (!props.visible) return null;

  return (
    <ark.div
      className={`ark-jsonforms-layout ark-jsonforms-layout-${direction}`}
    >
      {layout.elements?.map((child: any, index: number) => (
        <JsonFormsDispatch
          key={`${child.scope ?? child.type}-${index}`}
          schema={props.schema}
          uischema={child}
          path={props.path}
          enabled={props.enabled}
          renderers={props.renderers}
          cells={props.cells}
        />
      ))}
    </ark.div>
  );
};
