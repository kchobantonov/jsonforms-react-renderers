import { useMixedScalar } from '@chobantonov/jsonforms-react-renderer-common/mixedScalar';
import { CellProps, WithClassname } from '@jsonforms/core';
import { AutoComplete, AutoCompleteProps, Input } from 'antd';
import every from 'lodash/every';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import merge from 'lodash/merge';
import React, { CSSProperties } from 'react';
import { useDebouncedChange, useFocus } from '../util';
import { AntdClearableInput } from './AntdClearableInput';

const eventToValue = (ev: any) => {
  if (ev.target) {
    return ev.target.value === '' ? undefined : ev.target.value;
  }
  return ev === '' ? undefined : ev;
};

type ElementType<T> = T extends (infer U)[] ? U : never;
type AutoCompleteOption = ElementType<AutoCompleteProps['options']>;

export const AntdInputText = React.memo(function AntdInputText(
  props: CellProps &
    WithClassname & {
      inputProps?: React.ComponentProps<
        | typeof Input
        | typeof Input.TextArea
        | typeof Input.Password
        | typeof AutoComplete
      >;
    }
) {
  const [focused, onFocus, onBlur] = useFocus();

  const {
    data,
    config,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange: originalHandleChange,
    schema,
    inputProps,
  } = props;
  const keepEmptyString = useMixedScalar(path);
  const handleChange = React.useCallback(
    (target: string, value: any) =>
      originalHandleChange(
        target,
        keepEmptyString && value === undefined ? '' : value
      ),
    [originalHandleChange, keepEmptyString]
  );
  const maxLength = schema.maxLength;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const [inputText, onChange, onClear] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    eventToValue
  );

  let InputComponent: React.ComponentType<any> = Input;

  const specificProps: Record<string, any> = {};

  const suggestions = appliedUiSchemaOptions?.suggestion;

  if (isArray(suggestions) && every(suggestions, isString)) {
    const options: AutoCompleteOption[] = (suggestions as string[]).map(
      (suggestion) => ({ value: suggestion })
    );
    InputComponent = AutoComplete;

    (specificProps as AutoCompleteProps).options = options;
    (specificProps as AutoCompleteProps).filterOption = true;
    (specificProps as AutoCompleteProps).popupMatchSelectWidth = true;
  }

  const inputStyle: CSSProperties = { width: '100%' };

  if (appliedUiSchemaOptions.multi) {
    inputStyle.resize = 'vertical';
    inputStyle.overflow = 'auto';
    InputComponent = Input.TextArea;

    specificProps.rows = 5;
    specificProps.autoSize = { minRows: 5, maxRows: 5 };
  }

  return (
    <AntdClearableInput
      clearable={appliedUiSchemaOptions.clearable !== false}
      data={data}
      enabled={enabled}
      onClear={onClear}
    >
      <InputComponent
        value={inputText}
        onChange={onChange}
        className={className}
        id={id}
        disabled={!enabled}
        autoFocus={appliedUiSchemaOptions.focus}
        style={inputStyle}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={appliedUiSchemaOptions.placeholder}
        count={
          maxLength !== undefined
            ? { max: maxLength, show: focused }
            : undefined
        }
        {...specificProps}
        {...inputProps}
      />
    </AntdClearableInput>
  );
});
