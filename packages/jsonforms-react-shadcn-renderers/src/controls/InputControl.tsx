import { useMixedScalar } from '@chobantonov/jsonforms-react-renderer-common/mixedScalar';
import { usePreTouchErrors } from '@chobantonov/jsonforms-react-renderer-common/preTouchErrors';
import { useJsonForms } from '@jsonforms/react';
import {
  getControlHelp,
  ControlHelpProps,
} from '@chobantonov/jsonforms-react-renderer-common/controlHelp';
import { ControlProps } from '@jsonforms/core';
import React, { useContext } from 'react';
import { ShadcnCellMode } from '../cells/asCell';
import { ClearValueButton } from '../components/ClearValueButton';
import { Input } from '@jsonforms-react-shadcn-ui/input';

export const toStringValue = (value: unknown) =>
  value === undefined ? '' : String(value);

export const makeId = (path: string, label?: string) =>
  `shadcn-jsonforms-${path || label || 'root'}`.replace(/[^a-zA-Z0-9_-]/g, '-');

export const InputShell = ({
  id,
  label,
  required,
  description,
  errors: rawErrors,
  path = '',
  schema,
  children,
  config,
  uischema,
}: React.PropsWithChildren<
  ControlHelpProps & {
    config?: ControlHelpProps['config'] & { hideRequiredAsterisk?: boolean };
    uischema?: ControlHelpProps['uischema'] & {
      label?: ControlProps['uischema']['label'];
      options?: { hideRequiredAsterisk?: boolean };
    };
    id: string;
    path?: string;
    schema?: ControlProps['schema'];
    label?: string;
    required?: boolean;
    description?: string;
    errors?: string;
  }
>) => {
  const ctx = useJsonForms();
  const { errors, focused, onFocus, onBlur } = usePreTouchErrors({
    errors: rawErrors,
    path,
    schema,
    config: config ?? ctx.config,
    uischema: uischema as ControlProps['uischema'],
  });
  const help = getControlHelp(
    { description, errors, config: config ?? ctx.config, uischema },
    focused
  );
  const cell = useContext(ShadcnCellMode);
  if (cell)
    return (
      <div
        className='shadcn-jsonforms-cell'
        title={errors || undefined}
        onFocusCapture={onFocus}
        onBlurCapture={onBlur}
      >
        {children}
      </div>
    );
  return (
    <div
      className='shadcn-jsonforms-field'
      onFocusCapture={onFocus}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          onBlur();
      }}
    >
      {label && uischema?.label !== false ? (
        <label className='shadcn-jsonforms-label' htmlFor={id}>
          {label}
          {required &&
          !(
            uischema?.options?.hideRequiredAsterisk ??
            (config ?? ctx.config)?.hideRequiredAsterisk
          ) ? (
            <span aria-hidden='true'> *</span>
          ) : null}
        </label>
      ) : null}
      {children}
      {help && !errors ? (
        <div className='shadcn-jsonforms-description'>{help}</div>
      ) : null}
      {errors ? (
        <div
          id={`${id}-errors`}
          role='alert'
          className='shadcn-jsonforms-error'
        >
          {errors}
        </div>
      ) : null}
    </div>
  );
};

export const ShadcnInputControl = ({
  data,
  schema,
  config,
  description,
  enabled,
  errors,
  handleChange: originalHandleChange,
  label,
  path,
  required,
  readonly,
  uischema,
  visible,
  type = 'text',
  suggestions,
}: ControlProps & { type?: string; suggestions?: string[] }) => {
  const keepEmptyString = useMixedScalar(path);
  const handleChange = (target: string, value: any) =>
    originalHandleChange(
      target,
      keepEmptyString && value === undefined ? '' : value
    );
  if (!visible) return null;
  const id = makeId(path, label);
  const inputType = uischema.options?.format ?? type;

  return (
    <InputShell
      path={path}
      schema={schema}
      config={config}
      uischema={uischema}
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
          maxLength={
            uischema.options?.restrict ?? config?.restrict
              ? schema.maxLength
              : undefined
          }
          disabled={!enabled || readonly}
          aria-invalid={Boolean(errors)}
          aria-describedby={errors ? `${id}-errors` : undefined}
          list={suggestions ? `${id}-suggestions` : undefined}
          value={toStringValue(data)}
          onChange={(event) =>
            handleChange(path, event.currentTarget.value || undefined)
          }
        />
        {suggestions && (
          <datalist id={`${id}-suggestions`}>
            {suggestions.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        )}
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
    handleChange: originalHandleChange,
    path,
    readonly,
    uischema,
    visible,
  } = props;
  const keepSelectedType = useMixedScalar(path);
  const handleChange = (target: string, value: any) =>
    originalHandleChange(
      target,
      keepSelectedType && value === undefined ? 0 : value
    );
  if (!visible) return null;
  const id = makeId(path, props.label);

  return (
    <InputShell
      {...props}
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
          disabled={!enabled || readonly}
          value={toStringValue(data)}
          onChange={(event) => {
            const value = event.currentTarget.value;
            handleChange(
              path,
              value === ''
                ? undefined
                : props.integer
                ? Math.trunc(Number(value))
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
