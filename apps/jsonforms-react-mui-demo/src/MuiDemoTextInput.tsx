import React from 'react';
import { TextField } from '@mui/material';
import type { DemoTextInputProps } from '@chobantonov/jsonforms-react-demo-common';

export const MuiDemoTextInput = ({
  label,
  value,
  placeholder,
  description,
  onChange,
}: DemoTextInputProps) => (
  <TextField
    fullWidth
    size='small'
    label={label}
    value={value}
    placeholder={placeholder}
    helperText={description}
    onChange={(event) => onChange(event.target.value)}
  />
);
