import { ControlFormItem, useDebouncedChange } from '../util';
import { usePreTouchErrors } from '../util/preTouchErrors';
import React from 'react';
import {
  ControlProps,
  isDateControl,
  isDescriptionHidden,
  isTimeControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import { Input } from 'antd';

export const NativeControl = (props: ControlProps) => {
  const {
    id,
    label,
    schema,
    description,
    enabled,
    visible,
    required,
    path,
    handleChange,
    data,
    config,
  } = props;
  // See `usePreTouchErrors`; with filtering off this is `props.errors`.
  const { errors, focused, onFocus, onBlur } = usePreTouchErrors({
    errors: props.errors,
    path: props.path,
    schema: props.schema,
    uischema: props.uischema as any,
    config,
  });
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options);
  const [inputValue, onChange] = useDebouncedChange(
    handleChange,
    '',
    data,
    path
  );
  const fieldType = appliedUiSchemaOptions.format ?? schema.format;
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const inputStyle = { width: '100%' };

  if (!visible) {
    return null;
  }

  return (
    <ControlFormItem
      errors={!isValid ? errors : undefined}
      required={required}
      label={label}
      help={!isValid ? errors : showDescription ? description : null}
      htmlFor={id + '-input'}
      id={id}
    >
      <Input
        id={id + '-input'}
        type={fieldType}
        disabled={!enabled}
        style={inputStyle}
        onFocus={onFocus}
        onBlur={onBlur}
        value={inputValue}
        onChange={onChange}
      />
    </ControlFormItem>
  );
};

export const nativeControlTester: RankedTester = rankWith(
  2,
  or(isDateControl, isTimeControl)
);

export default withJsonFormsControlProps(NativeControl);
