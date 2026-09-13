import React from 'react';
import { EditorControlFrameProps } from '@chobantonov/jsonforms-react-extended-renderers';
import { Message } from 'primereact/message';
export const PrimeEditorFrame = ({
  children,
  ...props
}: EditorControlFrameProps) => (
  <div className='field'>
    <label>
      {props.label}
      {props.required ? ' *' : ''}
    </label>
    {children}
    {props.errors ? (
      <Message severity='error' text={props.errors} />
    ) : (
      <small>{props.description}</small>
    )}
  </div>
);
