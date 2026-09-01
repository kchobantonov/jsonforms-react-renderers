import {
  and,
  Layout,
  LayoutProps,
  or,
  RankedTester,
  rankWith,
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import { Splitter } from 'antd';
import React from 'react';

export const hasAntdSplitLayoutVariant = (uischema: UISchemaElement) =>
  String(uischema.options?.variant ?? '').toLowerCase() === 'splitter';

export const antdSplitLayoutTester: RankedTester = rankWith(
  5,
  and(
    or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')),
    hasAntdSplitLayoutVariant
  )
);

export const AntdSplitLayout = (props: LayoutProps) => {
  if (!props.visible) return null;
  const layout = props.uischema as Layout;
  const vertical = layout.type === 'VerticalLayout';
  return (
    <Splitter
      layout={vertical ? 'vertical' : 'horizontal'}
      style={{ minHeight: vertical ? Number(layout.options?.minHeight ?? 320) : 200 }}
    >
      {layout.elements.map((element, index) => (
        <Splitter.Panel defaultSize={`${100 / layout.elements.length}%`} key={index} min='10%'>
          <div style={{ height: '100%', minWidth: 0, overflow: 'auto', padding: 12 }}>
            <JsonFormsDispatch
              cells={props.cells}
              enabled={props.enabled}
              path={props.path}
              renderers={props.renderers}
              schema={props.schema}
              uischema={element}
            />
          </div>
        </Splitter.Panel>
      ))}
    </Splitter>
  );
};

export const AntdSplitLayoutRenderer = withJsonFormsLayoutProps(AntdSplitLayout);
