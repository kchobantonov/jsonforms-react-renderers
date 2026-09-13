import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
export { extendedNullTester as primeNullControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
export const PrimeNullControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const options = { ...props.config, ...props.uischema.options };
  return (
    <div className='field'>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <TriStateCheckbox
          id={props.id}
          aria-labelledby={`${props.id}-label`}
          value={props.data === null ? true : null}
          disabled={!props.enabled || props.readonly}
          autoFocus={options.focus}
          invalid={Boolean(props.errors)}
          onChange={(event) =>
            props.handleChange(
              props.path,
              event.value === true ? null : undefined
            )
          }
        />
        <label id={`${props.id}-label`} htmlFor={props.id}>
          {props.label}
          {props.required && !options.hideRequiredAsterisk ? ' *' : ''}
        </label>
      </div>
      <small className={props.errors ? 'p-error' : undefined}>
        {props.errors || props.description}
      </small>
    </div>
  );
};
export const PrimeNullControlRenderer =
  withJsonFormsControlProps(PrimeNullControl);
