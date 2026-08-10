/// <reference path='../ark-ui-react-factory.d.ts' />

import { ControlProps } from '@jsonforms/core';
import { ark } from '@ark-ui/react/factory';
import React from 'react';

export const toStringValue = (value: unknown) =>
  value === undefined ? '' : String(value);

export const makeId = (path: string, label?: string) =>
  `ark-jsonforms-${path || label || 'root'}`.replace(/[^a-zA-Z0-9_-]/g, '-');

export const InputShell = ({
  id,
  label,
  required,
  description,
  errors,
  children,
}: React.PropsWithChildren<{
  id: string;
  label?: string;
  required?: boolean;
  description?: string;
  errors?: string;
}>) => (
  <ark.div className='ark-jsonforms-field'>
    {label ? (
      <ark.label className='ark-jsonforms-label' htmlFor={id}>
        {label}
        {required ? <ark.span aria-hidden='true'> *</ark.span> : null}
      </ark.label>
    ) : null}
    {children}
    {description ? (
      <ark.div className='ark-jsonforms-description'>{description}</ark.div>
    ) : null}
    {errors ? (
      <ark.div className='ark-jsonforms-error'>{errors}</ark.div>
    ) : null}
  </ark.div>
);

export const ArkInputControl = ({
  data,
  description,
  enabled,
  errors,
  handleChange,
  label,
  path,
  required,
  uischema,
  visible,
  type = 'text',
}: ControlProps & { type?: string }) => {
  if (!visible) return null;
  const id = makeId(path, label);
  const inputType = uischema.options?.format ?? type;

  return (
    <InputShell
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <ark.input
        id={id}
        className='ark-jsonforms-input'
        type={inputType}
        disabled={!enabled}
        value={toStringValue(data)}
        onChange={(event) =>
          handleChange(path, event.currentTarget.value || undefined)
        }
      />
    </InputShell>
  );
};

export const ArkNumberControl = (
  props: ControlProps & { integer?: boolean }
) => {
  const { data, enabled, handleChange, path, visible } = props;
  if (!visible) return null;
  const id = makeId(path, props.label);

  return (
    <InputShell
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <ark.input
        id={id}
        className='ark-jsonforms-input'
        type='number'
        step={props.integer ? 1 : 'any'}
        disabled={!enabled}
        value={toStringValue(data)}
        onChange={(event) => {
          const value = event.currentTarget.value;
          handleChange(
            path,
            value === ''
              ? undefined
              : props.integer
              ? parseInt(value, 10)
              : Number(value)
          );
        }}
      />
    </InputShell>
  );
};
