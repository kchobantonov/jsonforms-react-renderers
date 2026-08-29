import { cva } from 'class-variance-authority';
import type { ShadcnButtonProps } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

const jsonFormsButtonVariants = cva('shadcn-jsonforms-button', {
  variants: {
    variant: {
      default: '',
      secondary: 'shadcn-jsonforms-button-secondary',
      outline: 'shadcn-jsonforms-button-outline',
      ghost: 'shadcn-jsonforms-button-ghost',
      destructive: 'shadcn-jsonforms-button-danger',
    },
    size: {
      default: '',
      sm: 'shadcn-jsonforms-button-sm',
      lg: 'shadcn-jsonforms-button-lg',
      icon: 'shadcn-jsonforms-button-icon',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export const JsonFormsButton = ({
  className,
  type = 'button',
  variant,
  size,
  ...props
}: ShadcnButtonProps) => (
  <Button
    type={type}
    variant={variant}
    size={size}
    className={cn(jsonFormsButtonVariants({ variant, size }), className)}
    {...props}
  />
);
import React from 'react';
