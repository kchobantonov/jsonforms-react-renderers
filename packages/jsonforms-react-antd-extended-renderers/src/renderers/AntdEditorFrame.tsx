import React from 'react';
import { EditorControlFrameProps } from '@chobantonov/jsonforms-react-extended-renderers';
import { Form } from 'antd';
export const AntdEditorFrame = ({
  children,
  ...props
}: EditorControlFrameProps) => (
  <Form.Item
    label={props.label}
    required={props.required}
    help={props.errors || props.description}
    validateStatus={props.errors ? 'error' : undefined}
  >
    {children}
  </Form.Item>
);
