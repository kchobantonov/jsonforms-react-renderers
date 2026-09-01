import { Box, IconButton, TextField, Tooltip } from '@mui/material';
import React from 'react';

export interface MuiAdditionalPropertyAddProps {
  disabled: boolean;
  error?: string;
  label: string;
  onAdd: () => void;
  onChange: (value: string) => void;
  value: string;
}

export const MuiAdditionalPropertyAdd = ({
  disabled,
  error,
  label,
  onAdd,
  onChange,
  value,
}: MuiAdditionalPropertyAddProps) => (
  <Box sx={{ alignItems: 'flex-start', display: 'flex', gap: 0.5 }}>
    <TextField
      aria-label={label ? `Add property to ${label}` : 'Add property'}
      error={Boolean(error)}
      fullWidth
      helperText={error}
      label='Property Name'
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onAdd();
        }
      }}
      size='small'
      value={value}
    />
    <Tooltip title='Add property'>
      <span>
        <IconButton
          aria-label='Add property'
          disabled={disabled}
          onClick={onAdd}
          size='small'
          sx={{ mt: 0.5 }}
        >
          +
        </IconButton>
      </span>
    </Tooltip>
  </Box>
);
