import React from 'react';
import { IntegerCell } from './IntegerCell';
import {
  CellProps,
  Formatted,
  isNumberFormatControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { AntdInputNumberFormat } from '../antd-controls/AntdInputNumberFormat';

export const NumberFormatCell = (
  props: CellProps & WithClassname & Partial<Formatted<number>>,
) => {
  const { toFormatted, fromFormatted } = props;
  return toFormatted && fromFormatted ? (
    <AntdInputNumberFormat
      {...props}
      toFormatted={toFormatted}
      fromFormatted={fromFormatted}
    />
  ) : (
    <IntegerCell {...props} />
  );
};
/**
 * Default tester for text-based/string controls.
 * @type {RankedTester}
 */
export const numberFormatCellTester: RankedTester = rankWith(
  4,
  isNumberFormatControl,
);

export default withJsonFormsCellProps(NumberFormatCell);
