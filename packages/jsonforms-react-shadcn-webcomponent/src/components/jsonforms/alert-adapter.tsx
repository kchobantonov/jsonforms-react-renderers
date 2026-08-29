import type { ShadcnAlertProps } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Alert } from '../ui/alert';
import { cn } from '../ui/utils';

export const JsonFormsAlert = ({
  className,
  variant = 'default',
  ...props
}: ShadcnAlertProps) => (
  <Alert
    className={cn(
      'shadcn-jsonforms-alert',
      variant === 'destructive' && 'shadcn-jsonforms-alert-destructive',
      className
    )}
    variant={variant}
    {...props}
  />
);
import React from 'react';
