import {
  ControlProps,
  isOneOfEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsOneOfEnumProps,
  withTranslateProps,
} from '@jsonforms/react';
import React from 'react';
import { AntdSelect } from '../antd-controls/AntdSelect';
import { InputControl } from './InputControl';

export const OneOfEnumControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => {
  return <InputControl {...props} input={AntdSelect} />;
};

export const oneOfEnumControlTester: RankedTester = rankWith(
  5,
  isOneOfEnumControl
);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(
  withTranslateProps(React.memo(OneOfEnumControl)),
  false
);
