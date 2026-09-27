import React from 'react';
import {
  CellProps,
  isDateControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdDatePicker } from '../antd-controls';

export const DateCell = (props: CellProps & WithClassname) => {
  return <AntdDatePicker {...props} />;
};
export const dateCellTester: RankedTester = rankWith(2, isDateControl);

export default withJsonFormsCellProps(DateCell);
