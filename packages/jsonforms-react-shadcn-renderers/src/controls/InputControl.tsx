import { ControlProps } from '@jsonforms/core';
import React from 'react';
import { ClearValueButton } from '../components/ClearValueButton';
import { Input } from '../components/ui/input';

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
  config,
  description,
  enabled,
  errors,
  handleChange,
  label,
  path,
  required,
  readonly,
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
      <div className='group relative w-full'>
        <Input
          id={id}
          className='shadcn-jsonforms-input pr-10'
          type={inputType}
          disabled={!enabled}
          value={toStringValue(data)}
          onChange={(event) =>
            handleChange(path, event.currentTarget.value || undefined)
          }
        />
        <ClearValueButton
          clearable={uischema.options?.clearable ?? config?.clearable ?? true}
          data={data}
          enabled={enabled}
          readonly={readonly}
          onClear={() => handleChange(path, undefined)}
        />
      </div>
    </InputShell>
  );
};

export const ShadcnNumberControl = (
  props: ControlProps & { integer?: boolean }
) => {
  const {
    config,
    data,
    enabled,
    handleChange,
    path,
    readonly,
    uischema,
    visible,
  } = props;
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
      <div className='group relative w-full'>
        <Input
          id={id}
          className='shadcn-jsonforms-input pr-10'
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
        <ClearValueButton
          clearable={uischema.options?.clearable ?? config?.clearable ?? true}
          data={data}
          enabled={enabled}
          readonly={readonly}
          onClear={() => handleChange(path, undefined)}
        />
      </div>
    </InputShell>
  );
};
