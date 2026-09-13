import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
export { extendedNullTester as muiNullControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
export const MuiNullControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const options = { ...props.config, ...props.uischema.options };
  return (
    <FormControl error={Boolean(props.errors)}>
      <FormControlLabel
        label={props.label}
        required={props.required && !options.hideRequiredAsterisk}
        control={
          <Checkbox
            id={props.id}
            checked={props.data === null}
            indeterminate={props.data === undefined}
            disabled={!props.enabled || props.readonly}
            autoFocus={options.focus}
            inputProps={{
              'aria-label': props.label || 'Null value',
              'aria-describedby': `${props.id}-help`,
              'aria-invalid': Boolean(props.errors),
            }}
            onChange={(_event, checked) =>
              props.handleChange(props.path, checked ? null : undefined)
            }
          />
        }
      />
      <FormHelperText id={`${props.id}-help`}>
        {props.errors || props.description}
      </FormHelperText>
    </FormControl>
  );
};
export const MuiNullControlRenderer = withJsonFormsControlProps(MuiNullControl);
