import * as React from 'react';
import type { ShadcnCheckboxProps } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../ui/utils';

export const JsonFormsCheckbox = React.forwardRef<
  HTMLButtonElement,
  ShadcnCheckboxProps
>(({ checked, className, onCheckedChange, ...props }, ref) => (
  <Checkbox
    ref={ref}
    checked={checked}
    onCheckedChange={(value) => onCheckedChange?.(value === true)}
    className={cn('shadcn-jsonforms-checkbox-control', className)}
    {...props}
  />
));
JsonFormsCheckbox.displayName = 'JsonFormsCheckbox';
