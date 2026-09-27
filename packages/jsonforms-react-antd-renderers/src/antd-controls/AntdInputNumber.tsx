import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import merge from 'lodash/merge';
import { InputNumber } from 'antd';
import { toCommittableNumber, useDebouncedChange } from '../util';
import { AntdClearableInput } from './AntdClearableInput';
import { CLEAR_OFFSET_WITH_HANDLES } from './AntdClearValueButton';

const eventToValue = (value: any) => toCommittableNumber(value);

export const AntdInputNumber = React.memo(function AntdInputNumber(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof InputNumber> }
) {
  const {
    data,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    config,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const inputStyle = { width: '100%' };

  const [inputValue, onChange, onClear] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    eventToValue
  );
  return (
    // The clear button sits over the control rather than in antd's suffix,
    // because `Form.Item` feedback replaces that slot instead of composing with
    // it - so an errored field would lose its clear button. The wider offset
    // keeps it clear of the stepper handles antd reveals on hover.
    <AntdClearableInput
      clearable={appliedUiSchemaOptions.clearable !== false}
      data={data}
      enabled={enabled}
      offset={CLEAR_OFFSET_WITH_HANDLES}
      onClear={onClear}
    >
      <InputNumber
        value={inputValue}
        // antd reports a cleared field as null. Routing that through onClear
        // rather than the debounced path commits it at once and cancels any
        // queued keystroke, so an old callback cannot restore the value.
        onChange={(value) =>
          value === null || value === undefined
            ? onClear()
            : onChange(value as never)
        }
        className={className}
        id={id}
        disabled={!enabled}
        autoFocus={appliedUiSchemaOptions.focus}
        step={0.1}
        style={inputStyle}
        placeholder={appliedUiSchemaOptions.placeholder}
        {...inputProps}
      />
    </AntdClearableInput>
  );
});
