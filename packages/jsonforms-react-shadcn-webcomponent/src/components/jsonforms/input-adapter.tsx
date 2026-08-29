import * as React from 'react';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';

export const JsonFormsInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn('shadcn-jsonforms-input', className)}
    {...props}
  />
));
JsonFormsInput.displayName = 'JsonFormsInput';
