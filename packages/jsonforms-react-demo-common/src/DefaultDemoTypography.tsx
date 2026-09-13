import React from 'react';
import type { DemoTypographyProps } from './App';

export const DefaultDemoTypography = ({
  component,
  ...props
}: DemoTypographyProps) => React.createElement(component, props);
