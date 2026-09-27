import React from 'react';
import {
  CellProps,
  isBooleanControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdCheckbox } from '../antd-controls/AntdCheckbox';

export const BooleanCell = (props: CellProps & WithClassname) => {
  return <AntdCheckbox {...props} />;
};

export const booleanCellTester: RankedTester = rankWith(2, isBooleanControl);

export default withJsonFormsCellProps(BooleanCell);
