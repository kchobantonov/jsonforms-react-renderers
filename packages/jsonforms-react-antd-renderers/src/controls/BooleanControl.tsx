import React from 'react';
import {
  isBooleanControl,
  RankedTester,
  rankWith,
  ControlProps,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { AntdCheckbox } from '../antd-controls/AntdCheckbox';
import { InputControl } from './InputControl';

export const BooleanControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdCheckbox} />
);

export const booleanControlTester: RankedTester = rankWith(2, isBooleanControl);
export default withJsonFormsControlProps(BooleanControl);
