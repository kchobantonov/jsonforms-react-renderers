import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const buttonVariants: (
  props?: {
    variant?:
      | 'link'
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  } & import('class-variance-authority/dist/types').ClassProp
) => string;
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;
export { Button, buttonVariants };
