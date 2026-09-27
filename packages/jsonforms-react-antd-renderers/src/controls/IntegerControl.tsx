import React from 'react';
import {
  ControlProps,
  isIntegerControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { AntdInputInteger } from '../antd-controls/AntdInputInteger';
import { InputControl } from './InputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const IntegerControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdInputInteger} />
);
export const integerControlTester: RankedTester = rankWith(2, isIntegerControl);
export default withJsonFormsControlProps(IntegerControl);
