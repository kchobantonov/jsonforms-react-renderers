import React from 'react';
export declare const RadioGroup: React.ComponentType<
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    onValueChange?: (value: string) => void;
  }
>;
export declare const RadioGroupItem: React.ComponentType<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>;
