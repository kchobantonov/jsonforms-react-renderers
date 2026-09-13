import React, { useId } from 'react';
import {
  FormControl,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { BrightnessAuto, LightMode, DarkMode } from '@mui/icons-material';
import type { DemoSelectProps } from '@chobantonov/jsonforms-react-demo-common';

export const MuiDemoSegmentedControl = ({
  label,
  value,
  options,
  onChange,
}: DemoSelectProps) => {
  const labelId = useId();
  return (
    <FormControl sx={{ gap: 1 }}>
      <FormLabel id={labelId}>{label}</FormLabel>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size='small'
        value={value}
        aria-labelledby={labelId}
        onChange={(_event, next: string | null) => {
          if (next !== null) onChange(next);
        }}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value} sx={{ gap: 1 }}>
            {option.value === 'system' && <BrightnessAuto fontSize='small' />}
            {option.value === 'light' && <LightMode fontSize='small' />}
            {option.value === 'dark' && <DarkMode fontSize='small' />}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  );
};
