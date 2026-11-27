import { CellProps, WithClassname } from '@jsonforms/core';
import { DatePicker } from 'antd';
import React from 'react';
import { datePickerMode } from '../util/temporalFormats';
import { useTemporalPicker } from './useTemporalPicker';

export const AntdDatePicker = React.memo(function AntdDatePicker(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof DatePicker> },
) {
  const { pickerProps, options, disabledDate, saveFormat } = useTemporalPicker(
    props,
    'date',
  );
  return (
    <DatePicker
      {...pickerProps}
      picker={datePickerMode(options.views, saveFormat)}
      disabledDate={disabledDate}
      {...props.inputProps}
    />
  );
});
