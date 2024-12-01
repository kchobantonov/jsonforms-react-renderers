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
import React, { CSSProperties, useState } from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import merge from 'lodash/merge';
import { Input } from 'antd';
import { useDebouncedChange, useFocus } from '../util';

const eventToValue = (ev: any) =>
  ev.target.value === '' ? undefined : ev.target.value;

export const AntdInputText = React.memo(function AntdInputText(
  props: CellProps & WithClassname
) {
  const [pointed, setPointed] = useState(false);
  const [focused, onFocus, onBlur] = useFocus();

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

  let InputComponent:
    | typeof Input
    | typeof Input.TextArea
    | typeof Input.Password = Input;

  const inputStyle: CSSProperties =
    !appliedUiSchemaOptions.trim || maxLength === undefined
      ? { width: '100%' }
      : {};

  if (appliedUiSchemaOptions.multi) {
    inputStyle.resize = 'vertical';
    inputStyle.overflow = 'auto';
    InputComponent = Input.TextArea;
  }

  if (schema.format === 'password') {
    InputComponent = Input.Password;
  }

  const onMouseOver = () => setPointed(true);
  const onMouseLeave = () => setPointed(false);

  return (
    <InputComponent
      value={inputText}
      onChange={onChange}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      style={inputStyle}
      maxLength={maxLength}
      allowClear={pointed && enabled}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={appliedUiSchemaOptions.placeholder}
      count={
        maxLength !== undefined ? { max: maxLength, show: focused } : undefined
      }
      {...(appliedUiSchemaOptions.multi
        ? { autoSize: { minRows: 5, maxRows: 5 } }
        : {})}
    />
  );
});
