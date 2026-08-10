import { LayoutProps } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React from 'react';

export const ShadcnLayout = ({
  direction,
  ...props
}: LayoutProps & { direction: 'row' | 'column' }) => {
  const layout = props.uischema as any;
  if (!props.visible) return null;

  return (
    <div
      className={`shadcn-jsonforms-layout shadcn-jsonforms-layout-${direction}`}
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
    </div>
  );
};
