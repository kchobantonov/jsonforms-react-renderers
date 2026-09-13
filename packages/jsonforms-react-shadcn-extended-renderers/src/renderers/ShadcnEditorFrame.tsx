import React from 'react';
import { EditorControlFrameProps } from '@chobantonov/jsonforms-react-extended-renderers';
import { InputShell } from '@chobantonov/jsonforms-react-shadcn-renderers';
export const ShadcnEditorFrame = ({
  children,
  ...props
}: EditorControlFrameProps) => (
  <InputShell
    id={props.id}
    label={props.label}
    required={props.required}
    description={props.description}
    errors={props.errors}
  >
    {children}
  </InputShell>
);
