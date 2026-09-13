import React from 'react';
import { Typography } from '@mui/material';
import type { DemoTypographyProps } from '@chobantonov/jsonforms-react-demo-common';

export const MuiDemoTypography = ({
  component,
  className,
  children,
}: DemoTypographyProps) => (
  <Typography
    component={component}
    className={className}
    variant={
      component === 'h1'
        ? 'h5'
        : component === 'h2'
        ? 'h6'
        : component === 'h3'
        ? 'subtitle1'
        : 'body1'
    }
  >
    {children}
  </Typography>
);
