import { CellProps, WithClassname } from '@jsonforms/core';
import { TimePicker } from 'antd';
import React from 'react';
import { timePickerColumns } from '../util/temporalFormats';
import { useTemporalPicker } from './useTemporalPicker';

export const AntdTimePicker = React.memo(function AntdTimePicker(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof TimePicker> },
) {
  const { pickerProps, options, disabledTime } = useTemporalPicker(
    props,
    'time',
  );
  return (
    <TimePicker
      {...pickerProps}
      disabledTime={disabledTime}
      // `views` picks the columns; absent, the display format still decides.
      {...timePickerColumns(options.views)}
      use12Hours={!!options.ampm}
      {...props.inputProps}
    />
  );
});
