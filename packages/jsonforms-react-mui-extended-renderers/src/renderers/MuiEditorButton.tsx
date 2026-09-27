import React from 'react';
import { Button } from '@mui/material';
import type { EditorActionProps } from '@chobantonov/jsonforms-react-extended-renderers';

export const MuiEditorButton = ({
  variant,
  icon,
  children,
  ...props
}: EditorActionProps) => (
  <Button
    type='button'
    variant={variant === 'primary' ? 'contained' : 'outlined'}
    color={variant === 'danger' ? 'error' : 'primary'}
    {...props}
  >
    {icon}
    {children}
  </Button>
);
