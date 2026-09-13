import { Layout, LayoutProps, RankedTester } from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import {
  sharedSplitLayoutTester,
  splitCssSize,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import React from 'react';

export const primeSplitLayoutTester: RankedTester = (ui, schema, context) =>
  sharedSplitLayoutTester(ui, schema, context) < 0 ? -1 : 5;
export const PrimeSplitLayout = (props: LayoutProps) => {
  const layout = props.uischema as Layout;
  const vertical = layout.type === 'VerticalLayout';
  const options = { ...props.config, ...layout.options };
  if (!props.visible) return null;
  return (
    <Splitter
      layout={vertical ? 'vertical' : 'horizontal'}
      style={{
        height: vertical ? splitCssSize(options.height) ?? '20rem' : undefined,
        minHeight: vertical ? splitCssSize(options.minHeight) : undefined,
      }}
    >
      {layout.elements.map((element, index) => (
        <SplitterPanel
          key={index}
          size={100 / layout.elements.length}
          minSize={1}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              minWidth: 0,
              overflow: 'auto',
              padding: 8,
            }}
          >
            <JsonFormsDispatch
              schema={props.schema}
              uischema={element}
              path={props.path}
              enabled={props.enabled}
              renderers={props.renderers}
              cells={props.cells}
            />
          </div>
        </SplitterPanel>
      ))}
    </Splitter>
  );
};
export const PrimeSplitLayoutRenderer =
  withJsonFormsLayoutProps(PrimeSplitLayout);
