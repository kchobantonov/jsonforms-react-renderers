import React from 'react';
import {
  CellProps,
  isTimeControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdTimePicker } from '../antd-controls/AntdTimePicker';

export const TimeCell = (props: CellProps & WithClassname) => (
  <AntdTimePicker {...props} />
);
export const timeCellTester: RankedTester = rankWith(2, isTimeControl);

export default withJsonFormsCellProps(TimeCell);
