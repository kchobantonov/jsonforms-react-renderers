import React from 'react';
import { Button } from '@chobantonov/jsonforms-react-shadcn-renderers';
import type { EditorActionProps } from '@chobantonov/jsonforms-react-extended-renderers';

export const ShadcnEditorButton = ({
  variant,
  icon,
  children,
  ...props
}: EditorActionProps) => (
  <Button
    type='button'
    variant={
      variant === 'danger'
        ? 'destructive'
        : variant === 'primary'
        ? 'default'
        : 'outline'
    }
    {...props}
  >
    {icon}
    {children}
  </Button>
);
