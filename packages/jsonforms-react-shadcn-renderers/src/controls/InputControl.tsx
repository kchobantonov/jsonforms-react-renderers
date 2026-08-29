import { ControlProps } from '@jsonforms/core';
import React from 'react';
import { useShadcnComponents } from '../components';

export const toStringValue = (value: unknown) =>
  value === undefined ? '' : String(value);

export const makeId = (path: string, label?: string) =>
  `shadcn-jsonforms-${path || label || 'root'}`.replace(/[^a-zA-Z0-9_-]/g, '-');

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
  <div className='shadcn-jsonforms-field'>
    {label ? (
      <label className='shadcn-jsonforms-label' htmlFor={id}>
        {label}
        {required ? <span aria-hidden='true'> *</span> : null}
      </label>
    ) : null}
    {children}
    {description ? (
      <div className='shadcn-jsonforms-description'>{description}</div>
    ) : null}
    {errors ? <div className='shadcn-jsonforms-error'>{errors}</div> : null}
  </div>
);

export const ShadcnInputControl = ({
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
  const { Input } = useShadcnComponents();
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
      <Input
        id={id}
        className='shadcn-jsonforms-input'
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

export const ShadcnNumberControl = (
  props: ControlProps & { integer?: boolean }
) => {
  const { Input } = useShadcnComponents();
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
      <Input
        id={id}
        className='shadcn-jsonforms-input'
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
