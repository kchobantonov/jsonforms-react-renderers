import React from 'react';
import {
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { AntdInputText } from '../antd-controls/AntdInputText';
import { InputControl } from './InputControl';

export const TextControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdInputText} />
);

export const textControlTester: RankedTester = rankWith(1, isStringControl);
export default withJsonFormsControlProps(TextControl);
