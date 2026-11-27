import React from 'react';
import type { ControlProps } from '@jsonforms/core';
import { ControlFormItem } from '@chobantonov/jsonforms-react-antd-renderers';

export function PickerFormItem({
  props,
  error,
  children,
}: React.PropsWithChildren<{ props: ControlProps; error?: string }>) {
  return (
    <ControlFormItem
      adornmentSchema={props.schema}
      adornmentOptions={props.uischema.options as Record<string, unknown>}
      id={props.id}
      required={props.required}
      errors={error || undefined}
      label={props.label}
      help={error || props.description}
    >
      {children}
    </ControlFormItem>
  );
}
