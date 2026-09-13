import React from 'react';
import type { DemoTextInputProps } from './App';

export const DefaultDemoTextInput = ({
  label,
  value,
  placeholder,
  description,
  onChange,
}: DemoTextInputProps) => (
  <label className='demo-ui-field'>
    <span>{label}</span>
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
    {description && <small>{description}</small>}
  </label>
);
