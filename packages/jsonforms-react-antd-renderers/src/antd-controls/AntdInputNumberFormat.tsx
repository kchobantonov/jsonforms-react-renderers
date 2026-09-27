import { CellProps, Formatted, WithClassname } from '@jsonforms/core';
import { Input } from 'antd';
import merge from 'lodash/merge';
import React from 'react';
import { AntdClearableInput } from './AntdClearableInput';

export const AntdInputNumberFormat = (
  props: CellProps &
    WithClassname &
    Formatted<number> & {
      inputProps?: React.ComponentProps<typeof Input | typeof Input.TextArea>;
    }
) => {
  const {
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    schema,
    config,
    inputProps,
  } = props;
  const maxLength = schema.maxLength;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const formattedNumber = props.toFormatted(props.data);

  const onChange = (ev: any) => {
    const validStringNumber = props.fromFormatted(ev.currentTarget.value);
    handleChange(path, validStringNumber);
  };

  let InputComponent: React.ComponentType<any> = Input;

  if (appliedUiSchemaOptions.multi === true) {
    InputComponent = Input.TextArea;
  }

  const inputStyle = { width: '100%' };

  return (
    <AntdClearableInput
      clearable={appliedUiSchemaOptions.clearable !== false}
      data={props.data}
      enabled={enabled}
      onClear={() => handleChange(path, undefined)}
    >
      <InputComponent
        value={formattedNumber}
        onChange={onChange}
        className={className}
        id={id}
        disabled={!enabled}
        autoFocus={appliedUiSchemaOptions.focus}
        placeholder={appliedUiSchemaOptions.placeholder}
        maxLength={maxLength}
        style={inputStyle}
        {...inputProps}
      />
    </AntdClearableInput>
  );
};
