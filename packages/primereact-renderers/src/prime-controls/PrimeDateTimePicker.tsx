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
import dayjs from 'dayjs';
import merge from 'lodash/merge';
import { Calendar } from 'primereact/calendar';
import React, { useCallback } from 'react';
import { createOnChangeHandler, formatDate, getData } from '../util';

const JSON_SCHEMA_DATE_TIME_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
];

const DATE_PICKER_STYLE = {
  width: '100%',
};

export const PrimeDateTimePicker = React.memo(function PrimeDateTimePicker(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof Calendar> }
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
    errors,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const format = appliedUiSchemaOptions.dateTimeFormat ?? 'YYYY-MM-DD HH:mm';
  const saveFormat =
    appliedUiSchemaOptions.dateTimeSaveFormat ?? defaultDateTimeFormat;

  const onChange = useCallback(
    () => createOnChangeHandler(path, handleChange, saveFormat),
    [path, handleChange, saveFormat]
  );

  const value = getData(data, [
    saveFormat,
    format,
    ...JSON_SCHEMA_DATE_TIME_FORMATS,
  ]);

  return (
    <Calendar
      value={value as any}
      selectionMode='single'
      onChange={onChange}
      formatDateTime={(date) => formatDate(dayjs(date), format)}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      placeholder={appliedUiSchemaOptions.placeholder}
      showTime={true}
      hourFormat={appliedUiSchemaOptions.ampm ? '12' : '24'}
      style={DATE_PICKER_STYLE}
      showButtonBar
      showIcon
      icon={<i className='pi pi-calendar-clock' />}
      invalid={!!errors}
      {...inputProps}
    />
  );
});
