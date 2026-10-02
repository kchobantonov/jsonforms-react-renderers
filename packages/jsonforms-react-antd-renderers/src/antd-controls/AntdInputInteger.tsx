import React from 'react';
import { useMixedScalar } from '@chobantonov/jsonforms-react-renderer-common/mixedScalar';
import { CellProps, WithClassname } from '@jsonforms/core';
import merge from 'lodash/merge';
import { InputNumber } from 'antd';
import { toCommittableNumber, useDebouncedChange } from '../util';
import { AntdClearableInput } from './AntdClearableInput';
import { CLEAR_OFFSET_WITH_HANDLES } from './AntdClearValueButton';

const eventToValue = (value: any) => toCommittableNumber(value);

export const AntdInputInteger = React.memo(function AntdInputInteger(
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
    handleChange: originalHandleChange,
    config,
    inputProps,
  } = props;
  const keepSelectedType = useMixedScalar(path);
  const handleChange = React.useCallback(
    (target: string, value: any) =>
      originalHandleChange(
        target,
        keepSelectedType && value === undefined ? 0 : value
      ),
    [originalHandleChange, keepSelectedType]
  );
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const inputStyle = { width: '100%' };

  const [inputValue, onChange, onClear] = useDebouncedChange(
    handleChange,
    keepSelectedType ? 0 : '',
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
            : Number.isInteger(Number(value))
            ? onChange(value as never)
            : undefined
        }
        className={className}
        id={id}
        disabled={!enabled}
        autoFocus={appliedUiSchemaOptions.focus}
        style={inputStyle}
        placeholder={appliedUiSchemaOptions.placeholder}
        {...inputProps}
      />
    </AntdClearableInput>
  );
});
