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

export const colorControlTester: RankedTester = rankWith(
  2,
  and(isStringControl, formatIs('color'))
);

export const normalizeColor = (value: unknown): string => {
  if (typeof value !== 'string') return '#000000';
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .slice(1)
      .split('')
      .map((part) => part + part)
      .join('')}`;
  }
  if (/^#[0-9a-f]{8}$/i.test(value)) return value.slice(0, 7);
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
};

export const ShadcnColorControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const value = typeof props.data === 'string' ? props.data : '';

  return (
    <InputShell
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <div className='shadcn-jsonforms-color-control'>
        <Input
          className='shadcn-jsonforms-input'
          id={id}
          value={value}
          placeholder='#RRGGBB'
          disabled={!props.enabled}
          onChange={(event) => {
            const next = event.currentTarget.value;
            props.handleChange(props.path, next || undefined);
          }}
        />
        <Input
          aria-label={`${props.label || 'Color'} picker`}
          className='shadcn-jsonforms-color-picker shadcn-jsonforms-input'
          type='color'
          value={normalizeColor(value)}
          disabled={!props.enabled}
          onChange={(event) =>
            props.handleChange(props.path, event.currentTarget.value)
          }
        />
        {value ? (
          <Button
            className='shadcn-jsonforms-button shadcn-jsonforms-button-ghost shadcn-jsonforms-button-sm'
            variant='ghost'
            size='sm'
            disabled={!props.enabled}
            onClick={() => props.handleChange(props.path, undefined)}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </InputShell>
  );
};

export const ColorControlRenderer =
  withJsonFormsControlProps(ShadcnColorControl);
