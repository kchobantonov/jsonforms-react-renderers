import React from 'react';
import {
  EnumCellProps,
  isEnumControl,
  RankedTester,
  rankWith,
  WithClassname,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsEnumCellProps,
  withTranslateProps,
} from '@jsonforms/react';
import { AntdSelect } from '../antd-controls/AntdSelect';

export const EnumCell = (
  props: EnumCellProps & WithClassname & TranslateProps
) => <AntdSelect {...props} />;

/**
 * Default tester for enum controls.
 * @type {RankedTester}
 */
export const enumCellTester: RankedTester = rankWith(2, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumCellProps(
  withTranslateProps(React.memo(EnumCell)),
  false
);
