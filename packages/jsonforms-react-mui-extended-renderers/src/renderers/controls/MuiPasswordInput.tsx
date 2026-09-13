import React, { useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { useInputComponent } from '@jsonforms/material-renderers';
import { IconButton, InputAdornment } from '@mui/material';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';

export const MuiPasswordInput = (props: ControlProps) => {
  const [show, setShow] = useState(false);
  const Input = useInputComponent();
  const options = { ...props.config, ...props.uischema.options };
  const editable = props.enabled && !props.readonly;
  return (
    <Input
      id={props.id}
      label={props.label}
      type={show ? 'text' : 'password'}
      value={props.data ?? ''}
      disabled={!props.enabled}
      readOnly={props.readonly}
      error={Boolean(props.errors)}
      fullWidth={!options.trim || props.schema.maxLength === undefined}
      autoFocus={options.focus}
      placeholder={options.placeholder}
      inputProps={{
        maxLength: options.restrict ? props.schema.maxLength : undefined,
        size: options.trim ? props.schema.maxLength : undefined,
        autoComplete: options.autoComplete ?? 'current-password',
      }}
      onChange={(event) => {
        if (editable)
          props.handleChange(props.path, event.target.value || undefined);
      }}
      endAdornment={
        <InputAdornment position='end'>
          {(options.clearable ?? true) && editable && Boolean(props.data) && (
            <IconButton
              size='small'
              aria-label='Clear value'
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => props.handleChange(props.path, undefined)}
            >
              <Close fontSize='small' />
            </IconButton>
          )}
          <IconButton
            size='small'
            disabled={!props.enabled}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShow((value) => !value)}
          >
            {show ? (
              <VisibilityOff fontSize='small' />
            ) : (
              <Visibility fontSize='small' />
            )}
          </IconButton>
        </InputAdornment>
      }
    />
  );
};
