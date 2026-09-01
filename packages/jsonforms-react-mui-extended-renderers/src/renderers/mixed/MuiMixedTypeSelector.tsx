import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import React, { useId } from 'react';
import { JsonDataType } from './mixedTypes';

export interface MuiMixedTypeSelectorProps {
  disabled: boolean;
  error?: string;
  label: string;
  onChange: (type: JsonDataType) => void;
  required?: boolean;
  types: JsonDataType[];
  value: JsonDataType | null;
}

export const MuiMixedTypeSelector = ({
  disabled,
  error,
  label,
  onChange,
  required,
  types,
  value,
}: MuiMixedTypeSelectorProps) => {
  const helperTextId = useId();

  return (
    <FormControl error={Boolean(error)} size='small' sx={{ minWidth: 150 }}>
      <InputLabel required={required}>{label || 'Type'}</InputLabel>
      <Select
        aria-label={`${label || 'Value'} type`}
        disabled={disabled}
        inputProps={{
          'aria-describedby': error ? helperTextId : undefined,
        }}
        label={label || 'Type'}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value as JsonDataType)}
      >
        <MenuItem disabled value=''>
          Select type
        </MenuItem>
        {types.map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </Select>
      {error ? (
        <FormHelperText id={helperTextId}>{error}</FormHelperText>
      ) : null}
    </FormControl>
  );
};
