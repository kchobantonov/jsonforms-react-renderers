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
import { CellProps, WithClassname, defaultTimeFormat } from '@jsonforms/core';
import dayjs from 'dayjs';
import merge from 'lodash/merge';
import { PrimeIcons } from 'primereact/api';
import { Calendar } from 'primereact/calendar';
import React, { useMemo } from 'react';
import { createOnChangeHandler, formatDate, getData } from '../util';

const JSON_SCHEMA_TIME_FORMATS = [
  'HH:mm:ss.SSSZ',
  'HH:mm:ss.SSS',
  'HH:mm:ssZ',
  'HH:mm:ss',
];

const TIME_PICKER_STYLE = {
  width: '100%',
};

export const PrimeTimePicker = React.memo(function PrimeTimePicker(
  props: CellProps & WithClassname
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
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const format =
    appliedUiSchemaOptions.timeFormat ??
    (appliedUiSchemaOptions.ampm === true ? 'hh:mm a' : 'HH:mm');
  const saveFormat = appliedUiSchemaOptions.timeSaveFormat ?? defaultTimeFormat;

  const onChange = useMemo(
    () => createOnChangeHandler(path, handleChange, saveFormat),
    [path, handleChange, saveFormat]
  );

  const value = getData(data, [
    saveFormat,
    format,
    ...JSON_SCHEMA_TIME_FORMATS,
  ]);

  return (
    <Calendar
      value={value}
      onChange={onChange}
      showTime={true}
      showSeconds={format.includes('s')}
      formatDateTime={(date) => formatDate(dayjs(date), format)}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      placeholder={appliedUiSchemaOptions.placeholder}
      hourFormat={appliedUiSchemaOptions.ampm ? '12' : '24'}
      style={TIME_PICKER_STYLE}
      timeOnly
      showButtonBar
      showIcon
      icon={PrimeIcons.CLOCK}
      invalid={!!errors}
    />
  );
});
