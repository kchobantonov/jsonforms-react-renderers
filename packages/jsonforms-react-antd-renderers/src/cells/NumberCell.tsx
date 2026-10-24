import React from 'react';
import {
  CellProps,
  isNumberControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdInputNumber } from '../antd-controls/AntdInputNumber';

export const NumberCell = (props: CellProps & WithClassname) => (
  <AntdInputNumber {...props} />
);
/**
 * Default tester for number controls.
 * @type {RankedTester}
 */
export const numberCellTester: RankedTester = rankWith(2, isNumberControl);
export default withJsonFormsCellProps(NumberCell);
