/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import { CellProps, WithClassname } from '@jsonforms/core';
import { AutoComplete, AutoCompleteProps, Input } from 'antd';
import every from 'lodash/every';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import merge from 'lodash/merge';
import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDebouncedChange, useFocus } from '../util';
import { PasswordProps } from 'antd/es/input';

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
  const [pointed, setPointed] = useState(false);
  const [focused, onFocus, onBlur] = useFocus();
  const [filteredOptions, setFilteredOptions] = useState<AutoCompleteOption[]>(
    []
  );

  const {
    data,
    config,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    schema,
    inputProps,
  } = props;
  const maxLength = schema.maxLength;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const [inputText, onChange, _onClear] = useDebouncedChange(
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

    const search = (query: string) => {
      console.log('query', query);
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOptions(filtered);
    };

    (specificProps as AutoCompleteProps).options = filteredOptions;
    (specificProps as AutoCompleteProps).onSelect = search;
    (specificProps as AutoCompleteProps).popupMatchSelectWidth = true;
  }

  const inputStyle: CSSProperties =
    !appliedUiSchemaOptions.trim || maxLength === undefined
      ? { width: '100%' }
      : {};

  if (appliedUiSchemaOptions.multi) {
    inputStyle.resize = 'vertical';
    inputStyle.overflow = 'auto';
    InputComponent = Input.TextArea;

    specificProps.rows = 5;
    specificProps.autoSize = { minRows: 5, maxRows: 5 };
  }

  if (schema.format === 'password') {
    InputComponent = Input.Password;

    (specificProps as PasswordProps).visibilityToggle = true; // be able to display the password as plain text
  }

  const onMouseOver = useCallback(() => setPointed(true), []);
  const onMouseLeave = useCallback(() => setPointed(false), []);

  const inputRef = useRef(null);

  useEffect(() => {
    const inputWrapper =
      inputRef.current?.input?.parentElement ||
      inputRef.current?.textarea?.parentElement;

    if (inputWrapper) {
      inputWrapper.addEventListener('mouseover', onMouseOver);
      inputWrapper.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      if (inputWrapper) {
        inputWrapper.removeEventListener('mouseover', onMouseOver);
        inputWrapper.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [inputRef]);

  return (
    <InputComponent
      ref={inputRef}
      value={inputText}
      onChange={onChange}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      style={inputStyle}
      maxLength={maxLength}
      allowClear={{
        clearIcon:
          enabled && pointed && inputText ? <CloseCircleFilled /> : <></>,
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={appliedUiSchemaOptions.placeholder}
      count={
        maxLength !== undefined ? { max: maxLength, show: focused } : undefined
      }
      {...specificProps}
      {...inputProps}
    />
  );
});
