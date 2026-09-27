import React from 'react';
import {
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  VerticalLayout,
} from '@jsonforms/core';
import { AntdLayoutRenderer, AntdLayoutRendererProps } from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

/**
 * Default tester for a vertical layout.
 * @type {RankedTester}
 */
export const verticalLayoutTester: RankedTester = rankWith(
  1,
  uiTypeIs('VerticalLayout')
);

export const VerticalLayoutRenderer = ({
  uischema,
  schema,
  path,
  enabled,
  visible,
  renderers,
  cells,
  config,
}: LayoutProps) => {
  const verticalLayout = uischema as VerticalLayout;
  const childProps: AntdLayoutRendererProps = {
    elements: verticalLayout.elements,
    schema,
    path,
    enabled,
    direction: 'column',
    visible,
    // The container half of the sizing model: gap, wrap, align, justify,
    // minItemWidth, and gridColumns for a horizontal layout.
    layoutOptions: verticalLayout.options as any,
    config,
  };

  return (
    <AntdLayoutRenderer {...childProps} renderers={renderers} cells={cells} />
  );
};

export default withJsonFormsLayoutProps(VerticalLayoutRenderer);
