import { ControlProps, isDescriptionHidden } from '@jsonforms/core';
import React, { useCallback } from 'react';

import merge from 'lodash/merge';
import { AntdCheckbox } from '../antd-controls';
import { ControlFormItem, useCellMode } from '../util';
import { usePreTouchErrors } from '../util/preTouchErrors';
import {
  clearedDynamicPropertyValue,
  PRESERVE_DYNAMIC_PROPERTY_OPTION,
} from '../util/dynamicProperties';

export interface WithInput {
  input: any;
}

export const InputControl = (props: ControlProps & WithInput) => {
  const cell = useCellMode();
  const { id, description, label, uischema, visible, required, config, input } =
    props;
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
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const preserveDynamicPropertyKey =
    appliedUiSchemaOptions[PRESERVE_DYNAMIC_PROPERTY_OPTION] === true;
  const handleInputChange = useCallback(
    (changedPath: string, value: unknown) => {
      props.handleChange(
        changedPath,
        preserveDynamicPropertyKey && value === undefined
          ? clearedDynamicPropertyValue(props.schema, props.rootSchema)
          : value
      );
    },
    [
      preserveDynamicPropertyKey,
      props.handleChange,
      props.rootSchema,
      props.schema,
    ]
  );

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  // const firstFormHelperText = showDescription
  //   ? description
  //   : !isValid
  //   ? errors
  //   : null;
  // const secondFormHelperText = showDescription && !isValid ? errors : null;
  const help = !isValid ? errors : showDescription ? description : null;
  const helpId = help ? `${id}-input-help` : undefined;

  const InnerComponent = input;
  const style = { width: '100%' };

  if (!visible) {
    return null;
  }

  return (
    <ControlFormItem
      required={required}
      errors={isValid ? undefined : errors}
      label={input !== AntdCheckbox ? label : ''}
      help={help ? <span id={helpId}>{help}</span> : null}
      style={style}
      htmlFor={id + '-input'}
      id={id}
    >
      <InnerComponent
        {...props}
        handleChange={handleInputChange}
        label={cell ? '' : label}
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
