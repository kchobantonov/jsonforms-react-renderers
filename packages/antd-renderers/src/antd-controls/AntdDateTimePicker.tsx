/*
  The MIT License

  Copyright (c) 2017-2021 EclipseSource Munich
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
import {
  CellProps,
  WithClassname,
  defaultDateTimeFormat,
} from '@jsonforms/core';
import { DatePicker } from 'antd';
import merge from 'lodash/merge';
import React, { useMemo } from 'react';
import { createOnChangeHandler, getData } from '../util';

const JSON_SCHEMA_DATE_TIME_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
];

const DATE_PICKER_STYLE = {
  width: '100%',
};

export const AntdDateTimePicker = React.memo(function AntdDateTimePicker(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof DatePicker> }
) {
  const {
    data,
    className,
    enabled,
    id,
    uischema,
    path,
    handleChange,
    config,
    isValid,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const format = appliedUiSchemaOptions.dateTimeFormat ?? 'YYYY-MM-DD HH:mm';
  const saveFormat =
    appliedUiSchemaOptions.dateTimeSaveFormat ?? defaultDateTimeFormat;

  const onChange = useMemo(
    () => createOnChangeHandler(path, handleChange, saveFormat),
    [path, handleChange, saveFormat]
  );

  const value = getData(data, [
    saveFormat,
    format,
    ...JSON_SCHEMA_DATE_TIME_FORMATS,
  ]);

  return (
    <DatePicker
      value={value}
      onChange={onChange}
      format={format}
      allowClear={enabled}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      placeholder={appliedUiSchemaOptions.placeholder}
      showTime={true}
      use12Hours={!!appliedUiSchemaOptions.ampm}
      style={DATE_PICKER_STYLE}
      status={isValid ? undefined : 'error'}
      {...inputProps}
    />
  );
});
