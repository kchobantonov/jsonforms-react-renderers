import {
  ControlProps,
  RankedTester,
  isTimeControl,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';

import { AntdTimePicker } from '../antd-controls/AntdTimePicker';

import { InputControl } from './InputControl';

export const TimeControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdTimePicker} />
);

export const timeControlTester: RankedTester = rankWith(4, isTimeControl);

export default withJsonFormsControlProps(TimeControl);
