import { getControlHelp } from '@chobantonov/jsonforms-react-renderer-common/controlHelp';
import { ControlProps } from '@jsonforms/core';
import React, { useCallback } from 'react';

import { AntdCheckbox } from '../antd-controls';
import { ControlFormItem, useCellMode } from '../util';
import { usePreTouchErrors } from '../util/preTouchErrors';
import {
  clearedDynamicPropertyValue,
  useDynamicProperty,
} from '../util/dynamicProperties';

export interface WithInput {
  input: any;
}

export const InputControl = (props: ControlProps & WithInput) => {
  const cell = useCellMode();
  const { id, label, visible, required, config, input } = props;
  /*
    Replaces `useFocus`: the same focus state, plus the touch state pre-touch
    error filtering needs, and the filtered message. With filtering off this
    returns `props.errors` unchanged.
  */
  const { errors, focused, onFocus, onBlur } = usePreTouchErrors({
    errors: props.errors,
    path: props.path,
    schema: props.schema,
    uischema: props.uischema as any,
    config,
  });
  const isValid = errors.length === 0;
  const preserveDynamicPropertyKey = useDynamicProperty(props.path);
  const handleInputChange = useCallback(
    (changedPath: string, value: unknown) => {
      props.handleChange(
        changedPath,
        preserveDynamicPropertyKey &&
          changedPath === props.path &&
          value === undefined
          ? clearedDynamicPropertyValue(props.schema, props.rootSchema)
          : value
      );
    },
    [
      preserveDynamicPropertyKey,
      props.handleChange,
      props.path,
      props.rootSchema,
      props.schema,
    ]
  );

  const help = getControlHelp({ ...props, errors }, focused);

  const helpId = help ? `${id}-input-help` : undefined;

  const InnerComponent = input;
  const style = { width: '100%' };

  if (!visible) {
    return null;
  }

  return (
    <ControlFormItem
      hideRequiredAsterisk={props.uischema.options?.hideRequiredAsterisk}
      path={props.path}
      required={required}
      errors={isValid ? undefined : errors}
      label={
        input !== AntdCheckbox && props.uischema.label !== false ? label : ''
      }
      help={help ? <span id={helpId}>{help}</span> : null}
      style={style}
      htmlFor={id + '-input'}
      id={id}
    >
      <InnerComponent
        {...props}
        handleChange={handleInputChange}
        label={cell || props.uischema.label === false ? '' : label}
        inputProps={{
          onFocus,
          onBlur,
          'aria-describedby': helpId,
        }}
        id={id + '-input'}
        isValid={isValid}
        visible={visible}
      />
    </ControlFormItem>
  );
};
