import { ControlProps } from '@jsonforms/core';
import React from 'react';
import { AntdRadioGroup } from '../antd-controls/AntdRadioGroup';
import { InputControl } from './InputControl';

export const RadioGroup = (props: ControlProps) => (
  <InputControl {...props} input={AntdRadioGroup} />
);
