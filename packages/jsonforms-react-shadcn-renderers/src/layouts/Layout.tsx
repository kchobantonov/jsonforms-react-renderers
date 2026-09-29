import { LayoutProps } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React from 'react';
import { useEffectiveElements } from '@chobantonov/jsonforms-react-renderer-common/layoutContext';
import {
  containerStyle,
  itemSizing,
  resolveGap,
  resolveGridColumns,
} from '@chobantonov/jsonforms-react-renderer-common/layoutSizing';

export const ShadcnLayout = ({
  direction,
  ...props
}: LayoutProps & { direction: 'row' | 'column' }) => {
  const layout = props.uischema as any;
  const elements = useEffectiveElements(
    layout.elements ?? [],
    props.path,
    props.config
  );
  if (!props.visible) return null;
  const gap = resolveGap(layout.options, props.config, direction, {
    row: 16,
    column: 16,
  });
  const grid = resolveGridColumns(layout.options, props.config);
  return (
    <div
      data-layout={direction}
      className={`shadcn-jsonforms-layout shadcn-jsonforms-layout-${direction}`}
      style={containerStyle(layout.options, props.config, direction, {
        row: 16,
        column: 16,
      })}
    >
      {elements.map((child: any, index: number) => (
        <div
          key={`${child.scope ?? child.type}-${index}`}
          style={
            itemSizing(
              child,
              direction,
              grid,
              gap,
              layout.options?.minItemWidth
            ).style
          }
        >
          <JsonFormsDispatch
            schema={props.schema}
            uischema={child}
            path={props.path}
            enabled={props.enabled}
            renderers={props.renderers}
            cells={props.cells}
          />
        </div>
      ))}
    </div>
  );
};
