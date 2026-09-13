import React, { useRef } from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import {
  durationFields,
  durationFieldMax,
  useDurationControl,
} from '@chobantonov/jsonforms-react-extended-renderers';
export { extendedDurationTester as primeDurationControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
export const PrimeDurationControl = (props: ControlProps) => {
  const state = useDurationControl(props);
  const overlay = useRef<OverlayPanel>(null);
  if (!props.visible) return null;
  return (
    <div className='field'>
      <label htmlFor={props.id}>
        {props.label}
        {props.required && !state.options.hideRequiredAsterisk ? ' *' : ''}
      </label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <InputText
          id={props.id}
          style={{ flex: 1, minWidth: 0 }}
          value={state.value}
          disabled={state.disabled}
          invalid={Boolean(state.error)}
          autoFocus={state.options.focus}
          placeholder={state.options.placeholder ?? 'P1DT2H'}
          onChange={(event) => state.changeText(event.target.value)}
        />
        {(state.options.clearable ?? true) &&
          state.value &&
          !state.disabled && (
            <Button
              type='button'
              text
              icon='pi pi-times'
              aria-label='Clear value'
              onClick={() => state.changeText('')}
            />
          )}
        <Button
          type='button'
          icon='pi pi-clock'
          aria-label='Edit duration'
          disabled={state.disabled}
          onClick={(event) => {
            state.openPicker();
            overlay.current?.show(event, event.currentTarget);
          }}
        />
      </div>
      <small className={state.error ? 'p-error' : undefined}>
        {state.error || props.description}
      </small>
      <OverlayPanel ref={overlay} onHide={state.close}>
        <div style={{ display: 'grid', gap: '1rem', width: 280 }}>
          {durationFields.map((field) => (
            <div key={field}>
              <label htmlFor={`${props.id}-${field}`}>
                {field[0].toUpperCase() + field.slice(1)}
              </label>
              <InputNumber
                inputId={`${props.id}-${field}`}
                value={state.draft[field]}
                disabled={state.fieldDisabled(field)}
                min={0}
                max={durationFieldMax[field]}
                maxFractionDigits={0}
                onValueChange={(event) =>
                  state.changePart(field, event.value ?? 0)
                }
              />
            </div>
          ))}
          {state.showActions && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
              }}
            >
              <Button
                type='button'
                text
                label={state.options.cancelLabel ?? 'Cancel'}
                onClick={() => {
                  state.close();
                  overlay.current?.hide();
                }}
              />
              <Button
                type='button'
                label={state.options.okLabel ?? 'OK'}
                onClick={() => {
                  state.apply();
                  overlay.current?.hide();
                }}
              />
            </div>
          )}
        </div>
      </OverlayPanel>
    </div>
  );
};
export const PrimeDurationControlRenderer =
  withJsonFormsControlProps(PrimeDurationControl);
