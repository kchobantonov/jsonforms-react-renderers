import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import { colorPickerValue } from '@chobantonov/jsonforms-react-extended-renderers';
export { extendedColorTester as muiColorControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
export const MuiColorControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const options = { ...props.config, ...props.uischema.options };
  const disabled = !props.enabled || Boolean(props.readonly);
  const change = (value: string) => {
    if (!disabled) props.handleChange(props.path, value || undefined);
  };
  return (
    <TextField
      fullWidth
      id={props.id}
      label={props.label}
      value={props.data ?? ''}
      required={props.required && !options.hideRequiredAsterisk}
      disabled={disabled}
      autoFocus={options.focus}
      placeholder={options.placeholder ?? '#RRGGBB'}
      error={Boolean(props.errors)}
      helperText={props.errors || props.description}
      onChange={(event) => change(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position='start'>
              <Box
                component='input'
                type='color'
                aria-label={`${props.label || 'Color'} picker`}
                value={colorPickerValue(props.data)}
                disabled={disabled}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  change(event.target.value)
                }
                sx={{
                  width: 28,
                  height: 28,
                  border: 0,
                  p: 0,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                }}
              />
            </InputAdornment>
          ),
          endAdornment:
            (options.clearable ?? true) && !disabled && props.data ? (
              <InputAdornment position='end'>
                <IconButton
                  aria-label='Clear value'
                  size='small'
                  onClick={() => change('')}
                >
                  <Close fontSize='small' />
                </IconButton>
              </InputAdornment>
            ) : undefined,
        },
      }}
    />
  );
};
export const MuiColorControlRenderer =
  withJsonFormsControlProps(MuiColorControl);
