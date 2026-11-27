import { CellProps, WithClassname } from '@jsonforms/core';
import { DatePicker } from 'antd';
import React from 'react';
import { timePickerColumns } from '../util/temporalFormats';
import { useTemporalPicker } from './useTemporalPicker';

export const AntdDateTimePicker = React.memo(function AntdDateTimePicker(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof DatePicker> },
) {
  const { pickerProps, options, disabledDate, disabledTime } =
    useTemporalPicker(props, 'dateTime');
  return (
    <DatePicker
      {...pickerProps}
      disabledDate={disabledDate}
      disabledTime={disabledTime}
      /*
        The time half of `views`. The date half is not applied here: a
        date-time picker always offers a full date, and narrowing it to months
        would leave a value it cannot express.
      */
      showTime={timePickerColumns(options.views) ?? true}
      use12Hours={!!options.ampm}
      {...props.inputProps}
    />
  );
});
