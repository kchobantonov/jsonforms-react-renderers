import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsEnumProps,
  withTranslateProps,
} from '@jsonforms/react';
import React from 'react';
import { AntdSelect } from '../antd-controls/AntdSelect';
import { InputControl } from './InputControl';

export const EnumControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => {
  return <InputControl {...props} input={AntdSelect} />;
};

export const enumControlTester: RankedTester = rankWith(2, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(
  withTranslateProps(React.memo(EnumControl)),
  false
);
