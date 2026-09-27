import React from 'react';
import {
  ControlProps,
  isNumberControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { AntdInputNumber } from '../antd-controls/AntdInputNumber';
import { InputControl } from './InputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const NumberControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdInputNumber} />
);

export const numberControlTester: RankedTester = rankWith(2, isNumberControl);

export default withJsonFormsControlProps(NumberControl);
