import {
  ControlProps,
  RankedTester,
  isDateTimeControl,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { AntdDateTimePicker } from '../antd-controls/AntdDateTimePicker';

import { InputControl } from './InputControl';

export const DateTimeControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdDateTimePicker} />
);

export const dateTimeControlTester: RankedTester = rankWith(
  2,
  isDateTimeControl
);

export default withJsonFormsControlProps(DateTimeControl);
