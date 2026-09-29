import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const alertVariants: (
  props?: {
    variant?: 'default' | 'destructive';
  } & import('class-variance-authority/dist/types').ClassProp
) => string;
declare const Alert: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<
      (
        props?: {
          variant?: 'default' | 'destructive';
        } & import('class-variance-authority/dist/types').ClassProp
      ) => string
    > &
    React.RefAttributes<HTMLDivElement>
>;
declare const AlertTitle: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLHeadingElement> &
    React.RefAttributes<HTMLParagraphElement>
>;
declare const AlertDescription: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLParagraphElement> &
    React.RefAttributes<HTMLParagraphElement>
>;
export { Alert, AlertDescription, AlertTitle, alertVariants };
