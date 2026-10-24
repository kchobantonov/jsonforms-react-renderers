import React from 'react';
export declare const Slider: React.ComponentType<
  Omit<React.HTMLAttributes<HTMLSpanElement>, 'defaultValue'> & {
    value?: number[];
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onValueChange?: (value: number[]) => void;
  }
>;
