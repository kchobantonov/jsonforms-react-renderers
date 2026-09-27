import React from 'react';
import {
  CellProps,
  isStringControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdInputText } from '../antd-controls/AntdInputText';

export const TextCell = (props: CellProps & WithClassname) => (
  <AntdInputText {...props} />
);

/**
 * Default tester for text-based/string controls.
 * @type {RankedTester}
 */
export const textCellTester: RankedTester = rankWith(1, isStringControl);

export default withJsonFormsCellProps(TextCell);
