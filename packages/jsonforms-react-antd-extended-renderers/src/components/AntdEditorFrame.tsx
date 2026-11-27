import { ControlFormItem } from '@chobantonov/jsonforms-react-antd-renderers';
import React from 'react';
import { EditorControlFrameProps } from '@chobantonov/jsonforms-react-extended-renderers';
export const AntdEditorFrame = ({
  children,
  ...props
}: EditorControlFrameProps) => (
  <ControlFormItem
    label={props.label}
    required={props.required}
    errors={props.errors || undefined}
    help={props.errors || props.description}
  >
    {children}
  </ControlFormItem>
);
