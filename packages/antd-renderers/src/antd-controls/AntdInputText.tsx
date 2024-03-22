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
import React, { CSSProperties } from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import merge from 'lodash/merge';
import { Input } from 'antd';
import { useDebouncedChange } from '../util';

const eventToValue = (ev: any) =>
  ev.target.value === '' ? undefined : ev.target.value;

export const AntdInputText = React.memo(function AntdInputText(
  props: CellProps & WithClassname
) {
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

  const InputComponent = appliedUiSchemaOptions.multi ? Input.TextArea : Input;
  const inputStyle: CSSProperties =
    !appliedUiSchemaOptions.trim || maxLength === undefined
      ? { width: '100%' }
      : {};

  if (appliedUiSchemaOptions.multi) {
    inputStyle.resize = 'vertical';
    inputStyle.overflow = 'auto';
  }

  return (
    <InputComponent
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      value={inputText}
      onChange={onChange}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      style={inputStyle}
      maxLength={maxLength}
      allowClear
      placeholder={appliedUiSchemaOptions.placeholder}
      {...(appliedUiSchemaOptions.multi
        ? { autoSize: { minRows: 5, maxRows: 5 } }
        : {})}
    />
  );
});
