import React from 'react';
import { Button } from 'primereact/button';
import type { EditorActionProps } from '@chobantonov/jsonforms-react-extended-renderers';

export const PrimeEditorButton = ({
  variant,
  icon,
  children,
  ...props
}: EditorActionProps) => (
  <Button
    type='button'
    severity={variant === 'danger' ? 'danger' : undefined}
    outlined={variant !== 'primary'}
    {...props}
  >
    {icon}
    {children}
  </Button>
);
