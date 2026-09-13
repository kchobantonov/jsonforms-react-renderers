import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ColorPicker } from 'primereact/colorpicker';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { colorPickerValue } from '@chobantonov/jsonforms-react-extended-renderers';
export { extendedColorTester as primeColorControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
export const PrimeColorControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const options = { ...props.config, ...props.uischema.options };
  const disabled = !props.enabled || Boolean(props.readonly);
  const change = (value: string) => {
    if (!disabled) props.handleChange(props.path, value || undefined);
  };
  return (
    <div className='field'>
      <label htmlFor={props.id}>
        {props.label}
        {props.required && !options.hideRequiredAsterisk ? ' *' : ''}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <InputText
          id={props.id}
          style={{ flex: 1, minWidth: 0 }}
          value={props.data ?? ''}
          disabled={disabled}
          invalid={Boolean(props.errors)}
          autoFocus={options.focus}
          placeholder={options.placeholder ?? '#RRGGBB'}
          onChange={(event) => change(event.target.value)}
        />
        <ColorPicker
          value={colorPickerValue(props.data).slice(1)}
          format='hex'
          disabled={disabled}
          onChange={(event) => change('#' + event.value)}
        />
        {(options.clearable ?? true) && props.data && !disabled && (
          <Button
            type='button'
            text
            rounded
            icon='pi pi-times'
            aria-label='Clear value'
            onClick={() => change('')}
          />
        )}
      </div>
      <small className={props.errors ? 'p-error' : undefined}>
        {props.errors || props.description}
      </small>
    </div>
  );
};
export const PrimeColorControlRenderer =
  withJsonFormsControlProps(PrimeColorControl);
