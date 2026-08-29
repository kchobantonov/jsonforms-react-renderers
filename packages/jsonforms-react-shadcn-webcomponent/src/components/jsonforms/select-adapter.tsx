import type { ShadcnSelectProps } from '@chobantonov/jsonforms-react-shadcn-renderers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../ui/utils';

export const JsonFormsSelect = ({
  className,
  disabled,
  id,
  name,
  onBlur,
  onFocus,
  onValueChange,
  options,
  placeholder,
  required,
  value,
  ...ariaProps
}: ShadcnSelectProps) => (
  <Select
    disabled={disabled}
    name={name}
    required={required}
    value={value || undefined}
    onValueChange={onValueChange}
  >
    <SelectTrigger
      id={id}
      className={cn(
        'shadcn-jsonforms-input shadcn-jsonforms-select',
        className
      )}
      onBlur={onBlur}
      onFocus={onFocus}
      {...ariaProps}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className='shadcn-jsonforms-select-content'>
      {options.map((option) => (
        <SelectItem
          className='shadcn-jsonforms-select-item'
          key={option.value}
          value={option.value}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
import React from 'react';
