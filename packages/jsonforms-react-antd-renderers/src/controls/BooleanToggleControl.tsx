import {
  ControlProps,
  RankedTester,
  and,
  isBooleanControl,
  optionIs,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { AntdToggle } from '../antd-controls/AntdToggle';

import { InputControl } from './InputControl';

export const BooleanToggleControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdToggle} />
);

export const booleanToggleControlTester: RankedTester = rankWith(
  3,
  and(isBooleanControl, optionIs('toggle', true))
);

export default withJsonFormsControlProps(BooleanToggleControl);
