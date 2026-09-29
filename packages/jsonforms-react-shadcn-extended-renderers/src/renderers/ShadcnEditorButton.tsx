import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';

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

/** Compact editor action; title and accessible name come from the shared translator. */
export const ShadcnEditorToggleButton = ({
  variant: _variant,
  icon,
  children,
  ...props
}: EditorActionProps) => (
  <Button
    type='button'
    variant='ghost'
    size='icon'
    className='h-8 w-8'
    {...props}
  >
    {icon}
    {children}
  </Button>
);
