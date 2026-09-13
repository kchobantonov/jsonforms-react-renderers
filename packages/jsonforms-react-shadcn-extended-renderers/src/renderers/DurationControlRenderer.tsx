import {
  ControlProps,
  RankedTester,
  and,
  formatIs,
  isStringControl,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Button,
  Input,
  InputShell,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import React from 'react';
import {
  useDurationControl,
  durationFields,
  durationFieldMax,
} from '@chobantonov/jsonforms-react-extended-renderers';

export const durationControlTester: RankedTester = rankWith(
  2,
  and(isStringControl, formatIs('duration'))
);
const fields = durationFields;

export const ShadcnDurationControl = (props: ControlProps) => {
  const state = useDurationControl(props);
  const { open, draft: parts } = state;
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const value = state.value;
  const valid = !state.error;

  return (
    <InputShell
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={
        !valid
          ? 'Enter an ISO 8601 duration, for example P2DT3H.'
          : props.errors
      }
    >
      <div className='shadcn-jsonforms-duration-control'>
        <Input
          className='shadcn-jsonforms-input'
          id={id}
          value={value}
          placeholder={state.options.placeholder ?? 'P1DT2H'}
          autoFocus={state.options.focus}
          disabled={state.disabled}
          onChange={(event) =>
            props.handleChange(
              props.path,
              event.currentTarget.value || undefined
            )
          }
        />
        <Button
          className='shadcn-jsonforms-button shadcn-jsonforms-button-outline shadcn-jsonforms-button-sm'
          variant='outline'
          size='sm'
          disabled={state.disabled}
          aria-expanded={open}
          onClick={() => {
            open ? state.close() : state.openPicker();
          }}
        >
          Duration
        </Button>
      </div>
      {open ? (
        <div className='shadcn-jsonforms-duration-picker'>
          {fields.map((field) => (
            <label key={field}>
              {field}
              <Input
                className='shadcn-jsonforms-input'
                type='number'
                min={0}
                value={parts[field]}
                disabled={state.fieldDisabled(field)}
                max={durationFieldMax[field]}
                onChange={(event) =>
                  state.changePart(field, Number(event.currentTarget.value))
                }
              />
            </label>
          ))}
          {state.showActions && (
            <div className='shadcn-jsonforms-duration-actions'>
              <Button
                className='shadcn-jsonforms-button shadcn-jsonforms-button-sm'
                size='sm'
                onClick={() => {
                  state.apply();
                }}
              >
                {state.options.okLabel ?? 'Apply'}
              </Button>
              <Button
                className='shadcn-jsonforms-button shadcn-jsonforms-button-ghost shadcn-jsonforms-button-sm'
                variant='ghost'
                size='sm'
                onClick={() => state.close()}
              >
                {state.options.cancelLabel ?? 'Cancel'}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </InputShell>
  );
};

export const DurationControlRenderer = withJsonFormsControlProps(
  ShadcnDurationControl
);
