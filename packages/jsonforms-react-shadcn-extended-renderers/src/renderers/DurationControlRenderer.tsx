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
  DurationParts,
  EMPTY_DURATION_PARTS,
  formatDurationIso,
  parseDuration,
} from './duration';

export const durationControlTester: RankedTester = rankWith(
  2,
  and(isStringControl, formatIs('duration'))
);
const fields: Array<keyof DurationParts> = [
  'weeks',
  'years',
  'months',
  'days',
  'hours',
  'minutes',
  'seconds',
];

export const ShadcnDurationControl = (props: ControlProps) => {
  const [open, setOpen] = React.useState(false);
  const [parts, setParts] = React.useState<DurationParts>(
    () => parseDuration(props.data) ?? EMPTY_DURATION_PARTS
  );
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const value = typeof props.data === 'string' ? props.data : '';
  const valid = !value || parseDuration(value) !== null;

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
          placeholder='P1DT2H'
          disabled={!props.enabled}
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
          disabled={!props.enabled}
          aria-expanded={open}
          onClick={() => {
            setParts(parseDuration(value) ?? EMPTY_DURATION_PARTS);
            setOpen((current) => !current);
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
                disabled={field !== 'weeks' && parts.weeks > 0}
                onChange={(event) =>
                  setParts((current) => ({
                    ...current,
                    [field]: Number(event.currentTarget.value),
                  }))
                }
              />
            </label>
          ))}
          <div className='shadcn-jsonforms-duration-actions'>
            <Button
              className='shadcn-jsonforms-button shadcn-jsonforms-button-sm'
              size='sm'
              onClick={() => {
                props.handleChange(props.path, formatDurationIso(parts));
                setOpen(false);
              }}
            >
              Apply
            </Button>
            <Button
              className='shadcn-jsonforms-button shadcn-jsonforms-button-ghost shadcn-jsonforms-button-sm'
              variant='ghost'
              size='sm'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </InputShell>
  );
};

export const DurationControlRenderer = withJsonFormsControlProps(
  ShadcnDurationControl
);
