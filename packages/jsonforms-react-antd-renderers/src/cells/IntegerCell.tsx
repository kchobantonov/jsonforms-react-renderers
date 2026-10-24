import React from 'react';
import {
  CellProps,
  isIntegerControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdInputInteger } from '../antd-controls/AntdInputInteger';

export const IntegerCell = (props: CellProps & WithClassname) => (
  <AntdInputInteger {...props} />
);
export const integerCellTester: RankedTester = rankWith(2, isIntegerControl);

export default withJsonFormsCellProps(IntegerCell);
