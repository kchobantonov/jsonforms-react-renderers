import React, { useRef } from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Popover,
  Stack,
  Button,
} from '@mui/material';
import { Close, Schedule } from '@mui/icons-material';
import {
  durationFields,
  durationFieldMax,
  useDurationControl,
} from '@chobantonov/jsonforms-react-extended-renderers';
export { extendedDurationTester as muiDurationControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
export const MuiDurationControl = (props: ControlProps) => {
  const state = useDurationControl(props);
  const anchor = useRef<HTMLDivElement>(null);
  if (!props.visible) return null;
  return (
    <>
      <TextField
        ref={anchor}
        fullWidth
        id={props.id}
        label={props.label}
        value={state.value}
        required={props.required && !state.options.hideRequiredAsterisk}
        disabled={state.disabled}
        autoFocus={state.options.focus}
        placeholder={state.options.placeholder ?? 'P1DT2H'}
        error={Boolean(state.error)}
        helperText={state.error || props.description}
        onChange={(event) => state.changeText(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position='end'>
                {(state.options.clearable ?? true) &&
                  state.value &&
                  !state.disabled && (
                    <IconButton
                      size='small'
                      aria-label='Clear value'
                      onClick={() => state.changeText('')}
                    >
                      <Close fontSize='small' />
                    </IconButton>
                  )}
                <IconButton
                  size='small'
                  disabled={state.disabled}
                  aria-label='Edit duration'
                  onClick={state.openPicker}
                >
                  <Schedule fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        open={state.open && !state.disabled}
        anchorEl={anchor.current}
        onClose={state.close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack
          spacing={2}
          sx={{ p: 2, width: 280 }}
          role='group'
          aria-label='Duration components'
        >
          {durationFields.map((field) => (
            <TextField
              key={field}
              size='small'
              type='number'
              label={field[0].toUpperCase() + field.slice(1)}
              value={state.draft[field]}
              disabled={state.fieldDisabled(field)}
              slotProps={{
                htmlInput: { min: 0, max: durationFieldMax[field], step: 1 },
              }}
              onChange={(event) =>
                state.changePart(field, Number(event.target.value))
              }
            />
          ))}
          {state.showActions && (
            <Stack direction='row' spacing={1} justifyContent='flex-end'>
              <Button onClick={state.close}>
                {state.options.cancelLabel ?? 'Cancel'}
              </Button>
              <Button onClick={state.apply}>
                {state.options.okLabel ?? 'OK'}
              </Button>
            </Stack>
          )}
        </Stack>
      </Popover>
    </>
  );
};
export const MuiDurationControlRenderer =
  withJsonFormsControlProps(MuiDurationControl);
