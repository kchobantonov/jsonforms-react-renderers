import React from 'react';
import {
  HorizontalLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { AntdLayoutRenderer, AntdLayoutRendererProps } from '../util/layout';

/**
 * Default tester for a horizontal layout.
 * @type {RankedTester}
 */
export const horizontalLayoutTester: RankedTester = rankWith(
  2,
  uiTypeIs('HorizontalLayout')
);

export const HorizontalLayoutRenderer = ({
  uischema,
  renderers,
  cells,
  schema,
  path,
  enabled,
  visible,
  config,
}: LayoutProps) => {
  const layout = uischema as HorizontalLayout;
  const childProps: AntdLayoutRendererProps = {
    elements: layout.elements,
    schema,
    path,
    enabled,
    direction: 'row',
    visible,
    // The container half of the sizing model: gap, wrap, align, justify,
    // minItemWidth, and gridColumns for a horizontal layout.
    layoutOptions: layout.options as any,
    config,
  };

  return (
    <AntdLayoutRenderer {...childProps} renderers={renderers} cells={cells} />
  );
};

export default withJsonFormsLayoutProps(HorizontalLayoutRenderer);
